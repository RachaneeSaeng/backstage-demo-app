import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { securityToolsDashboardRouteRef, cloudSecurityDashboardRouteRef, securityGuidelinesRouteRef } from './routes';

export const securityDashboardPlugin = createPlugin({
  id: 'security-dashboard',
  routes: {
    securityToolsDashboard: securityToolsDashboardRouteRef,
    cloudSecurityDashboard: cloudSecurityDashboardRouteRef,
    securityGuidelines: securityGuidelinesRouteRef,
  },
});

export const SecurityToolMonitoringDashboardPage = securityDashboardPlugin.provide(
  createRoutableExtension({
    name: 'SecurityToolMonitoringDashboardPage',
    component: () =>
      import('./components/SecurityToolMonitoringDashboard').then(m => m.SecurityToolMonitoringDashboard),
    mountPoint: securityToolsDashboardRouteRef,
  }),
);

export const CloudSecurityDashboardPage = securityDashboardPlugin.provide(
  createRoutableExtension({
    name: 'CloudSecurityDashboardPage',
    component: () =>
      import('./components/CloudSecurityDashboard').then(m => m.CloudSecurityDashboard),
    mountPoint: cloudSecurityDashboardRouteRef,
  }),
);

export const SecurityGuidelinesPage = securityDashboardPlugin.provide(
  createRoutableExtension({
    name: 'SecurityGuidelinesPage',
    component: () =>
      import('./components/SecurityGuidelines').then(m => m.SecurityGuidelines),
    mountPoint: securityGuidelinesRouteRef,
  }),
);
