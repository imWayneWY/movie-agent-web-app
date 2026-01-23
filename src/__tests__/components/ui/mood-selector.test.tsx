import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoodSelector, MoodSelectorSkeleton } from '@/components/ui/mood-selector';
import { MOODS } from '@/lib/constants';

describe('MoodSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('Rendering', () => {
    it('renders all mood options', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      MOODS.forEach((mood) => {
        expect(screen.getByRole('button', { name: new RegExp(mood.label) })).toBeInTheDocument();
      });
    });

    it('renders with correct testid', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      expect(screen.getByTestId('mood-selector')).toBeInTheDocument();
    });

    it('renders mood emojis', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      MOODS.forEach((mood) => {
        expect(screen.getByText(mood.emoji)).toBeInTheDocument();
      });
    });

    it('renders mood labels', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      MOODS.forEach((mood) => {
        expect(screen.getByText(mood.label)).toBeInTheDocument();
      });
    });

    it('renders as a grid layout', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      const container = screen.getByTestId('mood-selector');
      expect(container).toHaveClass('grid');
    });
  });

  describe('Selection State', () => {
    it('renders with no selection by default', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('renders with initial selected value', () => {
      render(<MoodSelector onSelect={mockOnSelect} selectedMood="happy" />);

      const happyButton = screen.getByRole('button', { name: /happy/i });
      expect(happyButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('applies selected styling to selected mood', () => {
      render(<MoodSelector onSelect={mockOnSelect} selectedMood="excited" />);

      const excitedButton = screen.getByRole('button', { name: /excited/i });
      expect(excitedButton).toHaveClass('ring-2');
    });

    it('does not apply selected styling to unselected moods', () => {
      render(<MoodSelector onSelect={mockOnSelect} selectedMood="happy" />);

      const excitedButton = screen.getByRole('button', { name: /excited/i });
      expect(excitedButton).not.toHaveClass('ring-2');
    });
  });

  describe('Selection Behavior', () => {
    it('calls onSelect with mood value when clicked', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} />);

      const happyButton = screen.getByRole('button', { name: /happy/i });
      await user.click(happyButton);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith('happy');
    });

    it('calls onSelect with correct value for each mood', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} />);

      const excitedButton = screen.getByRole('button', { name: /excited/i });
      await user.click(excitedButton);

      expect(mockOnSelect).toHaveBeenCalledWith('excited');
    });

    it('allows re-selecting the same mood', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} selectedMood="happy" />);

      const happyButton = screen.getByRole('button', { name: /happy/i });
      await user.click(happyButton);

      expect(mockOnSelect).toHaveBeenCalledWith('happy');
    });

    it('can select different moods consecutively', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole('button', { name: /happy/i }));
      await user.click(screen.getByRole('button', { name: /scared/i }));
      await user.click(screen.getByRole('button', { name: /excited/i }));

      expect(mockOnSelect).toHaveBeenCalledTimes(3);
      expect(mockOnSelect).toHaveBeenNthCalledWith(1, 'happy');
      expect(mockOnSelect).toHaveBeenNthCalledWith(2, 'scared');
      expect(mockOnSelect).toHaveBeenNthCalledWith(3, 'excited');
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows selection with Enter key', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} />);

      const happyButton = screen.getByRole('button', { name: /happy/i });
      happyButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalledWith('happy');
    });

    it('allows selection with Space key', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} />);

      const relaxedButton = screen.getByRole('button', { name: /relaxed/i });
      relaxedButton.focus();
      await user.keyboard(' ');

      expect(mockOnSelect).toHaveBeenCalledWith('relaxed');
    });

    it('supports Tab navigation between mood buttons', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} />);

      const firstButton = screen.getByRole('button', { name: /happy/i });
      firstButton.focus();

      await user.tab();
      const secondButton = screen.getByRole('button', { name: /excited/i });
      expect(secondButton).toHaveFocus();
    });

    it('supports Shift+Tab navigation', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} />);

      const secondButton = screen.getByRole('button', { name: /excited/i });
      secondButton.focus();

      await user.tab({ shift: true });
      const firstButton = screen.getByRole('button', { name: /happy/i });
      expect(firstButton).toHaveFocus();
    });

    it('maintains focus outline on keyboard interaction', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} />);

      const happyButton = screen.getByRole('button', { name: /happy/i });
      await user.tab();
      
      // The first focusable button should have focus-visible styles applied
      // This is handled by Tailwind's focus-visible: classes
      expect(happyButton).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has accessible role for the container', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('has aria-label on the container', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'Select your mood');
    });

    it('supports custom aria-label', () => {
      render(<MoodSelector onSelect={mockOnSelect} aria-label="Choose a mood" />);

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'Choose a mood');
    });

    it('each mood button has aria-pressed attribute', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('selected mood has aria-pressed="true"', () => {
      render(<MoodSelector onSelect={mockOnSelect} selectedMood="scared" />);

      const scaredButton = screen.getByRole('button', { name: /scared/i });
      expect(scaredButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('unselected moods have aria-pressed="false"', () => {
      render(<MoodSelector onSelect={mockOnSelect} selectedMood="scared" />);

      const happyButton = screen.getByRole('button', { name: /happy/i });
      expect(happyButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('each button has accessible name including emoji and label', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      MOODS.forEach((mood) => {
        const button = screen.getByRole('button', { name: new RegExp(mood.label) });
        expect(button).toBeInTheDocument();
      });
    });

    it('buttons are not disabled by default', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('supports disabled state', () => {
      render(<MoodSelector onSelect={mockOnSelect} disabled />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('does not call onSelect when disabled', async () => {
      const user = userEvent.setup();
      render(<MoodSelector onSelect={mockOnSelect} disabled />);

      const happyButton = screen.getByRole('button', { name: /happy/i });
      await user.click(happyButton);

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Grid Layout', () => {
    it('has responsive grid classes', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      const container = screen.getByTestId('mood-selector');
      // Should have responsive grid column classes
      expect(container).toHaveClass('grid-cols-2');
      expect(container).toHaveClass('sm:grid-cols-4');
      expect(container).toHaveClass('lg:grid-cols-8');
    });

    it('has appropriate gap between grid items', () => {
      render(<MoodSelector onSelect={mockOnSelect} />);

      const container = screen.getByTestId('mood-selector');
      expect(container).toHaveClass('gap-2');
    });
  });

  describe('Controlled Component', () => {
    it('updates selection when selectedMood prop changes', () => {
      const { rerender } = render(
        <MoodSelector onSelect={mockOnSelect} selectedMood="happy" />
      );

      expect(screen.getByRole('button', { name: /happy/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      );

      rerender(<MoodSelector onSelect={mockOnSelect} selectedMood="excited" />);

      expect(screen.getByRole('button', { name: /happy/i })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      expect(screen.getByRole('button', { name: /excited/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('clears selection when selectedMood becomes undefined', () => {
      const { rerender } = render(
        <MoodSelector onSelect={mockOnSelect} selectedMood="happy" />
      );

      rerender(<MoodSelector onSelect={mockOnSelect} selectedMood={undefined} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });
  });

  describe('Custom Styling', () => {
    it('accepts custom className', () => {
      render(
        <MoodSelector onSelect={mockOnSelect} className="custom-class" />
      );

      const container = screen.getByTestId('mood-selector');
      expect(container).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      render(
        <MoodSelector onSelect={mockOnSelect} className="mt-4" />
      );

      const container = screen.getByTestId('mood-selector');
      expect(container).toHaveClass('grid');
      expect(container).toHaveClass('mt-4');
    });
  });
});

describe('MoodSelectorSkeleton', () => {
  it('renders skeleton items for all moods', () => {
    render(<MoodSelectorSkeleton />);

    const skeletons = screen.getAllByTestId(/mood-skeleton-/);
    expect(skeletons).toHaveLength(MOODS.length);
  });

  it('has correct testid', () => {
    render(<MoodSelectorSkeleton />);

    expect(screen.getByTestId('mood-selector-skeleton')).toBeInTheDocument();
  });

  it('renders as a grid layout', () => {
    render(<MoodSelectorSkeleton />);

    const container = screen.getByTestId('mood-selector-skeleton');
    expect(container).toHaveClass('grid');
  });

  it('has responsive grid classes', () => {
    render(<MoodSelectorSkeleton />);

    const container = screen.getByTestId('mood-selector-skeleton');
    expect(container).toHaveClass('grid-cols-2');
    expect(container).toHaveClass('sm:grid-cols-4');
    expect(container).toHaveClass('lg:grid-cols-8');
  });

  it('accepts custom className', () => {
    render(<MoodSelectorSkeleton className="custom-skeleton-class" />);

    const container = screen.getByTestId('mood-selector-skeleton');
    expect(container).toHaveClass('custom-skeleton-class');
  });
});
