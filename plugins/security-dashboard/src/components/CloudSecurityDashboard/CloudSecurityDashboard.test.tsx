import { CloudSecurityDashboard } from './CloudSecurityDashboard';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import {
  registerMswTestHooks,
  renderInTestApp,
} from '@backstage/test-utils';

describe('CloudSecurityDashboard', () => {
  const server = setupServer();
  registerMswTestHooks(server);

  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render', async () => {
    await renderInTestApp(<CloudSecurityDashboard />);
    expect(
      screen.getByText('Cloud Security Dashboard'),
    ).toBeInTheDocument();
  });
});
