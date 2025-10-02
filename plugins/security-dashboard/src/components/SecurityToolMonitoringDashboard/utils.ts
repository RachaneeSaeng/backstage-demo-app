import { SecurityStatus, Repository, RepositoryToolData, allowedStatuses } from './types';
import mockFinalRepositoryData2 from './mockData/mockFinalRepositoryData2.json';

export const getToolStatus = (repository: Repository, toolCategory: string, toolName: string): SecurityStatus => {
  const step = repository.steps.find(s => s.toolCategory === toolCategory);
  const tool = step?.tools.find(t => t.name === toolName);

  if (!tool || tool.status === 'none') {
    return { status: 'none', text: 'n/a' };
  }

  return {
    status: tool.status,
    text: 'Latest scan report',
    link: '#'
  };
};

// Convert flat data structure to nested structure
const convertRepositoryDataStructure = (flatData: RepositoryToolData[]): Repository[] => {
  const repoMap = new Map<string, Repository>();

  flatData.forEach((item) => {
    if (!repoMap.has(item.repository_name)) {
      repoMap.set(item.repository_name, {
        name: item.repository_name,
        steps: [],
      });
    }

    const repo = repoMap.get(item.repository_name)!;
    let step = repo.steps.find(s => s.toolCategory === item.tool_category);

    if (!step) {
      step = {
        toolCategory: item.tool_category,
        tools: [],
      };
      repo.steps.push(step);
    }

    step.tools.push({
      name: item.tool_name,
      status: allowedStatuses.includes(item.status) ? item.status : 'none',
    });
  });

  return Array.from(repoMap.values());
};

// New function to get repositories from flat data structure
export const repositoriesData: Repository[] = convertRepositoryDataStructure(mockFinalRepositoryData2.data as RepositoryToolData[]);