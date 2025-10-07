import { RepositorySecurityTool } from '../types';

export type SecurityToolKey = Pick<RepositorySecurityTool, 'repository_name' | 'tool_category' | 'tool_name'>;

export type SecurityToolInput = {
  repository_name: string;
  repository_url?: string;
  tool_category: string;
  tool_name: string;
  is_required?: boolean;
  is_implemented?: boolean;
  info_url?: string | null;
};
