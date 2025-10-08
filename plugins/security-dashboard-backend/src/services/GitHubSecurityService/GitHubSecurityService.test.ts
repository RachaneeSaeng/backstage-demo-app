import { mockServices } from '@backstage/backend-test-utils';
import { GitHubSecurityService } from './GithubSecurityService';
import { OctokitFactory } from './OctokitFactory';
import { WorkflowParser } from './WorkflowParser';

// Mock dependencies
jest.mock('./OctokitFactory');
jest.mock('./WorkflowParser');
jest.mock('@backstage/integration', () => ({
  ScmIntegrations: {
    fromConfig: jest.fn(() => ({
      github: {
        byHost: jest.fn(() => ({
          config: {
            apiBaseUrl: 'https://api.github.com',
          },
        })),
      },
    })),
  },
  DefaultGithubCredentialsProvider: {
    fromIntegrations: jest.fn(() => ({
      getCredentials: jest.fn(async () => ({
        headers: {
          authorization: 'token test-token',
        },
        token: 'test-token',
      })),
    })),
  },
}));

describe('GitHubSecurityService', () => {
  const logger = mockServices.logger.mock();
  const config = mockServices.rootConfig();

  let service: GitHubSecurityService;
  let mockGraphqlClient: jest.Mock;
  let mockOctokit: any;
  let mockWorkflowParser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGraphqlClient = jest.fn();
    mockOctokit = {
      request: jest.fn(),
    };

    mockWorkflowParser = {
      parseWorkflowFile: jest.fn(() => []),
    };

    (OctokitFactory as jest.MockedClass<typeof OctokitFactory>).mockImplementation(
      () =>
        ({
          createGraphQLClient: jest.fn(() => mockGraphqlClient),
          createRestClient: jest.fn(() => mockOctokit),
        } as any),
    );

    (WorkflowParser as jest.MockedClass<typeof WorkflowParser>).mockImplementation(
      () => mockWorkflowParser as any,
    );

    service = new GitHubSecurityService(config, logger);
  });

  describe('getAllRepositoriesWithSecurityInfo', () => {
    it('should fetch all repositories with pagination', async () => {
      // Mock paginated GraphQL responses
      mockGraphqlClient
        .mockResolvedValueOnce({
          repositoryOwner: {
            repositories: {
              nodes: [
                {
                  name: 'repo1',
                  url: 'https://github.com/test-org/repo1',
                  languages: { nodes: [{ name: 'TypeScript' }] },
                  hasVulnerabilityAlertsEnabled: true,
                },
              ],
              pageInfo: {
                hasNextPage: true,
                endCursor: 'cursor1',
              },
            },
          },
        })
        .mockResolvedValueOnce({
          repositoryOwner: {
            repositories: {
              nodes: [
                {
                  name: 'repo2',
                  url: 'https://github.com/test-org/repo2',
                  languages: { nodes: [{ name: 'JavaScript' }] },
                  hasVulnerabilityAlertsEnabled: false,
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: 'cursor2',
              },
            },
          },
        });

      // Mock REST API responses
      mockOctokit.request.mockResolvedValue({
        status: 200,
        data: { workflows: [] },
      });

      const result = await service.getAllRepositoriesWithSecurityInfo({
        org: 'test-org',
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('repo1');
      expect(result[1].name).toBe('repo2');
      expect(mockGraphqlClient).toHaveBeenCalledTimes(2);
    });

    it('should filter repositories by exclude pattern', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: {
          repositories: {
            nodes: [
              {
                name: 'keep-this',
                url: 'https://github.com/test-org/keep-this',
                languages: { nodes: [] },
                hasVulnerabilityAlertsEnabled: true,
              },
              {
                name: 'exclude-this',
                url: 'https://github.com/test-org/exclude-this',
                languages: { nodes: [] },
                hasVulnerabilityAlertsEnabled: false,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      mockOctokit.request.mockResolvedValue({
        status: 200,
        data: { workflows: [] },
      });

      const result = await service.getAllRepositoriesWithSecurityInfo({
        org: 'test-org',
        excludePattern: 'exclude-*',
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('keep-this');
    });

    it('should handle errors for individual repositories gracefully', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: {
          repositories: {
            nodes: [
              {
                name: 'good-repo',
                url: 'https://github.com/test-org/good-repo',
                languages: { nodes: [] },
                hasVulnerabilityAlertsEnabled: true,
              },
              {
                name: 'bad-repo',
                url: 'https://github.com/test-org/bad-repo',
                languages: { nodes: [] },
                hasVulnerabilityAlertsEnabled: false,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      // good-repo: secret scanning check, workflows check
      // bad-repo: secret scanning error
      mockOctokit.request
        .mockResolvedValueOnce({ status: 200, data: [] })
        .mockResolvedValueOnce({ status: 200, data: { workflows: [] } })
        .mockRejectedValueOnce(new Error('API Error'));

      const result = await service.getAllRepositoriesWithSecurityInfo({
        org: 'test-org',
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('good-repo');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch security info for bad-repo'),
      );
    });

    it('should throw error when organization not found', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: null,
      });

      await expect(
        service.getAllRepositoriesWithSecurityInfo({ org: 'non-existent-org' }),
      ).rejects.toThrow('Organization non-existent-org not found or has no repositories');
    });
  });

  describe('getLatestUpdatedRepositoriesWithSecurityInfo', () => {
    it('should fetch latest updated repositories with limit', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: {
          repositories: {
            nodes: [
              {
                name: 'latest-repo',
                url: 'https://github.com/test-org/latest-repo',
                languages: { nodes: [{ name: 'Python' }] },
                hasVulnerabilityAlertsEnabled: true,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      mockOctokit.request.mockResolvedValue({
        status: 200,
        data: { workflows: [] },
      });

      const result = await service.getLatestUpdatedRepositoriesWithSecurityInfo(
        { org: 'test-org' },
        10,
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('latest-repo');
      expect(mockGraphqlClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ first: 10 }),
      );
    });
  });

  describe('secret scanning detection', () => {
    it('should detect secret scanning when enabled', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: {
          repositories: {
            nodes: [
              {
                name: 'secure-repo',
                url: 'https://github.com/test-org/secure-repo',
                languages: { nodes: [] },
                hasVulnerabilityAlertsEnabled: true,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      // Secret scanning check (returns 200) and workflows check
      mockOctokit.request
        .mockResolvedValueOnce({ status: 200, data: [] })
        .mockResolvedValueOnce({ status: 200, data: { workflows: [] } });

      const result = await service.getAllRepositoriesWithSecurityInfo({
        org: 'test-org',
      });

      expect(result).toHaveLength(1);
      expect(result[0].secretScanningEnabled).toBe(true);
    });

    it('should detect secret scanning when disabled (403)', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: {
          repositories: {
            nodes: [
              {
                name: 'insecure-repo',
                url: 'https://github.com/test-org/insecure-repo',
                languages: { nodes: [] },
                hasVulnerabilityAlertsEnabled: false,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      // Secret scanning check (returns 403) and workflows check
      mockOctokit.request
        .mockRejectedValueOnce({ status: 403 })
        .mockResolvedValueOnce({ status: 200, data: { workflows: [] } });

      const result = await service.getAllRepositoriesWithSecurityInfo({
        org: 'test-org',
      });

      expect(result).toHaveLength(1);
      expect(result[0].secretScanningEnabled).toBe(false);
    });

    it('should detect secret scanning when not found (404)', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: {
          repositories: {
            nodes: [
              {
                name: 'no-secret-scan',
                url: 'https://github.com/test-org/no-secret-scan',
                languages: { nodes: [] },
                hasVulnerabilityAlertsEnabled: false,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      // Secret scanning check (returns 404) and workflows check
      mockOctokit.request
        .mockRejectedValueOnce({ status: 404 })
        .mockResolvedValueOnce({ status: 200, data: { workflows: [] } });

      const result = await service.getAllRepositoriesWithSecurityInfo({
        org: 'test-org',
      });

      expect(result).toHaveLength(1);
      expect(result[0].secretScanningEnabled).toBe(false);
    });
  });

  describe('workflow fetching', () => {
    it('should fetch and parse workflows', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: {
          repositories: {
            nodes: [
              {
                name: 'workflow-repo',
                url: 'https://github.com/test-org/workflow-repo',
                languages: { nodes: [] },
                hasVulnerabilityAlertsEnabled: true,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      mockOctokit.request
        .mockResolvedValueOnce({ status: 200, data: [] })
        .mockResolvedValueOnce({
          status: 200,
          data: {
            workflows: [
              {
                id: 123,
                name: 'CI',
                url: 'https://api.github.com/repos/test-org/workflow-repo/actions/workflows/123',
                path: '.github/workflows/ci.yml',
                state: 'active',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-02T00:00:00Z',
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: {
            content: Buffer.from('name: CI\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest').toString('base64'),
          },
        });

      mockWorkflowParser.parseWorkflowFile.mockReturnValue([
        { name: 'test', runsOn: ['push'] },
      ]);

      const result = await service.getAllRepositoriesWithSecurityInfo({
        org: 'test-org',
      });

      expect(result[0].workflows).toHaveLength(1);
      expect(result[0].workflows[0].name).toBe('CI');
      expect(result[0].workflows[0].jobs).toHaveLength(1);
    });

    it('should handle workflow fetch errors gracefully', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: {
          repositories: {
            nodes: [
              {
                name: 'no-workflows',
                url: 'https://github.com/test-org/no-workflows',
                languages: { nodes: [] },
                hasVulnerabilityAlertsEnabled: false,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      mockOctokit.request
        .mockResolvedValueOnce({ status: 200, data: [] })
        .mockRejectedValueOnce({ status: 404 });

      const result = await service.getAllRepositoriesWithSecurityInfo({
        org: 'test-org',
      });

      expect(result[0].workflows).toEqual([]);
    });
  });

  describe('repository enrichment', () => {
    it('should enrich repository with all security information', async () => {
      mockGraphqlClient.mockResolvedValue({
        repositoryOwner: {
          repositories: {
            nodes: [
              {
                name: 'full-repo',
                url: 'https://github.com/test-org/full-repo',
                languages: {
                  nodes: [
                    { name: 'TypeScript' },
                    { name: 'JavaScript' },
                    { name: 'Python' },
                  ],
                },
                hasVulnerabilityAlertsEnabled: true,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      mockOctokit.request
        .mockResolvedValueOnce({ status: 200, data: [] })
        .mockResolvedValueOnce({ status: 200, data: { workflows: [] } });

      const result = await service.getAllRepositoriesWithSecurityInfo({
        org: 'test-org',
      });

      expect(result[0]).toMatchObject({
        name: 'full-repo',
        url: 'https://github.com/test-org/full-repo',
        languages: ['TypeScript', 'JavaScript', 'Python'],
        dependabotAlertsEnabled: true,
        secretScanningEnabled: true,
        workflows: [],
      });
    });
  });
});
