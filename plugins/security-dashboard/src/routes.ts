import { createRouteRef } from '@backstage/core-plugin-api';

export const securityToolsDashboardRouteRef = createRouteRef({
  id: 'security-tools-dashboard',
});

export const cloudSecurityDashboardRouteRef = createRouteRef({
  id: 'cloud-security-dashboard',
});

export const securityGuidelinesRouteRef = createRouteRef({
  id: 'security-guidelines',
});
