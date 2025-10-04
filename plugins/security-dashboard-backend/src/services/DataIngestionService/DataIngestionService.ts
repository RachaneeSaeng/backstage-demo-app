import { LoggerService, RootConfigService } from '@backstage/backend-plugin-api';
import { GitHubSecurityService } from './GithubSecurityService';
import { RepositorySecurityInfo } from '../types';

/**
 * Service for data ingestion from various sources
 */
export class DataIngestionService {
  private readonly githubService: GitHubSecurityService;

  constructor(
    config: RootConfigService,
    private readonly logger: LoggerService,
  ) {
    this.githubService = new GitHubSecurityService(config, logger);
  }

  /**
   * Fetch repository security information
   */
  async fetchGitHubSecurityInfo(): Promise<RepositorySecurityInfo[]> {
    this.logger.info(`Fetching repository security info`);

    const repositories = await this.githubService.getRepositoriesWithSecurityInfo({
      org: 'RachaneeSaeng',
      includeArchived: false,
      excludePattern: '^react',
      includePattern: '',
    });

    return repositories;
  }
}
