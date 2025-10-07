/**
 * GraphQL queries for GitHub API
 */

/**
 * Query to fetch all repositories with pagination
 */
export const FETCH_ALL_REPOSITORIES_QUERY = `
  query repositories($org: String!, $cursor: String) {
    repositoryOwner(login: $org) {
      repositories(first: 100, isArchived: false, after: $cursor) {
        nodes {
          name
          url
          isArchived
          hasVulnerabilityAlertsEnabled
          languages(first: 10) {
            nodes {
              name
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

/**
 * Query to fetch latest updated repositories
 */
export const FETCH_LATEST_REPOSITORIES_QUERY = `
  query repositories($org: String!, $first: Int!) {
    repositoryOwner(login: $org) {
      repositories(first: $first, orderBy: {field: UPDATED_AT, direction: DESC}, isArchived: false) {
        nodes {
          name
          url
          isArchived
          hasVulnerabilityAlertsEnabled
          languages(first: 10) {
            nodes {
              name
            }
          }
        }
      }
    }
  }
`;
