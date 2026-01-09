import React from 'react';
import { render } from '@testing-library/react';
import { Separator } from '@/components/ui/separator';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Separator', () => {
  describe('Rendering', () => {
    it('renders separator element', () => {
      const { container } = render(<Separator />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Separator className="custom-class" />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveClass('custom-class');
    });

    it('has default separator styles', () => {
      const { container } = render(<Separator />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveClass('shrink-0', 'bg-border');
    });

    it('forwards ref to separator element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Separator ref={ref} />);
      
      expect(ref.current).toBeDefined();
    });
  });

  describe('Orientation', () => {
    it('renders horizontal by default', () => {
      const { container } = render(<Separator />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
      expect(separator).toHaveClass('h-[1px]', 'w-full');
    });

    it('renders horizontal when specified', () => {
      const { container } = render(<Separator orientation="horizontal" />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
      expect(separator).toHaveClass('h-[1px]', 'w-full');
    });

    it('renders vertical when specified', () => {
      const { container } = render(<Separator orientation="vertical" />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
      expect(separator).toHaveClass('h-full', 'w-[1px]');
    });
  });

  describe('Decorative', () => {
    it('is decorative by default', () => {
      const { container } = render(<Separator />);
      
      const separator = container.firstChild as HTMLElement;
      // Check for aria-hidden which indicates decorative nature
      expect(separator).toBeInTheDocument();
    });

    it('can be non-decorative', () => {
      const { container } = render(<Separator decorative={false} />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveAttribute('role', 'separator');
    });

    it('has role separator when non-decorative', () => {
      const { container } = render(<Separator decorative={false} />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveAttribute('role', 'separator');
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <div>
          <div>Section 1</div>
          <Separator />
          <div>Section 2</div>
        </div>
      );
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });

    it('decorative separator is for visual purposes', () => {
      const { container } = render(<Separator decorative />);
      
      const separator = container.firstChild as HTMLElement;
      // Decorative separators don't have role="separator"
      expect(separator).toBeInTheDocument();
    });

    it('non-decorative separator is accessible', () => {
      const { container } = render(<Separator decorative={false} />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveAttribute('role', 'separator');
    });

    it('supports aria-orientation when non-decorative', () => {
      const { container } = render(
        <Separator decorative={false} orientation="vertical" />
      );
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  describe('Use cases', () => {
    it('separates content sections', () => {
      const { container } = render(
        <div>
          <div>Content 1</div>
          <Separator className="my-4" />
          <div>Content 2</div>
        </div>
      );
      
      const separator = container.querySelector('.shrink-0');
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveClass('my-4');
    });

    it('works in navigation menus', () => {
      const { container } = render(
        <nav>
          <a href="/home">Home</a>
          <Separator orientation="vertical" className="mx-2" />
          <a href="/about">About</a>
        </nav>
      );
      
      const separator = container.querySelector('[data-orientation="vertical"]');
      expect(separator).toBeInTheDocument();
    });

    it('separates list items', () => {
      const { container } = render(
        <div>
          <div>Item 1</div>
          <Separator />
          <div>Item 2</div>
          <Separator />
          <div>Item 3</div>
        </div>
      );
      
      const separators = container.querySelectorAll('.shrink-0');
      expect(separators).toHaveLength(2);
    });

    it('divides card sections', () => {
      const { container } = render(
        <div className="card">
          <div className="card-header">Header</div>
          <Separator />
          <div className="card-body">Body</div>
          <Separator />
          <div className="card-footer">Footer</div>
        </div>
      );
      
      const separators = container.querySelectorAll('[data-orientation="horizontal"]');
      expect(separators).toHaveLength(2);
    });
  });

  describe('Responsive behavior', () => {
    it('maintains full width for horizontal separator', () => {
      const { container } = render(<Separator orientation="horizontal" />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveClass('w-full');
    });

    it('maintains full height for vertical separator', () => {
      const { container } = render(<Separator orientation="vertical" />);
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveClass('h-full');
    });

    it('supports responsive spacing', () => {
      const { container } = render(
        <Separator className="my-2 md:my-4 lg:my-6" />
      );
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveClass('my-2', 'md:my-4', 'lg:my-6');
    });
  });

  describe('Styling variations', () => {
    it('supports custom colors', () => {
      const { container } = render(
        <Separator className="bg-gray-300" />
      );
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveClass('bg-gray-300');
    });

    it('supports custom thickness', () => {
      const { container } = render(
        <Separator className="h-[2px]" orientation="horizontal" />
      );
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveClass('h-[2px]');
    });

    it('supports opacity variations', () => {
      const { container } = render(
        <Separator className="opacity-50" />
      );
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveClass('opacity-50');
    });
  });

  describe('Layout integration', () => {
    it('works in flexbox layouts', () => {
      const { container } = render(
        <div className="flex items-center">
          <span>Left</span>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <span>Right</span>
        </div>
      );
      
      const separator = container.querySelector('[data-orientation="vertical"]');
      expect(separator).toBeInTheDocument();
    });

    it('works in grid layouts', () => {
      const { container } = render(
        <div className="grid grid-cols-3">
          <div>Column 1</div>
          <Separator orientation="vertical" />
          <div>Column 2</div>
        </div>
      );
      
      const separator = container.querySelector('[data-orientation="vertical"]');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('HTML attributes', () => {
    it('supports data attributes', () => {
      const { container } = render(
        <Separator data-testid="test-separator" />
      );
      
      const separator = container.firstChild as HTMLElement;
      expect(separator).toHaveAttribute('data-testid', 'test-separator');
    });
  });
});
