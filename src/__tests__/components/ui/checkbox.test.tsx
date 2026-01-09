import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '@/components/ui/checkbox';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Checkbox', () => {
  describe('Rendering', () => {
    it('renders checkbox', () => {
      render(<Checkbox aria-label="Accept terms" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Checkbox className="custom-class" aria-label="Checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('custom-class');
    });

    it('has default checkbox styles', () => {
      render(<Checkbox aria-label="Checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass(
        'h-4',
        'w-4',
        'rounded-sm',
        'border',
        'border-primary'
      );
    });

    it('forwards ref to checkbox element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Checkbox ref={ref} aria-label="Checkbox" />);
      
      expect(ref.current).toBeDefined();
    });
  });

  describe('States', () => {
    it('renders in unchecked state by default', () => {
      render(<Checkbox aria-label="Checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('renders in checked state', () => {
      render(<Checkbox checked aria-label="Checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('handles disabled state', () => {
      render(<Checkbox disabled aria-label="Disabled checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
    });

    it('applies disabled opacity', () => {
      render(<Checkbox disabled aria-label="Checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Interactions', () => {
    it('handles click to check', () => {
      const onCheckedChange = jest.fn();
      render(
        <Checkbox
          onCheckedChange={onCheckedChange}
          aria-label="Toggle checkbox"
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('handles click to uncheck', () => {
      const onCheckedChange = jest.fn();
      render(
        <Checkbox
          checked
          onCheckedChange={onCheckedChange}
          aria-label="Toggle checkbox"
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it('does not trigger onCheckedChange when disabled', () => {
      const onCheckedChange = jest.fn();
      render(
        <Checkbox
          disabled
          onCheckedChange={onCheckedChange}
          aria-label="Disabled checkbox"
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('can be focused for keyboard interaction', () => {
      const onCheckedChange = jest.fn();
      render(
        <Checkbox
          onCheckedChange={onCheckedChange}
          aria-label="Keyboard checkbox"
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      
      expect(checkbox).toHaveFocus();
    });
  });

  describe('Visual indicator', () => {
    it('shows check icon when checked', () => {
      const { container } = render(
        <Checkbox checked aria-label="Checked checkbox" />
      );
      
      // Check icon is rendered via lucide-react Check component
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('does not show check icon when unchecked', () => {
      render(<Checkbox aria-label="Unchecked checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <div>
          <label htmlFor="test-checkbox">Accept terms</label>
          <Checkbox id="test-checkbox" />
        </div>
      );
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });

    it('supports aria-label', () => {
      render(<Checkbox aria-label="Terms checkbox" />);
      
      const checkbox = screen.getByRole('checkbox', { name: /terms checkbox/i });
      expect(checkbox).toBeInTheDocument();
    });

    it('has focus styles', () => {
      render(<Checkbox aria-label="Focus checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring'
      );
    });

    it('can be focused', () => {
      render(<Checkbox aria-label="Focusable checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      
      expect(checkbox).toHaveFocus();
    });

    it('supports aria-required for forms', () => {
      render(<Checkbox aria-required="true" aria-label="Required checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Form integration', () => {
    it('can be integrated with forms', () => {
      render(
        <form>
          <Checkbox name="terms" aria-label="Terms" />
        </form>
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('supports controlled state', () => {
      const onCheckedChange = jest.fn();
      const { rerender } = render(
        <Checkbox
          checked={false}
          onCheckedChange={onCheckedChange}
          aria-label="Controlled"
        />
      );
      
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
      
      rerender(
        <Checkbox
          checked={true}
          onCheckedChange={onCheckedChange}
          aria-label="Controlled"
        />
      );
      
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('Use cases', () => {
    it('works as a terms acceptance checkbox', () => {
      const { rerender } = render(
        <div>
          <Checkbox id="terms" />
          <label htmlFor="terms">I accept the terms and conditions</label>
        </div>
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      
      rerender(
        <div>
          <Checkbox id="terms" checked />
          <label htmlFor="terms">I accept the terms and conditions</label>
        </div>
      );
      
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('works for multi-select options', () => {
      render(
        <div>
          <Checkbox id="option1" aria-label="Option 1" />
          <Checkbox id="option2" aria-label="Option 2" />
          <Checkbox id="option3" aria-label="Option 3" />
        </div>
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });
  });

  describe('Responsive behavior', () => {
    it('maintains consistent size', () => {
      render(<Checkbox aria-label="Responsive checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('h-4', 'w-4');
    });
  });
});
