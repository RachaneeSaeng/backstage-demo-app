import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const securityDashboardPlugin = createPlugin({
  id: 'security-dashboard',
  routes: {
    root: rootRouteRef,
  },
});

export const SecurityDashboardPage = securityDashboardPlugin.provide(
  createRoutableExtension({
    name: 'SecurityDashboardPage',
    component: () =>
      import('./components/SecurityToolMonitoringDashboard').then(m => m.SecurityToolMonitoringDashboard),
    mountPoint: rootRouteRef,
  }),
);
