import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaturnTextarea } from '@/components/saturn/SaturnTextarea';

describe('SaturnTextarea', () => {
  it('renders without crashing', () => {
    render(<SaturnTextarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<SaturnTextarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with value', () => {
    render(<SaturnTextarea value="Test value" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('Test value');
  });

  it('handles disabled state', () => {
    render(<SaturnTextarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('applies fullWidth class when prop is true', () => {
    const { container } = render(<SaturnTextarea fullWidth />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('applies error styling', () => {
    const { container } = render(<SaturnTextarea error="Error message" />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('border-red-500');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<SaturnTextarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('accepts custom className', () => {
    const { container } = render(<SaturnTextarea className="custom-class" />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('custom-class');
  });

  it('applies required attribute', () => {
    render(<SaturnTextarea required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('applies correct default styling', () => {
    const { container } = render(<SaturnTextarea />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('rounded-lg');
    expect(textarea).toHaveClass('border');
    expect(textarea).toHaveClass('bg-white');
    expect(textarea).toHaveClass('px-3');
  });

  it('displays error message when provided', () => {
    render(<SaturnTextarea error="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('does not display error message when not provided', () => {
    const { container } = render(<SaturnTextarea />);
    const errorMessage = container.querySelector('.text-red-600');
    expect(errorMessage).not.toBeInTheDocument();
  });
});
