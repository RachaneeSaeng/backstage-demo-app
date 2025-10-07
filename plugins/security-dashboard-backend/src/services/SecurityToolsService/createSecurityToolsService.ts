import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { Knex } from 'knex';
import {
  RepositorySecurityTool,
  SecurityToolsService,
  SecurityToolKey,
  SecurityToolInput,
} from './types';

const TABLE_NAME = 'repositories_security_tools';

function buildSecurityToolWhereClause(
  query: Knex.QueryBuilder,
  key: SecurityToolKey,
): Knex.QueryBuilder {
  return query
    .where('repository_name', key.repository_name)
    .andWhere('tool_category', key.tool_category)
    .andWhere('tool_name', key.tool_name);
}

function normalizeBooleanFields(
  tool: RepositorySecurityTool,
): RepositorySecurityTool {
  return {
    ...tool,
    is_required: Boolean(tool.is_required),
    is_implemented: Boolean(tool.is_implemented),
  };
}

function buildUpdateData(
  input: SecurityToolInput,
  existing: RepositorySecurityTool,
): Partial<Knex.ResolveTableType<RepositorySecurityTool>> | null {
  const updateData: Partial<Knex.ResolveTableType<RepositorySecurityTool>> = {};

  if (input.is_required !== undefined && input.is_required !== Boolean(existing.is_required)) {
    updateData.is_required = input.is_required;
  }
  if (input.is_implemented !== undefined && input.is_implemented !== Boolean(existing.is_implemented)) {
    updateData.is_implemented = input.is_implemented;
  }
  if (input.info_url !== undefined && input.info_url !== existing.info_url) {
    updateData.info_url = input.info_url;
  }

  return Object.keys(updateData).length > 0 ? updateData : null;
}

async function findExistingTool(
  trx: Knex.Transaction,
  key: SecurityToolKey,
): Promise<RepositorySecurityTool | undefined> {
  const query = trx<RepositorySecurityTool>(TABLE_NAME);
  return buildSecurityToolWhereClause(query, key).first();
}

async function updateTool(
  trx: Knex.Transaction,
  key: SecurityToolKey,
  updateData: Partial<Knex.ResolveTableType<RepositorySecurityTool>>,
): Promise<RepositorySecurityTool> {
  const updateWithTimestamp = {
    ...updateData,
    updated_at: trx.fn.now() as any,
  };

  const query = trx(TABLE_NAME);
  const [result] = await buildSecurityToolWhereClause(query, key)
    .update(updateWithTimestamp)
    .returning('*');

  return normalizeBooleanFields(result as RepositorySecurityTool);
}

async function insertTool(
  trx: Knex.Transaction,
  input: SecurityToolInput,
): Promise<RepositorySecurityTool> {
  const [result] = await trx(TABLE_NAME)
    .insert({
      repository_name: input.repository_name,
      repository_url: input.repository_url,
      tool_category: input.tool_category,
      tool_name: input.tool_name,
      is_required: input.is_required ?? false,
      is_implemented: input.is_implemented ?? false,
      info_url: input.info_url || null,
      updated_at: trx.fn.now(),
    })
    .returning('*');

  return normalizeBooleanFields(result as RepositorySecurityTool);
}

export async function createSecurityToolsService({
  database,
  logger,
}: {
  database: DatabaseService;
  logger: LoggerService;
}): Promise<SecurityToolsService> {
  logger.info('Initializing SecurityToolsService');

  const db = await database.getClient();

  return {
    async bulkUpsertSecurityTools(inputs) {
      logger.info('Bulk upserting security tools', {
        count: inputs.length
      });

      const created: RepositorySecurityTool[] = [];
      const updated: RepositorySecurityTool[] = [];

      await db.transaction(async trx => {
        for (const input of inputs) {
          const key: SecurityToolKey = {
            repository_name: input.repository_name,
            tool_category: input.tool_category,
            tool_name: input.tool_name,
          };

          const existing = await findExistingTool(trx, key);

          if (existing) {
            const changes = buildUpdateData(input, existing);
            if (changes) {
              const result = await updateTool(trx, key, changes);
              updated.push(result);
            }
          } else {
            const result = await insertTool(trx, input);
            created.push(result);
          }
        }
      });

      logger.info('Bulk upsert completed', {
        created: created.length,
        updated: updated.length,
      });

      return { created, updated };
    },

    async listSecurityTools() {
      logger.debug('Listing all security tools');

      const items = await db<RepositorySecurityTool>(TABLE_NAME)
        .select('*')
        .orderBy('repository_name', 'asc');

      logger.debug('Retrieved security tools', { count: items.length });

      return {
        items: items.map(normalizeBooleanFields),
      };
    },

    async getSecurityTool(request) {
      logger.debug('Getting security tool', {
        repositoryName: request.repositoryName,
      });

      const tool = await db<RepositorySecurityTool>(TABLE_NAME)
        .where('repository_name', request.repositoryName)
        .first();

      if (!tool) {
        throw new NotFoundError(
          `No security tool found for repository '${request.repositoryName}'`,
        );
      }

      return normalizeBooleanFields(tool);
    },

    async deleteSecurityTool(request) {
      logger.info('Deleting security tool', {
        repositoryName: request.repositoryName
      });

      const deletedCount = await db(TABLE_NAME)
        .where('repository_name', request.repositoryName)
        .delete();

      if (deletedCount === 0) {
        throw new NotFoundError(
          `No security tool found for repository '${request.repositoryName}'`,
        );
      }

      logger.info('Security tool deleted successfully', {
        repositoryName: request.repositoryName,
      });
    },
  };
}
