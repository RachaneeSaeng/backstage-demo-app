import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { RepositoryToolData } from '../types';

export interface SecurityDashboardApi {
  listSecurityTools(): Promise<{items: RepositoryToolData[]}>;
}

export const securityDashboardApiRef = createApiRef<SecurityDashboardApi>({
  id: 'plugin.security-dashboard.service',
});

export class SecurityDashboardClient implements SecurityDashboardApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async listSecurityTools(): Promise<{items: RepositoryToolData[]}> {
    const baseUrl = await this.discoveryApi.getBaseUrl('security-dashboard');
    const response = await this.fetchApi.fetch(`${baseUrl}/security-tools`);

    if (!response.ok) {
      throw new Error(`Failed to fetch security tools: ${response.statusText}`);
    }

    return await response.json();
  }
}
