import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { GitHubSecurityService } from '../GitHubSecurityService';
import { CreateSecurityToolInput, SecurityToolsService, RepositorySecurityInfo } from '../types';
import { SECURITY_TOOLS_CONFIG, SecurityToolDefinition } from './securityToolsConfig';

interface WorkflowImplementationDetail {
  is_implemented: boolean;
  info_url: string;
}

/**
 * Service for data ingestion from various sources
 */
export class DataIngestionService {
  private readonly githubService: GitHubSecurityService;
  private readonly org = 'RachaneeSaeng';
  private readonly excludeRepositoriesPattern = 'Comm*';
  private readonly limitLatestRecords = 30;

  constructor(
    config: RootConfigService,
    private readonly logger: LoggerService,
    private readonly securityToolsService: SecurityToolsService,
  ) {
    this.githubService = new GitHubSecurityService(config, logger);
  }

  /**
   * Fetch all repositories from GitHub with security information (with pagination)
   */
  private async fetchAllRepositories() {
    const repositories =
      await this.githubService.getAllRepositoriesWithSecurityInfo({
        org: this.org,
        excludePattern: this.excludeRepositoriesPattern,
      });

    this.logger.info(
      `Retrieved ${repositories.length} repositories, transforming to security tool records`,
    );

    return repositories;
  }

  /**
   * Fetch latest updated X repositories from GitHub with security information
   */
  private async fetchLatestUpdatedRepositories(limit: number) {
    const repositories =
      await this.githubService.getLatestUpdatedRepositoriesWithSecurityInfo(
        {
          org: this.org,
          excludePattern: this.excludeRepositoriesPattern,
        },
        limit,
      );

    this.logger.info(
      `Retrieved ${repositories.length} latest updated repositories, transforming to security tool records`,
    );

    return repositories;
  }

  /**
   * Helper method to find workflow and create tool info
   * Checks both workflow names and job names for matches
   */
  private getWorkflowImplementationDetail(
    repo: RepositorySecurityInfo,
    isPullRequest: boolean,
    searchTerms: string[],
  ): WorkflowImplementationDetail {
    // First try to find in workflow names (backward compatibility)
    let workflow = repo.workflows.find(wf => {
      const lowerName = wf.name.toLowerCase();
      return searchTerms.every(term => {
        if (term.startsWith('!')) {
          return !lowerName.includes(term.substring(1));
        }
        return lowerName.includes(term);
      });
    });

    // If not found in workflow name, search in job names
    if (!workflow) {
      workflow = repo.workflows.find(wf => {
        if (!wf.jobs || wf.jobs.length === 0) {
          return false;
        }

        // Check if any job matches the search terms and runs on the correct event
        return wf.jobs.some(job => {
          const lowerJobName = job.name.toLowerCase();
          const matchesSearchTerms = searchTerms.every(term => {
            if (term.startsWith('!')) {
              return !lowerJobName.includes(term.substring(1));
            }
            return lowerJobName.includes(term);
          });

          // For Pull Request: check if runsOn includes 'pull_request'
          // For CI (push): check if runsOn includes 'push' or 'schedule'
          const runsOnExpectedEvent = isPullRequest
            ? job.runsOn.includes('pull_request')
            : job.runsOn.includes('push') || job.runsOn.includes('schedule');

          return matchesSearchTerms && runsOnExpectedEvent;
        });
      });
    }

    return {
      is_implemented: !!workflow,
      info_url: workflow
        ? `${repo.url}/actions/${workflow.path.replace('.github/', '')}`
        : '',
    };
  }

  /**
   * Create a security tool record from a tool definition
   */
  private createSecurityToolRecord(
    repo: RepositorySecurityInfo,
    toolDef: SecurityToolDefinition,
  ): CreateSecurityToolInput {
    const baseRecord: CreateSecurityToolInput = {
      repository_name: repo.name,
      repository_url: repo.url,
      tool_category: toolDef.category,
      tool_name: toolDef.name,
      is_required: toolDef.isRequired(repo.languages),
    };

    // Handle GitHub Security tools with direct implementation status
    if (toolDef.infoUrl) {
      return {
        ...baseRecord,
        is_implemented: this.getDirectImplementationStatus(repo, toolDef),
        info_url: toolDef.infoUrl(repo.url),
      };
    }

    // Handle workflow-based tools
    if (toolDef.useWorkflowImplementation && toolDef.workflowSearchTerms) {
      const workflowDetail = this.getWorkflowImplementationDetail(
        repo,
        toolDef.isPullRequest ?? false,
        toolDef.workflowSearchTerms,
      );
      return {
        ...baseRecord,
        ...workflowDetail,
      };
    }

    return baseRecord;
  }

  /**
   * Get direct implementation status for GitHub Security tools
   */
  private getDirectImplementationStatus(
    repo: RepositorySecurityInfo,
    toolDef: SecurityToolDefinition,
  ): boolean {
    switch (toolDef.name) {
      case 'Secret Scanning':
        return repo.secretScanningEnabled;
      case 'Dependabot Alerts':
        return repo.dependabotAlertsEnabled;
      default:
        return false;
    }
  }

  /**
   * Transform repositories to security tool records
   */
  private transformRepositoriesToSecurityToolRecords(
    repositories: RepositorySecurityInfo[],
  ): CreateSecurityToolInput[] {
    const securityToolRecords: CreateSecurityToolInput[] = [];

    for (const repo of repositories) {
      for (const toolDef of SECURITY_TOOLS_CONFIG) {
        securityToolRecords.push(this.createSecurityToolRecord(repo, toolDef));
      }
    }

    return securityToolRecords;
  }

  /**
   * Fetch all repository security information from GitHub and save to database (with pagination)
   */
  async fetchAndSaveAllGitHubSecurityData(): Promise<{ created: number; updated: number }> {
    this.logger.info(`Fetching all repository security info from GitHub`);

    const repositories = await this.fetchAllRepositories();
    const securityToolRecords =
      this.transformRepositoriesToSecurityToolRecords(repositories);

    // Bulk upsert all records - requires system credentials
    const result = await this.securityToolsService.bulkUpsertSecurityTools(
      securityToolRecords,
    );

    this.logger.info(
      `Successfully saved security tool records: ${result.created.length} created, ${result.updated.length} updated`,
    );

    return {
      created: result.created.length,
      updated: result.updated.length,
    };
  }

  /**
   * Fetch latest updated X repository security information from GitHub and save to database
   */
  async fetchAndSaveLatestUpdatedGitHubSecurityData(
    limit: number = this.limitLatestRecords,
  ): Promise<{ created: number; updated: number }> {
    this.logger.info(
      `Fetching latest updated ${limit} repository security info from GitHub`,
    );

    const repositories = await this.fetchLatestUpdatedRepositories(limit);
    const securityToolRecords =
      this.transformRepositoriesToSecurityToolRecords(repositories);

    // Bulk upsert all records - requires system credentials
    const result = await this.securityToolsService.bulkUpsertSecurityTools(
      securityToolRecords,
    );

    this.logger.info(
      `Successfully saved security tool records: ${result.created.length} created, ${result.updated.length} updated`,
    );

    return {
      created: result.created.length,
      updated: result.updated.length,
    };
  }
}
