import { startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';

const mockSecurityToolsService = {
  listSecurityTools: jest.fn(),
  getSecurityTool: jest.fn(),
  bulkUpsertSecurityTools: jest.fn(),
  deleteSecurityTool: jest.fn(),
};

const mockDataIngestionService = {
  fetchAndSaveAllGitHubSecurityData: jest.fn(),
  fetchAndSaveLatestUpdatedGitHubSecurityData: jest.fn(),
};

jest.mock('./services/SecurityToolsService', () => ({
  createSecurityToolsService: jest.fn(() => Promise.resolve(mockSecurityToolsService)),
}));

jest.mock('./services/DataIngestionService', () => ({
  DataIngestionService: jest.fn().mockImplementation(() => mockDataIngestionService),
}));

import { securityDashboardPlugin } from './plugin';

describe('plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call service to get all security tools', async () => {
    const mockTools = [
      {
        repository_name: 'test-repo',
        repository_url: 'https://github.com/test/test-repo',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        is_implemented: false,
        info_url: 'https://eslint.org',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ];
    mockSecurityToolsService.listSecurityTools.mockResolvedValue({ items: mockTools });

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .get('/api/security-dashboard/security-tools')
      .expect(200, {
        items: mockTools,
      });

    expect(mockSecurityToolsService.listSecurityTools).toHaveBeenCalledTimes(1);

    await backend.stop();
  });

  it('should call service to get security tools by repository', async () => {
    const mockTool = {
      repository_name: 'test-repo',
      repository_url: 'https://github.com/test/test-repo',
      tool_category: 'SAST',
      tool_name: 'ESLint',
      is_required: true,
      is_implemented: false,
      info_url: 'https://eslint.org',
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    mockSecurityToolsService.getSecurityTool.mockResolvedValue(mockTool);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .get('/api/security-dashboard/security-tools/test-repo')
      .expect(200, mockTool);

    expect(mockSecurityToolsService.getSecurityTool).toHaveBeenCalledWith({
      repositoryName: 'test-repo',
    });

    await backend.stop();
  });

  it('should call service to delete a security tool', async () => {
    mockSecurityToolsService.deleteSecurityTool.mockResolvedValue(undefined);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .delete('/api/security-dashboard/security-tools/test-repo')
      .expect(204);

    expect(mockSecurityToolsService.deleteSecurityTool).toHaveBeenCalledWith({
      repositoryName: 'test-repo',
    });

    await backend.stop();
  });

  it('should call service to bulk upsert security tools', async () => {
    const inputTools = [
      {
        repository_name: 'new-repo',
        repository_url: 'https://github.com/test/new-repo',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        is_implemented: false,
      },
      {
        repository_name: 'existing-repo',
        repository_url: 'https://github.com/test/existing-repo',
        tool_category: 'SAST',
        tool_name: 'Bandit',
        is_required: false,
        is_implemented: true,
      },
    ];

    const mockResult = {
      created: [
        {
          ...inputTools[0],
          info_url: null,
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ],
      updated: [
        {
          ...inputTools[1],
          is_required: false,
          info_url: null,
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue(mockResult);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .post('/api/security-dashboard/security-tools/bulk-upsert')
      .send(inputTools)
      .expect(200, mockResult);

    expect(mockSecurityToolsService.bulkUpsertSecurityTools).toHaveBeenCalledWith(inputTools);

    await backend.stop();
  });

  it('should handle empty array in bulk upsert', async () => {
    const mockResult = {
      created: [],
      updated: [],
    };

    mockSecurityToolsService.bulkUpsertSecurityTools.mockResolvedValue(mockResult);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .post('/api/security-dashboard/security-tools/bulk-upsert')
      .send([])
      .expect(200, mockResult);

    expect(mockSecurityToolsService.bulkUpsertSecurityTools).toHaveBeenCalledWith([]);

    await backend.stop();
  });

  it('should validate bulk upsert requires array input', async () => {
    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    const response = await request(server)
      .post('/api/security-dashboard/security-tools/bulk-upsert')
      .send({
        repository_name: 'test-repo',
        tool_category: 'SAST',
        tool_name: 'ESLint',
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(mockSecurityToolsService.bulkUpsertSecurityTools).not.toHaveBeenCalled();

    await backend.stop();
  });

  it('should validate required fields in bulk upsert items', async () => {
    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    const response = await request(server)
      .post('/api/security-dashboard/security-tools/bulk-upsert')
      .send([
        {
          repository_name: 'test-repo',
          // Missing tool_category, tool_name, and repository_url
        },
      ]);

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(mockSecurityToolsService.bulkUpsertSecurityTools).not.toHaveBeenCalled();

    await backend.stop();
  });

  it('should fetch and save all GitHub security data', async () => {
    mockDataIngestionService.fetchAndSaveAllGitHubSecurityData.mockResolvedValue({
      created: 5,
      updated: 3,
    });

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .post('/api/security-dashboard/data-ingestion/github/all')
      .expect(200, {
        message: 'Successfully fetched and saved all GitHub security data: 5 created, 3 updated',
      });

    expect(mockDataIngestionService.fetchAndSaveAllGitHubSecurityData).toHaveBeenCalledTimes(1);

    await backend.stop();
  });

  it('should fetch and save latest updated GitHub security data', async () => {
    mockDataIngestionService.fetchAndSaveLatestUpdatedGitHubSecurityData.mockResolvedValue({
      created: 2,
      updated: 1,
    });

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .post('/api/security-dashboard/data-ingestion/github/latest')
      .send({ limit: 10 })
      .expect(200, {
        message: 'Successfully fetched and saved latest updated repositories: 2 created, 1 updated',
      });

    expect(mockDataIngestionService.fetchAndSaveLatestUpdatedGitHubSecurityData).toHaveBeenCalledWith(10);

    await backend.stop();
  });
});
