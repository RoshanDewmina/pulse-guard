import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PageHeader } from '@/components/saturn/PageHeader';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Test Page" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('renders title with correct heading tag', () => {
    render(<PageHeader title="Test Page" />);
    const title = screen.getByText('Test Page');
    expect(title.tagName).toBe('H1');
  });

  it('applies correct styling to title', () => {
    render(<PageHeader title="Test Page" />);
    const title = screen.getByText('Test Page');
    expect(title).toHaveClass('text-[#37322F]');
    expect(title).toHaveClass('font-serif');
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Test Page" description="Test description" />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<PageHeader title="Test Page" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('applies correct styling to description', () => {
    render(<PageHeader title="Test Page" description="Test description" />);
    const description = screen.getByText('Test description');
    expect(description).toHaveClass('text-[rgba(55,50,47,0.80)]');
    expect(description).toHaveClass('font-sans');
  });

  it('renders title and description together', () => {
    render(
      <PageHeader 
        title="My Dashboard" 
        description="View your monitor statistics" 
      />
    );
    expect(screen.getByText('My Dashboard')).toBeInTheDocument();
    expect(screen.getByText('View your monitor statistics')).toBeInTheDocument();
  });

  it('applies responsive text sizes', () => {
    render(<PageHeader title="Test" />);
    const title = screen.getByText('Test');
    expect(title).toHaveClass('text-3xl');
    expect(title).toHaveClass('sm:text-4xl');
  });
});


