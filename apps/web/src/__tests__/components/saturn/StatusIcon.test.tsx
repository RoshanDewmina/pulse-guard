import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusIcon } from '@/components/saturn/StatusIcon';

describe('StatusIcon', () => {
  it('renders OK status with correct icon and color', () => {
    const { container } = render(<StatusIcon status="OK" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-green-600');
  });

  it('renders LATE status with correct icon and color', () => {
    const { container } = render(<StatusIcon status="LATE" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-yellow-600');
  });

  it('renders MISSED status with correct icon and color', () => {
    const { container } = render(<StatusIcon status="MISSED" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-orange-600');
  });

  it('renders FAILING status with correct icon and color', () => {
    const { container } = render(<StatusIcon status="FAILING" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-red-600');
  });

  it('renders DISABLED status with correct icon and color', () => {
    const { container } = render(<StatusIcon status="DISABLED" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-gray-400');
  });

  it('applies correct default size', () => {
    const { container } = render(<StatusIcon status="OK" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-5');
    expect(svg).toHaveClass('h-5');
  });

  it('renders with label when showLabel is true', () => {
    render(<StatusIcon status="OK" showLabel />);
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('does not render label by default', () => {
    render(<StatusIcon status="OK" />);
    expect(screen.queryByText('Healthy')).not.toBeInTheDocument();
  });

  it('renders label with correct styling', () => {
    render(<StatusIcon status="OK" showLabel />);
    const label = screen.getByText('Healthy');
    expect(label).toHaveClass('text-[#37322F]');
    expect(label).toHaveClass('font-sans');
  });

  describe('All status types', () => {
    const statuses: Array<'OK' | 'LATE' | 'MISSED' | 'FAILING' | 'DISABLED'> = [
      'OK',
      'LATE',
      'MISSED',
      'FAILING',
      'DISABLED',
    ];

    statuses.forEach((status) => {
      it(`renders ${status} status without errors`, () => {
        const { container } = render(<StatusIcon status={status} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it(`renders ${status} status with label`, () => {
        const labels: Record<typeof status, string> = {
          OK: 'Healthy',
          LATE: 'Late',
          MISSED: 'Missed',
          FAILING: 'Failing',
          DISABLED: 'Disabled',
        };
        render(<StatusIcon status={status} showLabel />);
        expect(screen.getByText(labels[status])).toBeInTheDocument();
      });
    });
  });

  it('wraps icon and label in flex container when label is shown', () => {
    const { container } = render(<StatusIcon status="OK" showLabel />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('inline-flex');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('gap-2');
  });
});

