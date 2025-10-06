import { Repository, RepositoryToolData } from '../types';

// Convert flat data structure to nested structure
export const convertRepositoryDataStructure = (flatData: RepositoryToolData[]): Repository[] => {
  const repoMap = new Map<string, Repository>();

  const repo_owner = 'RachaneeSaeng';
  flatData.forEach((item) => {
    if (!repoMap.has(item.repository_name)) {
      repoMap.set(item.repository_name, {
        name: item.repository_name,
        url: `https://github.com/${repo_owner}/${item.repository_name}`, // Placeholder, as URL is not provided in RepositoryToolData
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