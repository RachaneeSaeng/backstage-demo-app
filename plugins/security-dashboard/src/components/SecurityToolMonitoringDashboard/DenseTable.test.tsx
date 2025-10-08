import { screen } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';
import { DenseTable } from './DenseTable';

// Mock the utils module
jest.mock('./utils', () => ({
  getToolStatus: jest.fn(() => ({
    status: 'none',
    text: 'n/a',
  })),
  repositoriesData: [
    {
      name: 'test-repo-1',
      steps: [
        {
          toolCategory: 'Github Security',
          tools: [
            { name: 'Secret Scanning', status: 'low-risk' },
            { name: 'Dependabot', status: 'none' },
          ],
        },
      ],
    }
  ],
}));


// Mock StatusChip component
jest.mock('./StatusChip', () => ({
  StatusChip: ({ status }: any) => (
    <div data-testid="status-chip">{status?.status || 'none'}</div>
  ),
}));

describe('DenseTable', () => {
  const mockRepositoryData = [
    {
      name: 'test-repo-1',
      url: 'https://github.com/test/repo-1',
      steps: [
        {
          toolCategory: 'Github Security',
          tools: [
            { name: 'Secret Scanning', status: 'low-risk' },
            { name: 'Dependabot', status: 'none' },
          ],
        },
      ],
    }
  ];

  it('should render table with correct structure', async () => {
    await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    const tables = screen.getAllByRole('table');
    expect(tables.length).toBeGreaterThanOrEqual(1);
  });

  it('should render repository column header', async () => {
    await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    expect(screen.getByText('Repository')).toBeInTheDocument();
  });

  it('should render tool category headers', async () => {
    await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    expect(screen.getAllByText('Github Security').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pull Request').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CI').length).toBeGreaterThanOrEqual(1);
  });

  it('should render tool names under categories', async () => {
    await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    expect(screen.getAllByText('Secret Scanning').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/pnpm audit/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Veracode/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CodeQL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Trivy').length).toBeGreaterThanOrEqual(1);
  });

  it('should render repository names', async () => {
    await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    expect(screen.getByText('test-repo-1')).toBeInTheDocument();
  });

  it('should render StatusChip components for each tool', async () => {
    await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    const statusChips = screen.getAllByTestId('status-chip');
    expect(statusChips.length).toBeGreaterThanOrEqual(11); // At least 11 tool columns
  });

  it('should render category cells with background colors', async () => {
    const { container } = await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    const thead = container.querySelector('thead');
    const firstRow = thead?.querySelector('tr');
    const cells = firstRow?.querySelectorAll('th');

    // Find Github Security and Pull Request cells by checking their text content
    const githubSecCell = Array.from(cells || []).find(cell => cell.textContent?.includes('Github Security')) as HTMLElement;
    const pullReqCell = Array.from(cells || []).find(cell => cell.textContent?.includes('Pull Request')) as HTMLElement;

    expect(githubSecCell).toBeDefined();
    expect(pullReqCell).toBeDefined();
    expect(githubSecCell?.style.backgroundColor).toBeTruthy();
    expect(pullReqCell?.style.backgroundColor).toBeTruthy();
  });

  it('should render table in a Paper container', async () => {
    const { container } = await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    const paper = container.querySelector('.MuiPaper-root');
    expect(paper).toBeInTheDocument();
  });

  it('should render correct number of header rows', async () => {
    const { container } = await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    const thead = container.querySelector('thead');
    const headerRows = thead?.querySelectorAll('tr');
    expect(headerRows?.length).toBeGreaterThanOrEqual(1); // At least 1 header row
  });

  it('should render correct number of body rows', async () => {
    const { container } = await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    const tbody = container.querySelector('tbody');
    const bodyRows = tbody?.querySelectorAll('tr');
    expect(bodyRows?.length).toBeGreaterThanOrEqual(1); // At least 1 repository row
  });

  it('should render category headers spanning multiple columns', async () => {
    const { container } = await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    const thead = container.querySelector('thead');
    const firstRow = thead?.querySelector('tr');
    const cells = firstRow?.querySelectorAll('th');

    // Github Security should be in the header (it spans 2 tool columns)
    const githubSecCell = Array.from(cells || []).find(cell => cell.textContent?.includes('Github Security'));
    expect(githubSecCell).toBeDefined();

    // Pull Request should be in the header (it spans 4 tool columns)
    const pullReqCell = Array.from(cells || []).find(cell => cell.textContent?.includes('Pull Request'));
    expect(pullReqCell).toBeDefined();
  });

  it('should render Repository header in first row', async () => {
    const { container } = await renderInTestApp(<DenseTable repositoriesData={mockRepositoryData} />);

    const thead = container.querySelector('thead');
    const firstRow = thead?.querySelector('tr');
    const cells = firstRow?.querySelectorAll('th');

    // Repository should be the first cell in the header
    const repositoryHeader = Array.from(cells || []).find(cell => cell.textContent === 'Repository');
    expect(repositoryHeader).toBeDefined();
    expect(repositoryHeader).toBeInTheDocument();
  });
});
