import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { Knex } from 'knex';
import {
  RepositorySecurityTool,
  SecurityToolsService,
} from '../types';

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

      // Process each input in a transaction
      await db.transaction(async trx => {
        for (const input of inputs) {
          // Check if the record exists
          const existing = await trx<RepositorySecurityTool>(
            'repositories_security_tools',
          )
            .where('repository_name', input.repository_name)
            .andWhere('tool_category', input.tool_category)
            .andWhere('tool_name', input.tool_name)
            .first();

          if (existing) {
            // Update existing record only if fields have changed
            const updateData: Partial<Knex.ResolveTableType<RepositorySecurityTool>> = {};
            
            if (input.is_required !== undefined && input.is_required !== Boolean(existing.is_required)) {
              updateData.is_required = input.is_required;
            }
            if (input.implemented !== undefined && input.implemented !== Boolean(existing.implemented)) {
              updateData.implemented = input.implemented;
            }
            if (input.info_url !== undefined && input.info_url !== existing.info_url) {
              updateData.info_url = input.info_url;
            }

            if (updateData && Object.keys(updateData).length > 0) {
              updateData.updated_at = trx.fn.now() as any;

              const [result] = await trx('repositories_security_tools')
                .where('repository_name', input.repository_name)
                .andWhere('tool_category', input.tool_category)
                .andWhere('tool_name', input.tool_name)
                .update(updateData)
                .returning('*');

              updated.push({
                ...result,
                is_required: Boolean(result.is_required),
                implemented: Boolean(result.implemented),
              } as RepositorySecurityTool);
            }
          } else {
            // Insert new record
            const [result] = await trx('repositories_security_tools')
              .insert({
                repository_name: input.repository_name,
                repository_url: input.repository_url,
                tool_category: input.tool_category,
                tool_name: input.tool_name,
                is_required: input.is_required ?? false,
                implemented: input.implemented ?? false,
                info_url: input.info_url || null,
                updated_at: trx.fn.now(),
              })
              .returning('*');

            created.push({
              ...result,
              is_required: Boolean(result.is_required),
              implemented: Boolean(result.implemented),
            } as RepositorySecurityTool);
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

      const items = await db<RepositorySecurityTool>(
        'repositories_security_tools',
      )
        .select('*')
        .orderBy('repository_name', 'asc');

      logger.debug('Retrieved security tools', { count: items.length });

      return {
        items: items.map(item => ({
          ...item,
          is_required: Boolean(item.is_required),
          implemented: Boolean(item.implemented),
        })),
      };
    },

    async getSecurityTool(request) {
      logger.debug('Getting security tool', {
        repositoryName: request.repositoryName,
      });

      const tool = await db<RepositorySecurityTool>(
        'repositories_security_tools',
      )
        .where('repository_name', request.repositoryName)
        .first();

      if (!tool) {
        throw new NotFoundError(
          `No security tool found for repository '${request.repositoryName}'`,
        );
      }

      return {
        ...tool,
        is_required: Boolean(tool.is_required),
        implemented: Boolean(tool.implemented),
      };
    },

    async deleteSecurityTool(request) {
      logger.info('Deleting security tool', {
        repositoryName: request.repositoryName
      });

      const deletedCount = await db('repositories_security_tools')
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
