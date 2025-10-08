import { RepositorySecurityInfo } from '../GitHubSecurityService';
import { WorkflowImplementationDetail } from './types';

/**
 * Utility class for matching workflows against search criteria
 */
export class WorkflowMatcher {
  /**
   * Check if search terms match a workflow or job name
   */
  private matchesSearchTerms(name: string, searchTerms: string[]): boolean {
    const lowerName = name.toLowerCase();
    return searchTerms.every(term => {
      if (term.startsWith('!')) {
        return !lowerName.includes(term.substring(1));
      }
      return lowerName.includes(term);
    });
  }

  /**
   * Check if a workflow name matches the search terms
   */
  private matchesWorkflowName(
    workflowName: string,
    searchTerms: string[],
  ): boolean {
    return this.matchesSearchTerms(workflowName, searchTerms);
  }

  /**
   * Check if any job in the workflow matches search terms and runs on expected event
   */
  private matchesJobInWorkflow(
    workflow: any,
    searchTerms: string[],
    isPullRequest: boolean,
  ): boolean {
    if (!workflow.jobs || workflow.jobs.length === 0) {
      return false;
    }

    return workflow.jobs.some((job: any) => {
      const matchesSearchTerms = this.matchesSearchTerms(job.name, searchTerms);

      // For Pull Request: check if runsOn includes 'pull_request'
      // For CI (push): check if runsOn includes 'push' or 'schedule'
      const runsOnExpectedEvent = isPullRequest
        ? job.runsOn.includes('pull_request')
        : job.runsOn.includes('push') || job.runsOn.includes('schedule');

      return matchesSearchTerms && runsOnExpectedEvent;
    });
  }

  /**
   * Find workflow and create tool info
   * Checks both workflow names and job names for matches
   */
  getWorkflowImplementationDetail(
    repo: RepositorySecurityInfo,
    isPullRequest: boolean,
    searchTerms: string[],
  ): WorkflowImplementationDetail {
    // First try to find in workflow names (backward compatibility)
    let workflow = repo.workflows.find(wf =>
      this.matchesWorkflowName(wf.name, searchTerms),
    );

    // If not found in workflow name, search in job names
    if (!workflow) {
      workflow = repo.workflows.find(wf =>
        this.matchesJobInWorkflow(wf, searchTerms, isPullRequest),
      );
    }

    return {
      is_implemented: !!workflow,
      info_url: workflow
        ? `${repo.url}/actions/${workflow.path.replace('.github/', '')}`
        : '',
    };
  }
}
