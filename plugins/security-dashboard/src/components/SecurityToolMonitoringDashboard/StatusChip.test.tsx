import { render, screen } from '@testing-library/react';
import { StatusChip } from './StatusChip';
import { SecurityStatus } from '../../types';

describe('StatusChip', () => {
  it('should render critical-risk status chip', () => {
    const status: SecurityStatus = {
      status: 'critical-risk',
      text: 'Latest scan report',
      link: 'https://example.com/scan',
    };

    render(<StatusChip status={status} />);

    expect(screen.getByText('View latest scan result')).toBeInTheDocument();
    expect(screen.getByText('Pending Tickets')).toBeInTheDocument();
  });

  it('should render high-risk status chip', () => {
    const status: SecurityStatus = {
      status: 'high-risk',
      text: 'Latest scan report',
      link: 'https://example.com/scan',
    };

    render(<StatusChip status={status} />);

    expect(screen.getByText('View latest scan result')).toBeInTheDocument();
    expect(screen.getByText('Pending Tickets')).toBeInTheDocument();
  });

  it('should render medium-risk status chip', () => {
    const status: SecurityStatus = {
      status: 'medium-risk',
      text: 'Latest scan report',
      link: 'https://example.com/scan',
    };

    render(<StatusChip status={status} />);

    expect(screen.getByText('View latest scan result')).toBeInTheDocument();
    expect(screen.getByText('Pending Tickets')).toBeInTheDocument();
  });

  it('should render low-risk status chip', () => {
    const status: SecurityStatus = {
      status: 'low-risk',
      text: 'Latest scan report',
      link: 'https://example.com/scan',
    };

    render(<StatusChip status={status} />);

    expect(screen.getByText('View latest scan result')).toBeInTheDocument();
    expect(screen.getByText('Pending Tickets')).toBeInTheDocument();
  });

  it('should render none status chip', () => {
    const status: SecurityStatus = {
      status: 'none',
      text: 'n/a',
    };

    render(<StatusChip status={status} />);

    expect(screen.getByText('View latest scan result')).toBeInTheDocument();
    expect(screen.getByText('Pending Tickets')).toBeInTheDocument();
  });

  it('should render links with correct href', () => {
    const status: SecurityStatus = {
      status: 'critical-risk',
      text: 'Latest scan report',
      link: 'https://example.com/test-link',
    };

    render(<StatusChip status={status} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://example.com/test-link');
    expect(links[1]).toHaveAttribute('href', 'https://example.com/test-link');
  });

  it('should render chip with small size', () => {
    const status: SecurityStatus = {
      status: 'high-risk',
      text: 'Latest scan report',
      link: '#',
    };

    const { container } = render(<StatusChip status={status} />);

    const chip = container.querySelector('.MuiChip-sizeSmall');
    expect(chip).toBeInTheDocument();
  });
});
