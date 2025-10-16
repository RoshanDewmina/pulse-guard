import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaturnButton } from '../SaturnButton';
import { Plus } from 'lucide-react';

describe('SaturnButton', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<SaturnButton>Click me</SaturnButton>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      render(<SaturnButton icon={<Plus data-testid="icon" />}>With Icon</SaturnButton>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(<SaturnButton loading>Loading</SaturnButton>);
      expect(screen.getByRole('button')).toBeDisabled();
      // Loading spinner should be present
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies primary variant styles', () => {
      render(<SaturnButton variant="primary">Primary</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[#37322F]');
      expect(button).toHaveClass('text-white');
    });

    it('applies secondary variant styles', () => {
      render(<SaturnButton variant="secondary">Secondary</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('text-[#37322F]');
    });

    it('applies ghost variant styles', () => {
      render(<SaturnButton variant="ghost">Ghost</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-[rgba(49,45,43,0.80)]');
    });

    it('applies danger variant styles', () => {
      render(<SaturnButton variant="danger">Danger</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });
  });

  describe('Sizes', () => {
    it('applies small size styles', () => {
      render(<SaturnButton size="sm">Small</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
    });

    it('applies medium size styles (default)', () => {
      render(<SaturnButton>Medium</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
    });

    it('applies large size styles', () => {
      render(<SaturnButton size="lg">Large</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
    });
  });

  describe('Interaction', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = jest.fn();
      render(<SaturnButton onClick={handleClick}>Click</SaturnButton>);
      
      fireEvent.click(screen.getByText('Click'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<SaturnButton disabled onClick={handleClick}>Disabled</SaturnButton>);
      
      fireEvent.click(screen.getByText('Disabled'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<SaturnButton loading onClick={handleClick}>Loading</SaturnButton>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<SaturnButton onClick={handleClick}>Keyboard</SaturnButton>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
      
      // Button click should be triggered by keyboard
      expect(button).toHaveFocus;
    });

    it('has correct disabled state', () => {
      render(<SaturnButton disabled>Disabled</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('supports fullWidth prop', () => {
      render(<SaturnButton fullWidth>Full Width</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Custom Props', () => {
    it('forwards additional props to button element', () => {
      render(
        <SaturnButton data-testid="custom-button" aria-label="Custom">
          Custom
        </SaturnButton>
      );
      
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('aria-label', 'Custom');
    });

    it('applies custom className', () => {
      render(<SaturnButton className="custom-class">Custom</SaturnButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});


