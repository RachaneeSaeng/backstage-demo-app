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
  status: 'critical-risk' | 'high-risk' | 'medium-risk' | 'low-risk' | 'none';
  info_url: string;
}

export interface Repository {
  name: string;
  steps: Array<{
    toolCategory: string;
    tools: Array<{
      name: string;
      status: 'critical-risk' | 'high-risk' | 'medium-risk' | 'low-risk' | 'none';
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