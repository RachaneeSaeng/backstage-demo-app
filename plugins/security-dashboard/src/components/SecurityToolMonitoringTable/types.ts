export interface SecurityStatus {
  status: 'critical-risk' | 'high-risk' | 'medium-risk' | 'low-risk' | 'none';
  text: string;
  link?: string;
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