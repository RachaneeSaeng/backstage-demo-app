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
      },
      async init({ logger, httpAuth, httpRouter, database }) {
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
      },
    });
  },
});
