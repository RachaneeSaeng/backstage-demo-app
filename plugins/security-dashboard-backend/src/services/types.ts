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

  bulkUpsertSecurityTools(
    inputs: CreateSecurityToolInput[],
    options: {
      credentials: BackstageCredentials;
    },
  ): Promise<{
    created: RepositorySecurityTool[];
    updated: RepositorySecurityTool[];
  }>;

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

export type GitHubWorkflow = {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
};

/**
 * Repository security information
 */
export type RepositorySecurityInfo = {
  name: string;
  url: string;
  languages: string[];
  dependabotAlertsEnabled: boolean;
  secretScanningEnabled: boolean;
  workflows: GitHubWorkflow[];
};

/**
 * Filter options for repository queries
 */
export type RepositoryFilters = {
  org: string;
  includeArchived?: boolean;
  excludePattern?: string;
};

/**
 * GraphQL response types
 */
export type PageInfo = {
  hasNextPage: boolean;
  endCursor?: string;
};

export type Connection<T> = {
  pageInfo: PageInfo;
  nodes: T[];
};

export type RepositoryGraphQLResponse = {
  name: string;
  url: string;
  isArchived: boolean;
  hasVulnerabilityAlertsEnabled: boolean;
  languages: {
    nodes: Array<{
      name: string;
    }>;
  };
};

export type OrganizationRepositoriesResponse = {
  repositoryOwner?: {
    repositories: Connection<RepositoryGraphQLResponse>;
  };
};

