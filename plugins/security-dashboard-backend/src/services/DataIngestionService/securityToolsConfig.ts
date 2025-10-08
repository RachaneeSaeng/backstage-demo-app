import { VERACODE_SUPPORTED_LANGUAGES, TRIVY_REQUIRED_LANGUAGES } from './constants';

/**
 * Security tool definition interface
 */
export interface SecurityToolDefinition {
  category: string;
  name: string;
  isRequired: (languages: string[]) => boolean;
  isPullRequest?: boolean;
  workflowSearchTerms?: string[];
  infoUrl?: (repoUrl: string) => string;
  useWorkflowImplementation?: boolean;
}

/**
 * Security tool configuration
 * Defines all security tools that should be tracked for each repository
 */
export const SECURITY_TOOLS_CONFIG: SecurityToolDefinition[] = [
  // GitHub Security Tools
  {
    category: 'Github Security',
    name: 'Secret Scanning',
    isRequired: () => true,
    infoUrl: (repoUrl: string) => `${repoUrl}/security/secret-scanning`,
  },
  {
    category: 'Github Security',
    name: 'Dependabot Alerts',
    isRequired: () => true,
    infoUrl: (repoUrl: string) => `${repoUrl}/security/dependabot`,
  },

  // Pull Request Tools
  {
    category: 'Pull Request',
    name: 'Dependabot Dependency Review',
    isRequired: () => true,
    isPullRequest: true,
    useWorkflowImplementation: true,
    workflowSearchTerms: ['dependency review'],
  },
  {
    category: 'Pull Request',
    name: 'pnpm audit',
    isRequired: () => false,
    isPullRequest: true,
    useWorkflowImplementation: true,
    workflowSearchTerms: ['pnpm audit'],
  },
  {
    category: 'Pull Request',
    name: 'Veracode Pipeline Scan',
    isRequired: (languages: string[]) =>
      languages.some(lang =>
        VERACODE_SUPPORTED_LANGUAGES.includes(lang as any),
      ),
    isPullRequest: true,
    useWorkflowImplementation: true,
    workflowSearchTerms: ['veracode'],
  },
  {
    category: 'Pull Request',
    name: 'CodeQL',
    isRequired: () => false,
    isPullRequest: true,
    useWorkflowImplementation: true,
    workflowSearchTerms: ['codeql'],
  },
  {
    category: 'Pull Request',
    name: 'Trivy',
    isRequired: (languages: string[]) =>
      languages.some(lang => TRIVY_REQUIRED_LANGUAGES.includes(lang as any)),
    isPullRequest: true,
    useWorkflowImplementation: true,
    workflowSearchTerms: ['trivy'],
  },

  // CI Tools
  {
    category: 'CI',
    name: 'Veracode Policy Scan',
    isRequired: (languages: string[]) =>
      languages.some(lang =>
        VERACODE_SUPPORTED_LANGUAGES.includes(lang as any),
      ),
    isPullRequest: false,
    useWorkflowImplementation: true,
    workflowSearchTerms: ['veracode'],
  },
  {
    category: 'CI',
    name: 'pnpm audit',
    isRequired: () => false,
    isPullRequest: false,
    useWorkflowImplementation: true,
    workflowSearchTerms: ['pnpm audit'],
  },
  {
    category: 'CI',
    name: 'CodeQL',
    isRequired: () => false,
    isPullRequest: false,
    useWorkflowImplementation: true,
    workflowSearchTerms: ['codeql'],
  },
  {
    category: 'CI',
    name: 'Trivy',
    isRequired: (languages: string[]) =>
      languages.some(lang => TRIVY_REQUIRED_LANGUAGES.includes(lang as any)),
    isPullRequest: false,
    useWorkflowImplementation: true,
    workflowSearchTerms: ['trivy'],
  },
];
