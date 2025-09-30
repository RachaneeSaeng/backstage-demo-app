import { SecurityStatus, Repository, allowedStatuses } from './types';
import mockFinalRepositoryData from '../../mockData/mockFinalRepositoryData.json';

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

export const repositories: Repository[] = mockFinalRepositoryData.repositories.map((repo: any) => ({
  name: repo.name,
  steps: repo.steps.map((step: any) => ({
    toolCategory: step.toolCategory,
    tools: step.tools.map((tool: any) => ({
      name: tool.name,
      status: allowedStatuses.includes(tool.status)
        ? tool.status
        : "none",
    })),
  })),
}));