import { LoggerService, RootConfigService } from '@backstage/backend-plugin-api';
import {
  DefaultGithubCredentialsProvider,
  GithubCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';
import { Octokit } from '@octokit/core';
import { graphql } from '@octokit/graphql';
import { minimatch } from 'minimatch';
import {
  RepositorySecurityInfo,
  RepositoryFilters,
  OrganizationRepositoriesResponse,
  PageInfo,
  GitHubWorkflow,
  RepositoryGraphQLResponse,
} from '../types';
import { OctokitFactory } from './OctokitFactory';
import { WorkflowParser } from './WorkflowParser';
import { GITHUB_API, HTTP_STATUS } from './constants';
import {
  FETCH_ALL_REPOSITORIES_QUERY,
  FETCH_LATEST_REPOSITORIES_QUERY,
} from './graphqlQueries';

interface GitHubClients {
  graphqlClient: typeof graphql;
  octokit: Octokit;
}

/**
 * Service for fetching GitHub repository security information
 */
export class GitHubSecurityService {
  private readonly credentialsProvider: GithubCredentialsProvider;
  private readonly integrations: ScmIntegrations;
  private readonly octokitFactory: OctokitFactory;
  private readonly workflowParser: WorkflowParser;

  constructor(
    config: RootConfigService,
    private readonly logger: LoggerService,
  ) {
    this.integrations = ScmIntegrations.fromConfig(config);
    this.credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(this.integrations);
    this.octokitFactory = new OctokitFactory(logger);
    this.workflowParser = new WorkflowParser(logger);
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
  private async setupGitHubClients(org: string): Promise<GitHubClients> {
    const githubIntegration = this.integrations.github.byHost(GITHUB_API.HOST);
    if (!githubIntegration) {
      throw new Error('GitHub integration not configured');
    }

    const credentials = await this.credentialsProvider.getCredentials({
      url: `https://${GITHUB_API.HOST}/${org}`,
    });

    if (!credentials.headers || !credentials.token) {
      throw new Error('GitHub credentials not found');
    }

    const baseUrl = githubIntegration.config.apiBaseUrl || GITHUB_API.DEFAULT_BASE_URL;

    const graphqlClient = this.octokitFactory.createGraphQLClient(credentials.headers, baseUrl);
    const octokit = this.octokitFactory.createRestClient(credentials.token, baseUrl);

    return { graphqlClient, octokit };
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
    const repositories: RepositoryGraphQLResponse[] = [];
    let cursor: string | undefined = undefined;
    let hasNextPage = true;

    while (hasNextPage) {
      const response: OrganizationRepositoriesResponse = await client(
        FETCH_ALL_REPOSITORIES_QUERY,
        { org, cursor },
      );

      const repositoryOwner = response.repositoryOwner;
      if (!repositoryOwner?.repositories) {
        throw new Error(`Organization ${org} not found or has no repositories`);
      }

      const repos = repositoryOwner.repositories;
      repositories.push(...repos.nodes);

      const pageInfo: PageInfo = repos.pageInfo;
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
    const response: OrganizationRepositoriesResponse = await client(
      FETCH_LATEST_REPOSITORIES_QUERY,
      { org, first: limit },
    );

    const repositoryOwner = response.repositoryOwner;
    if (!repositoryOwner?.repositories) {
      throw new Error(`Organization ${org} not found or has no repositories`);
    }

    return repositoryOwner.repositories.nodes;
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
      const response = await octokit.request('GET /repos/{owner}/{repo}/secret-scanning/alerts', {
        owner: org,
        repo: repo,
      });

      return response.status === HTTP_STATUS.OK;
    } catch (error: any) {
      // If we don't have permission or it's not available, return false
      if (error.status === HTTP_STATUS.FORBIDDEN || error.status === HTTP_STATUS.NOT_FOUND) {
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
      const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: org,
        repo: repo,
        path: path,
      });

      // GitHub API returns base64 encoded content
      if ('content' in data && typeof data.content === 'string') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error: any) {
      if (error.status === HTTP_STATUS.FORBIDDEN || error.status === HTTP_STATUS.NOT_FOUND) {
        return null;
      }
      throw error;
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
      const { data } = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows?per_page=50', {
        owner: org,
        repo: repo,
      });

      // Fetch and parse each workflow file
      const workflowsWithJobs = await Promise.all(
        data.workflows.map(async (workflow: any) => {
          const content = await this.fetchWorkflowFileContent(
            octokit,
            org,
            repo,
            workflow.path,
          );

          const jobs = content ? this.workflowParser.parseWorkflowFile(content) : [];

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
      if (error.status === HTTP_STATUS.FORBIDDEN || error.status === HTTP_STATUS.NOT_FOUND) {
        return [];
      }
      throw error;
    }
  }
}
