import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
} from '@/components/saturn/SaturnCard';

describe('SaturnCard', () => {
  describe('SaturnCard Component', () => {
    it('renders without crashing', () => {
      render(<SaturnCard>Test Content</SaturnCard>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SaturnCard className="custom-class">Content</SaturnCard>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with padding="md" (default)', () => {
      const { container } = render(<SaturnCard padding="md">Content</SaturnCard>);
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('renders with padding="sm"', () => {
      const { container } = render(<SaturnCard padding="sm">Content</SaturnCard>);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('renders with padding="lg"', () => {
      const { container } = render(<SaturnCard padding="lg">Content</SaturnCard>);
      expect(container.firstChild).toHaveClass('p-8');
    });

    it('renders with padding="none"', () => {
      const { container } = render(<SaturnCard padding="none">Content</SaturnCard>);
      expect(container.firstChild).not.toHaveClass('p-6');
      expect(container.firstChild).not.toHaveClass('p-4');
      expect(container.firstChild).not.toHaveClass('p-8');
    });

    it('applies default styling classes', () => {
      const { container } = render(<SaturnCard>Content</SaturnCard>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
    });

    it('applies noBorder option', () => {
      const { container } = render(<SaturnCard noBorder>Content</SaturnCard>);
      expect(container.firstChild).toHaveClass('bg-white');
    });
  });

  describe('SaturnCardHeader Component', () => {
    it('renders children correctly', () => {
      render(<SaturnCardHeader>Header Content</SaturnCardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SaturnCardHeader className="custom-header">Header</SaturnCardHeader>
      );
      expect(container.firstChild).toHaveClass('custom-header');
    });

    it('applies border styling', () => {
      const { container } = render(
        <SaturnCardHeader>Header</SaturnCardHeader>
      );
      expect(container.firstChild).toHaveClass('border-b');
    });
  });

  describe('SaturnCardTitle Component', () => {
    it('renders as h2 by default', () => {
      render(<SaturnCardTitle>Title Text</SaturnCardTitle>);
      const title = screen.getByText('Title Text');
      expect(title.tagName).toBe('H2');
    });

    it('renders as custom element when "as" prop is provided', () => {
      render(<SaturnCardTitle as="h3">Title Text</SaturnCardTitle>);
      const title = screen.getByText('Title Text');
      expect(title.tagName).toBe('H3');
    });

    it('applies correct styling classes', () => {
      render(<SaturnCardTitle>Title</SaturnCardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-[#37322F]');
      expect(title).toHaveClass('font-serif');
    });

    it('applies size classes based on heading level', () => {
      render(<SaturnCardTitle as="h1">Title</SaturnCardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-3xl');
    });
  });

  describe('SaturnCardDescription Component', () => {
    it('renders description text', () => {
      render(<SaturnCardDescription>Description text</SaturnCardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('applies correct styling', () => {
      render(<SaturnCardDescription>Description</SaturnCardDescription>);
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('text-[rgba(55,50,47,0.60)]');
      expect(desc).toHaveClass('font-sans');
    });

    it('applies custom className', () => {
      const { container } = render(
        <SaturnCardDescription className="custom-desc">Description</SaturnCardDescription>
      );
      expect(container.firstChild).toHaveClass('custom-desc');
    });
  });

  describe('SaturnCardContent Component', () => {
    it('renders content', () => {
      render(<SaturnCardContent>Card Content</SaturnCardContent>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SaturnCardContent className="custom-content">Content</SaturnCardContent>
      );
      expect(container.firstChild).toHaveClass('custom-content');
    });

    it('applies default padding', () => {
      const { container } = render(
        <SaturnCardContent>Content</SaturnCardContent>
      );
      expect(container.firstChild).toHaveClass('p-6');
    });
  });

  describe('Full Card Composition', () => {
    it('renders complete card with all sections', () => {
      render(
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle>Test Title</SaturnCardTitle>
            <SaturnCardDescription>Test Description</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>Test Content</SaturnCardContent>
        </SaturnCard>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders card with header only', () => {
      render(
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle>Title Only</SaturnCardTitle>
          </SaturnCardHeader>
        </SaturnCard>
      );

      expect(screen.getByText('Title Only')).toBeInTheDocument();
    });
  });
});
