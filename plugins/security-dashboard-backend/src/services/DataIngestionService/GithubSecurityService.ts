import { LoggerService } from '@backstage/backend-plugin-api';
import {
  DefaultGithubCredentialsProvider,
  GithubCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';
import { Octokit } from '@octokit/core';
import { graphql } from '@octokit/graphql';
import { throttling } from '@octokit/plugin-throttling';
import { minimatch } from 'minimatch';
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
    integrations: ScmIntegrations,
    private readonly logger: LoggerService,
  ) {
    this.integrations = integrations;
    this.credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(integrations);
  }

  /**
   * Get all repositories with security information
   */
  async getRepositoriesWithSecurityInfo(
    filters: RepositoryFilters,
  ): Promise<RepositorySecurityInfo[]> {
    const { org, includeArchived = false, excludePattern, includePattern } = filters;

    this.logger.info(`Fetching repositories for organization: ${org}`);

    // Get GitHub integration config
    const githubIntegration = this.integrations.github.byHost('github.com');
    if (!githubIntegration) {
      throw new Error('GitHub integration not configured');
    }

    // Get credentials
    const credentials = await this.credentialsProvider.getCredentials({
      url: `https://github.com/${org}`,
    });

    if (!credentials.headers || !credentials.token) {
      throw new Error('GitHub credentials not found for');
    }

    // Create GraphQL client
    const graphqlClient = this.createGraphQLClient(
      credentials.headers,
      githubIntegration.config.apiBaseUrl || 'https://api.github.com',
    );

    // Fetch repositories using GraphQL
    const repositories = await this.fetchRepositories(graphqlClient, org);

    // Filter repositories
    const filteredRepos = repositories.filter(repo => {
      // Filter archived
      if (!includeArchived && repo.isArchived) {
        return false;
      }

      // Filter by name patterns
      if (excludePattern && minimatch(repo.name, excludePattern)) {
        return false;
      }

      if (includePattern && !minimatch(repo.name, includePattern)) {
        return false;
      }

      return true;
    });

    this.logger.info(
      `Found ${filteredRepos.length} repositories after filtering`,
    );

    // Create REST client for additional API calls
    const ThrottledOctokit = Octokit.plugin(throttling);
    const octokit = new ThrottledOctokit({
      auth: credentials.token,
      baseUrl: githubIntegration.config.apiBaseUrl || 'https://api.github.com',
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

    // Fetch additional security info for each repository
    const securityInfoPromises = filteredRepos.map(repo =>
      this.enrichRepositoryWithSecurityInfo(octokit, org, repo),
    );

    const results = await Promise.allSettled(securityInfoPromises);

    // Filter out failed requests and log errors
    const successfulResults = results
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

    return successfulResults;
  }

  /**
   * Fetch repositories using GraphQL
   */
  private async fetchRepositories(
    client: typeof graphql,
    org: string,
  ): Promise<RepositoryGraphQLResponse[]> {
    const query = `
      query repositories($org: String!, $cursor: String) {
        repositoryOwner(login: $org) {
          repositories(first: 20, after: $cursor) {
            nodes {
              name
              url
              isArchived
              visibility
              hasVulnerabilityAlertsEnabled
              defaultBranchRef {
                name
              },
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
      isArchived: repo.isArchived,
      visibility: repo.visibility,
      defaultBranch: repo.defaultBranchRef?.name || null,
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
      // Get repository details which includes security_and_analysis
      const { data } = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: org,
        repo: repo,
      });

      return (
        data.security_and_analysis?.secret_scanning?.status === 'enabled' ||
        false
      );
    } catch (error: any) {
      // If we don't have permission or it's not available, return false
      if (error.status === 403 || error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Fetch workflows for a repository
   */
  private async fetchWorkflows(
    octokit: Octokit,
    org: string,
    repo: string,
  ): Promise<GitHubWorkflow[]> {
    try {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/actions/workflows',
        {
          owner: org,
          repo: repo,
        },
      );

      return data.workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
      }));
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
