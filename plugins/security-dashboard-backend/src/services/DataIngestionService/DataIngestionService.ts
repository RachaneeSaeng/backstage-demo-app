import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { GitHubSecurityService } from '../GitHubSecurityService';
import { RepositorySecurityInfo } from '../GitHubSecurityService';
import { CreateSecurityToolInput, SecurityToolsService } from '../SecurityToolsService';
import { SECURITY_TOOLS_CONFIG, SecurityToolDefinition } from './securityToolsConfig';
import { WorkflowMatcher } from './WorkflowMatcher';

export interface DataIngestionOptions {
  org: string;
  excludeRepositoriesPattern: string;
  limitLatestRecords: number;
}

/**
 * Service for data ingestion from various sources
 */
export class DataIngestionService {
  private readonly githubService: GitHubSecurityService;
  private readonly workflowMatcher: WorkflowMatcher;
  private readonly org: string;
  private readonly excludeRepositoriesPattern: string;
  private readonly limitLatestRecords: number;

  constructor(
    config: RootConfigService,
    private readonly logger: LoggerService,
    private readonly securityToolsService: SecurityToolsService,
    options: DataIngestionOptions,
  ) {
    this.githubService = new GitHubSecurityService(config, logger);
    this.workflowMatcher = new WorkflowMatcher();
    this.org = options.org;
    this.excludeRepositoriesPattern = options.excludeRepositoriesPattern;
    this.limitLatestRecords = options.limitLatestRecords;
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
      is_implemented: false,
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
      const workflowDetail = this.workflowMatcher.getWorkflowImplementationDetail(
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
