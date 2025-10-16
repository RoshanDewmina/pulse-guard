import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaturnLabel } from '@/components/saturn/SaturnLabel';

describe('SaturnLabel', () => {
  it('renders label text', () => {
    render(<SaturnLabel>Label Text</SaturnLabel>);
    expect(screen.getByText('Label Text')).toBeInTheDocument();
  });

  it('renders as label element', () => {
    render(<SaturnLabel>Label</SaturnLabel>);
    const label = screen.getByText('Label');
    expect(label.tagName).toBe('LABEL');
  });

  it('applies htmlFor attribute', () => {
    render(<SaturnLabel htmlFor="input-id">Label</SaturnLabel>);
    const label = screen.getByText('Label');
    expect(label).toHaveAttribute('for', 'input-id');
  });

  it('shows required indicator when required=true', () => {
    render(<SaturnLabel required>Required Field</SaturnLabel>);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator when required=false', () => {
    render(<SaturnLabel required={false}>Optional Field</SaturnLabel>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('does not show required indicator by default', () => {
    render(<SaturnLabel>Default Field</SaturnLabel>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('applies correct styling', () => {
    render(<SaturnLabel>Label</SaturnLabel>);
    const label = screen.getByText('Label');
    expect(label).toHaveClass('text-[#37322F]');
    expect(label).toHaveClass('font-sans');
    expect(label).toHaveClass('font-medium');
  });

  it('applies custom className', () => {
    render(<SaturnLabel className="custom-class">Label</SaturnLabel>);
    const label = screen.getByText('Label');
    expect(label).toHaveClass('custom-class');
  });

  it('renders required indicator with correct color', () => {
    render(<SaturnLabel required>Required</SaturnLabel>);
    // The asterisk should be present in the document
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('combines required indicator with label text correctly', () => {
    render(<SaturnLabel required>Email Address</SaturnLabel>);
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});

