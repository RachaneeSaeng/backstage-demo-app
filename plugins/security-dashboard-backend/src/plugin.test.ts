import { startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';

const mockService = {
  listSecurityTools: jest.fn(),
  getSecurityTool: jest.fn(),
  createSecurityTool: jest.fn(),
  bulkUpsertSecurityTools: jest.fn(),
  updateSecurityTool: jest.fn(),
  deleteSecurityTool: jest.fn(),
};

jest.mock('./services/SecurityToolsService', () => ({
  createSecurityToolsService: jest.fn(() => Promise.resolve(mockService)),
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
        programming_languages: 'typescript',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        implemented: false,
        info_url: 'https://eslint.org',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ];
    mockService.listSecurityTools.mockResolvedValue({ items: mockTools });

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .get('/api/security-dashboard/security-tools')
      .expect(200, {
        items: mockTools,
      });

    expect(mockService.listSecurityTools).toHaveBeenCalledTimes(1);

    await backend.stop();
  });

  it('should call service to create a security tool', async () => {
    const newTool = {
      repository_name: 'test-repo',
      programming_languages: 'typescript',
      tool_category: 'SAST',
      tool_name: 'ESLint',
      is_required: true,
      implemented: false,
      info_url: 'https://eslint.org',
    };
    const createdTool = {
      ...newTool,
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    mockService.createSecurityTool.mockResolvedValue(createdTool);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .post('/api/security-dashboard/security-tools')
      .send(newTool)
      .expect(201, createdTool);

    expect(mockService.createSecurityTool).toHaveBeenCalledWith(
      newTool,
      expect.objectContaining({
        credentials: expect.any(Object),
      }),
    );

    await backend.stop();
  });

  it('should call service to get security tools by repository', async () => {
    const mockTool = {
      repository_name: 'test-repo',
      programming_languages: 'typescript',
      tool_category: 'SAST',
      tool_name: 'ESLint',
      is_required: true,
      implemented: false,
      info_url: 'https://eslint.org',
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    mockService.getSecurityTool.mockResolvedValue(mockTool);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .get('/api/security-dashboard/security-tools/test-repo')
      .expect(200, mockTool);

    expect(mockService.getSecurityTool).toHaveBeenCalledWith({
      repositoryName: 'test-repo',
    });

    await backend.stop();
  });

  it('should call service to update a security tool', async () => {
    const updatedData = {
      implemented: true,
      info_url: 'https://bandit.readthedocs.io',
    };
    const updatedTool = {
      repository_name: 'test-repo',
      programming_languages: 'python',
      tool_category: 'SAST',
      tool_name: 'Bandit',
      is_required: false,
      implemented: true,
      info_url: 'https://bandit.readthedocs.io',
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    mockService.updateSecurityTool.mockResolvedValue(updatedTool);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .put('/api/security-dashboard/security-tools/test-repo')
      .send(updatedData)
      .expect(200, updatedTool);

    expect(mockService.updateSecurityTool).toHaveBeenCalledWith(
      'test-repo',
      updatedData,
      expect.objectContaining({
        credentials: expect.any(Object),
      }),
    );

    await backend.stop();
  });

  it('should call service to delete a security tool', async () => {
    mockService.deleteSecurityTool.mockResolvedValue(undefined);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .delete('/api/security-dashboard/security-tools/test-repo')
      .expect(204);

    expect(mockService.deleteSecurityTool).toHaveBeenCalledWith(
      { repositoryName: 'test-repo' },
      expect.objectContaining({
        credentials: expect.any(Object),
      }),
    );

    await backend.stop();
  });

  it('should call service to bulk upsert security tools', async () => {
    const inputTools = [
      {
        repository_name: 'new-repo',
        programming_languages: 'typescript',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        implemented: false,
      },
      {
        repository_name: 'existing-repo',
        programming_languages: 'python',
        tool_category: 'SAST',
        tool_name: 'Bandit',
        implemented: true,
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

    mockService.bulkUpsertSecurityTools.mockResolvedValue(mockResult);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .post('/api/security-dashboard/security-tools/bulk-upsert')
      .send(inputTools)
      .expect(200, mockResult);

    expect(mockService.bulkUpsertSecurityTools).toHaveBeenCalledWith(
      inputTools,
      expect.objectContaining({
        credentials: expect.any(Object),
      }),
    );

    await backend.stop();
  });

  it('should handle empty array in bulk upsert', async () => {
    const mockResult = {
      created: [],
      updated: [],
    };

    mockService.bulkUpsertSecurityTools.mockResolvedValue(mockResult);

    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .post('/api/security-dashboard/security-tools/bulk-upsert')
      .send([])
      .expect(200, mockResult);

    expect(mockService.bulkUpsertSecurityTools).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        credentials: expect.any(Object),
      }),
    );

    await backend.stop();
  });

  it('should validate bulk upsert requires array input', async () => {
    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .post('/api/security-dashboard/security-tools/bulk-upsert')
      .send({
        repository_name: 'test-repo',
        tool_category: 'SAST',
        tool_name: 'ESLint',
      })
      .expect(400);

    expect(mockService.bulkUpsertSecurityTools).not.toHaveBeenCalled();

    await backend.stop();
  });

  it('should validate required fields in bulk upsert items', async () => {
    const backend = await startTestBackend({
      features: [securityDashboardPlugin],
    });
    const { server } = backend;

    await request(server)
      .post('/api/security-dashboard/security-tools/bulk-upsert')
      .send([
        {
          repository_name: 'test-repo',
          // Missing tool_category and tool_name
        },
      ])
      .expect(400);

    expect(mockService.bulkUpsertSecurityTools).not.toHaveBeenCalled();

    await backend.stop();
  });
});
