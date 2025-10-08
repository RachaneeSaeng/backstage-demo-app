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

    const { container } = render(<StatusChip status={status} />);

    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    // Check that the chip has the critical chip class (dynamically generated)
    const chipClasses = chip?.className || '';
    expect(chipClasses).toMatch(/makeStyles-criticalChip-/);
  });

  it('should render high-risk status chip', () => {
    const status: SecurityStatus = {
      status: 'high-risk',
      text: 'Latest scan report',
      link: 'https://example.com/scan',
    };

    const { container } = render(<StatusChip status={status} />);

    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    // Check that the chip has the high chip class (dynamically generated)
    const chipClasses = chip?.className || '';
    expect(chipClasses).toMatch(/makeStyles-highChip-/);
  });

  it('should render medium-risk status chip', () => {
    const status: SecurityStatus = {
      status: 'medium-risk',
      text: 'Latest scan report',
      link: 'https://example.com/scan',
    };

    const { container } = render(<StatusChip status={status} />);

    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    // Check that the chip has the medium chip class (dynamically generated)
    const chipClasses = chip?.className || '';
    expect(chipClasses).toMatch(/makeStyles-mediumChip-/);
  });

  it('should render low-risk status chip', () => {
    const status: SecurityStatus = {
      status: 'low-risk',
      text: 'Latest scan report',
      link: 'https://example.com/scan',
    };

    const { container } = render(<StatusChip status={status} />);

    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    // Check that the chip has the low chip class (dynamically generated)
    const chipClasses = chip?.className || '';
    expect(chipClasses).toMatch(/makeStyles-lowChip-/);
  });

  it('should render none status chip', () => {
    const status: SecurityStatus = {
      status: 'none',
      text: 'n/a',
    };

    const { container } = render(<StatusChip status={status} />);

    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    // Check that the chip has the none chip class (dynamically generated)
    const chipClasses = chip?.className || '';
    expect(chipClasses).toMatch(/makeStyles-noneChip-/);
  });

  it('should render links with correct href', () => {
    const status: SecurityStatus = {
      status: 'critical-risk',
      text: 'Latest scan report',
      link: 'https://example.com/test-link',
    };

    render(<StatusChip status={status} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/test-link');
    expect(link).toHaveAttribute('target', '_blank');
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
