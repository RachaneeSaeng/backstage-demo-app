import { createDevApp } from '@backstage/dev-utils';
import { securityDashboardPlugin, SecurityDashboardPage } from '../src/plugin';

createDevApp()
  .registerPlugin(securityDashboardPlugin)
  .addPage({
    element: <SecurityDashboardPage />,
    title: 'Root Page',
    path: '/security-dashboard',
  })
  .render();
