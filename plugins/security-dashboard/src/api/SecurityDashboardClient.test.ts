import { SecurityDashboardClient } from './SecurityDashboardClient';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

describe('SecurityDashboardClient', () => {
  let mockDiscoveryApi: jest.Mocked<DiscoveryApi>;
  let mockFetchApi: jest.Mocked<FetchApi>;
  let client: SecurityDashboardClient;

  beforeEach(() => {
    mockDiscoveryApi = {
      getBaseUrl: jest.fn(),
    } as any;

    mockFetchApi = {
      fetch: jest.fn(),
    } as any;

    client = new SecurityDashboardClient({
      discoveryApi: mockDiscoveryApi,
      fetchApi: mockFetchApi,
    });
  });

  describe('listSecurityTools', () => {
    it('should fetch security tools successfully', async () => {
      const mockData = {
        items: [
          {
            repository_name: 'test-repo',
            repository_url: 'https://github.com/test/test-repo',
            tool_category: 'SAST',
            tool_name: 'ESLint',
            is_required: true,
            is_implemented: false,
            info_url: 'https://eslint.org',
          },
        ],
      };

      mockDiscoveryApi.getBaseUrl.mockResolvedValue('http://localhost:7007/api/security-dashboard');
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await client.listSecurityTools();

      expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('security-dashboard');
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/security-dashboard/security-tools',
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error when fetch fails', async () => {
      mockDiscoveryApi.getBaseUrl.mockResolvedValue('http://localhost:7007/api/security-dashboard');
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(client.listSecurityTools()).rejects.toThrow(
        'Failed to fetch security tools: Internal Server Error',
      );
    });

    it('should throw error when discovery fails', async () => {
      mockDiscoveryApi.getBaseUrl.mockRejectedValue(new Error('Discovery failed'));

      await expect(client.listSecurityTools()).rejects.toThrow('Discovery failed');
    });

    it('should handle empty response', async () => {
      const mockData = { items: [] };

      mockDiscoveryApi.getBaseUrl.mockResolvedValue('http://localhost:7007/api/security-dashboard');
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await client.listSecurityTools();

      expect(result).toEqual(mockData);
      expect(result.items).toHaveLength(0);
    });
  });
});
