import {
  mockCredentials,
  mockServices,
  TestDatabaseId,
  TestDatabases,
} from '@backstage/backend-test-utils';
import { NotFoundError } from '@backstage/errors';
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

  describe('bulkUpsertSecurityTools', () => {
    it.each(databases.eachSupportedId())(
      'should create multiple new security tools, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        const inputs = [
          {
            repository_name: 'bulk-repo-1',
            repository_url: 'https://github.com/test-org/bulk-repo-1',
            tool_category: 'SAST',
            tool_name: 'Tool 1',
          },
          {
            repository_name: 'bulk-repo-2',
            repository_url: 'https://github.com/test-org/bulk-repo-2',
            tool_category: 'DAST',
            tool_name: 'Tool 2',
            is_required: true,
          },
          {
            repository_name: 'bulk-repo-3',
            repository_url: 'https://github.com/test-org/bulk-repo-3',
            tool_category: 'SCA',
            tool_name: 'Tool 3',
            is_implemented: true,
          },
        ];

        const result = await service.bulkUpsertSecurityTools(inputs);

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
        await service.bulkUpsertSecurityTools([
          {
            repository_name: 'existing-repo-1',
            repository_url: 'https://github.com/test-org/existing-repo-1',
            tool_category: 'SAST',
            tool_name: 'Old Tool 1',
            is_required: false,
            is_implemented: false,
          },
          {
            repository_name: 'existing-repo-2',
            repository_url: 'https://github.com/test-org/existing-repo-2',
            tool_category: 'DAST',
            tool_name: 'Old Tool 2',
            is_required: false,
            is_implemented: false,
          },
        ]);

        // Now bulk upsert with same repository names but different data
        const inputs = [
          {
            repository_name: 'existing-repo-1',
            repository_url: 'https://github.com/test-org/existing-repo-1',
            tool_category: 'SAST',
            tool_name: 'Old Tool 1',
            is_required: true,
            is_implemented: true,
          },
          {
            repository_name: 'existing-repo-2',
            repository_url: 'https://github.com/test-org/existing-repo-2',
            tool_category: 'DAST',
            tool_name: 'Old Tool 2',
            is_implemented: true,
          },
        ];

        const result = await service.bulkUpsertSecurityTools(inputs);

        expect(result.created).toHaveLength(0);
        expect(result.updated).toHaveLength(2);
        expect(result.updated[0].repository_name).toBe('existing-repo-1');
        expect(result.updated[0].is_required).toBe(true);
        expect(result.updated[0].is_implemented).toBe(true);
        expect(result.updated[1].repository_name).toBe('existing-repo-2');
        expect(result.updated[1].is_implemented).toBe(true);

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should handle mixed create and update operations, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        // Create one existing tool
        await service.bulkUpsertSecurityTools([
          {
            repository_name: 'mixed-existing',
            repository_url: 'https://github.com/test-org/mixed-existing',
            tool_category: 'SAST',
            tool_name: 'Existing Tool',
          },
        ]);

        // Bulk upsert with one existing and two new
        const inputs = [
          {
            repository_name: 'mixed-existing',
            repository_url: 'https://github.com/test-org/mixed-existing',
            tool_category: 'SAST',
            tool_name: 'Existing Tool',
            is_implemented: true,
          },
          {
            repository_name: 'mixed-new-1',
            repository_url: 'https://github.com/test-org/mixed-new-1',
            tool_category: 'DAST',
            tool_name: 'New Tool 1',
          },
          {
            repository_name: 'mixed-new-2',
            repository_url: 'https://github.com/test-org/mixed-new-2',
            tool_category: 'SCA',
            tool_name: 'New Tool 2',
          },
        ];

        const result = await service.bulkUpsertSecurityTools(inputs);

        expect(result.created).toHaveLength(2);
        expect(result.updated).toHaveLength(1);
        expect(result.updated[0].repository_name).toBe('mixed-existing');
        expect(result.updated[0].is_implemented).toBe(true);
        expect(result.created[0].repository_name).toBe('mixed-new-1');
        expect(result.created[1].repository_name).toBe('mixed-new-2');

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should handle empty array input, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        const result = await service.bulkUpsertSecurityTools([]);

        expect(result.created).toHaveLength(0);
        expect(result.updated).toHaveLength(0);

        await knex.destroy();
      },
    );

    it.each(databases.eachSupportedId())(
      'should not update when no changes detected, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        // Create a tool first
        await service.bulkUpsertSecurityTools([
          {
            repository_name: 'no-change-repo',
            repository_url: 'https://github.com/test-org/no-change-repo',
            tool_category: 'SAST',
            tool_name: 'Tool',
            is_implemented: false,
          },
        ]);

        // Try to upsert with same values
        const result = await service.bulkUpsertSecurityTools([
          {
            repository_name: 'no-change-repo',
            repository_url: 'https://github.com/test-org/no-change-repo',
            tool_category: 'SAST',
            tool_name: 'Tool',
            is_implemented: false,
          },
        ]);

        expect(result.created).toHaveLength(0);
        expect(result.updated).toHaveLength(0);

        await knex.destroy();
      },
    );
  });

  describe('listSecurityTools', () => {
    it.each(databases.eachSupportedId())(
      'should list all security tools ordered by repository_name, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.bulkUpsertSecurityTools([
          {
            repository_name: 'repo-b',
            repository_url: 'https://github.com/test-org/repo-b',
            tool_category: 'SAST',
            tool_name: 'Tool B',
          },
          {
            repository_name: 'repo-a',
            repository_url: 'https://github.com/test-org/repo-a',
            tool_category: 'DAST',
            tool_name: 'Tool A',
          },
          {
            repository_name: 'repo-c',
            repository_url: 'https://github.com/test-org/repo-c',
            tool_category: 'SCA',
            tool_name: 'Tool C',
          },
        ]);

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

        await service.bulkUpsertSecurityTools([
          {
            repository_name: 'bool-test',
            repository_url: 'https://github.com/test-org/bool-test',
            tool_category: 'SAST',
            tool_name: 'Test Tool',
            is_required: true,
            is_implemented: true,
          },
        ]);

        const result = await service.listSecurityTools();

        expect(result.items[0].is_required).toBe(true);
        expect(result.items[0].is_implemented).toBe(true);
        expect(typeof result.items[0].is_required).toBe('boolean');
        expect(typeof result.items[0].is_implemented).toBe('boolean');

        await knex.destroy();
      },
    );
  });

  describe('getSecurityTool', () => {
    it.each(databases.eachSupportedId())(
      'should get a specific security tool, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.bulkUpsertSecurityTools([
          {
            repository_name: 'get-test-repo',
            repository_url: 'https://github.com/test-org/get-test-repo',
            tool_category: 'SAST',
            tool_name: 'Bandit',
            is_required: true,
            is_implemented: true,
            info_url: 'https://bandit.readthedocs.io',
          },
        ]);

        const result = await service.getSecurityTool({
          repositoryName: 'get-test-repo',
        });

        expect(result).toMatchObject({
          repository_name: 'get-test-repo',
          repository_url: 'https://github.com/test-org/get-test-repo',
          tool_category: 'SAST',
          tool_name: 'Bandit',
          is_required: true,
          is_implemented: true,
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

  describe('deleteSecurityTool', () => {
    it.each(databases.eachSupportedId())(
      'should delete a security tool, %p',
      async databaseId => {
        const { service, knex } = await createDatabase(databaseId);

        await service.bulkUpsertSecurityTools([
          {
            repository_name: 'delete-test-repo',
            repository_url: 'https://github.com/test-org/delete-test-repo',
            tool_category: 'SAST',
            tool_name: 'Test Tool',
          },
        ]);

        await service.deleteSecurityTool({
          repositoryName: 'delete-test-repo',
        });

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
          service.deleteSecurityTool({ repositoryName: 'non-existent-repo' }),
        ).rejects.toThrow(NotFoundError);

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
