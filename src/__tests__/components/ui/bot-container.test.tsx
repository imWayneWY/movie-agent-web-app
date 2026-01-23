import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  BotContainer,
  BotContainerSkeleton,
} from '@/components/ui/bot-container';

// =============================================================================
// BOTCONTAINER TESTS
// =============================================================================

describe('BotContainer', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders the component with correct testid', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(screen.getByTestId('bot-container')).toBeInTheDocument();
    });

    it('renders with a form element', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('renders the title', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(
        screen.getByRole('heading', { name: /how are you feeling/i })
      ).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(
        screen.getByText(/select your mood.*personalized movie/i)
      ).toBeInTheDocument();
    });

    it('renders the MoodSelector component', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(screen.getByTestId('mood-selector')).toBeInTheDocument();
    });

    it('renders the AdvancedFilters component', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(screen.getByTestId('advanced-filters')).toBeInTheDocument();
    });

    it('renders the submit button', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(
        screen.getByRole('button', { name: /get recommendations/i })
      ).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(
        <BotContainer onSubmit={mockOnSubmit} className="custom-class" />
      );

      expect(screen.getByTestId('bot-container')).toHaveClass('custom-class');
    });

    it('renders the form with accessible name', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(
        screen.getByRole('form', { name: /movie recommendation/i })
      ).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // MOOD SELECTION TESTS
  // ===========================================================================

  describe('Mood Selection', () => {
    it('has no mood selected by default', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      const moodSelector = screen.getByTestId('mood-selector');
      const buttons = within(moodSelector).getAllByRole('button');

      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('selects a mood when clicked', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} />);

      const happyButton = screen.getByRole('button', { name: /happy/i });
      await user.click(happyButton);

      expect(happyButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('changes mood selection when different mood is clicked', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} />);

      const happyButton = screen.getByRole('button', { name: /happy/i });
      const excitedButton = screen.getByRole('button', { name: /excited/i });

      await user.click(happyButton);
      expect(happyButton).toHaveAttribute('aria-pressed', 'true');

      await user.click(excitedButton);
      expect(excitedButton).toHaveAttribute('aria-pressed', 'true');
      expect(happyButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('supports initial mood value', () => {
      render(
        <BotContainer onSubmit={mockOnSubmit} initialMood="excited" />
      );

      const excitedButton = screen.getByRole('button', { name: /excited/i });
      expect(excitedButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // ===========================================================================
  // ADVANCED FILTERS INTEGRATION TESTS
  // ===========================================================================

  describe('Advanced Filters Integration', () => {
    it('starts with filters collapsed by default', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(screen.queryByTestId('filters-content')).not.toBeInTheDocument();
    });

    it('expands filters when clicked', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} />);

      const filtersTrigger = screen.getByRole('button', {
        name: /advanced filters/i,
      });
      await user.click(filtersTrigger);

      expect(screen.getByTestId('filters-content')).toBeInTheDocument();
    });

    it('supports defaultFiltersExpanded prop', () => {
      render(
        <BotContainer onSubmit={mockOnSubmit} defaultFiltersExpanded />
      );

      expect(screen.getByTestId('filters-content')).toBeInTheDocument();
    });

    it('allows genre selection', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} defaultFiltersExpanded />);

      const actionCheckbox = screen.getByRole('checkbox', { name: /action/i });
      await user.click(actionCheckbox);

      expect(actionCheckbox).toBeChecked();
    });

    it('allows multiple genre selection', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} defaultFiltersExpanded />);

      const actionCheckbox = screen.getByRole('checkbox', { name: /action/i });
      const comedyCheckbox = screen.getByRole('checkbox', { name: /comedy/i });

      await user.click(actionCheckbox);
      await user.click(comedyCheckbox);

      expect(actionCheckbox).toBeChecked();
      expect(comedyCheckbox).toBeChecked();
    });

    it('allows platform selection', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} defaultFiltersExpanded />);

      const netflixCheckbox = screen.getByRole('checkbox', { name: /netflix/i });
      await user.click(netflixCheckbox);

      expect(netflixCheckbox).toBeChecked();
    });

    it('supports initial filter values', () => {
      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          defaultFiltersExpanded
          initialGenres={['Action', 'Comedy']}
          initialPlatforms={['netflix']}
        />
      );

      expect(screen.getByRole('checkbox', { name: /action/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /comedy/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /netflix/i })).toBeChecked();
    });
  });

  // ===========================================================================
  // FORM SUBMISSION TESTS
  // ===========================================================================

  describe('Form Submission', () => {
    it('submits form with selected mood', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole('button', { name: /happy/i }));
      await user.click(screen.getByRole('button', { name: /get recommendations/i }));

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          mood: 'happy',
        })
      );
    });

    it('submits form with selected genres', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} defaultFiltersExpanded />);

      await user.click(screen.getByRole('button', { name: /happy/i }));
      await user.click(screen.getByRole('checkbox', { name: /action/i }));
      await user.click(screen.getByRole('checkbox', { name: /comedy/i }));
      await user.click(screen.getByRole('button', { name: /get recommendations/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          genres: expect.arrayContaining(['Action', 'Comedy']),
        })
      );
    });

    it('submits form with selected platforms', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} defaultFiltersExpanded />);

      await user.click(screen.getByRole('button', { name: /happy/i }));
      await user.click(screen.getByRole('checkbox', { name: /netflix/i }));
      await user.click(screen.getByRole('button', { name: /get recommendations/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          platforms: ['netflix'],
        })
      );
    });

    it('submits form with all filter values', async () => {
      const user = userEvent.setup();
      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          defaultFiltersExpanded
          initialMood="excited"
          initialGenres={['Drama']}
          initialPlatforms={['prime']}
          initialRuntimeRange={{ min: 90, max: 150 }}
          initialYearRange={{ from: 2010, to: 2023 }}
        />
      );

      await user.click(screen.getByRole('button', { name: /get recommendations/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        mood: 'excited',
        genres: ['Drama'],
        platforms: ['prime'],
        runtime: { min: 90, max: 150 },
        releaseYear: { from: 2010, to: 2023 },
      });
    });

    it('prevents default form submission behavior', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole('button', { name: /happy/i }));

      const form = screen.getByRole('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      form.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // FORM VALIDATION TESTS
  // ===========================================================================

  describe('Form Validation', () => {
    it('disables submit button when no mood is selected', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', {
        name: /get recommendations/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when mood is selected', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole('button', { name: /happy/i }));

      const submitButton = screen.getByRole('button', {
        name: /get recommendations/i,
      });
      expect(submitButton).toBeEnabled();
    });

    it('does not submit when mood is not selected', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', {
        name: /get recommendations/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows validation message when showValidation is true and no mood selected', async () => {
      render(<BotContainer onSubmit={mockOnSubmit} showValidation />);

      // Validation message should appear when showValidation is true and no mood is selected
      expect(screen.getByText(/please select a mood/i)).toBeInTheDocument();
    });

    it('hides validation message when mood is selected', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} showValidation />);

      // Initially shows validation message
      expect(screen.getByText(/please select a mood/i)).toBeInTheDocument();

      // Select a mood
      await user.click(screen.getByRole('button', { name: /happy/i }));

      // Validation message should be hidden
      expect(screen.queryByText(/please select a mood/i)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('Loading State', () => {
    it('shows loading state when isLoading is true', () => {
      render(<BotContainer onSubmit={mockOnSubmit} isLoading />);

      const submitButton = screen.getByRole('button', {
        name: /loading|searching/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('disables mood selector when loading', () => {
      render(<BotContainer onSubmit={mockOnSubmit} isLoading initialMood="happy" />);

      const moodSelector = screen.getByTestId('mood-selector');
      const buttons = within(moodSelector).getAllByRole('button');

      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('disables filters when loading', () => {
      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          isLoading
          defaultFiltersExpanded
          initialMood="happy"
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('shows spinner icon in submit button when loading', () => {
      render(<BotContainer onSubmit={mockOnSubmit} isLoading initialMood="happy" />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // DISABLED STATE TESTS
  // ===========================================================================

  describe('Disabled State', () => {
    it('disables all interactions when disabled', () => {
      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          disabled
          defaultFiltersExpanded
          initialMood="happy"
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /get recommendations/i,
      });
      expect(submitButton).toBeDisabled();

      const moodSelector = screen.getByTestId('mood-selector');
      const moodButtons = within(moodSelector).getAllByRole('button');
      moodButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('does not submit when disabled', async () => {
      const user = userEvent.setup();
      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          disabled
          initialMood="happy"
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /get recommendations/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // RESET FUNCTIONALITY TESTS
  // ===========================================================================

  describe('Reset Functionality', () => {
    it('renders reset button when showReset is true', () => {
      render(<BotContainer onSubmit={mockOnSubmit} showReset />);

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('does not render reset button by default', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(
        screen.queryByRole('button', { name: /reset/i })
      ).not.toBeInTheDocument();
    });

    it('clears all selections when reset is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          showReset
          defaultFiltersExpanded
          initialMood="happy"
          initialGenres={['Action']}
        />
      );

      // Verify initial state
      expect(
        screen.getByRole('button', { name: /happy/i })
      ).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('checkbox', { name: /action/i })).toBeChecked();

      // Click reset
      await user.click(screen.getByRole('button', { name: /reset/i }));

      // Verify reset state
      expect(
        screen.getByRole('button', { name: /happy/i })
      ).toHaveAttribute('aria-pressed', 'false');
      expect(
        screen.getByRole('checkbox', { name: /action/i })
      ).not.toBeChecked();
    });

    it('calls onReset callback when provided', async () => {
      const mockOnReset = jest.fn();
      const user = userEvent.setup();
      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          showReset
          onReset={mockOnReset}
          initialMood="happy"
        />
      );

      await user.click(screen.getByRole('button', { name: /reset/i }));

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible form with aria-label', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('form')).toHaveAttribute('aria-label');
    });

    it('has proper heading hierarchy', () => {
      render(<BotContainer onSubmit={mockOnSubmit} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} />);

      // Tab to first mood button
      await user.tab();
      expect(document.activeElement).toHaveAttribute('type', 'button');
    });

    it('allows form submission via Enter key', async () => {
      const user = userEvent.setup();
      render(<BotContainer onSubmit={mockOnSubmit} initialMood="happy" />);

      const submitButton = screen.getByRole('button', {
        name: /get recommendations/i,
      });
      submitButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('announces loading state to screen readers', () => {
      render(<BotContainer onSubmit={mockOnSubmit} isLoading initialMood="happy" />);

      const submitButton = screen.getByRole('button', {
        name: /loading|searching/i,
      });
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  // ===========================================================================
  // CONTROLLED MODE TESTS
  // ===========================================================================

  describe('Controlled Mode', () => {
    it('supports controlled mood value', () => {
      const { rerender } = render(
        <BotContainer onSubmit={mockOnSubmit} mood="happy" onMoodChange={() => {}} />
      );

      expect(
        screen.getByRole('button', { name: /happy/i })
      ).toHaveAttribute('aria-pressed', 'true');

      rerender(
        <BotContainer onSubmit={mockOnSubmit} mood="excited" onMoodChange={() => {}} />
      );

      expect(
        screen.getByRole('button', { name: /excited/i })
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByRole('button', { name: /happy/i })
      ).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls onMoodChange in controlled mode', async () => {
      const mockOnMoodChange = jest.fn();
      const user = userEvent.setup();

      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          mood="happy"
          onMoodChange={mockOnMoodChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /scared/i }));

      expect(mockOnMoodChange).toHaveBeenCalledWith('scared');
    });
  });

  // ===========================================================================
  // STATE CHANGE CALLBACK TESTS
  // ===========================================================================

  describe('State Change Callbacks', () => {
    it('calls onGenresChange when genres change', async () => {
      const mockOnGenresChange = jest.fn();
      const user = userEvent.setup();

      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          defaultFiltersExpanded
          onGenresChange={mockOnGenresChange}
        />
      );

      await user.click(screen.getByRole('checkbox', { name: /action/i }));

      expect(mockOnGenresChange).toHaveBeenCalledWith(['Action']);
    });

    it('calls onPlatformsChange when platforms change', async () => {
      const mockOnPlatformsChange = jest.fn();
      const user = userEvent.setup();

      render(
        <BotContainer
          onSubmit={mockOnSubmit}
          defaultFiltersExpanded
          onPlatformsChange={mockOnPlatformsChange}
        />
      );

      await user.click(screen.getByRole('checkbox', { name: /netflix/i }));

      expect(mockOnPlatformsChange).toHaveBeenCalledWith(['netflix']);
    });
  });
});

// =============================================================================
// BOTCONTAINERSKELETON TESTS
// =============================================================================

describe('BotContainerSkeleton', () => {
  it('renders skeleton with correct testid', () => {
    render(<BotContainerSkeleton />);

    expect(screen.getByTestId('bot-container-skeleton')).toBeInTheDocument();
  });

  it('renders title skeleton', () => {
    render(<BotContainerSkeleton />);

    const container = screen.getByTestId('bot-container-skeleton');
    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders mood selector skeleton placeholder', () => {
    render(<BotContainerSkeleton />);

    // Should have grid of skeleton mood buttons
    const container = screen.getByTestId('bot-container-skeleton');
    expect(container).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<BotContainerSkeleton className="custom-skeleton" />);

    expect(screen.getByTestId('bot-container-skeleton')).toHaveClass(
      'custom-skeleton'
    );
  });

  it('has accessible label for screen readers', () => {
    render(<BotContainerSkeleton />);

    expect(screen.getByTestId('bot-container-skeleton')).toHaveAttribute(
      'aria-label',
      'Loading movie recommendation form'
    );
  });

  it('indicates busy state for screen readers', () => {
    render(<BotContainerSkeleton />);

    expect(screen.getByTestId('bot-container-skeleton')).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });
});
