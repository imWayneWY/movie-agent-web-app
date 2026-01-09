import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders badge with children', () => {
      render(<Badge>New</Badge>);
      
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Badge className="custom-class">Badge</Badge>
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });

    it('has default badge styles', () => {
      const { container } = render(<Badge>Badge</Badge>);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold'
      );
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('renders secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('renders destructive variant', () => {
      const { container } = render(<Badge variant="destructive">Error</Badge>);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('renders outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-foreground');
    });
  });

  describe('Content', () => {
    it('renders text content', () => {
      render(<Badge>Text Badge</Badge>);
      
      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('renders with numbers', () => {
      render(<Badge>99+</Badge>);
      
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('renders with icons and text', () => {
      render(
        <Badge>
          <span>⭐</span> Featured
        </Badge>
      );
      
      expect(screen.getByText('⭐')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('renders empty badge', () => {
      const { container } = render(<Badge />);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });
  });

  describe('HTML attributes', () => {
    it('supports onClick handler', () => {
      const onClick = jest.fn();
      const { container } = render(<Badge onClick={onClick}>Clickable</Badge>);
      
      const badge = container.firstChild as HTMLElement;
      badge.click();
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('supports data attributes', () => {
      const { container } = render(
        <Badge data-testid="test-badge">Badge</Badge>
      );
      
      const badge = screen.getByTestId('test-badge');
      expect(badge).toBeInTheDocument();
    });

    it('supports aria attributes', () => {
      const { container } = render(
        <Badge aria-label="Status badge">Live</Badge>
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute('aria-label', 'Status badge');
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Badge>Accessible Badge</Badge>);
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });

    it('supports focus styles', () => {
      const { container } = render(<Badge>Focus Badge</Badge>);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('renders with semantic meaning using aria-label', () => {
      render(<Badge aria-label="New notification badge">3</Badge>);
      
      const badge = screen.getByLabelText('New notification badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Use cases', () => {
    it('displays status indicator', () => {
      render(<Badge variant="default">Active</Badge>);
      
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays notification count', () => {
      render(<Badge variant="destructive">5</Badge>);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays category label', () => {
      render(<Badge variant="secondary">Action</Badge>);
      
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('maintains size on different screens', () => {
      const { container } = render(
        <Badge className="text-xs md:text-sm">Responsive</Badge>
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-xs', 'md:text-sm');
    });
  });
});
