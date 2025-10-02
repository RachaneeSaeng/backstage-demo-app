import { SecurityStatus, Repository, RepositoryToolData } from './types';
import mockFinalRepositoryData2 from './mockData/mockFinalRepositoryData2.json';

export const getToolStatus = (repository: Repository, toolCategory: string, toolName: string): SecurityStatus => {
  const step = repository.steps.find(s => s.toolCategory === toolCategory);
  const tool = step?.tools.find(t => t.name === toolName);

  if (!tool) {
    return { status: 'none', text: 'n/a' };
  }

  if (tool.isRequired && !tool.implemented) {
    return { status: 'critical-risk', text: ' ⚠️ Required tool is not implemented ⚠️ '};
  } else if (tool.implemented) {
    return { status: 'low-risk', text: 'View the tool status', link: tool.info_url };
  } else {
    return { status: 'none', text: 'n/a' };
  }
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
      isRequired: item.is_required,
      implemented: item.implemented,
      info_url: item.info_url,
    });
  });

  return Array.from(repoMap.values());
};

// New function to get repositories from flat data structure
export const repositoriesData: Repository[] = convertRepositoryDataStructure(mockFinalRepositoryData2.data as RepositoryToolData[]);