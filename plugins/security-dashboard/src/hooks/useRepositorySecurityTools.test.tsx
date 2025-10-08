import { renderHook, waitFor } from '@testing-library/react';
import { useRepositorySecurityTools } from './useRepositorySecurityTools';
import { TestApiProvider } from '@backstage/test-utils';
import { securityDashboardApiRef } from '../api';
import React from 'react';

describe('useRepositorySecurityTools', () => {
  it('should fetch and convert repository security tools', async () => {
    const mockApi = {
      listSecurityTools: jest.fn().mockResolvedValue({
        items: [
          {
            repository_name: 'test-repo',
            repository_url: 'https://github.com/test/test-repo',
            tool_category: 'SAST',
            tool_name: 'ESLint',
            is_required: true,
            is_implemented: false,
            info_url: 'https://eslint.org',
          },
          {
            repository_name: 'test-repo',
            repository_url: 'https://github.com/test/test-repo',
            tool_category: 'SAST',
            tool_name: 'SonarQube',
            is_required: false,
            is_implemented: true,
            info_url: 'https://sonarqube.org',
          },
        ],
      }),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApiProvider apis={[[securityDashboardApiRef, mockApi]]}>
        {children}
      </TestApiProvider>
    );

    const { result } = renderHook(() => useRepositorySecurityTools(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.repositorySecurityTools).toBeUndefined();

    // Wait for the data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check the converted data
    expect(result.current.repositorySecurityTools).toHaveLength(1);
    expect(result.current.repositorySecurityTools![0].name).toBe('test-repo');
    expect(result.current.repositorySecurityTools![0].url).toBe('https://github.com/test/test-repo');
    expect(result.current.repositorySecurityTools![0].steps).toHaveLength(1);
    expect(result.current.repositorySecurityTools![0].steps[0].toolCategory).toBe('SAST');
    expect(result.current.repositorySecurityTools![0].steps[0].tools).toHaveLength(2);
  });

  it('should handle empty response', async () => {
    const mockApi = {
      listSecurityTools: jest.fn().mockResolvedValue({
        items: [],
      }),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApiProvider apis={[[securityDashboardApiRef, mockApi]]}>
        {children}
      </TestApiProvider>
    );

    const { result } = renderHook(() => useRepositorySecurityTools(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.repositorySecurityTools).toHaveLength(0);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle API errors', async () => {
    const mockError = new Error('Failed to fetch');
    const mockApi = {
      listSecurityTools: jest.fn().mockRejectedValue(mockError),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApiProvider apis={[[securityDashboardApiRef, mockApi]]}>
        {children}
      </TestApiProvider>
    );

    const { result } = renderHook(() => useRepositorySecurityTools(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Failed to fetch');
    expect(result.current.repositorySecurityTools).toBeUndefined();
  });

  it('should handle multiple repositories', async () => {
    const mockApi = {
      listSecurityTools: jest.fn().mockResolvedValue({
        items: [
          {
            repository_name: 'repo1',
            repository_url: 'https://github.com/test/repo1',
            tool_category: 'SAST',
            tool_name: 'ESLint',
            is_required: true,
            is_implemented: false,
            info_url: null,
          },
          {
            repository_name: 'repo2',
            repository_url: 'https://github.com/test/repo2',
            tool_category: 'DAST',
            tool_name: 'OWASP ZAP',
            is_required: false,
            is_implemented: true,
            info_url: null,
          },
        ],
      }),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApiProvider apis={[[securityDashboardApiRef, mockApi]]}>
        {children}
      </TestApiProvider>
    );

    const { result } = renderHook(() => useRepositorySecurityTools(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.repositorySecurityTools).toHaveLength(2);
    expect(result.current.repositorySecurityTools![0].name).toBe('repo1');
    expect(result.current.repositorySecurityTools![1].name).toBe('repo2');
  });
});
