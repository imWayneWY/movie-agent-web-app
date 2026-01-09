import React from 'react';
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('renders skeleton element', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('custom-class');
    });

    it('has default skeleton styles', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });
  });

  describe('Custom sizing', () => {
    it('accepts custom width', () => {
      const { container } = render(<Skeleton className="w-32" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('w-32');
    });

    it('accepts custom height', () => {
      const { container } = render(<Skeleton className="h-16" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-16');
    });

    it('accepts custom dimensions', () => {
      const { container } = render(<Skeleton className="w-full h-48" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('w-full', 'h-48');
    });
  });

  describe('Shape variants', () => {
    it('renders as rectangle (default)', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('renders as circle', () => {
      const { container } = render(<Skeleton className="rounded-full" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('renders with custom border radius', () => {
      const { container } = render(<Skeleton className="rounded-lg" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-lg');
    });
  });

  describe('Use cases', () => {
    it('renders as text line placeholder', () => {
      const { container } = render(<Skeleton className="h-4 w-full" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-4', 'w-full');
    });

    it('renders as avatar placeholder', () => {
      const { container } = render(
        <Skeleton className="h-12 w-12 rounded-full" />
      );
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full');
    });

    it('renders as card placeholder', () => {
      const { container } = render(
        <Skeleton className="h-64 w-full rounded-lg" />
      );
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-64', 'w-full', 'rounded-lg');
    });

    it('renders as button placeholder', () => {
      const { container } = render(<Skeleton className="h-10 w-24" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-10', 'w-24');
    });
  });

  describe('Multiple skeletons', () => {
    it('renders multiple skeleton elements', () => {
      const { container } = render(
        <div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });

    it('creates loading state for movie card', () => {
      const { container } = render(
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Animation', () => {
    it('has pulse animation', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('Accessibility', () => {
    it('is a non-interactive element', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.tagName).toBe('DIV');
    });

    it('supports aria-hidden for screen readers', () => {
      const { container } = render(<Skeleton aria-hidden="true" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });

    it('can be labeled for loading state', () => {
      const { container } = render(
        <div aria-busy="true" aria-label="Loading content">
          <Skeleton />
        </div>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Responsive behavior', () => {
    it('supports responsive widths', () => {
      const { container } = render(
        <Skeleton className="w-full md:w-1/2 lg:w-1/3" />
      );
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('w-full', 'md:w-1/2', 'lg:w-1/3');
    });

    it('supports responsive heights', () => {
      const { container } = render(
        <Skeleton className="h-32 md:h-48 lg:h-64" />
      );
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-32', 'md:h-48', 'lg:h-64');
    });
  });

  describe('HTML attributes', () => {
    it('supports data attributes', () => {
      const { container } = render(
        <Skeleton data-testid="skeleton-loader" />
      );
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('data-testid', 'skeleton-loader');
    });

    it('accepts style prop', () => {
      const { container } = render(
        <Skeleton style={{ width: '200px', height: '100px' }} />
      );
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });
  });
});
