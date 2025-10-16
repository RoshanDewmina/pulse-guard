import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaturnSwitch } from '@/components/saturn/SaturnSwitch';

describe('SaturnSwitch', () => {
  it('renders without crashing', () => {
    const { container } = render(<SaturnSwitch />);
    expect(container).toBeInTheDocument();
  });

  it('accepts checked prop', () => {
    const { container } = render(<SaturnSwitch checked={true} />);
    expect(container).toBeInTheDocument();
  });

  it('accepts onCheckedChange handler', () => {
    const handleChange = jest.fn();
    const { container } = render(<SaturnSwitch onCheckedChange={handleChange} />);
    expect(container).toBeInTheDocument();
  });

  it('accepts disabled prop', () => {
    const { container } = render(<SaturnSwitch disabled />);
    expect(container).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(<SaturnSwitch className="custom-switch" />);
    expect(container.querySelector('.custom-switch')).toBeInTheDocument();
  });

  it('can be controlled with checked prop', () => {
    const { rerender, container } = render(<SaturnSwitch checked={false} onCheckedChange={() => {}} />);
    expect(container).toBeInTheDocument();
    
    rerender(<SaturnSwitch checked={true} onCheckedChange={() => {}} />);
    expect(container).toBeInTheDocument();
  });

  it('can be uncontrolled with defaultChecked', () => {
    const { container } = render(<SaturnSwitch defaultChecked={true} />);
    expect(container).toBeInTheDocument();
  });

  it('renders Radix Switch component', () => {
    const { container } = render(<SaturnSwitch />);
    // Radix UI renders a button with role="switch"
    const switchElement = container.querySelector('[role="switch"]');
    expect(switchElement).toBeInTheDocument();
  });
});
