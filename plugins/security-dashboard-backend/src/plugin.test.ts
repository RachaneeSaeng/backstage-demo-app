import {
  TestDatabases,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { securityDashboardPlugin } from './plugin';
import request from 'supertest';
import { Knex } from 'knex';

const databases = TestDatabases.create({
  ids: ['SQLITE_3'],
});

describe('plugin', () => {
  let knex: Knex;

  describe.each(databases.eachSupportedId())('%p', databaseId => {
    beforeAll(async () => {
      knex = await databases.init(databaseId);
      await knex.migrate.latest({
        directory: `${__dirname}/../migrations`,
      });
    }, 60000);

    afterEach(async () => {
      await knex('repositories_security_tools').delete();
    });

    afterAll(async () => {
      await knex.destroy();
    });

    it('should create and read security tools', async () => {
      const backend = await startTestBackend({
        features: [
          securityDashboardPlugin,
          mockServices.database.factory({ knex }),
        ],
      });
      const { server } = backend;

      await request(server)
        .get('/api/security-dashboard/security-tools')
        .expect(200, {
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
        repository_name: 'test-repo',
        programming_languages: 'typescript',
        tool_category: 'SAST',
        tool_name: 'ESLint',
        is_required: true,
        implemented: false,
        info_url: 'https://eslint.org',
        updated_at: expect.any(String),
      });

      const createdSecurityTool = createRes.body;

      await request(server)
        .get('/api/security-dashboard/security-tools')
        .expect(200, {
          items: [createdSecurityTool],
        });

      await request(server)
        .get(
          `/api/security-dashboard/security-tools/${createdSecurityTool.repository_name}`,
        )
        .expect(200, createdSecurityTool);

      await backend.stop();
    });

    it('should update a security tool', async () => {
      const backend = await startTestBackend({
        features: [
          securityDashboardPlugin,
          mockServices.database.factory({ knex }),
        ],
      });
      const { server } = backend;

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
        repository_name: 'update-test-repo',
        programming_languages: 'python',
        tool_category: 'SAST',
        tool_name: 'Bandit',
        is_required: false,
        implemented: true,
        info_url: 'https://bandit.readthedocs.io',
        updated_at: expect.any(String),
      });

      await backend.stop();
    });

    it('should delete a security tool', async () => {
      const backend = await startTestBackend({
        features: [
          securityDashboardPlugin,
          mockServices.database.factory({ knex }),
        ],
      });
      const { server } = backend;

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

      await backend.stop();
    });
  });
});
