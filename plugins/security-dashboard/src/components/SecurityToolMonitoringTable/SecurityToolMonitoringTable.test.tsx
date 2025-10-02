import { renderInTestApp } from '@backstage/test-utils';
import { SecurityToolMonitoringTable } from './SecurityToolMonitoringTable';

describe('SecurityToolMonitoringTable', () => {
  it('renders the security monitoring tools table', async () => {
    const { getByText, findByRole } =
      await renderInTestApp(<SecurityToolMonitoringTable />);

    // Wait for the table to render
    const table = await findByRole('table');

    // Assert that the table is rendered
    expect(table).toBeInTheDocument();

    // Assert that the table contains the expected header
    expect(getByText('Repository')).toBeInTheDocument();
  });
});
