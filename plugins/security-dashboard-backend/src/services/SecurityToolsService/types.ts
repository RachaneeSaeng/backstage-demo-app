export interface RepositorySecurityTool {
  repository_name: string;
  repository_url: string;
  tool_category: string;
  tool_name: string;
  is_required: boolean;
  is_implemented: boolean;
  info_url?: string | null;
  updated_at: string;
}

export interface CreateSecurityToolInput {
  repository_name: string;
  repository_url: string;
  tool_category: string;
  tool_name: string;
  is_required: boolean;
  is_implemented: boolean;
  info_url?: string | null;
}

export interface UpdateSecurityToolInput {
  tool_category?: string;
  tool_name?: string;
  is_required: boolean;
  is_implemented: boolean;
  info_url?: string | null;
}

export interface SecurityToolsService {

  bulkUpsertSecurityTools(
    inputs: CreateSecurityToolInput[]
  ): Promise<{
    created: RepositorySecurityTool[];
    updated: RepositorySecurityTool[];
  }>;

  listSecurityTools(): Promise<{ items: RepositorySecurityTool[] }>;

  getSecurityTool(request: {
    repositoryName: string;
  }): Promise<RepositorySecurityTool>;

  deleteSecurityTool(
    request: { repositoryName: string }
  ): Promise<void>;
}

export type SecurityToolKey = Pick<RepositorySecurityTool, 'repository_name' | 'tool_category' | 'tool_name'>;

export type SecurityToolInput = {
  repository_name: string;
  repository_url?: string;
  tool_category: string;
  tool_name: string;
  is_required: boolean;
  is_implemented: boolean;
  info_url?: string | null;
};
