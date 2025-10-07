import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { GitHubSecurityService } from './GithubSecurityService';
import { CreateSecurityToolInput, SecurityToolsService } from '../types';

/**
 * Service for data ingestion from various sources
 */
export class DataIngestionService {
  private readonly githubService: GitHubSecurityService;
  private readonly org = 'RachaneeSaeng';
  private readonly excludeRepositoriesPattern = 'Comm*';
  private readonly limitLatestRecords = 20;

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
   */
  private getWorkflowImplementationDetail(
    repo: any,
    ...searchTerms: string[]
  ): { is_implemented: boolean; info_url: string } {
    const workflow = repo.workflows.find((workflow: { name: string; path?: string }) => {
      const lowerName = workflow.name.toLowerCase();
      return searchTerms.every(term => {
        if (term.startsWith('!')) {
          return !lowerName.includes(term.substring(1));
        }
        return lowerName.includes(term);
      });
    });
    return {
      is_implemented: !!workflow,
      info_url: workflow ? `${repo.url}/actions/${workflow.path.replace('.github/', '')}` : ''
    };
  }

  /**
   * Transform repositories to security tool records
   */
  private transformRepositoriesToSecurityToolRecords(
    repositories: Awaited<ReturnType<any>>,
  ): CreateSecurityToolInput[] {
    const veracodeSupportedLanguages = [
      'JavaScript',
      'TypeScript',
      'Python',
      'Java',
      'C#',
      'Ruby',
      'Go',
      'PHP',      
      'Kotlin',
      'Scala',
      'Ionic'
    ];

    const securityToolRecords: CreateSecurityToolInput[] = [];

    for (const repo of repositories) {
      // 1. Github Security - Secret Scanning
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'Github Security',
        tool_name: 'Secret Scanning',
        is_required: true,
        is_implemented: repo.secretScanningEnabled,
        info_url: `${repo.url}/security/secret-scanning`,
      });

      // 2. Github Security - Dependabot Alerts
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'Github Security',
        tool_name: 'Dependabot Alerts',
        is_required: true,
        is_implemented: repo.dependabotAlertsEnabled,
        info_url: `${repo.url}/security/dependabot`,
      });

      // 3. Pull Request - Dependabot Dependency Review
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'Pull Request',
        tool_name: 'Dependabot Dependency Review',
        is_required: true,
        ...this.getWorkflowImplementationDetail(repo, 'dependency review'),
      });

      // 4. Pull Request - pnpm audit
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'Pull Request',
        tool_name: 'pnpm audit',
        is_required: false,
        ...this.getWorkflowImplementationDetail(repo, 'pnpm audit', 'pull request'),
      });

      // 5. Pull Request - Veracode Pipeline Scan
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'Pull Request',
        tool_name: 'Veracode Pipeline Scan',
        is_required: repo.languages.some((lang: string) =>
          veracodeSupportedLanguages.includes(lang),
        ),
        ...this.getWorkflowImplementationDetail(repo, 'veracode', 'pipeline'),
      });

      // 6. Pull Request - CodeQL
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'Pull Request',
        tool_name: 'CodeQL',
        is_required: false,
        ...this.getWorkflowImplementationDetail(repo, 'codeql', 'pull request'),
      });

      // 7. Pull Request - Trivy
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'Pull Request',
        tool_name: 'Trivy',
        is_required: repo.languages.some((lang: string) => lang === 'HCL'),
        ...this.getWorkflowImplementationDetail(repo, 'trivy', 'pull request'),
      });

      // 8. CI - Veracode Policy Scan
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'CI',
        tool_name: 'Veracode Policy Scan',
        is_required: repo.languages.some((lang: string) =>
          veracodeSupportedLanguages.includes(lang),
        ),
        ...this.getWorkflowImplementationDetail(repo, 'veracode', 'policy'),
      });

      // 9. CI - pnpm audit
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'CI',
        tool_name: 'pnpm audit',
        is_required: false,
        ...this.getWorkflowImplementationDetail(repo, 'pnpm audit', '!pull request'),
      });

      // 10. CI - CodeQL
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'CI',
        tool_name: 'CodeQL',
        is_required: false,
        ...this.getWorkflowImplementationDetail(repo, 'codeql', '!pull request'),
      });

      // 11. CI - Trivy
      securityToolRecords.push({
        repository_name: repo.name,
        repository_url: repo.url,
        tool_category: 'CI',
        tool_name: 'Trivy',
        is_required: repo.languages.some((lang: string) => lang === 'HCL'),
        ...this.getWorkflowImplementationDetail(repo, 'trivy', '!pull request'),
      });
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
