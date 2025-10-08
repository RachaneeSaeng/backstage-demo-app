import { convertRepositoryDataStructure } from './utils';
import { RepositoryToolData } from '../types';

describe('convertRepositoryDataStructure', () => {
  it('should convert flat data to nested repository structure', () => {
    const flatData: RepositoryToolData[] = [
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        is_implemented: false,
        info_url: 'https://eslint.org',
      },
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SAST',
        tool_name: 'SonarQube',
        is_required: false,
        is_implemented: true,
        info_url: 'https://sonarqube.org',
      },
    ];

    const result = convertRepositoryDataStructure(flatData);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('repo1');
    expect(result[0].url).toBe('https://github.com/org/repo1');
    expect(result[0].steps).toHaveLength(1);
    expect(result[0].steps[0].toolCategory).toBe('SAST');
    expect(result[0].steps[0].tools).toHaveLength(2);
    expect(result[0].steps[0].tools[0].name).toBe('ESLint');
    expect(result[0].steps[0].tools[1].name).toBe('SonarQube');
  });

  it('should handle multiple repositories', () => {
    const flatData: RepositoryToolData[] = [
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        is_implemented: false,
        info_url: null,
      },
      {
        repository_name: 'repo2',
        repository_url: 'https://github.com/org/repo2',
        tool_category: 'DAST',
        tool_name: 'OWASP ZAP',
        is_required: false,
        is_implemented: true,
        info_url: 'https://zaproxy.org',
      },
    ];

    const result = convertRepositoryDataStructure(flatData);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('repo1');
    expect(result[1].name).toBe('repo2');
  });

  it('should handle multiple tool categories in same repository', () => {
    const flatData: RepositoryToolData[] = [
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        is_implemented: false,
        info_url: null,
      },
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'DAST',
        tool_name: 'OWASP ZAP',
        is_required: false,
        is_implemented: true,
        info_url: null,
      },
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SCA',
        tool_name: 'Dependabot',
        is_required: true,
        is_implemented: true,
        info_url: null,
      },
    ];

    const result = convertRepositoryDataStructure(flatData);

    expect(result).toHaveLength(1);
    expect(result[0].steps).toHaveLength(3);
    expect(result[0].steps.map(s => s.toolCategory)).toEqual(['SAST', 'DAST', 'SCA']);
  });

  it('should handle empty input', () => {
    const result = convertRepositoryDataStructure([]);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should preserve tool properties correctly', () => {
    const flatData: RepositoryToolData[] = [
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        is_implemented: false,
        info_url: 'https://eslint.org',
      },
    ];

    const result = convertRepositoryDataStructure(flatData);

    const tool = result[0].steps[0].tools[0];
    expect(tool.name).toBe('ESLint');
    expect(tool.isRequired).toBe(true);
    expect(tool.isImplemented).toBe(false);
    expect(tool.info_url).toBe('https://eslint.org');
  });

  it('should handle null info_url', () => {
    const flatData: RepositoryToolData[] = [
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        is_implemented: false,
        info_url: null,
      },
    ];

    const result = convertRepositoryDataStructure(flatData);

    expect(result[0].steps[0].tools[0].info_url).toBeNull();
  });

  it('should group tools with same category under single step', () => {
    const flatData: RepositoryToolData[] = [
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SAST',
        tool_name: 'Tool1',
        is_required: true,
        is_implemented: false,
        info_url: null,
      },
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SAST',
        tool_name: 'Tool2',
        is_required: false,
        is_implemented: true,
        info_url: null,
      },
      {
        repository_name: 'repo1',
        repository_url: 'https://github.com/org/repo1',
        tool_category: 'SAST',
        tool_name: 'Tool3',
        is_required: true,
        is_implemented: true,
        info_url: null,
      },
    ];

    const result = convertRepositoryDataStructure(flatData);

    expect(result).toHaveLength(1);
    expect(result[0].steps).toHaveLength(1);
    expect(result[0].steps[0].tools).toHaveLength(3);
    expect(result[0].steps[0].tools.map(t => t.name)).toEqual(['Tool1', 'Tool2', 'Tool3']);
  });
});
