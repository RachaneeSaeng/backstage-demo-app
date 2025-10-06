import { SecurityStatus, Repository } from '../../types';

export const getToolStatus = (repository: Repository, toolCategory: string, toolName: string): SecurityStatus => {
  const step = repository.steps.find(s => s.toolCategory === toolCategory);
  const tool = step?.tools.find(t => t.name === toolName);

  if (!tool) {
    return { status: 'none', text: 'n/a' };
  }

  if (tool.isRequired && !tool.implemented) {
    return { status: 'critical-risk', text: ' ⚠️ Required tool is not implemented ⚠️ ', link: tool.info_url};
  } else if (tool.implemented) {
    return { status: 'low-risk', text: 'View the tool status', link: tool.info_url };
  } else {
    return { status: 'none', text: 'n/a' };
  }
};