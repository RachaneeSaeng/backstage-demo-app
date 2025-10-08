import {
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { SecurityToolsService } from './services/SecurityToolsService';
import { DataIngestionService } from './services/DataIngestionService';

const mockSecurityTool = {
  repository_name: 'test-repo',
  repository_url: 'https://github.com/test/test-repo',
  tool_category: 'SAST',
  tool_name: 'ESLint',
  is_required: true,
  is_implemented: false,
  info_url: 'https://eslint.org',
  updated_at: new Date().toISOString(),
};

describe('createRouter', () => {
  let app: express.Express;
  let securityToolsService: jest.Mocked<SecurityToolsService>;
  let dataIngestionService: jest.Mocked<DataIngestionService>;

  beforeEach(async () => {
    securityToolsService = {
      bulkUpsertSecurityTools: jest.fn(),
      listSecurityTools: jest.fn(),
      getSecurityTool: jest.fn(),
      deleteSecurityTool: jest.fn(),
    } as any;

    dataIngestionService = {
      fetchAndSaveAllGitHubSecurityData: jest.fn(),
      fetchAndSaveLatestUpdatedGitHubSecurityData: jest.fn(),
    } as any;

    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      securityToolsService,
      dataIngestionService,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('POST /security-tools/bulk-upsert', () => {
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
            repository_url: 'https://github.com/test/test-repo',
            tool_category: 'SAST',
            tool_name: 'ESLint',
            is_required: false,
            is_implemented: false
          },
          {
            repository_name: 'updated-repo',
            repository_url: 'https://github.com/test/updated-repo',
            tool_category: 'SAST',
            tool_name: 'Bandit',
            is_required: false,
            is_implemented: true
          },
        ]);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(securityToolsService.bulkUpsertSecurityTools).toHaveBeenCalledWith([
        {
          repository_name: 'test-repo',
          repository_url: 'https://github.com/test/test-repo',
          tool_category: 'SAST',
          tool_name: 'ESLint',
          is_required: false,
          is_implemented: false
        },
        {
          repository_name: 'updated-repo',
          repository_url: 'https://github.com/test/updated-repo',
          tool_category: 'SAST',
          tool_name: 'Bandit',
          is_required: false,
          is_implemented: true
        },
      ]);
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
            // Missing required fields: repository_url, tool_category, tool_name
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

  describe('GET /security-tools', () => {
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
  });

  describe('GET /security-tools/:repositoryName', () => {
    it('should get a specific security tool', async () => {
      securityToolsService.getSecurityTool.mockResolvedValue(mockSecurityTool);

      const response = await request(app).get('/security-tools/test-repo');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSecurityTool);
      expect(securityToolsService.getSecurityTool).toHaveBeenCalledWith({
        repositoryName: 'test-repo',
      });
    });
  });

  describe('DELETE /security-tools/:repositoryName', () => {
    it('should delete a security tool', async () => {
      securityToolsService.deleteSecurityTool.mockResolvedValue(undefined);

      const response = await request(app).delete('/security-tools/test-repo');

      expect(response.status).toBe(204);
      expect(securityToolsService.deleteSecurityTool).toHaveBeenCalledWith({
        repositoryName: 'test-repo',
      });
    });
  });

  describe('POST /data-ingestion/github/all', () => {
    it('should fetch and save all GitHub security data', async () => {
      dataIngestionService.fetchAndSaveAllGitHubSecurityData.mockResolvedValue({
        created: 5,
        updated: 3,
      });

      const response = await request(app).post('/data-ingestion/github/all');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Successfully fetched and saved all GitHub security data: 5 created, 3 updated',
      });
    });
  });

  describe('POST /data-ingestion/github/latest', () => {
    it('should fetch and save latest updated GitHub security data', async () => {
      dataIngestionService.fetchAndSaveLatestUpdatedGitHubSecurityData.mockResolvedValue({
        created: 2,
        updated: 1,
      });

      const response = await request(app)
        .post('/data-ingestion/github/latest')
        .send({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Successfully fetched and saved latest updated repositories: 2 created, 1 updated',
      });
      expect(dataIngestionService.fetchAndSaveLatestUpdatedGitHubSecurityData).toHaveBeenCalledWith(10);
    });

    it('should work without limit parameter', async () => {
      dataIngestionService.fetchAndSaveLatestUpdatedGitHubSecurityData.mockResolvedValue({
        created: 0,
        updated: 0,
      });

      const response = await request(app).post('/data-ingestion/github/latest').send({});

      expect(response.status).toBe(200);
    });
  });
});
