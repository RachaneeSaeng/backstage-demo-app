import { createDevApp } from '@backstage/dev-utils';
import { securityDashboardPlugin, SecurityToolMonitoringDashboardPage, CloudSecurityDashboardPage, SecurityGuidelinesPage } from '../src/plugin';

createDevApp()
  .registerPlugin(securityDashboardPlugin)
  .addPage({
    element: <SecurityToolMonitoringDashboardPage />,
    title: 'Security Tool Monitoring',
    path: '/security-tools-dashboard',
  })
  .addPage({
    element: <CloudSecurityDashboardPage />,
    title: 'Cloud Security Dashboard',
    path: '/cloud-security-dashboard',
  })
  .addPage({
    element: <SecurityGuidelinesPage />,
    title: 'Security Guidelines',
    path: '/security-guidelines',
  })
  .render();
