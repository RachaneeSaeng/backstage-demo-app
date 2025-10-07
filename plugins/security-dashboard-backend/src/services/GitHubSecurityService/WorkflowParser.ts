import { LoggerService } from '@backstage/backend-plugin-api';
import * as yaml from 'js-yaml';

export type WorkflowTriggerEvent = 'pull_request' | 'push' | 'schedule';

export interface ParsedJob {
  name: string;
  runsOn: WorkflowTriggerEvent[];
}

/**
 * Utility class for parsing GitHub workflow YAML files
 */
export class WorkflowParser {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Parse workflow YAML file to extract jobs and their trigger events
   */
  parseWorkflowFile(content: string): ParsedJob[] {
    try {
      const workflowData = yaml.load(content) as any;

      if (!workflowData || !workflowData.jobs) {
        return [];
      }

      const triggers = this.extractTriggers(workflowData.on);
      const runsOn = this.mapTriggersToRunsOn(triggers);

      return this.extractJobs(workflowData.jobs, runsOn);
    } catch (error) {
      this.logger.warn(`Failed to parse workflow file: ${error}`);
      return [];
    }
  }

  /**
   * Extract trigger events from workflow 'on' configuration
   */
  private extractTriggers(onConfig: any): Set<string> {
    const triggers = new Set<string>();

    if (!onConfig) {
      return triggers;
    }

    if (typeof onConfig === 'string') {
      triggers.add(onConfig);
    } else if (Array.isArray(onConfig)) {
      onConfig.forEach((event: string) => triggers.add(event));
    } else if (typeof onConfig === 'object') {
      Object.keys(onConfig).forEach(event => triggers.add(event));
    }

    return triggers;
  }

  /**
   * Map workflow triggers to runsOn events
   * Note: workflow_dispatch is treated as 'push' for CI purposes
   */
  private mapTriggersToRunsOn(triggers: Set<string>): WorkflowTriggerEvent[] {
    const runsOn: WorkflowTriggerEvent[] = [];

    if (triggers.has('pull_request')) {
      runsOn.push('pull_request');
    }
    if (triggers.has('push')) {
      runsOn.push('push');
    }
    if (triggers.has('schedule')) {
      runsOn.push('schedule');
    }

    // If no recognized triggers, default to push
    if (runsOn.length === 0) {
      runsOn.push('push');
    }

    return runsOn;
  }

  /**
   * Extract jobs from workflow configuration
   */
  private extractJobs(jobs: any, runsOn: WorkflowTriggerEvent[]): ParsedJob[] {
    return Object.entries(jobs).map(([jobKey, jobValue]: [string, any]) => ({
      name: jobValue.name || jobKey,
      runsOn,
    }));
  }
}
