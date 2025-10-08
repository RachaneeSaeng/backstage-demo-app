import { LoggerService } from '@backstage/backend-plugin-api';
import * as yaml from 'js-yaml';

export type WorkflowTriggerEvent = 'pull_request' | 'push' | 'schedule';

export interface ParsedWorkflow {
  jobs: ParsedJob[];
  triggersOn?: WorkflowTriggerEvent[];
}

export interface ParsedJob {
  name: string;
}

/**
 * Utility class for parsing GitHub workflow YAML files
 */
export class WorkflowParser {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Parse workflow YAML file to extract jobs and their trigger events
   */
  parseWorkflowFile(content: string): ParsedWorkflow | null {
    try {
      const workflowData = yaml.load(content) as any;

      if (!workflowData || !workflowData.jobs) {
        return null;
      }

      const triggers = this.extractTriggers(workflowData.on);
      const triggersOn = this.mapTriggersToTriggersOn(triggers);

      return {
        jobs: this.extractJobs(workflowData.jobs),
        triggersOn,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse workflow file: ${error}`);
      return null;
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
   * Map workflow triggers to triggersOn events
   * Note: workflow_dispatch is treated as 'push' for CI purposes
   */
  private mapTriggersToTriggersOn(triggers: Set<string>): WorkflowTriggerEvent[] {
    const triggersOn: WorkflowTriggerEvent[] = [];

    if (triggers.has('pull_request')) {
      triggersOn.push('pull_request');
    }
    if (triggers.has('push')) {
      triggersOn.push('push');
    }
    if (triggers.has('schedule')) {
      triggersOn.push('schedule');
    }

    // If no recognized triggers, default to push
    if (triggersOn.length === 0) {
      triggersOn.push('push');
    }

    return triggersOn;
  }

  /**
   * Extract jobs from workflow configuration
   */
  private extractJobs(jobs: any): ParsedJob[] {
    return Object.entries(jobs).map(([jobKey, jobValue]: [string, any]) => ({
      name: jobValue.name || jobKey,
    }));
  }
}
