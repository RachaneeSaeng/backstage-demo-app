import { WorkflowMatcher } from './WorkflowMatcher';
import { RepositorySecurityInfo } from '../GitHubSecurityService';

describe('WorkflowMatcher', () => {
  let matcher: WorkflowMatcher;

  beforeEach(() => {
    matcher = new WorkflowMatcher();
  });

  describe('getWorkflowImplementationDetail', () => {
    it('should find workflow by name', () => {
      const repo: RepositorySecurityInfo = {
        name: 'test-repo',
        url: 'https://github.com/org/test-repo',
        languages: ['TypeScript'],
        dependabotAlertsEnabled: false,
        secretScanningEnabled: false,
        workflows: [
          {
            id: 1,
            name: 'CodeQL Analysis',
            url: 'https://api.github.com/repos/org/test-repo/actions/workflows/1',
            path: '.github/workflows/codeql.yml',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
            runsOn: ['push', 'schedule'],
            jobs: [],
          },
        ],
      };

      const result = matcher.getWorkflowImplementationDetail(repo, false, ['codeql']);

      expect(result.is_implemented).toBe(true);
      expect(result.info_url).toContain('workflows/codeql.yml');
    });

    it('should find workflow by job name', () => {
      const repo: RepositorySecurityInfo = {
        name: 'test-repo',
        url: 'https://github.com/org/test-repo',
        languages: ['TypeScript'],
        dependabotAlertsEnabled: false,
        secretScanningEnabled: false,
        workflows: [
          {
            id: 1,
            name: 'CI',
            url: 'https://api.github.com/repos/org/test-repo/actions/workflows/1',
            path: '.github/workflows/ci.yml',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
            runsOn: ['push', 'schedule'],
            jobs: [
              {
                name: 'Trivy Security Scan',
              },
            ],
          },
        ],
      };

      const result = matcher.getWorkflowImplementationDetail(repo, false, ['trivy']);

      expect(result.is_implemented).toBe(true);
      expect(result.info_url).toContain('workflows/ci.yml');
    });

    it('should respect pull request event filtering', () => {
      const repo: RepositorySecurityInfo = {
        name: 'test-repo',
        url: 'https://github.com/org/test-repo',
        languages: ['TypeScript'],
        dependabotAlertsEnabled: false,
        secretScanningEnabled: false,
        workflows: [
          {
            id: 1,
            name: 'CI',
            url: 'https://api.github.com/repos/org/test-repo/actions/workflows/1',
            path: '.github/workflows/ci.yml',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
            runsOn: ['push'],
            jobs: [
              {
                name: 'Trivy Security Scan',
              },
            ],
          },
        ],
      };

      const result = matcher.getWorkflowImplementationDetail(repo, true, ['trivy']);

      expect(result.is_implemented).toBe(false);
    });

    it('should handle negative search terms', () => {
      const repo: RepositorySecurityInfo = {
        name: 'test-repo',
        url: 'https://github.com/org/test-repo',
        languages: ['TypeScript'],
        dependabotAlertsEnabled: false,
        secretScanningEnabled: false,
        workflows: [
          {
            id: 1,
            name: 'Veracode Policy Scan',
            url: 'https://api.github.com/repos/org/test-repo/actions/workflows/1',
            path: '.github/workflows/veracode.yml',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
            runsOn: ['push'],
            jobs: [],
          },
          {
            id: 2,
            name: 'Veracode Pipeline Scan',
            url: 'https://api.github.com/repos/org/test-repo/actions/workflows/2',
            path: '.github/workflows/veracode-pipeline.yml',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
            runsOn: ['push'],
            jobs: [],
          },
        ],
      };

      const result = matcher.getWorkflowImplementationDetail(repo, false, ['veracode', '!pipeline']);

      expect(result.is_implemented).toBe(true);
      expect(result.info_url).toContain('veracode.yml');
    });

    it('should return not implemented when no workflow matches', () => {
      const repo: RepositorySecurityInfo = {
        name: 'test-repo',
        url: 'https://github.com/org/test-repo',
        languages: ['TypeScript'],
        dependabotAlertsEnabled: false,
        secretScanningEnabled: false,
        workflows: [],
      };

      const result = matcher.getWorkflowImplementationDetail(repo, false, ['nonexistent']);

      expect(result.is_implemented).toBe(false);
      expect(result.info_url).toBe('');
    });
  });
});
