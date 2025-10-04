import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { createSecurityToolsService } from './services/SecurityToolsService';
import { DataIngestionService } from './services/DataIngestionService';

/**
 * securityDashboardPlugin backend plugin
 *
 * @public
 */
export const securityDashboardPlugin = createBackendPlugin({
  pluginId: 'security-dashboard',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        database: coreServices.database,
        scheduler: coreServices.scheduler,
        lifecycle: coreServices.lifecycle,
        config: coreServices.rootConfig,
      },
      async init({ logger, httpAuth, httpRouter, database, scheduler, lifecycle, config }) {
        // ********** Expose backend APIs ********** //
        const securityToolsService = await createSecurityToolsService({
          database,
          logger,
        });

        httpRouter.use(
          await createRouter({
            httpAuth,
            securityToolsService,
          }),
        );

        // ********** Schedule a periodic task to fetch and update data ********** //
        const abortController = new AbortController();

        // Stop the task when the plugin shuts down
        lifecycle.addShutdownHook(() => {
          abortController.abort();
        });

        await scheduler.scheduleTask({
          id: 'daily-data-update3',
          frequency: { cron: '0 0 * * *' }, // Run at midnight daily
          timeout: { minutes: 3 },
          scope: 'global', // Run once across all instances
          signal: abortController.signal,
          fn: async () => {
            logger.info('Starting daily data update');
            const service = new DataIngestionService(config, logger);
            const repositories = await service.fetchGitHubSecurityInfo();

            logger.info('Completed daily data update');
          },
        });
      },
    });
  },
});
