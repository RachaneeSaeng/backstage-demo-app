import { mockServices } from '@backstage/backend-test-utils';
import { DataIngestionService } from './DataIngestionService';
import { GitHubSecurityService } from '../GitHubSecurityService';
import { SecurityToolsService } from '../SecurityToolsService';
import { RepositorySecurityInfo } from '../GitHubSecurityService/types';

// Mock dependencies
jest.mock('../GitHubSecurityService');

describe('DataIngestionService', () => {
  const logger = mockServices.logger.mock();
  const config = mockServices.rootConfig();

  let service: DataIngestionService;
  let mockGitHubService: jest.Mocked<GitHubSecurityService>;
  let mockSecurityToolsService: jest.Mocked<SecurityToolsService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGitHubService = {
      getAllRepositoriesWithSecurityInfo: jest.fn(),
      getLatestUpdatedRepositoriesWithSecurityInfo: jest.fn(),
    } as any;

    mockSecurityToolsService = {
      bulkUpsertSecurityTools: jest.fn(),
      listSecurityTools: jest.fn(),
      getSecurityTool: jest.fn(),
      deleteSecurityTool: jest.fn(),
    } as any;

    (GitHubSecurityService as jest.MockedClass<typeof GitHubSecurityService>).mockImplementation(
      () => mockGitHubService as any,
    );

    service = new DataIngestionService(config, logger, mockSecurityToolsService, {
      org: 'ORG',
      excludeRepositoriesPatterns: ['ABC*'],
      limitLatestRecords: 30,
    });
  });

  describe('fetchAndSaveAllGitHubSecurityData', () => {
    it('should fetch all repositories and save security tools', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'test-repo-1',
          url: 'https://github.com/test-org/test-repo-1',
          languages: ['TypeScript', 'JavaScript'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: true,
          workflows: [],
        },
        {
          name: 'test-repo-2',
          url: 'https://github.com/test-org/test-repo-2',
          languages: ['Python'],
          dependabotAlertsEnabled: false,
          secretScanningEnabled: false,
          workflows: [],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [{ repository_name: 'test-repo-1' } as any],
        updated: [{ repository_name: 'test-repo-2' } as any],
      });

      const result = await service.fetchAndSaveAllGitHubSecurityData();

      expect(result).toEqual({ created: 1, updated: 1 });
      expect(mockGitHubService.getAllRepositoriesWithSecurityInfo).toHaveBeenCalledWith({
        org: 'ORG',
        excludePatterns: ['ABC*'],
      });
      expect(mockSecurityToolsService.bulkUpsertSecurityTools).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved 2 repositories'),
      );
    });

    it('should transform repositories to security tool records', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'repo-with-tools',
          url: 'https://github.com/test-org/repo-with-tools',
          languages: ['Java'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: true,
          workflows: [
            {
              id: 1,
              name: 'CodeQL Analysis',
              url: 'https://api.github.com/repos/test-org/repo/actions/workflows/1',
              path: '.github/workflows/codeql.yml',
              state: 'active',
              created_at: '2023-01-01',
              updated_at: '2023-01-02',
              triggersOn: ['pull_request'],
              jobs: [
                {
                  name: 'CodeQL',
                },
              ],
            },
          ],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveAllGitHubSecurityData();

      const bulkUpsertCall = mockSecurityToolsService.bulkUpsertSecurityTools.mock.calls[0][0];

      // Verify security tools are created for each repository
      expect(bulkUpsertCall.length).toBeGreaterThan(0);

      // Check that required tools are marked as required
      const secretScanningTool = bulkUpsertCall.find(
        (tool: any) => tool.tool_name === 'Secret Scanning',
      );
      expect(secretScanningTool).toBeDefined();
      expect(secretScanningTool?.is_required).toBe(true);
      expect(secretScanningTool?.is_implemented).toBe(true);
    });

    it('should handle empty repository list', async () => {
      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue([]);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      const result = await service.fetchAndSaveAllGitHubSecurityData();

      expect(result).toEqual({ created: 0, updated: 0 });
    });
  });

  describe('fetchAndSaveLatestUpdatedGitHubSecurityData', () => {
    it('should fetch latest updated repositories with default limit', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'recent-repo',
          url: 'https://github.com/test-org/recent-repo',
          languages: ['Go'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: false,
          workflows: [],
        },
      ];

      mockGitHubService.getLatestUpdatedRepositoriesWithSecurityInfo.mockResolvedValue(
        mockRepositories,
      );
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [{ repository_name: 'recent-repo' } as any],
        updated: [],
      });

      const result = await service.fetchAndSaveLatestUpdatedGitHubSecurityData();

      expect(result).toEqual({ created: 1, updated: 0 });
      expect(mockGitHubService.getLatestUpdatedRepositoriesWithSecurityInfo).toHaveBeenCalledWith(
        {
          org: 'ORG',
          excludePatterns: ['ABC*'],
        },
        30,
      );
    });

    it('should fetch latest updated repositories with custom limit', async () => {
      mockGitHubService.getLatestUpdatedRepositoriesWithSecurityInfo.mockResolvedValue([]);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveLatestUpdatedGitHubSecurityData(10);

      expect(mockGitHubService.getLatestUpdatedRepositoriesWithSecurityInfo).toHaveBeenCalledWith(
        expect.any(Object),
        10,
      );
    });
  });

  describe('workflow detection', () => {
    it('should detect workflows by name', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'workflow-repo',
          url: 'https://github.com/test-org/workflow-repo',
          languages: ['TypeScript'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: true,
          workflows: [
            {
              id: 1,
              name: 'Dependency Review',
              url: 'https://api.github.com/repos/test-org/repo/actions/workflows/1',
              path: '.github/workflows/dependency-review.yml',
              state: 'active',
              created_at: '2023-01-01',
              updated_at: '2023-01-02',
              triggersOn: ['pull_request'],
              jobs: [],
            },
          ],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveAllGitHubSecurityData();

      const bulkUpsertCall = mockSecurityToolsService.bulkUpsertSecurityTools.mock.calls[0][0];
      const dependencyReviewTool = bulkUpsertCall.find(
        (tool: any) =>
          tool.tool_name === 'Dependabot Dependency Review' &&
          tool.tool_category === 'Pull Request',
      );

      expect(dependencyReviewTool).toBeDefined();
      expect(dependencyReviewTool?.is_implemented).toBe(true);
      expect(dependencyReviewTool?.info_url).toContain('actions/workflows');
    });

    it('should detect workflows by job name', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'job-workflow-repo',
          url: 'https://github.com/test-org/job-workflow-repo',
          languages: ['Python'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: true,
          workflows: [
            {
              id: 2,
              name: 'Security Checks',
              url: 'https://api.github.com/repos/test-org/repo/actions/workflows/2',
              path: '.github/workflows/security.yml',
              state: 'active',
              created_at: '2023-01-01',
              updated_at: '2023-01-02',
              triggersOn: ['pull_request'],
              jobs: [
                {
                  name: 'IaC Scan',
                },
              ],
            },
          ],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveAllGitHubSecurityData();

      const bulkUpsertCall = mockSecurityToolsService.bulkUpsertSecurityTools.mock.calls[0][0];
      const trivyPRTool = bulkUpsertCall.find(
        (tool: any) => tool.tool_name === 'Trivy' && tool.tool_category === 'Pull Request',
      );

      expect(trivyPRTool).toBeDefined();
      expect(trivyPRTool?.is_implemented).toBe(true);
    });

    it('should distinguish between PR and CI workflows', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'dual-workflow-repo',
          url: 'https://github.com/test-org/dual-workflow-repo',
          languages: ['Go'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: true,
          workflows: [
            {
              id: 3,
              name: 'Security',
              url: 'https://api.github.com/repos/test-org/repo/actions/workflows/3',
              path: '.github/workflows/security.yml',
              state: 'active',
              created_at: '2023-01-01',
              updated_at: '2023-01-02',
              triggersOn: ['push', 'pull_request'],
              jobs: [
                {
                  name: 'IaC Scan - Trivy PR'
                },
                {
                  name: 'IaC Scan - Trivy CI'
                },
              ],
            },
          ],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveAllGitHubSecurityData();

      const bulkUpsertCall = mockSecurityToolsService.bulkUpsertSecurityTools.mock.calls[0][0];

      const trivyPRTool = bulkUpsertCall.find(
        (tool: any) => tool.tool_name === 'Trivy' && tool.tool_category === 'Pull Request',
      );
      const trivyCITool = bulkUpsertCall.find(
        (tool: any) => tool.tool_name === 'Trivy' && tool.tool_category === 'CI',
      );

      expect(trivyPRTool?.is_implemented).toBe(true);
      expect(trivyCITool?.is_implemented).toBe(true);
    });
  });

  describe('language-based tool requirements', () => {
    it('should mark Veracode as required for Java repositories', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'java-repo',
          url: 'https://github.com/test-org/java-repo',
          languages: ['Java'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: true,
          workflows: [],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveAllGitHubSecurityData();

      const bulkUpsertCall = mockSecurityToolsService.bulkUpsertSecurityTools.mock.calls[0][0];
      const veracodeTool = bulkUpsertCall.find(
        (tool: any) => tool.tool_name === 'Veracode Pipeline Scan',
      );

      expect(veracodeTool?.is_required).toBe(true);
    });

    it('should mark Trivy as required for HCL repositories', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'hcl-repo',
          url: 'https://github.com/test-org/hcl-repo',
          languages: ['HCL'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: true,
          workflows: [],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveAllGitHubSecurityData();

      const bulkUpsertCall = mockSecurityToolsService.bulkUpsertSecurityTools.mock.calls[0][0];
      const trivyTool = bulkUpsertCall.find(
        (tool: any) => tool.tool_name === 'Trivy' && tool.tool_category === 'Pull Request',
      );

      expect(trivyTool?.is_required).toBe(true);
    });

    it('should mark optional tools as not required', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'ts-repo',
          url: 'https://github.com/test-org/ts-repo',
          languages: ['TypeScript'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: true,
          workflows: [],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveAllGitHubSecurityData();

      const bulkUpsertCall = mockSecurityToolsService.bulkUpsertSecurityTools.mock.calls[0][0];
      const codeqlTool = bulkUpsertCall.find(
        (tool: any) => tool.tool_name === 'CodeQL' && tool.tool_category === 'Pull Request',
      );

      expect(codeqlTool?.is_required).toBe(false);
    });
  });

  describe('GitHub security tools implementation status', () => {
    it('should set Secret Scanning implementation status based on repository', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'secure-repo',
          url: 'https://github.com/test-org/secure-repo',
          languages: ['TypeScript'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: true,
          workflows: [],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveAllGitHubSecurityData();

      const bulkUpsertCall = mockSecurityToolsService.bulkUpsertSecurityTools.mock.calls[0][0];
      const secretScanningTool = bulkUpsertCall.find(
        (tool: any) => tool.tool_name === 'Secret Scanning',
      );

      expect(secretScanningTool?.is_implemented).toBe(true);
      expect(secretScanningTool?.info_url).toContain('security/secret-scanning');
    });

    it('should set Dependabot implementation status based on repository', async () => {
      const mockRepositories: RepositorySecurityInfo[] = [
        {
          name: 'dependabot-repo',
          url: 'https://github.com/test-org/dependabot-repo',
          languages: ['Python'],
          dependabotAlertsEnabled: true,
          secretScanningEnabled: false,
          workflows: [],
        },
      ];

      mockGitHubService.getAllRepositoriesWithSecurityInfo.mockResolvedValue(mockRepositories);
      mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
        created: [],
        updated: [],
      });

      await service.fetchAndSaveAllGitHubSecurityData();

      const bulkUpsertCall = mockSecurityToolsService.bulkUpsertSecurityTools.mock.calls[0][0];
      const dependabotTool = bulkUpsertCall.find(
        (tool: any) => tool.tool_name === 'Dependabot Alerts',
      );

      expect(dependabotTool?.is_implemented).toBe(true);
      expect(dependabotTool?.info_url).toContain('security/dependabot');
    });
  });
});
