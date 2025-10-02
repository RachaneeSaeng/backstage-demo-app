import {
  mockCredentials,
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { SecurityToolsService } from './services/SecurityToolsService';

const mockSecurityTool = {
  id: 1,
  repository_name: 'test-repo',
  programming_languages: 'typescript',
  tool_category: 'SAST',
  tool_name: 'ESLint',
  is_required: true,
  implemented: false,
  info_url: 'https://eslint.org',
  created_by: mockCredentials.user().principal.userEntityRef,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('createRouter', () => {
  let app: express.Express;
  let securityToolsService: jest.Mocked<SecurityToolsService>;

  beforeEach(async () => {
    securityToolsService = {
      createSecurityTool: jest.fn(),
      bulkUpsertSecurityTools: jest.fn(),
      listSecurityTools: jest.fn(),
      getSecurityTool: jest.fn(),
      updateSecurityTool: jest.fn(),
      deleteSecurityTool: jest.fn(),
    } as any;
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      securityToolsService,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should create a security tool', async () => {
    securityToolsService.createSecurityTool.mockResolvedValue(mockSecurityTool);

    const response = await request(app).post('/security-tools').send({
      repository_name: 'test-repo',
      programming_languages: 'typescript',
      tool_category: 'SAST',
      tool_name: 'ESLint',
      is_required: true,
      implemented: false,
      info_url: 'https://eslint.org',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockSecurityTool);
  });

  it('should list security tools', async () => {
    securityToolsService.listSecurityTools.mockResolvedValue({
      items: [mockSecurityTool],
    });

    const response = await request(app).get('/security-tools');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [mockSecurityTool],
    });
  });

  it('should get a specific security tool', async () => {
    securityToolsService.getSecurityTool.mockResolvedValue(mockSecurityTool);

    const response = await request(app).get('/security-tools/test-repo');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSecurityTool);
  });

  it('should update a security tool', async () => {
    const updatedTool = { ...mockSecurityTool, implemented: true };
    securityToolsService.updateSecurityTool.mockResolvedValue(updatedTool);

    const response = await request(app).put('/security-tools/test-repo').send({
      implemented: true,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedTool);
  });

  it('should delete a security tool', async () => {
    securityToolsService.deleteSecurityTool.mockResolvedValue(undefined);

    const response = await request(app).delete('/security-tools/test-repo');

    expect(response.status).toBe(204);
  });

  it('should not allow unauthenticated requests to create a security tool', async () => {
    securityToolsService.createSecurityTool.mockResolvedValue(mockSecurityTool);

    const response = await request(app)
      .post('/security-tools')
      .set('Authorization', mockCredentials.none.header())
      .send({
        repository_name: 'test-repo',
        tool_category: 'SAST',
        tool_name: 'ESLint',
      });

    expect(response.status).toBe(401);
  });

  it('should validate required fields when creating a security tool', async () => {
    const response = await request(app).post('/security-tools').send({
      repository_name: 'test-repo',
      // Missing required fields: tool_category, tool_name
    });

    expect(response.status).toBe(400);
  });

  it('should bulk upsert security tools', async () => {
    const mockResult = {
      created: [mockSecurityTool],
      updated: [{ ...mockSecurityTool, repository_name: 'updated-repo' }],
    };
    securityToolsService.bulkUpsertSecurityTools.mockResolvedValue(mockResult);

    const response = await request(app)
      .post('/security-tools/bulk-upsert')
      .send([
        {
          repository_name: 'test-repo',
          programming_languages: 'typescript',
          tool_category: 'SAST',
          tool_name: 'ESLint',
        },
        {
          repository_name: 'updated-repo',
          programming_languages: 'python',
          tool_category: 'SAST',
          tool_name: 'Bandit',
        },
      ]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResult);
    expect(securityToolsService.bulkUpsertSecurityTools).toHaveBeenCalledWith(
      [
        {
          repository_name: 'test-repo',
          programming_languages: 'typescript',
          tool_category: 'SAST',
          tool_name: 'ESLint',
        },
        {
          repository_name: 'updated-repo',
          programming_languages: 'python',
          tool_category: 'SAST',
          tool_name: 'Bandit',
        },
      ],
      expect.objectContaining({
        credentials: expect.anything(),
      }),
    );
  });

  it('should not allow unauthenticated requests to bulk upsert', async () => {
    const response = await request(app)
      .post('/security-tools/bulk-upsert')
      .set('Authorization', mockCredentials.none.header())
      .send([
        {
          repository_name: 'test-repo',
          tool_category: 'SAST',
          tool_name: 'ESLint',
        },
      ]);

    expect(response.status).toBe(401);
  });

  it('should validate bulk upsert input is an array', async () => {
    const response = await request(app).post('/security-tools/bulk-upsert').send({
      repository_name: 'test-repo',
      tool_category: 'SAST',
      tool_name: 'ESLint',
    });

    expect(response.status).toBe(400);
  });

  it('should validate required fields in bulk upsert items', async () => {
    const response = await request(app)
      .post('/security-tools/bulk-upsert')
      .send([
        {
          repository_name: 'test-repo',
          // Missing required fields: tool_category, tool_name
        },
      ]);

    expect(response.status).toBe(400);
  });

  it('should handle empty array in bulk upsert', async () => {
    securityToolsService.bulkUpsertSecurityTools.mockResolvedValue({
      created: [],
      updated: [],
    });

    const response = await request(app).post('/security-tools/bulk-upsert').send([]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      created: [],
      updated: [],
    });
  });
});
