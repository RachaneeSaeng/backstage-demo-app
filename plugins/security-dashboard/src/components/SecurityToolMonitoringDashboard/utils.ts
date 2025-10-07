import { RepositoryTool, SecurityStatus } from '../../types';

export const getToolStatus = (repositoryTool: RepositoryTool): SecurityStatus => {  
  if (!repositoryTool) {
    return { status: 'none', text: 'n/a' };
  }

  if (repositoryTool.isRequired && !repositoryTool.isImplemented) {
    return { status: 'critical-risk', text: 'Required tool is not implemented', link: repositoryTool.info_url};
  } else if (repositoryTool.isImplemented) {
    return { status: 'low-risk', text: 'View the tool status', link: repositoryTool.info_url };
  } else {
    return { status: 'none', text: 'n/a' };
  }
};