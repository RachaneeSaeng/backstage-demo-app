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

  constructor(
    config: RootConfigService,
    private readonly logger: LoggerService,
    private readonly securityToolsService: SecurityToolsService,
  ) {
    this.githubService = new GitHubSecurityService(config, logger);
  }

  /**
   * Fetch repositories from GitHub with security information
   */
  private async fetchRepositories() {
    const repositories =
      await this.githubService.getRepositoriesWithSecurityInfo({
        org: 'RachaneeSaeng',
        includeArchived: false,
        excludePattern: '^react',
      });

    this.logger.info(
      `Retrieved ${repositories.length} repositories, transforming to security tool records`,
    );

    return repositories;
  }

  /**
   * Transform repositories to security tool records
   */
  private transformRepositoriesToSecurityToolRecords(
    repositories: Awaited<
      ReturnType<typeof this.githubService.getRepositoriesWithSecurityInfo>
    >,
  ): CreateSecurityToolInput[] {
    const veracodeSupportedLanguages = [
      'javascript',
      'typescript',
      'python',
      'java',
      'c#',
      'ruby',
      'go',
      'php',
      'ionic',
      'kotlin',
      'swift',
      'objective-c',
      'scala',
      'perl',
    ];

    const securityToolRecords: CreateSecurityToolInput[] = [];

    for (const repo of repositories) {
      // 1. Github Security - Secret Scanning
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Github Security',
        tool_name: 'Secret Scanning',
        is_required: true,
        implemented: repo.secretScanningEnabled,
        info_url: 'TODO: to be added',
      });

      // 2. Github Security - Dependabot Alerts
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Github Security',
        tool_name: 'Dependabot',
        is_required: true,
        implemented: repo.dependabotAlertsEnabled,
        info_url: 'TODO: to be added',
      });

      // 3. Pull Request - Dependabot Dependency Review
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'Dependabot',
        is_required: true,
        implemented: repo.workflows.some(workflow =>
          workflow.name.toLowerCase().includes('dependency review'),
        ),
        info_url: 'TODO: to be added',
      });

      // 4. Pull Request - pnpm audit
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'pnpm audit',
        is_required: false,
        implemented: repo.workflows.some(workflow =>
          workflow.name.toLowerCase().includes('pnpm audit'),
        ),
      });

      // 5. Pull Request - Veracode Pipeline Scan
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'Veracode',
        is_required: repo.languages.some(lang =>
          veracodeSupportedLanguages.includes(lang.toLowerCase()),
        ),
        implemented: repo.workflows.some(workflow =>
          workflow.name.toLowerCase().includes('veracode pipeline'),
        ),
        info_url: 'TODO: to be added',
      });

      // 6. Pull Request - CodeQL
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'CodeQL',
        is_required: false,
        implemented: repo.workflows.some(workflow =>
          workflow.name.toLowerCase().includes('codeql'),
        ),
        info_url: 'TODO: to be added',
      });

      // 7. Pull Request - Trivy
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'Trivy',
        is_required: repo.languages.some(lang => lang === 'HCL'),
        implemented: repo.workflows.some(workflow =>
          workflow.name.toLowerCase().includes('trivy'),
        ),
        info_url: 'TODO: to be added',
      });

      // 8. CI - Veracode Policy Scan
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'CI',
        tool_name: 'Veracode',
        is_required: repo.languages.some(lang =>
          veracodeSupportedLanguages.includes(lang.toLowerCase()),
        ),
        implemented: repo.workflows.some(workflow =>
          workflow.name.toLowerCase().includes('veracode policy'),
        ),
        info_url: 'TODO: to be added',
      });

      // 9. CI - pnpm audit
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'CI',
        tool_name: 'pnpm audit',
        is_required: false,
        implemented: repo.workflows.some(workflow =>
          workflow.name.toLowerCase().includes('pnpm audit'),
        ),
        info_url: 'TODO: to be added',
      });

      // 10. CI - CodeQL
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'CI',
        tool_name: 'CodeQL',
        is_required: false,
        implemented: repo.workflows.some(workflow =>
          workflow.name.toLowerCase().includes('codeql'),
        ),
        info_url: 'TODO: to be added',
      });

      // 11. Pull Request - Trivy
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'CI',
        tool_name: 'Trivy',
        is_required: repo.languages.some(lang => lang === 'HCL'),
        implemented: repo.workflows.some(workflow =>
          workflow.name.toLowerCase().includes('trivy'),
        ),
        info_url: 'TODO: to be added',
      });
    }

    return securityToolRecords;
  }

  /**
   * Fetch repository security information from GitHub and save to database
   */
  async fetchAndSaveGitHubSecurityData(): Promise<void> {
    this.logger.info(`Fetching repository security info from GitHub`);

    const repositories = await this.fetchRepositories();
    const securityToolRecords =
      this.transformRepositoriesToSecurityToolRecords(repositories);

    // Bulk upsert all records - requires system credentials
    const result = await this.securityToolsService.bulkUpsertSecurityTools(
      securityToolRecords,
    );

    this.logger.info(
      `Successfully saved security tool records: ${result.created.length} created, ${result.updated.length} updated`,
    );
  }
}
