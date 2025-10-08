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
   * Check if workflow or any job matches expected event trigger
   */
  private matchesExpectedEvent(
    workflow: any,
    isPullRequest: boolean,
  ): boolean {
    const workflowTriggersOn = workflow.triggersOn;
    if (workflowTriggersOn && workflowTriggersOn.length > 0) {
      return isPullRequest
        ? workflowTriggersOn.includes('pull_request')
        : workflowTriggersOn.includes('push') || workflowTriggersOn.includes('schedule');
    }

    return false;
  }

  /**
   * Check if a workflow name matches the search terms and runs on expected event
   */
  private matchesWorkflowName(
    workflow: any,
    searchTerms: string[],
    isPullRequest: boolean,
  ): boolean {
    const matchesSearchTerms = this.matchesSearchTerms(workflow.name, searchTerms);
    const triggersOnExpectedEvent = this.matchesExpectedEvent(workflow, isPullRequest);

    return matchesSearchTerms && triggersOnExpectedEvent;
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
      const triggersOnExpectedEvent = this.matchesExpectedEvent(workflow, isPullRequest);

      return matchesSearchTerms && triggersOnExpectedEvent;
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
      this.matchesWorkflowName(wf, searchTerms, isPullRequest),
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
