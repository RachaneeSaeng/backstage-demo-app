export interface SecurityStatus {
  status: 'critical-risk' | 'high-risk' | 'medium-risk' | 'low-risk' | 'none';
  text: string;
  link?: string;
}

export interface RepositoryToolData {
  repository_name: string;
  tool_category: string;
  tool_name: string;
  is_required: boolean;
  implemented: boolean;
  info_url: string;
}

export interface Repository {
  name: string;
  url: string;
  steps: Array<{
    toolCategory: string;
    tools: Array<{
      name: string;
      isRequired: boolean;
      implemented: boolean;
      info_url: string;
    }>;
  }>;
}

export const allowedStatuses = [
  "critical-risk",
  "high-risk",
  "medium-risk",
  "low-risk",
  "none",
] as const;