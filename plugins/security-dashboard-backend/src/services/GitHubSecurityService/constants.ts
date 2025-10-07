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