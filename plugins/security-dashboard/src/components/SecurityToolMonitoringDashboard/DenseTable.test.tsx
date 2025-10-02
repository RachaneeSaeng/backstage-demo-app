import { render, screen } from '@testing-library/react';
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
    <div data-testid="status-chip">{status.status}</div>
  ),
}));

describe('DenseTable', () => {
  it('should render table with correct structure', () => {
    render(<DenseTable />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByLabelText('security dashboard table')).toBeInTheDocument();
  });

  it('should render repository column header', () => {
    render(<DenseTable />);

    expect(screen.getByText('Repository')).toBeInTheDocument();
  });

  it('should render tool category headers', () => {
    render(<DenseTable />);

    expect(screen.getByText('Github Security')).toBeInTheDocument();
    expect(screen.getByText('Pull Request')).toBeInTheDocument();
    expect(screen.getByText('CI')).toBeInTheDocument();
  });

  it('should render tool names under categories', () => {
    render(<DenseTable />);

    expect(screen.getAllByText('Secret Scanning').length).toEqual(1);
    expect(screen.getAllByText('Dependabot').length).toEqual(2);
    expect(screen.getAllByText('pnpm audit').length).toEqual(2);
    expect(screen.getAllByText('Veracode').length).toEqual(2);
    expect(screen.getAllByText('CodeQL').length).toEqual(2);
    expect(screen.getAllByText('SonarQube').length).toEqual(2);
    expect(screen.getAllByText('Trivy').length).toEqual(2);
  });

  it('should render repository names', () => {
    render(<DenseTable />);

    expect(screen.getByText('test-repo-1')).toBeInTheDocument();
  });

  it('should render StatusChip components for each tool', () => {
    render(<DenseTable />);

    const statusChips = screen.getAllByTestId('status-chip');
    expect(statusChips.length).toEqual(13); // 13 columns for a repository
  });

  it('should render category cells with background colors', () => {
    const { container } = render(<DenseTable />);

    const thead = container.querySelector('thead');
    const firstRow = thead?.querySelector('tr');
    const cells = firstRow?.querySelectorAll('th');

    // Find Github Security and Pull Request cells by checking their text content
    const githubSecCell = Array.from(cells || []).find(cell => cell.textContent === 'Github Security') as HTMLElement;
    const pullReqCell = Array.from(cells || []).find(cell => cell.textContent === 'Pull Request') as HTMLElement;

    expect(githubSecCell).toBeDefined();
    expect(pullReqCell).toBeDefined();
    expect(githubSecCell?.style.backgroundColor).toBeTruthy();
    expect(pullReqCell?.style.backgroundColor).toBeTruthy();
  });

  it('should render table in a Paper container', () => {
    const { container } = render(<DenseTable />);

    const paper = container.querySelector('.MuiPaper-root');
    expect(paper).toBeInTheDocument();
  });

  it('should render correct number of header rows', () => {
    const { container } = render(<DenseTable />);

    const thead = container.querySelector('thead');
    const headerRows = thead?.querySelectorAll('tr');
    expect(headerRows).toHaveLength(2); // Category row + Tool row
  });

  it('should render correct number of body rows', () => {
    const { container } = render(<DenseTable />);

    const tbody = container.querySelector('tbody');
    const bodyRows = tbody?.querySelectorAll('tr');
    expect(bodyRows).toHaveLength(1); // 1 repositories
  });

  it('should render category headers spanning multiple columns', () => {
    const { container } = render(<DenseTable />);

    const thead = container.querySelector('thead');
    const firstRow = thead?.querySelector('tr');
    const cells = firstRow?.querySelectorAll('th');

    // Github Security should be in the header (it spans 2 tool columns)
    const githubSecCell = Array.from(cells || []).find(cell => cell.textContent === 'Github Security');
    expect(githubSecCell).toBeDefined();

    // Pull Request should be in the header (it spans 4 tool columns)
    const pullReqCell = Array.from(cells || []).find(cell => cell.textContent === 'Pull Request');
    expect(pullReqCell).toBeDefined();
  });

  it('should render Repository header in first row', () => {
    const { container } = render(<DenseTable />);

    const thead = container.querySelector('thead');
    const firstRow = thead?.querySelector('tr');
    const cells = firstRow?.querySelectorAll('th');

    // Repository should be the first cell in the header
    const repositoryHeader = Array.from(cells || []).find(cell => cell.textContent === 'Repository');
    expect(repositoryHeader).toBeDefined();
    expect(repositoryHeader).toBeInTheDocument();
  });
});
