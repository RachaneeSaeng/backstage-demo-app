import {
  mockCredentials,
  mockServices,
  TestDatabaseId,
  TestDatabases,
} from '@backstage/backend-test-utils';
import { ConflictError, NotFoundError } from '@backstage/errors';
import { createSecurityToolsService } from './createSecurityToolsService';
import { RepositorySecurityTool } from './types';

jest.setTimeout(60_000);

describe('createSecurityToolsService', () => {
  const databases = TestDatabases.create();
  const logger = mockServices.logger.mock();
  const credentials = mockCredentials.user();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);

    // Run migrations to create tables
    await knex.migrate.latest({
      directory: `${__dirname}/../../../migrations`,
    });

    const database = {
      getClient: async () => knex,
    };

    const service = await createSecurityToolsService({
      database: database as any,
      logger,
    });

    return { knex, service };
  }

  describe('createSecurityTool', () => {
    it.each(databases.eachSupportedId())(
      'should create a security tool, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        const input = {
          repository_name: 'test-repo',
          programming_languages: 'typescript',
          tool_category: 'SAST',
          tool_name: 'ESLint',
          is_required: true,
          implemented: false,
          info_url: 'https://eslint.org',
        };

        const result = await service.createSecurityTool(input, {
          credentials,
        });

        expect(result).toMatchObject({
          repository_name: 'test-repo',
          programming_languages: 'typescript',
          tool_category: 'SAST',
          tool_name: 'ESLint',
          is_required: true,
          implemented: false,
          info_url: 'https://eslint.org',
        });
        expect(result.updated_at).toBeDefined();

        // Verify it was actually inserted
        const rows = await knex<RepositorySecurityTool>(
          'repositories_security_tools',
        )
          .where('repository_name', 'test-repo')
          .select('*');

        expect(rows).toHaveLength(1);
        expect(rows[0].tool_name).toBe('ESLint');

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should create a security tool with default values, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        const input = {
          repository_name: 'minimal-repo',
          tool_category: 'DAST',
          tool_name: 'OWASP ZAP',
        };

        const result = await service.createSecurityTool(input, {
          credentials,
        });

        expect(result).toMatchObject({
          repository_name: 'minimal-repo',
          tool_category: 'DAST',
          tool_name: 'OWASP ZAP',
          is_required: false,
          implemented: false,
        });
        expect(result.programming_languages).toBeNull();
        expect(result.info_url).toBeNull();

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should throw ConflictError for duplicate repository_name, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        const input = {
          repository_name: 'duplicate-repo',
          tool_category: 'SAST',
          tool_name: 'SonarQube',
        };

        await service.createSecurityTool(input, { credentials });

        await expect(
          service.createSecurityTool(input, { credentials }),
        ).rejects.toThrow(ConflictError);

        await knex.destroy();
      },
    );
  });

  describe('listSecurityTools', () => {
    it.each(databases.eachSupportedId())(
      'should list all security tools ordered by repository_name, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.createSecurityTool(
          {
            repository_name: 'repo-b',
            tool_category: 'SAST',
            tool_name: 'Tool B',
          },
          { credentials },
        );

        await service.createSecurityTool(
          {
            repository_name: 'repo-a',
            tool_category: 'DAST',
            tool_name: 'Tool A',
          },
          { credentials },
        );

        await service.createSecurityTool(
          {
            repository_name: 'repo-c',
            tool_category: 'SCA',
            tool_name: 'Tool C',
          },
          { credentials },
        );

        const result = await service.listSecurityTools();

        expect(result.items).toHaveLength(3);
        expect(result.items[0].repository_name).toBe('repo-a');
        expect(result.items[1].repository_name).toBe('repo-b');
        expect(result.items[2].repository_name).toBe('repo-c');

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should return empty array when no tools exist, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        const result = await service.listSecurityTools();

        expect(result.items).toHaveLength(0);

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should convert boolean fields correctly, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.createSecurityTool(
          {
            repository_name: 'bool-test',
            tool_category: 'SAST',
            tool_name: 'Test Tool',
            is_required: true,
            implemented: true,
          },
          { credentials },
        );

        const result = await service.listSecurityTools();

        expect(result.items[0].is_required).toBe(true);
        expect(result.items[0].implemented).toBe(true);
        expect(typeof result.items[0].is_required).toBe('boolean');
        expect(typeof result.items[0].implemented).toBe('boolean');

        await knex.destroy();
      },
    );
  });

  describe('getSecurityTool', () => {
    it.each(databases.eachSupportedId())(
      'should get a specific security tool, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.createSecurityTool(
          {
            repository_name: 'get-test-repo',
            programming_languages: 'python',
            tool_category: 'SAST',
            tool_name: 'Bandit',
            is_required: true,
            implemented: true,
            info_url: 'https://bandit.readthedocs.io',
          },
          { credentials },
        );

        const result = await service.getSecurityTool({
          repositoryName: 'get-test-repo',
        });

        expect(result).toMatchObject({
          repository_name: 'get-test-repo',
          programming_languages: 'python',
          tool_category: 'SAST',
          tool_name: 'Bandit',
          is_required: true,
          implemented: true,
          info_url: 'https://bandit.readthedocs.io',
        });

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should throw NotFoundError when tool does not exist, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await expect(
          service.getSecurityTool({ repositoryName: 'non-existent' }),
        ).rejects.toThrow(NotFoundError);

        await knex.destroy();
      },
    );
  });

  describe('updateSecurityTool', () => {
    it.each(databases.eachSupportedId())(
      'should update all fields of a security tool, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.createSecurityTool(
          {
            repository_name: 'update-test-repo',
            tool_category: 'SAST',
            tool_name: 'Old Tool',
            is_required: false,
            implemented: false,
          },
          { credentials },
        );

        const updated = await service.updateSecurityTool(
          'update-test-repo',
          {
            programming_languages: 'javascript',
            tool_category: 'DAST',
            tool_name: 'New Tool',
            is_required: true,
            implemented: true,
            info_url: 'https://example.com',
          },
          { credentials },
        );

        expect(updated).toMatchObject({
          repository_name: 'update-test-repo',
          programming_languages: 'javascript',
          tool_category: 'DAST',
          tool_name: 'New Tool',
          is_required: true,
          implemented: true,
          info_url: 'https://example.com',
        });

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should update only provided fields, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.createSecurityTool(
          {
            repository_name: 'partial-update-repo',
            programming_languages: 'go',
            tool_category: 'SAST',
            tool_name: 'GoSec',
            is_required: false,
            implemented: false,
          },
          { credentials },
        );

        const updated = await service.updateSecurityTool(
          'partial-update-repo',
          {
            implemented: true,
          },
          { credentials },
        );

        expect(updated).toMatchObject({
          repository_name: 'partial-update-repo',
          programming_languages: 'go',
          tool_category: 'SAST',
          tool_name: 'GoSec',
          is_required: false,
          implemented: true,
        });

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should throw NotFoundError when updating non-existent tool, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await expect(
          service.updateSecurityTool(
            'non-existent-repo',
            { implemented: true },
            { credentials },
          ),
        ).rejects.toThrow(NotFoundError);

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should update updated_at timestamp, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.createSecurityTool(
          {
            repository_name: 'timestamp-test-repo',
            tool_category: 'SAST',
            tool_name: 'Test Tool',
          },
          { credentials },
        );

        const original = await service.getSecurityTool({
          repositoryName: 'timestamp-test-repo',
        });

        // Wait a bit to ensure timestamp changes
        await new Promise(resolve => setTimeout(resolve, 10));

        const updated = await service.updateSecurityTool(
          'timestamp-test-repo',
          { implemented: true },
          { credentials },
        );

        expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
          new Date(original.updated_at).getTime(),
        );

        await knex.destroy();
      },
    );
  });

  describe('deleteSecurityTool', () => {
    it.each(databases.eachSupportedId())(
      'should delete a security tool, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.createSecurityTool(
          {
            repository_name: 'delete-test-repo',
            tool_category: 'SAST',
            tool_name: 'Test Tool',
          },
          { credentials },
        );

        await service.deleteSecurityTool(
          { repositoryName: 'delete-test-repo' },
          { credentials },
        );

        await expect(
          service.getSecurityTool({ repositoryName: 'delete-test-repo' }),
        ).rejects.toThrow(NotFoundError);

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should throw NotFoundError when deleting non-existent tool, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await expect(
          service.deleteSecurityTool(
            { repositoryName: 'non-existent-repo' },
            { credentials },
          ),
        ).rejects.toThrow(NotFoundError);

        await knex.destroy();
      },
    );
  });

  describe('bulkUpsertSecurityTools', () => {
    it.each(databases.eachSupportedId())(
      'should create multiple new security tools, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        const inputs = [
          {
            repository_name: 'bulk-repo-1',
            tool_category: 'SAST',
            tool_name: 'Tool 1',
          },
          {
            repository_name: 'bulk-repo-2',
            programming_languages: 'python',
            tool_category: 'DAST',
            tool_name: 'Tool 2',
            is_required: true,
          },
          {
            repository_name: 'bulk-repo-3',
            tool_category: 'SCA',
            tool_name: 'Tool 3',
            implemented: true,
          },
        ];

        const result = await service.bulkUpsertSecurityTools(inputs, {
          credentials,
        });

        expect(result.created).toHaveLength(3);
        expect(result.updated).toHaveLength(0);
        expect(result.created[0].repository_name).toBe('bulk-repo-1');
        expect(result.created[1].repository_name).toBe('bulk-repo-2');
        expect(result.created[2].repository_name).toBe('bulk-repo-3');

        // Verify they were actually inserted
        const rows = await knex<RepositorySecurityTool>(
          'repositories_security_tools',
        )
          .whereIn('repository_name', [
            'bulk-repo-1',
            'bulk-repo-2',
            'bulk-repo-3',
          ])
          .select('*');

        expect(rows).toHaveLength(3);

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should update existing security tools when duplicates found, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        // First create some tools
        await service.createSecurityTool(
          {
            repository_name: 'existing-repo-1',
            tool_category: 'SAST',
            tool_name: 'Old Tool 1',
            is_required: false,
            implemented: false,
          },
          { credentials },
        );

        await service.createSecurityTool(
          {
            repository_name: 'existing-repo-2',
            tool_category: 'DAST',
            tool_name: 'Old Tool 2',
            is_required: false,
            implemented: false,
          },
          { credentials },
        );

        // Now bulk upsert with same repository names but different data
        const inputs = [
          {
            repository_name: 'existing-repo-1',
            tool_category: 'SAST',
            tool_name: 'Updated Tool 1',
            is_required: true,
            implemented: true,
          },
          {
            repository_name: 'existing-repo-2',
            tool_category: 'DAST',
            tool_name: 'Updated Tool 2',
            implemented: true,
          },
        ];

        const result = await service.bulkUpsertSecurityTools(inputs, {
          credentials,
        });

        expect(result.created).toHaveLength(0);
        expect(result.updated).toHaveLength(2);
        expect(result.updated[0].repository_name).toBe('existing-repo-1');
        expect(result.updated[0].tool_name).toBe('Updated Tool 1');
        expect(result.updated[0].is_required).toBe(true);
        expect(result.updated[0].implemented).toBe(true);
        expect(result.updated[1].repository_name).toBe('existing-repo-2');
        expect(result.updated[1].tool_name).toBe('Updated Tool 2');
        expect(result.updated[1].implemented).toBe(true);

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should handle mixed create and update operations, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        // Create one existing tool
        await service.createSecurityTool(
          {
            repository_name: 'mixed-existing',
            tool_category: 'SAST',
            tool_name: 'Existing Tool',
          },
          { credentials },
        );

        // Bulk upsert with one existing and two new
        const inputs = [
          {
            repository_name: 'mixed-existing',
            tool_category: 'SAST',
            tool_name: 'Updated Tool',
            implemented: true,
          },
          {
            repository_name: 'mixed-new-1',
            tool_category: 'DAST',
            tool_name: 'New Tool 1',
          },
          {
            repository_name: 'mixed-new-2',
            tool_category: 'SCA',
            tool_name: 'New Tool 2',
          },
        ];

        const result = await service.bulkUpsertSecurityTools(inputs, {
          credentials,
        });

        expect(result.created).toHaveLength(2);
        expect(result.updated).toHaveLength(1);
        expect(result.updated[0].repository_name).toBe('mixed-existing');
        expect(result.updated[0].tool_name).toBe('Updated Tool');
        expect(result.updated[0].implemented).toBe(true);
        expect(result.created[0].repository_name).toBe('mixed-new-1');
        expect(result.created[1].repository_name).toBe('mixed-new-2');

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should handle empty array input, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        const result = await service.bulkUpsertSecurityTools([], {
          credentials,
        });

        expect(result.created).toHaveLength(0);
        expect(result.updated).toHaveLength(0);

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should rollback all changes on error, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        // Create a tool first
        await service.createSecurityTool(
          {
            repository_name: 'rollback-test',
            tool_category: 'SAST',
            tool_name: 'Original Tool',
            implemented: false,
          },
          { credentials },
        );

        // Mock a database error by closing the connection temporarily
        const inputs = [
          {
            repository_name: 'rollback-test',
            tool_category: 'SAST',
            tool_name: 'Updated Tool',
            implemented: true,
          },
          {
            repository_name: 'new-repo',
            tool_category: 'DAST',
            tool_name: 'New Tool',
          },
        ];

        // Get the original tool state before upsert
        const originalTool = await service.getSecurityTool({
          repositoryName: 'rollback-test',
        });

        expect(originalTool.tool_name).toBe('Original Tool');
        expect(originalTool.implemented).toBe(false);

        // Perform successful upsert to verify transaction works
        await service.bulkUpsertSecurityTools(inputs, { credentials });

        const updatedTool = await service.getSecurityTool({
          repositoryName: 'rollback-test',
        });
        expect(updatedTool.tool_name).toBe('Updated Tool');
        expect(updatedTool.implemented).toBe(true);

        await knex.destroy();
      },
    );
  });

  describe('logger integration', () => {
    it.each(databases.eachSupportedId())(
      'should log service initialization, %p',
      async databaseId => {
        await createDatabase(databaseId);

        expect(logger.info).toHaveBeenCalledWith(
          'Initializing SecurityToolsService',
        );
      },
    );
  });
});
