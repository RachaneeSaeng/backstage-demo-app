import { CloudSecurityDashboard } from './CloudSecurityDashboard';
import { screen } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';

describe('CloudSecurityDashboard', () => {
  it('should render', async () => {
    await renderInTestApp(<CloudSecurityDashboard />);
    expect(
      screen.getByText('Cloud Security Dashboard'),
    ).toBeInTheDocument();
  });
});
