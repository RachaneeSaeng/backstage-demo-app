import { getToolStatus } from './utils';
import { RepositoryTool } from '../../types';

describe('getToolStatus', () => {
  it('should return critical-risk when tool is required but not implemented', () => {
    const tool: RepositoryTool = {
      name: 'ESLint',
      isRequired: true,
      isImplemented: false,
      info_url: 'https://eslint.org',
    };

    const result = getToolStatus(tool);

    expect(result.status).toBe('critical-risk');
    expect(result.text).toBe('Required tool is not implemented');
    expect(result.link).toBe('https://eslint.org');
  });

  it('should return low-risk when tool is implemented', () => {
    const tool: RepositoryTool = {
      name: 'ESLint',
      isRequired: false,
      isImplemented: true,
      info_url: 'https://eslint.org',
    };

    const result = getToolStatus(tool);

    expect(result.status).toBe('low-risk');
    expect(result.text).toBe('View the tool status');
    expect(result.link).toBe('https://eslint.org');
  });

  it('should return low-risk when tool is required and implemented', () => {
    const tool: RepositoryTool = {
      name: 'SonarQube',
      isRequired: true,
      isImplemented: true,
      info_url: 'https://sonarqube.org',
    };

    const result = getToolStatus(tool);

    expect(result.status).toBe('low-risk');
    expect(result.text).toBe('View the tool status');
    expect(result.link).toBe('https://sonarqube.org');
  });

  it('should return none when tool is not required and not implemented', () => {
    const tool: RepositoryTool = {
      name: 'Optional Tool',
      isRequired: false,
      isImplemented: false,
      info_url: null,
    };

    const result = getToolStatus(tool);

    expect(result.status).toBe('none');
    expect(result.text).toBe('n/a');
    expect(result.link).toBeUndefined();
  });

  it('should return none when tool is null or undefined', () => {
    const result = getToolStatus(null as any);

    expect(result.status).toBe('none');
    expect(result.text).toBe('n/a');
  });

  it('should handle tool without info_url', () => {
    const tool: RepositoryTool = {
      name: 'Test Tool',
      isRequired: true,
      isImplemented: false,
      info_url: null,
    };

    const result = getToolStatus(tool);

    expect(result.status).toBe('critical-risk');
    expect(result.text).toBe('Required tool is not implemented');
    expect(result.link).toBeNull();
  });

  it('should handle implemented tool without info_url', () => {
    const tool: RepositoryTool = {
      name: 'Test Tool',
      isRequired: false,
      isImplemented: true,
      info_url: null,
    };

    const result = getToolStatus(tool);

    expect(result.status).toBe('low-risk');
    expect(result.text).toBe('View the tool status');
    expect(result.link).toBeNull();
  });
});
