import {
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { DenseTable } from './DenseTable';
import { Repository, RepositoryToolData } from './types';
import { convertRepositoryDataStructure } from './utils';


import mockFinalRepositoryData2 from './mockData/mockFinalRepositoryData2.json';
import { useApp } from '@backstage/core-plugin-api';

export const SecurityToolMonitoringTable = () => {
//   const app = useApp();
// const { Progress } = app.getComponents();
  const { value, loading, error } = useAsync(async (): Promise<Repository[]> => {
    // Would use fetch in a real world example
    // Add a short delay to simulate loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    return convertRepositoryDataStructure(mockFinalRepositoryData2.data as RepositoryToolData[]);
  }, []);

  if (loading) {
    return <div>Querying data..</div>; //<Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <DenseTable repositoriesData={value ?? []}/>;
};
