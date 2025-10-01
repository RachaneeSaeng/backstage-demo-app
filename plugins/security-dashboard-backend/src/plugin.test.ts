import {
  mockCredentials,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { securityDashboardPlugin } from './plugin';
import request from 'supertest';

describe('plugin', () => {
  it('should create and read security tools', async () => {
    const { server } = await startTestBackend({
      features: [securityDashboardPlugin],
    });

    await request(server).get('/api/security-dashboard/security-tools').expect(200, {
      items: [],
    });

    const createRes = await request(server)
      .post('/api/security-dashboard/security-tools')
      .send({
        repository_name: 'test-repo',
        programming_languages: 'typescript',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        implemented: false,
        info_url: 'https://eslint.org',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toEqual({
      id: expect.any(Number),
      repository_name: 'test-repo',
      programming_languages: 'typescript',
      tool_category: 'SAST',
      tool_name: 'ESLint',
      is_required: true,
      implemented: false,
      info_url: 'https://eslint.org',
      created_by: mockCredentials.user().principal.userEntityRef,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });

    const createdSecurityTool = createRes.body;

    await request(server)
      .get('/api/security-dashboard/security-tools')
      .expect(200, {
        items: [createdSecurityTool],
      });

    await request(server)
      .get(`/api/security-dashboard/security-tools/${createdSecurityTool.repository_name}`)
      .expect(200, createdSecurityTool);
  });

  it('should update a security tool', async () => {
    const { server } = await startTestBackend({
      features: [securityDashboardPlugin],
    });

    const createRes = await request(server)
      .post('/api/security-dashboard/security-tools')
      .send({
        repository_name: 'update-test-repo',
        programming_languages: 'python',
        tool_category: 'SAST',
        tool_name: 'Bandit',
        is_required: false,
        implemented: false,
      });

    expect(createRes.status).toBe(201);

    const updateRes = await request(server)
      .put('/api/security-dashboard/security-tools/update-test-repo')
      .send({
        implemented: true,
        info_url: 'https://bandit.readthedocs.io',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toEqual({
      id: expect.any(Number),
      repository_name: 'update-test-repo',
      programming_languages: 'python',
      tool_category: 'SAST',
      tool_name: 'Bandit',
      is_required: false,
      implemented: true,
      info_url: 'https://bandit.readthedocs.io',
      created_by: mockCredentials.user().principal.userEntityRef,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  it('should delete a security tool', async () => {
    const { server } = await startTestBackend({
      features: [securityDashboardPlugin],
    });

    await request(server)
      .post('/api/security-dashboard/security-tools')
      .send({
        repository_name: 'delete-test-repo',
        tool_category: 'SCA',
        tool_name: 'Dependabot',
      });

    await request(server)
      .delete('/api/security-dashboard/security-tools/delete-test-repo')
      .expect(204);

    await request(server)
      .get('/api/security-dashboard/security-tools')
      .expect(200, {
        items: [],
      });
  });
});
