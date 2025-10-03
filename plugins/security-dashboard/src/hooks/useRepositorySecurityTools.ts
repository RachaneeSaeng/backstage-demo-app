import { useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import { securityDashboardApiRef } from '../api';
import { convertRepositoryDataStructure } from './utils';
import type { Repository } from '../types';
// Add import for RepositoryToolData type
import type { RepositoryToolData } from '../types';
import mockFinalRepositoryData2 from './mockData/mockFinalRepositoryData2.json';

/**
 * Hook to fetch all Repository Security Tools
 * @public
 */
export function useRepositorySecurityTools(): {
  repositorySecurityTools?: Repository[];
  loading: boolean;
  error?: Error;
} {
  const api = useApi(securityDashboardApiRef);

  const { value, loading, error } = useAsync(async () => {
    // const data = await api.listSecurityTools();
    // debugger;
    await new Promise(resolve => setTimeout(resolve, 1000));
    const data = mockFinalRepositoryData2.data as RepositoryToolData[];
    return convertRepositoryDataStructure(data);
  }, [api]);

  return {
    repositorySecurityTools: value,
    loading,
    error,
  };
}