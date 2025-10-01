import {
  DatabaseService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { ConflictError, NotFoundError } from '@backstage/errors';
import { Knex } from 'knex';
import {
  CreateSecurityToolInput,
  RepositorySecurityTool,
  SecurityToolsService,
  UpdateSecurityToolInput,
} from './types';

export async function createSecurityToolsService({
  database,
  logger,
}: {
  database: DatabaseService;
  logger: LoggerService;
}): Promise<SecurityToolsService> {
  logger.info('Initializing SecurityToolsService');

  const db = await database.getClient();

  // Ensure the table exists (for test environments)
  const hasTable = await db.schema.hasTable('repositories_security_tools');
  if (!hasTable) {
    await db.schema.createTable('repositories_security_tools', table => {
      table
        .string('repository_name', 100)
        .primary()
        .notNullable()
        .comment('Repository name');
      table
        .string('programming_languages')
        .nullable()
        .comment('Programming languages used in the repository');
      table
        .string('tool_category', 32)
        .notNullable()
        .comment('Category of the security tool');
      table
        .string('tool_name', 32)
        .notNullable()
        .comment('Name of the security tool');
      table
        .boolean('is_required')
        .defaultTo(false)
        .comment('Whether this tool is required');
      table
        .boolean('implemented')
        .defaultTo(false)
        .comment('Whether the tool has been implemented');
      table
        .string('info_url')
        .nullable()
        .comment('URL with more information about the tool implementation');
      table
        .timestamp('updated_at')
        .defaultTo(db.fn.now())
        .notNullable()
        .comment('Timestamp of last update');
    });
    logger.info('Created repositories_security_tools table');
  }

  return {
    async createSecurityTool(input, options) {
      logger.info('Creating new security tool', {
        repositoryName: input.repository_name,
        toolName: input.tool_name,
        credentials: options.credentials.principal as any,
      });

      try {
        const [result] = await db('repositories_security_tools')
          .insert({
            repository_name: input.repository_name,
            programming_languages: input.programming_languages || null,
            tool_category: input.tool_category,
            tool_name: input.tool_name,
            is_required: input.is_required ?? false,
            implemented: input.implemented ?? false,
            info_url: input.info_url || null,
            updated_at: db.fn.now(),
          })
          .returning('*');

        logger.info('Security tool created successfully', {
          repositoryName: result.repository_name,
        });

        return {
          ...result,
          is_required: Boolean(result.is_required),
          implemented: Boolean(result.implemented),
        } as RepositorySecurityTool;
      } catch (error) {
        // Check for primary key constraint violation
        if (
          error instanceof Error &&
          (error.message.includes('UNIQUE') ||
            error.message.includes('duplicate key'))
        ) {
          throw new ConflictError(
            `Security tool for repository '${input.repository_name}' already exists`,
          );
        }
        throw error;
      }
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

    async updateSecurityTool(repositoryName, input, options) {
      logger.info('Updating security tool', {
        repositoryName,
        credentials: options.credentials.principal as any,
      });

      // Build the update object dynamically, only including provided fields
      const updateData: Partial<Knex.ResolveTableType<RepositorySecurityTool>> =
        {
          updated_at: db.fn.now() as any,
        };

      if (input.programming_languages !== undefined) {
        updateData.programming_languages = input.programming_languages;
      }
      if (input.tool_category !== undefined) {
        updateData.tool_category = input.tool_category;
      }
      if (input.tool_name !== undefined) {
        updateData.tool_name = input.tool_name;
      }
      if (input.is_required !== undefined) {
        updateData.is_required = input.is_required;
      }
      if (input.implemented !== undefined) {
        updateData.implemented = input.implemented;
      }
      if (input.info_url !== undefined) {
        updateData.info_url = input.info_url;
      }

      const [updated] = await db('repositories_security_tools')
        .where('repository_name', repositoryName)
        .update(updateData)
        .returning('*');

      if (!updated) {
        throw new NotFoundError(
          `No security tool found for repository '${repositoryName}'`,
        );
      }

      logger.info('Security tool updated successfully', { repositoryName });

      return {
        ...updated,
        is_required: Boolean(updated.is_required),
        implemented: Boolean(updated.implemented),
      } as RepositorySecurityTool;
    },

    async deleteSecurityTool(request, options) {
      logger.info('Deleting security tool', {
        repositoryName: request.repositoryName,
        credentials: options.credentials.principal as any,
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
