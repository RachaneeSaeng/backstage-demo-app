import { LoggerService } from '@backstage/backend-plugin-api';
import { ScmIntegrations } from '@backstage/integration';
import { GitHubSecurityService } from './GithubSecurityService';
import { RepositorySecurityInfo } from '../types';

/**
 * Service for data ingestion from various sources
 */
export class DataIngestionService {
  private readonly githubService: GitHubSecurityService;

  constructor(
    integrations: ScmIntegrations,
    private readonly logger: LoggerService,
  ) {
    this.githubService = new GitHubSecurityService(integrations, logger);
  }

  /**
   * Fetch repository security information for an organization
   */
  async fetchGitHubSecurityInfo(org: string): Promise<RepositorySecurityInfo[]> {
    this.logger.info(`Fetching repository security info for org: ${org}`);

    const repositories = await this.githubService.getRepositoriesWithSecurityInfo({
      org,
      includeArchived: false,
      excludePattern: '^react',
      includePattern: '',
    });

    return repositories;
  }
}
