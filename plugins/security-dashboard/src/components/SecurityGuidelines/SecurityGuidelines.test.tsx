import { SecurityGuidelines } from './SecurityGuidelines';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import {
  registerMswTestHooks,
  renderInTestApp,
} from '@backstage/test-utils';

describe('SecurityGuidelines', () => {
  const server = setupServer();
  registerMswTestHooks(server);

  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render', async () => {
    await renderInTestApp(<SecurityGuidelines />);
    expect(
      screen.getByText('Security Guidelines'),
    ).toBeInTheDocument();
  });
});
