import { LoggerService, RootConfigService } from '@backstage/backend-plugin-api';
import {
  DefaultGithubCredentialsProvider,
  GithubCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';
import { Octokit } from '@octokit/core';
import { graphql } from '@octokit/graphql';
import { throttling } from '@octokit/plugin-throttling';
import { minimatch } from 'minimatch';
import * as yaml from 'js-yaml';
import {
  RepositorySecurityInfo,
  RepositoryFilters,
  OrganizationRepositoriesResponse,
  PageInfo,
  GitHubWorkflow,
  RepositoryGraphQLResponse,
} from '../types';

/**
 * Service for fetching GitHub repository security information
 */
export class GitHubSecurityService {
  private readonly credentialsProvider: GithubCredentialsProvider;
  private readonly integrations: ScmIntegrations;

  constructor(
    config: RootConfigService,
    private readonly logger: LoggerService,
  ) {
    this.integrations = ScmIntegrations.fromConfig(config);
    this.credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(this.integrations);
  }

  /**
   * Get all repositories with security information (with pagination)
   */
  async getAllRepositoriesWithSecurityInfo(
    filters: RepositoryFilters,
  ): Promise<RepositorySecurityInfo[]> {
    const { org } = filters;
    this.logger.info(`Fetching all repositories for organization: ${org}`);

    const { graphqlClient, octokit } = await this.setupGitHubClients(org);
    const repositories = await this.fetchAllRepositories(graphqlClient, org);

    return this.processRepositories(repositories, filters, octokit, org);
  }

  /**
   * Get latest updated X repositories with security information
   */
  async getLatestUpdatedRepositoriesWithSecurityInfo(
    filters: RepositoryFilters,
    limit: number,
  ): Promise<RepositorySecurityInfo[]> {
    const { org } = filters;
    this.logger.info(`Fetching latest updated ${limit} repositories for organization: ${org}`);

    const { graphqlClient, octokit } = await this.setupGitHubClients(org);
    const repositories = await this.fetchLatestUpdatedRepositories(graphqlClient, org, limit);

    return this.processRepositories(repositories, filters, octokit, org);
  }

  /**
   * Setup GitHub clients (GraphQL and REST)
   */
  private async setupGitHubClients(org: string): Promise<{
    graphqlClient: typeof graphql;
    octokit: Octokit;
  }> {
    const githubIntegration = this.integrations.github.byHost('github.com');
    if (!githubIntegration) {
      throw new Error('GitHub integration not configured');
    }

    const credentials = await this.credentialsProvider.getCredentials({
      url: `https://github.com/${org}`,
    });

    if (!credentials.headers || !credentials.token) {
      throw new Error('GitHub credentials not found for');
    }

    const baseUrl = githubIntegration.config.apiBaseUrl || 'https://api.github.com';

    const graphqlClient = this.createGraphQLClient(credentials.headers, baseUrl);
    const octokit = this.createOctokitClient(credentials.token, baseUrl);

    return { graphqlClient, octokit };
  }

  /**
   * Create Octokit REST client with throttling
   */
  private createOctokitClient(token: string, baseUrl: string): Octokit {
    const ThrottledOctokit = Octokit.plugin(throttling);
    return new ThrottledOctokit({
      auth: token,
      baseUrl,
      throttle: {
        onRateLimit: (retryAfter, options, octo, retryCount) => {
          this.logger.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`,
          );
          if (retryCount < 2) {
            this.logger.info(`Retrying after ${retryAfter} seconds`);
            return true;
          }
          return false;
        },
        onSecondaryRateLimit: (retryAfter, options, octo, retryCount) => {
          this.logger.warn(
            `Secondary rate limit hit for request ${options.method} ${options.url}`,
          );
          if (retryCount < 2) {
            this.logger.info(`Retrying after ${retryAfter} seconds`);
            return true;
          }
          return false;
        },
      },
    });
  }

  /**
   * Process repositories: filter, enrich with security info, and handle errors
   */
  private async processRepositories(
    repositories: RepositoryGraphQLResponse[],
    filters: RepositoryFilters,
    octokit: Octokit,
    org: string,
  ): Promise<RepositorySecurityInfo[]> {
    const { excludePattern } = filters;

    const filteredRepos = excludePattern
      ? repositories.filter(repo => !minimatch(repo.name, excludePattern))
      : repositories;

    this.logger.info(
      `Found ${filteredRepos.length} repositories after filtering`,
    );

    const securityInfoPromises = filteredRepos.map(repo =>
      this.enrichRepositoryWithSecurityInfo(octokit, org, repo),
    );

    const results = await Promise.allSettled(securityInfoPromises);

    return results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          this.logger.error(
            `Failed to fetch security info for ${filteredRepos[index].name}: ${result.reason}`,
          );
          return null;
        }
      })
      .filter((r): r is RepositorySecurityInfo => r !== null);
  }

  /**
   * Fetch all repositories using GraphQL with pagination
   */
  private async fetchAllRepositories(
    client: typeof graphql,
    org: string,
  ): Promise<RepositoryGraphQLResponse[]> {
    const query = `
      query repositories($org: String!, $cursor: String) {
        repositoryOwner(login: $org) {
          repositories(first: 100, isArchived: false, after: $cursor) {
            nodes {
              name
              url
              isArchived
              hasVulnerabilityAlertsEnabled
              languages(first: 10) {
                nodes {
                  name
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    const repositories: RepositoryGraphQLResponse[] = [];
    let cursor: string | undefined = undefined;
    let hasNextPage = true;

    while (hasNextPage) {
      const response: OrganizationRepositoriesResponse = await client(query, {
        org,
        cursor,
      });

      if (!response.repositoryOwner?.repositories) {
        throw new Error(`Organization ${org} not found or has no repositories`);
      }

      repositories.push(...response.repositoryOwner.repositories.nodes);

      const pageInfo: PageInfo = response.repositoryOwner.repositories.pageInfo;
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
    }

    return repositories;
  }

  /**
   * Fetch latest updated X repositories using GraphQL
   */
  private async fetchLatestUpdatedRepositories(
    client: typeof graphql,
    org: string,
    limit: number,
  ): Promise<RepositoryGraphQLResponse[]> {
    const query = `
      query repositories($org: String!, $first: Int!) {
        repositoryOwner(login: $org) {
          repositories(first: $first, orderBy: {field: UPDATED_AT, direction: DESC}, isArchived: false) {
            nodes {
              name
              url
              isArchived
              hasVulnerabilityAlertsEnabled
              languages(first: 10) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
    `;

    const response: OrganizationRepositoriesResponse = await client(query, {
      org,
      first: limit,
    });

    if (!response.repositoryOwner?.repositories) {
      throw new Error(`Organization ${org} not found or has no repositories`);
    }

    return response.repositoryOwner.repositories.nodes;
  }

  /**
   * Enrich repository with security information from REST API
   */
  private async enrichRepositoryWithSecurityInfo(
    octokit: Octokit,
    org: string,
    repo: RepositoryGraphQLResponse,
  ): Promise<RepositorySecurityInfo> {
    // Fetch secret scanning status and workflows in parallel
    const [secretScanningEnabled, workflows] = await Promise.all([
      this.checkSecretScanning(octokit, org, repo.name),
      this.fetchWorkflows(octokit, org, repo.name),
    ]);

    return {
      name: repo.name,
      url: repo.url,
      languages: repo.languages.nodes.map(lang => lang.name),
      dependabotAlertsEnabled: repo.hasVulnerabilityAlertsEnabled,
      secretScanningEnabled,
      workflows,
    };
  }

  /**
   * Check if secret scanning is enabled for a repository
   */
  private async checkSecretScanning(
    octokit: Octokit,
    org: string,
    repo: string,
  ): Promise<boolean> {
    try {
      // Get secret-alert information
      const response = await octokit.request('GET /repos/{owner}/{repo}/secret-scanning/alerts', {
        owner: org,
        repo: repo,
      });

      return response.status === 200;
    } catch (error: any) {
      // If we don't have permission or it's not available, return false
      if (error.status === 403 || error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Fetch workflow file content from repository
   */
  private async fetchWorkflowFileContent(
    octokit: Octokit,
    org: string,
    repo: string,
    path: string,
  ): Promise<string | null> {
    try {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          owner: org,
          repo: repo,
          path: path,
        },
      );

      // GitHub API returns base64 encoded content
      if ('content' in data && typeof data.content === 'string') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error: any) {
      if (error.status === 403 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Parse workflow YAML file to extract jobs and their trigger events
   */
  private parseWorkflowFile(content: string): Array<{
    name: string;
    runsOn: Array<'pull_request' | 'push' | 'schedule'>;
  }> {
    try {
      const workflowData = yaml.load(content) as any;

      if (!workflowData || !workflowData.jobs) {
        return [];
      }

      // Determine which events trigger this workflow
      const triggers = new Set<string>();
      if (workflowData.on) {
        if (typeof workflowData.on === 'string') {
          triggers.add(workflowData.on);
        } else if (Array.isArray(workflowData.on)) {
          workflowData.on.forEach((event: string) => triggers.add(event));
        } else if (typeof workflowData.on === 'object') {
          Object.keys(workflowData.on).forEach(event => triggers.add(event));
        }
      }

      // Build runsOn array from relevant triggers
      // Note: workflow_dispatch is treated as 'push' for CI purposes
      const runsOn: Array<'pull_request' | 'push' | 'schedule'> = [];

      if (triggers.has('pull_request')) {
        runsOn.push('pull_request');
      }
      if (triggers.has('push') || triggers.has('workflow_dispatch')) {
        runsOn.push('push');
      }
      if (triggers.has('schedule')) {
        runsOn.push('schedule');
      }

      // If no recognized triggers, default to push
      if (runsOn.length === 0) {
        runsOn.push('push');
      }

      // Extract job names
      const jobs = Object.entries(workflowData.jobs).map(([jobKey, jobValue]: [string, any]) => ({
        name: jobValue.name || jobKey,
        runsOn,
      }));

      return jobs;
    } catch (error) {
      this.logger.warn(`Failed to parse workflow file: ${error}`);
      return [];
    }
  }

  /**
   * Fetch workflows for a repository with hybrid approach:
   * 1. Fetch workflow list
   * 2. Fetch and parse workflow files to extract jobs and trigger events
   */
  private async fetchWorkflows(
    octokit: Octokit,
    org: string,
    repo: string,
  ): Promise<GitHubWorkflow[]> {
    try {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/actions/workflows?per_page=50',
        {
          owner: org,
          repo: repo,
        },
      );

      // Fetch and parse each workflow file
      const workflowsWithJobs = await Promise.all(
        data.workflows.map(async (workflow: any) => {
          const content = await this.fetchWorkflowFileContent(
            octokit,
            org,
            repo,
            workflow.path,
          );

          let jobs: Array<{
            name: string;
            runsOn: Array<'pull_request' | 'push' | 'schedule'>;
          }> = [];

          if (content) {
            jobs = this.parseWorkflowFile(content);
          }

          return {
            id: workflow.id,
            name: workflow.name,
            url: workflow.url,
            path: workflow.path,
            state: workflow.state,
            created_at: workflow.created_at,
            updated_at: workflow.updated_at,
            jobs,
          };
        }),
      );

      return workflowsWithJobs;
    } catch (error: any) {
      // If workflows are not accessible, return empty array
      if (error.status === 403 || error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Create GraphQL client with throttling
   */
  private createGraphQLClient(
    headers: { [name: string]: string } | undefined,
    baseUrl: string,
  ): typeof graphql {
    const ThrottledOctokit = Octokit.plugin(throttling);
    const octokit = new ThrottledOctokit({
      throttle: {
        onRateLimit: (retryAfter, options, octo, retryCount) => {
          this.logger.warn(
            `GraphQL request quota exhausted for request ${options.method} ${options.url}`,
          );
          if (retryCount < 2) {
            this.logger.info(
              `Retrying after ${retryAfter} seconds for the ${retryCount} time`,
            );
            return true;
          }
          return false;
        },
        onSecondaryRateLimit: (retryAfter, options, octo, retryCount) => {
          this.logger.warn(
            `GraphQL secondary rate limit hit for request ${options.method} ${options.url}`,
          );
          if (retryCount < 2) {
            this.logger.info(
              `Retrying after ${retryAfter} seconds for the ${retryCount} time`,
            );
            return true;
          }
          return false;
        },
      },
    });

    return octokit.graphql.defaults({
      headers,
      baseUrl,
    });
  }
}
