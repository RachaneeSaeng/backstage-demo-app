export type GitHubWorkflow = {
  id: number;
  name: string;
  url: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  runsOn: Array<'pull_request' | 'push' | 'schedule'>;
  jobs?: Array<{
    name: string;
  }>;
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

type Connection<T> = {
  pageInfo: PageInfo;
  nodes: T[];
};

export type RepositoryGraphQLResponse = {
  name: string;
  url: string;
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
