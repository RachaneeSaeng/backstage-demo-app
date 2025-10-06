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
  private readonly excludeRepositoriesPattern = '^react';

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
   * Transform repositories to security tool records
   */
  private transformRepositoriesToSecurityToolRecords(
    repositories: Awaited<ReturnType<any>>,
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
        info_url: `https://github.com/${this.org}/${repo.name}/security/secret-scanning`,
      });

      // 2. Github Security - Dependabot Alerts
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Github Security',
        tool_name: 'Dependabot',
        is_required: true,
        implemented: repo.dependabotAlertsEnabled,
        info_url: `https://github.com/${this.org}/${repo.name}/security/dependabot`,
      });

      // 3. Pull Request - Dependabot Dependency Review
      const dependabotWorkflow = repo.workflows.find((workflow: { name: string; url?: string }) =>
        workflow.name.toLowerCase().includes('dependency review'),
      );
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'Dependabot',
        is_required: true,
        implemented: !!dependabotWorkflow,
        info_url: dependabotWorkflow?.url,
      });

      // 4. Pull Request - pnpm audit
      const pnpmAuditWorkflow = repo.workflows.find((workflow: { name: string; url?: string }) =>
        workflow.name.toLowerCase().includes('pnpm audit') && workflow.name.toLowerCase().includes('pull request'),
      );
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'pnpm audit',
        is_required: false,
        implemented: !!pnpmAuditWorkflow,
        info_url: pnpmAuditWorkflow?.url,
      });

      // 5. Pull Request - Veracode Pipeline Scan
      const veracodePipelineScanWorkflow = repo.workflows.find((workflow: { name: string; url?: string }) =>
        workflow.name.toLowerCase().includes('veracode pipeline'),
      );
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'Veracode',
        is_required: repo.languages.some((lang: string) =>
          veracodeSupportedLanguages.includes(lang.toLowerCase()),
        ),
        implemented: !!veracodePipelineScanWorkflow,
        info_url: veracodePipelineScanWorkflow?.url,
      });

      // 6. Pull Request - CodeQL
      const codeQL = repo.workflows.find((workflow: { name: string; url?: string }) =>
        workflow.name.toLowerCase().includes('codeql') && workflow.name.toLowerCase().includes('pull request'),
      );
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'CodeQL',
        is_required: false,
        implemented: !!codeQL,
        info_url: codeQL?.url,
      });

      // 7. Pull Request - Trivy
      const trivyWorkflow = repo.workflows.find((workflow: { name: string; url?: string }) =>
        workflow.name.toLowerCase().includes('trivy') && workflow.name.toLowerCase().includes('pull request'),
      );
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'Pull Request',
        tool_name: 'Trivy',
        is_required: repo.languages.some((lang: string) => lang === 'HCL'),
        implemented: !!trivyWorkflow,
        info_url: trivyWorkflow?.url,
      });

      // 8. CI - Veracode Policy Scan
      const veracodePolicyScanWorkflow = repo.workflows.find((workflow: { name: string; url?: string }) =>
        workflow.name.toLowerCase().includes('veracode policy'),
      );
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'CI',
        tool_name: 'Veracode',
        is_required: repo.languages.some((lang: string) =>
          veracodeSupportedLanguages.includes(lang.toLowerCase()),
        ),
        implemented: !!veracodePolicyScanWorkflow,
        info_url: veracodePolicyScanWorkflow?.url,
      });

      // 9. CI - pnpm audit
      const pnpmAuditWorkflow_CI = repo.workflows.find((workflow: { name: string; url?: string }) =>
        workflow.name.toLowerCase().includes('pnpm audit') && !workflow.name.toLowerCase().includes('pull request')
      );
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'CI',
        tool_name: 'pnpm audit',
        is_required: false,
        implemented: !!pnpmAuditWorkflow_CI,
        info_url: pnpmAuditWorkflow_CI?.url,
      });

      // 10. CI - CodeQL
      const codeQL_CI = repo.workflows.find((workflow: { name: string; url?: string }) =>
        workflow.name.toLowerCase().includes('codeql') && !workflow.name.toLowerCase().includes('pull request')
      );
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'CI',
        tool_name: 'CodeQL',
        is_required: false,
        implemented: !!codeQL_CI,
        info_url: codeQL_CI?.url,
      });

      // 11. Pull Request - Trivy
      const trivyWorkflow_CI = repo.workflows.find((workflow: { name: string; url?: string }) =>
        workflow.name.toLowerCase().includes('trivy') && !workflow.name.toLowerCase().includes('pull request')
      );
      securityToolRecords.push({
        repository_name: repo.name,
        tool_category: 'CI',
        tool_name: 'Trivy',
        is_required: repo.languages.some((lang: string) => lang === 'HCL'),
        implemented: !!trivyWorkflow_CI,
        info_url: trivyWorkflow_CI?.url,
      });
    }

    return securityToolRecords;
  }

  /**
   * Fetch all repository security information from GitHub and save to database (with pagination)
   */
  async fetchAndSaveAllGitHubSecurityData(): Promise<void> {
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
  }

  /**
   * Fetch latest updated X repository security information from GitHub and save to database
   */
  async fetchAndSaveLatestUpdatedGitHubSecurityData(
    limit: number = 30,
  ): Promise<void> {
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
  }
}
