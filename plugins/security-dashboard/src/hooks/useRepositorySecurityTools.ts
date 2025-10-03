import { useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import { securityDashboardApiRef } from '../api';
import { convertRepositoryDataStructure } from './utils';
import type { Repository } from '../types';
// Add import for RepositoryToolData type
import type { RepositoryToolData } from '../types';

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
    // await new Promise(resolve => setTimeout(resolve, 1000));
    const data = await api.listSecurityTools();
    return convertRepositoryDataStructure(data.items as RepositoryToolData[]);
  }, [api]);

  return {
    repositorySecurityTools: value,
    loading,
    error,
  };
}