import { securityDashboardPlugin } from './plugin';

describe('security-dashboard', () => {
  it('should export plugin', () => {
    expect(securityDashboardPlugin).toBeDefined();
  });
});
