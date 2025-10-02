import { render, screen } from '@testing-library/react';
import { DenseTable } from './DenseTable';

// Mock the utils module
jest.mock('./utils', () => ({
  getToolStatus: jest.fn(() => ({
    status: 'none',
    text: 'n/a',
  })),
  repositories: [
    {
      name: 'test-repo-1',
      steps: [
        {
          toolCategory: 'SAST',
          tools: [
            { name: 'SonarQube', status: 'low-risk' },
            { name: 'Semgrep', status: 'none' },
          ],
        },
      ],
    },
    {
      name: 'test-repo-2',
      steps: [
        {
          toolCategory: 'SAST',
          tools: [
            { name: 'SonarQube', status: 'high-risk' },
            { name: 'Semgrep', status: 'medium-risk' },
          ],
        },
      ],
    },
  ],
}));

// Mock the config
jest.mock('./config/toolCategories.json', () => ({
  toolCategories: [
    {
      name: 'SAST',
      backgroundColor: '#4A90E2',
      tools: ['SonarQube', 'Semgrep'],
    },
    {
      name: 'DAST',
      backgroundColor: '#F5A623',
      tools: ['OWASP ZAP'],
    },
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

    expect(screen.getByText('SAST')).toBeInTheDocument();
    expect(screen.getByText('DAST')).toBeInTheDocument();
  });

  it('should render tool names under categories', () => {
    render(<DenseTable />);

    expect(screen.getByText('SonarQube')).toBeInTheDocument();
    expect(screen.getByText('Semgrep')).toBeInTheDocument();
    expect(screen.getByText('OWASP ZAP')).toBeInTheDocument();
  });

  it('should render repository names', () => {
    render(<DenseTable />);

    expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    expect(screen.getByText('test-repo-2')).toBeInTheDocument();
  });

  it('should render StatusChip components for each tool', () => {
    render(<DenseTable />);

    const statusChips = screen.getAllByTestId('status-chip');
    // 2 repositories * 3 tools (SonarQube, Semgrep, OWASP ZAP) = 6 chips
    expect(statusChips.length).toBeGreaterThan(0);
  });

  it('should render category cells with background colors', () => {
    const { container } = render(<DenseTable />);

    const thead = container.querySelector('thead');
    const firstRow = thead?.querySelector('tr');
    const cells = firstRow?.querySelectorAll('th');

    // Find SAST and DAST cells by checking their text content
    const sastCell = Array.from(cells || []).find(cell => cell.textContent === 'SAST') as HTMLElement;
    const dastCell = Array.from(cells || []).find(cell => cell.textContent === 'DAST') as HTMLElement;

    expect(sastCell).toBeDefined();
    expect(dastCell).toBeDefined();
    expect(sastCell?.style.backgroundColor).toBeTruthy();
    expect(dastCell?.style.backgroundColor).toBeTruthy();
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
    expect(bodyRows).toHaveLength(2); // 2 repositories
  });

  it('should render category headers spanning multiple columns', () => {
    const { container } = render(<DenseTable />);

    const thead = container.querySelector('thead');
    const firstRow = thead?.querySelector('tr');
    const cells = firstRow?.querySelectorAll('th');

    // SAST should be in the header (it spans 2 tool columns)
    const sastCell = Array.from(cells || []).find(cell => cell.textContent === 'SAST');
    expect(sastCell).toBeDefined();

    // DAST should be in the header (it spans 1 tool column)
    const dastCell = Array.from(cells || []).find(cell => cell.textContent === 'DAST');
    expect(dastCell).toBeDefined();
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
