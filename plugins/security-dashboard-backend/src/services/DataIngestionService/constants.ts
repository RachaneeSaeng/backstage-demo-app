/**
 * Constants for GitHub API and service configuration
 */

// GitHub API Configuration
export const GITHUB_API = {
  HOST: 'github.com',
  DEFAULT_BASE_URL: 'https://api.github.com',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
} as const;

// Supported Languages
export const VERACODE_SUPPORTED_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C#',
  'Ruby',
  'Go',
  'PHP',
  'Kotlin',
  'Scala',
  'Ionic',
] as const;

export const TRIVY_REQUIRED_LANGUAGES = ['HCL'] as const;
