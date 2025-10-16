import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaturnInput } from '@/components/saturn/SaturnInput';

describe('SaturnInput', () => {
  it('renders input element', () => {
    render(<SaturnInput placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<SaturnInput onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies disabled state', () => {
    render(<SaturnInput disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('supports different types', () => {
    const { rerender, container } = render(<SaturnInput type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    
    rerender(<SaturnInput type="password" placeholder="password" />);
    const passwordInput = container.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('applies fullWidth class when prop is true', () => {
    const { container } = render(<SaturnInput fullWidth />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('applies error styling', () => {
    const { container } = render(<SaturnInput error="Error message" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-red-500');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<SaturnInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('accepts custom className', () => {
    const { container } = render(<SaturnInput className="custom-class" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-class');
  });

  it('applies required attribute', () => {
    render(<SaturnInput required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('applies maxLength attribute', () => {
    render(<SaturnInput maxLength={10} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
  });

  it('supports autoComplete', () => {
    render(<SaturnInput autoComplete="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('autoComplete', 'email');
  });

  it('supports placeholder text', () => {
    render(<SaturnInput placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });
});

