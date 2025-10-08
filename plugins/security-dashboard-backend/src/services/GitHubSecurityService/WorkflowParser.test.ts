import { mockServices } from '@backstage/backend-test-utils';
import { WorkflowParser, ParsedJob } from './WorkflowParser';

describe('WorkflowParser', () => {
  const logger = mockServices.logger.mock();
  let parser: WorkflowParser;

  beforeEach(() => {
    parser = new WorkflowParser(logger);
  });

  describe('parseWorkflowFile', () => {
    it('should parse workflow with pull_request trigger', () => {
      const yamlContent = `
name: Test Workflow
on: pull_request
jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Run Tests',
        runsOn: ['pull_request'],
      });
    });

    it('should parse workflow with push trigger', () => {
      const yamlContent = `
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm build
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'build',
        runsOn: ['push'],
      });
    });

    it('should parse workflow with schedule trigger', () => {
      const yamlContent = `
name: Nightly Build
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  nightly:
    name: Nightly Job
    runs-on: ubuntu-latest
    steps:
      - run: echo "nightly"
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Nightly Job',
        runsOn: ['schedule'],
      });
    });

    it('should parse workflow with multiple triggers as array', () => {
      const yamlContent = `
name: Multi Trigger
on: [push, pull_request]
jobs:
  test:
    name: Test Job
    runs-on: ubuntu-latest
    steps:
      - run: npm test
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Job');
      expect(result[0].runsOn).toEqual(expect.arrayContaining(['push', 'pull_request']));
    });

    it('should parse workflow with multiple triggers as object', () => {
      const yamlContent = `
name: Complex Workflow
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'
jobs:
  job1:
    name: First Job
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
  job2:
    name: Second Job
    runs-on: ubuntu-latest
    steps:
      - run: echo "test2"
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('First Job');
      expect(result[0].runsOn).toEqual(expect.arrayContaining(['push', 'pull_request', 'schedule']));
      expect(result[1].name).toBe('Second Job');
      expect(result[1].runsOn).toEqual(expect.arrayContaining(['push', 'pull_request', 'schedule']));
    });

    it('should use job key as name when name is not provided', () => {
      const yamlContent = `
name: Workflow
on: push
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('build-and-test');
    });

    it('should handle workflow with no triggers (default to push)', () => {
      const yamlContent = `
name: No Trigger
jobs:
  default:
    name: Default Job
    runs-on: ubuntu-latest
    steps:
      - run: echo "default"
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0].runsOn).toEqual(['push']);
    });

    it('should handle workflow with unrecognized triggers (default to push)', () => {
      const yamlContent = `
name: Custom Trigger
on: workflow_dispatch
jobs:
  custom:
    name: Custom Job
    runs-on: ubuntu-latest
    steps:
      - run: echo "custom"
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0].runsOn).toEqual(['push']);
    });

    it('should return empty array for workflow with no jobs', () => {
      const yamlContent = `
name: No Jobs
on: push
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toEqual([]);
    });

    it('should return empty array for invalid YAML', () => {
      const yamlContent = `
this is not: valid: yaml: content
  - broken
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return empty array for empty content', () => {
      const result = parser.parseWorkflowFile('');

      expect(result).toEqual([]);
    });

    it('should parse workflow with multiple jobs and preserve job order', () => {
      const yamlContent = `
name: Multi Job
on: push
jobs:
  setup:
    name: Setup
    runs-on: ubuntu-latest
    steps:
      - run: echo "setup"
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - run: echo "build"
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploy"
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(4);
      expect(result.map(j => j.name)).toEqual(['Setup', 'Build', 'Test', 'Deploy']);
      result.forEach(job => {
        expect(job.runsOn).toEqual(['push']);
      });
    });

    it('should handle complex trigger configurations with mixed formats', () => {
      const yamlContent = `
name: Complex
on:
  push:
    branches:
      - main
      - develop
  pull_request:
    types: [opened, synchronize]
jobs:
  complex:
    name: Complex Job
    runs-on: ubuntu-latest
    steps:
      - run: echo "complex"
      `;

      const result = parser.parseWorkflowFile(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0].runsOn).toEqual(expect.arrayContaining(['push', 'pull_request']));
    });
  });
});
