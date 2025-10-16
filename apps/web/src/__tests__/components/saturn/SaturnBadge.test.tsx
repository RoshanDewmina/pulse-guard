import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaturnBadge } from '@/components/saturn/SaturnBadge';

describe('SaturnBadge', () => {
  it('renders badge with text', () => {
    render(<SaturnBadge>Badge Text</SaturnBadge>);
    expect(screen.getByText('Badge Text')).toBeInTheDocument();
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<SaturnBadge variant="default">Default</SaturnBadge>);
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('renders success variant', () => {
      render(<SaturnBadge variant="success">Success</SaturnBadge>);
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('renders warning variant', () => {
      render(<SaturnBadge variant="warning">Warning</SaturnBadge>);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('renders error variant', () => {
      render(<SaturnBadge variant="error">Error</SaturnBadge>);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<SaturnBadge size="sm">Small</SaturnBadge>);
      expect(screen.getByText('Small')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('text-xs');
      expect(container.firstChild).toHaveClass('px-2');
    });

    it('renders medium size by default', () => {
      const { container } = render(<SaturnBadge>Medium</SaturnBadge>);
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('text-xs');
      expect(container.firstChild).toHaveClass('px-3');
    });

    it('renders medium size explicitly', () => {
      const { container } = render(<SaturnBadge size="md">Medium</SaturnBadge>);
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('text-xs');
      expect(container.firstChild).toHaveClass('px-3');
    });
  });

  it('applies custom className', () => {
    const { container } = render(<SaturnBadge className="custom-class">Badge</SaturnBadge>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies rounded styling', () => {
    const { container } = render(<SaturnBadge>Badge</SaturnBadge>);
    expect(container.firstChild).toHaveClass('rounded-full');
  });

  it('renders with children elements', () => {
    render(
      <SaturnBadge>
        <span>Icon</span>
        <span>Text</span>
      </SaturnBadge>
    );
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('combines variant and size correctly', () => {
    const { container } = render(
      <SaturnBadge variant="success" size="sm">Success Small</SaturnBadge>
    );
    expect(screen.getByText('Success Small')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-xs');
  });
});
