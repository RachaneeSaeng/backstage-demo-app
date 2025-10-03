import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { createSecurityToolsService } from './services/SecurityToolsService';

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
      },
      async init({ logger, httpAuth, httpRouter, database, scheduler }) {
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

        await scheduler.scheduleTask({
          id: 'daily-data-insert',
          frequency: { cron: '0 0 * * *' }, // Run at midnight daily
          timeout: { hours: 1 },
          scope: 'global', // Run once across all instances
          fn: async () => {
            logger.info('Starting daily data insert');
            // Your database insert logic here
            // await database.getClient().insert(/* ... */);
            logger.info('Completed daily data insert');
          },
        });
      },
    });
  },
});
