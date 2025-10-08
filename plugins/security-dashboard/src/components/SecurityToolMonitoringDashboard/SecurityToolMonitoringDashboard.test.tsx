import { SecurityToolMonitoringDashboard } from './SecurityToolMonitoringDashboard';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import {
  registerMswTestHooks,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { securityDashboardApiRef } from '../../api';

describe('ExampleComponent', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  registerMswTestHooks(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render', async () => {
    const mockApi = {
      listSecurityTools: jest.fn().mockResolvedValue({
        items: [
          {
            repository: 'test-repo',
            tools: {
              dependabot: { status: 'none' },
              secretScanning: { status: 'none' },
              codescanning: { status: 'none' },
            },
          },
        ],
      }),
    };

    const rendered = await renderInTestApp(
      <TestApiProvider apis={[[securityDashboardApiRef, mockApi]]}>
        <SecurityToolMonitoringDashboard />
      </TestApiProvider>,
    );

    expect(
      await rendered.findByText('Security Tools Monitoring Dashboard'),
    ).toBeInTheDocument();
  });
});
