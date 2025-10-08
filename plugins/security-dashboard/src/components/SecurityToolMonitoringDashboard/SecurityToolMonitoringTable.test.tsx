import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { SecurityToolMonitoringTable } from './SecurityToolMonitoringTable';
import { securityDashboardApiRef } from '../../api';

describe('SecurityToolMonitoringTable', () => {
  it('renders the security monitoring tools table', async () => {
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

    const { getByText, findAllByRole } = await renderInTestApp(
      <TestApiProvider apis={[[securityDashboardApiRef, mockApi]]}>
        <SecurityToolMonitoringTable />
      </TestApiProvider>,
    );

    // Wait for the table to render
    const tables = await findAllByRole('table');

    // Assert that at least one table is rendered
    expect(tables.length).toBeGreaterThanOrEqual(1);

    // Assert that the table contains the expected header
    expect(getByText('Repository')).toBeInTheDocument();
  });
});
