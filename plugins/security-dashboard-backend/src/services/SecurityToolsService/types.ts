import { BackstageCredentials } from '@backstage/backend-plugin-api';

export interface RepositorySecurityTool {
  repository_name: string;
  programming_languages?: string | null;
  tool_category: string;
  tool_name: string;
  is_required: boolean;
  implemented: boolean;
  info_url?: string | null;
  updated_at: string;
}

export interface CreateSecurityToolInput {
  repository_name: string;
  programming_languages?: string | null;
  tool_category: string;
  tool_name: string;
  is_required?: boolean;
  implemented?: boolean;
  info_url?: string | null;
}

export interface UpdateSecurityToolInput {
  programming_languages?: string | null;
  tool_category?: string;
  tool_name?: string;
  is_required?: boolean;
  implemented?: boolean;
  info_url?: string | null;
}

export interface SecurityToolsService {
  createSecurityTool(
    input: CreateSecurityToolInput,
    options: {
      credentials: BackstageCredentials;
    },
  ): Promise<RepositorySecurityTool>;

  listSecurityTools(): Promise<{ items: RepositorySecurityTool[] }>;

  getSecurityTool(request: {
    repositoryName: string;
  }): Promise<RepositorySecurityTool>;

  updateSecurityTool(
    repositoryName: string,
    input: UpdateSecurityToolInput,
    options: {
      credentials: BackstageCredentials;
    },
  ): Promise<RepositorySecurityTool>;

  deleteSecurityTool(
    request: { repositoryName: string },
    options: {
      credentials: BackstageCredentials;
    },
  ): Promise<void>;
}
