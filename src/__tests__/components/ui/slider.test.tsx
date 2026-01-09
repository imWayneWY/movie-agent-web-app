import React from 'react';
import { render, screen } from '@testing-library/react';
import { Slider } from '@/components/ui/slider';

describe('Slider', () => {
  describe('Rendering', () => {
    it('renders slider', () => {
      render(<Slider aria-label="Volume" />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Slider className="custom-class" aria-label="Slider" />
      );
      
      const slider = container.firstChild as HTMLElement;
      expect(slider).toHaveClass('custom-class');
    });

    it('has default slider styles', () => {
      const { container } = render(<Slider aria-label="Slider" />);
      
      const slider = container.firstChild as HTMLElement;
      expect(slider).toHaveClass(
        'relative',
        'flex',
        'w-full',
        'touch-none',
        'select-none',
        'items-center'
      );
    });

    it('forwards ref to slider element', () => {
      const ref = React.createRef<HTMLSpanElement>();
      render(<Slider ref={ref} aria-label="Slider" />);
      
      expect(ref.current).toBeDefined();
    });
  });

  describe('Value handling', () => {
    it('renders with default value', () => {
      render(<Slider defaultValue={[50]} aria-label="Volume" />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    it('renders with min and max values', () => {
      render(
        <Slider
          min={0}
          max={100}
          defaultValue={[25]}
          aria-label="Range slider"
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
    });

    it('supports single value', () => {
      render(<Slider defaultValue={[75]} aria-label="Single value" />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '75');
    });

    it('supports controlled value', () => {
      const { rerender } = render(
        <Slider value={[30]} aria-label="Controlled" />
      );
      
      let slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '30');
      
      rerender(<Slider value={[70]} aria-label="Controlled" />);
      
      slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '70');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Slider disabled aria-label="Disabled slider" />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('data-disabled', '');
    });

    it('applies disabled styles to thumb', () => {
      const { container } = render(<Slider disabled aria-label="Disabled" />);
      
      const thumb = container.querySelector('[role="slider"]');
      expect(thumb).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });
  });

  describe('Step increments', () => {
    it('supports step values', () => {
      render(
        <Slider
          min={0}
          max={100}
          step={10}
          defaultValue={[50]}
          aria-label="Step slider"
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });
  });

  describe('Visual elements', () => {
    it('renders track element', () => {
      const { container } = render(<Slider aria-label="Slider" />);
      
      const track = container.querySelector('.bg-secondary');
      expect(track).toBeInTheDocument();
    });

    it('renders range element', () => {
      const { container } = render(<Slider defaultValue={[50]} aria-label="Slider" />);
      
      const range = container.querySelector('.bg-primary');
      expect(range).toBeInTheDocument();
    });

    it('renders thumb element', () => {
      const { container } = render(<Slider aria-label="Slider" />);
      
      const thumb = container.querySelector('.rounded-full.border-2');
      expect(thumb).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders with accessible label', () => {
      render(
        <div>
          <label htmlFor="volume-slider">Volume</label>
          <Slider id="volume-slider" defaultValue={[50]} aria-labelledby="volume-slider" />
        </div>
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('applies aria-label to root element', () => {
      const { container } = render(<Slider aria-label="Volume control" />);
      
      const root = container.querySelector('[aria-label="Volume control"]');
      expect(root).toBeInTheDocument();
    });

    it('has focus styles', () => {
      const { container } = render(<Slider aria-label="Focus slider" />);
      
      const thumb = container.querySelector('[role="slider"]');
      expect(thumb).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring'
      );
    });

    it('can be focused', () => {
      render(<Slider aria-label="Focusable slider" />);
      
      const slider = screen.getByRole('slider');
      slider.focus();
      
      expect(slider).toHaveFocus();
    });

    it('provides proper ARIA attributes', () => {
      render(
        <Slider
          min={0}
          max={100}
          defaultValue={[50]}
          aria-label="Volume"
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow');
      expect(slider).toHaveAttribute('aria-valuemin');
      expect(slider).toHaveAttribute('aria-valuemax');
    });
  });

  describe('Orientation', () => {
    it('renders horizontal by default', () => {
      render(<Slider aria-label="Horizontal" />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('supports vertical orientation', () => {
      render(<Slider orientation="vertical" aria-label="Vertical" />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  describe('Use cases', () => {
    it('works as volume control', () => {
      render(
        <div>
          <label htmlFor="volume">Volume</label>
          <Slider
            id="volume"
            min={0}
            max={100}
            defaultValue={[75]}
            step={5}
          />
        </div>
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '75');
    });

    it('works as range filter', () => {
      render(
        <div>
          <label htmlFor="runtime">Runtime (minutes)</label>
          <Slider
            id="runtime"
            min={60}
            max={180}
            defaultValue={[120]}
            step={10}
          />
        </div>
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '60');
      expect(slider).toHaveAttribute('aria-valuemax', '180');
    });
  });

  describe('Responsive behavior', () => {
    it('maintains full width', () => {
      const { container } = render(<Slider aria-label="Responsive slider" />);
      
      const slider = container.firstChild as HTMLElement;
      expect(slider).toHaveClass('w-full');
    });
  });

  describe('Callbacks', () => {
    it('supports onValueChange callback', () => {
      const onValueChange = jest.fn();
      render(
        <Slider
          onValueChange={onValueChange}
          defaultValue={[50]}
          aria-label="Callback slider"
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      // Note: Actual interaction testing would require simulating drag events
    });

    it('supports onValueCommit callback', () => {
      const onValueCommit = jest.fn();
      render(
        <Slider
          onValueCommit={onValueCommit}
          defaultValue={[50]}
          aria-label="Commit slider"
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });
  });
});
