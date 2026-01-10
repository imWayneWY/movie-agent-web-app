import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  AdvancedFilters,
  AdvancedFiltersSkeleton,
} from '@/components/ui/advanced-filters';
import { GENRES, PLATFORMS, RUNTIME, YEAR } from '@/lib/constants';
import type { GenreValue, PlatformId } from '@/types';

expect.extend(toHaveNoViolations);

describe('AdvancedFilters', () => {
  // Default mock handlers
  const defaultProps = {
    selectedGenres: [] as GenreValue[],
    selectedPlatforms: [] as PlatformId[],
    runtimeRange: { min: RUNTIME.DEFAULT_MIN, max: RUNTIME.DEFAULT_MAX },
    yearRange: { from: YEAR.DEFAULT_FROM, to: YEAR.DEFAULT_TO },
    onGenresChange: jest.fn(),
    onPlatformsChange: jest.fn(),
    onRuntimeChange: jest.fn(),
    onYearChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders the component with testid', () => {
      render(<AdvancedFilters {...defaultProps} />);

      expect(screen.getByTestId('advanced-filters')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<AdvancedFilters {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('advanced-filters')).toHaveClass('custom-class');
    });

    it('renders the collapsible trigger button', () => {
      render(<AdvancedFilters {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /advanced filters/i })
      ).toBeInTheDocument();
    });

    it('renders collapsed by default', () => {
      render(<AdvancedFilters {...defaultProps} />);

      // Content should not be visible initially
      expect(screen.queryByTestId('filters-content')).not.toBeInTheDocument();
    });

    it('renders expanded when defaultExpanded is true', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByTestId('filters-content')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // COLLAPSIBLE ACCORDION TESTS
  // ==========================================================================

  describe('Collapsible Accordion', () => {
    it('expands when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<AdvancedFilters {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /advanced filters/i });
      await user.click(trigger);

      expect(screen.getByTestId('filters-content')).toBeInTheDocument();
    });

    it('collapses when trigger is clicked again', async () => {
      const user = userEvent.setup();
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const trigger = screen.getByRole('button', { name: /advanced filters/i });
      await user.click(trigger);

      expect(screen.queryByTestId('filters-content')).not.toBeInTheDocument();
    });

    it('shows chevron icon that rotates on expand', async () => {
      const user = userEvent.setup();
      render(<AdvancedFilters {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /advanced filters/i });
      const chevron = within(trigger).getByTestId('chevron-icon');

      expect(chevron).toBeInTheDocument();

      await user.click(trigger);

      // After expansion, chevron should have rotate class
      expect(chevron).toHaveClass('rotate-180');
    });

    it('toggle can be controlled with keyboard', async () => {
      const user = userEvent.setup();
      render(<AdvancedFilters {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /advanced filters/i });
      trigger.focus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('filters-content')).toBeInTheDocument();

      await user.keyboard('{Enter}');
      expect(screen.queryByTestId('filters-content')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // GENRE MULTI-SELECT TESTS
  // ==========================================================================

  describe('Genre Multi-select', () => {
    it('renders all genre options', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const genreSection = screen.getByTestId('genre-section');
      GENRES.forEach((genre) => {
        expect(within(genreSection).getByLabelText(genre)).toBeInTheDocument();
      });
    });

    it('renders genre section heading', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByText('Genres')).toBeInTheDocument();
    });

    it('shows no genres selected by default', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const genreSection = screen.getByTestId('genre-section');
      const checkboxes = within(genreSection).getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('shows selected genres as checked', () => {
      render(
        <AdvancedFilters
          {...defaultProps}
          selectedGenres={['Action', 'Comedy']}
          defaultExpanded
        />
      );

      expect(screen.getByLabelText('Action')).toBeChecked();
      expect(screen.getByLabelText('Comedy')).toBeChecked();
      expect(screen.getByLabelText('Drama')).not.toBeChecked();
    });

    it('calls onGenresChange when genre is selected', async () => {
      const user = userEvent.setup();
      const onGenresChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          onGenresChange={onGenresChange}
          defaultExpanded
        />
      );

      await user.click(screen.getByLabelText('Action'));

      expect(onGenresChange).toHaveBeenCalledWith(['Action']);
    });

    it('adds genre to existing selection', async () => {
      const user = userEvent.setup();
      const onGenresChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          selectedGenres={['Action']}
          onGenresChange={onGenresChange}
          defaultExpanded
        />
      );

      await user.click(screen.getByLabelText('Comedy'));

      expect(onGenresChange).toHaveBeenCalledWith(['Action', 'Comedy']);
    });

    it('removes genre from selection when unchecked', async () => {
      const user = userEvent.setup();
      const onGenresChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          selectedGenres={['Action', 'Comedy']}
          onGenresChange={onGenresChange}
          defaultExpanded
        />
      );

      await user.click(screen.getByLabelText('Action'));

      expect(onGenresChange).toHaveBeenCalledWith(['Comedy']);
    });

    it('allows keyboard selection with Space', async () => {
      const user = userEvent.setup();
      const onGenresChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          onGenresChange={onGenresChange}
          defaultExpanded
        />
      );

      const actionCheckbox = screen.getByLabelText('Action');
      actionCheckbox.focus();
      await user.keyboard(' ');

      expect(onGenresChange).toHaveBeenCalledWith(['Action']);
    });

    it('supports Tab navigation between genre checkboxes', async () => {
      const user = userEvent.setup();
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const actionCheckbox = screen.getByLabelText('Action');
      actionCheckbox.focus();

      await user.tab();
      expect(screen.getByLabelText('Adventure')).toHaveFocus();
    });
  });

  // ==========================================================================
  // PLATFORM CHECKBOXES TESTS
  // ==========================================================================

  describe('Platform Checkboxes', () => {
    it('renders all platform options', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const platformSection = screen.getByTestId('platform-section');
      PLATFORMS.forEach((platform) => {
        expect(
          within(platformSection).getByLabelText(platform.name)
        ).toBeInTheDocument();
      });
    });

    it('renders platform section heading', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByText('Streaming Platforms')).toBeInTheDocument();
    });

    it('shows no platforms selected by default', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const platformSection = screen.getByTestId('platform-section');
      const checkboxes = within(platformSection).getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('shows selected platforms as checked', () => {
      render(
        <AdvancedFilters
          {...defaultProps}
          selectedPlatforms={['netflix', 'disney']}
          defaultExpanded
        />
      );

      expect(screen.getByLabelText('Netflix')).toBeChecked();
      expect(screen.getByLabelText('Disney+')).toBeChecked();
      expect(screen.getByLabelText('Prime Video')).not.toBeChecked();
    });

    it('calls onPlatformsChange when platform is selected', async () => {
      const user = userEvent.setup();
      const onPlatformsChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          onPlatformsChange={onPlatformsChange}
          defaultExpanded
        />
      );

      await user.click(screen.getByLabelText('Netflix'));

      expect(onPlatformsChange).toHaveBeenCalledWith(['netflix']);
    });

    it('adds platform to existing selection', async () => {
      const user = userEvent.setup();
      const onPlatformsChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          selectedPlatforms={['netflix']}
          onPlatformsChange={onPlatformsChange}
          defaultExpanded
        />
      );

      await user.click(screen.getByLabelText('Disney+'));

      expect(onPlatformsChange).toHaveBeenCalledWith(['netflix', 'disney']);
    });

    it('removes platform from selection when unchecked', async () => {
      const user = userEvent.setup();
      const onPlatformsChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          selectedPlatforms={['netflix', 'disney']}
          onPlatformsChange={onPlatformsChange}
          defaultExpanded
        />
      );

      await user.click(screen.getByLabelText('Netflix'));

      expect(onPlatformsChange).toHaveBeenCalledWith(['disney']);
    });

    it('displays platform logos', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      PLATFORMS.forEach((platform) => {
        const logo = screen.getByAltText(`${platform.name} logo`);
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', platform.logo);
      });
    });
  });

  // ==========================================================================
  // RUNTIME SLIDER TESTS
  // ==========================================================================

  describe('Runtime Slider', () => {
    it('renders runtime section heading', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByText('Runtime')).toBeInTheDocument();
    });

    it('renders the runtime slider', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByTestId('runtime-slider')).toBeInTheDocument();
    });

    it('displays current runtime range values', () => {
      render(
        <AdvancedFilters
          {...defaultProps}
          runtimeRange={{ min: 90, max: 150 }}
          defaultExpanded
        />
      );

      expect(screen.getByText('90 min')).toBeInTheDocument();
      expect(screen.getByText('150 min')).toBeInTheDocument();
    });

    it('displays default runtime range values', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByText(`${RUNTIME.DEFAULT_MIN} min`)).toBeInTheDocument();
      expect(screen.getByText(`${RUNTIME.DEFAULT_MAX} min`)).toBeInTheDocument();
    });

    it('displays special text for max runtime', () => {
      render(
        <AdvancedFilters
          {...defaultProps}
          runtimeRange={{ min: 60, max: RUNTIME.MAX }}
          defaultExpanded
        />
      );

      expect(screen.getByText('300+ min')).toBeInTheDocument();
    });

    it('calls onRuntimeChange when slider value changes', async () => {
      const user = userEvent.setup();
      const onRuntimeChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          onRuntimeChange={onRuntimeChange}
          defaultExpanded
        />
      );

      // Get the slider and simulate a change
      const slider = screen.getByTestId('runtime-slider');
      const sliderRoot = slider.querySelector('[role="slider"]');

      // Use keyboard to change value
      if (sliderRoot) {
        (sliderRoot as HTMLElement).focus();
        await user.keyboard('{ArrowRight}');
      }

      expect(onRuntimeChange).toHaveBeenCalled();
    });

    it('has proper aria labels for accessibility', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const slider = screen.getByTestId('runtime-slider');
      expect(slider).toHaveAttribute('aria-label', 'Runtime range');
    });
  });

  // ==========================================================================
  // YEAR RANGE INPUTS TESTS
  // ==========================================================================

  describe('Year Range Inputs', () => {
    it('renders year section heading', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByText('Release Year')).toBeInTheDocument();
    });

    it('renders from and to year inputs', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByLabelText('From year')).toBeInTheDocument();
      expect(screen.getByLabelText('To year')).toBeInTheDocument();
    });

    it('displays current year range values', () => {
      render(
        <AdvancedFilters
          {...defaultProps}
          yearRange={{ from: 2010, to: 2023 }}
          defaultExpanded
        />
      );

      expect(screen.getByLabelText('From year')).toHaveValue(2010);
      expect(screen.getByLabelText('To year')).toHaveValue(2023);
    });

    it('displays default year range values', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByLabelText('From year')).toHaveValue(YEAR.DEFAULT_FROM);
      expect(screen.getByLabelText('To year')).toHaveValue(YEAR.DEFAULT_TO);
    });

    it('calls onYearChange when from year is changed', async () => {
      const onYearChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          onYearChange={onYearChange}
          defaultExpanded
        />
      );

      const fromInput = screen.getByLabelText('From year');
      fireEvent.change(fromInput, { target: { value: '2015' } });

      expect(onYearChange).toHaveBeenCalledWith({ from: 2015, to: YEAR.DEFAULT_TO });
    });

    it('calls onYearChange when to year is changed', async () => {
      const onYearChange = jest.fn();
      render(
        <AdvancedFilters
          {...defaultProps}
          onYearChange={onYearChange}
          defaultExpanded
        />
      );

      const toInput = screen.getByLabelText('To year');
      fireEvent.change(toInput, { target: { value: '2022' } });

      expect(onYearChange).toHaveBeenCalledWith({ from: YEAR.DEFAULT_FROM, to: 2022 });
    });

    it('enforces minimum year constraint', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const fromInput = screen.getByLabelText('From year');
      expect(fromInput).toHaveAttribute('min', String(YEAR.MIN));
    });

    it('enforces maximum year constraint', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const toInput = screen.getByLabelText('To year');
      expect(toInput).toHaveAttribute('max', String(YEAR.MAX));
    });

    it('has proper input types for year fields', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      expect(screen.getByLabelText('From year')).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText('To year')).toHaveAttribute('type', 'number');
    });
  });

  // ==========================================================================
  // FORM STATE MANAGEMENT TESTS
  // ==========================================================================

  describe('Form State Management', () => {
    it('maintains independent state for each filter', async () => {
      const user = userEvent.setup();
      const onGenresChange = jest.fn();
      const onPlatformsChange = jest.fn();

      render(
        <AdvancedFilters
          {...defaultProps}
          onGenresChange={onGenresChange}
          onPlatformsChange={onPlatformsChange}
          defaultExpanded
        />
      );

      await user.click(screen.getByLabelText('Action'));
      await user.click(screen.getByLabelText('Netflix'));

      expect(onGenresChange).toHaveBeenCalledWith(['Action']);
      expect(onPlatformsChange).toHaveBeenCalledWith(['netflix']);
    });

    it('preserves filter state when accordion is toggled', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedFilters
          {...defaultProps}
          selectedGenres={['Action', 'Comedy']}
          selectedPlatforms={['netflix']}
          defaultExpanded
        />
      );

      // Collapse
      await user.click(screen.getByRole('button', { name: /advanced filters/i }));

      // Expand again
      await user.click(screen.getByRole('button', { name: /advanced filters/i }));

      // State should be preserved
      expect(screen.getByLabelText('Action')).toBeChecked();
      expect(screen.getByLabelText('Comedy')).toBeChecked();
      expect(screen.getByLabelText('Netflix')).toBeChecked();
    });

    it('updates when props change externally', () => {
      const { rerender } = render(
        <AdvancedFilters {...defaultProps} selectedGenres={[]} defaultExpanded />
      );

      expect(screen.getByLabelText('Action')).not.toBeChecked();

      rerender(
        <AdvancedFilters
          {...defaultProps}
          selectedGenres={['Action']}
          defaultExpanded
        />
      );

      expect(screen.getByLabelText('Action')).toBeChecked();
    });

    it('handles empty selections gracefully', () => {
      render(
        <AdvancedFilters
          {...defaultProps}
          selectedGenres={[]}
          selectedPlatforms={[]}
          defaultExpanded
        />
      );

      // All checkboxes should be unchecked
      const genreSection = screen.getByTestId('genre-section');
      const platformSection = screen.getByTestId('platform-section');

      within(genreSection)
        .getAllByRole('checkbox')
        .forEach((cb) => expect(cb).not.toBeChecked());
      within(platformSection)
        .getAllByRole('checkbox')
        .forEach((cb) => expect(cb).not.toBeChecked());
    });
  });

  // ==========================================================================
  // DISABLED STATE TESTS
  // ==========================================================================

  describe('Disabled State', () => {
    it('disables all inputs when disabled prop is true', () => {
      render(<AdvancedFilters {...defaultProps} disabled defaultExpanded />);

      // Genre checkboxes
      const genreSection = screen.getByTestId('genre-section');
      within(genreSection)
        .getAllByRole('checkbox')
        .forEach((cb) => expect(cb).toBeDisabled());

      // Platform checkboxes
      const platformSection = screen.getByTestId('platform-section');
      within(platformSection)
        .getAllByRole('checkbox')
        .forEach((cb) => expect(cb).toBeDisabled());

      // Year inputs
      expect(screen.getByLabelText('From year')).toBeDisabled();
      expect(screen.getByLabelText('To year')).toBeDisabled();
    });

    it('does not call handlers when disabled', async () => {
      const user = userEvent.setup();
      const onGenresChange = jest.fn();

      render(
        <AdvancedFilters
          {...defaultProps}
          onGenresChange={onGenresChange}
          disabled
          defaultExpanded
        />
      );

      // Attempt to click - should not trigger handler
      const actionCheckbox = screen.getByLabelText('Action');
      await user.click(actionCheckbox);

      expect(onGenresChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('has no accessibility violations when collapsed', async () => {
      const { container } = render(<AdvancedFilters {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when expanded', async () => {
      const { container } = render(
        <AdvancedFilters {...defaultProps} defaultExpanded />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper heading structure', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      // Section headings should exist
      expect(screen.getByText('Genres')).toBeInTheDocument();
      expect(screen.getByText('Streaming Platforms')).toBeInTheDocument();
      expect(screen.getByText('Runtime')).toBeInTheDocument();
      expect(screen.getByText('Release Year')).toBeInTheDocument();
    });

    it('has proper labels for all form controls', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      // All genre checkboxes have labels
      GENRES.forEach((genre) => {
        const checkbox = screen.getByLabelText(genre);
        expect(checkbox).toHaveAccessibleName(genre);
      });

      // All platform checkboxes have labels
      PLATFORMS.forEach((platform) => {
        const checkbox = screen.getByLabelText(platform.name);
        expect(checkbox).toHaveAccessibleName(platform.name);
      });

      // Year inputs have labels
      expect(screen.getByLabelText('From year')).toHaveAccessibleName('From year');
      expect(screen.getByLabelText('To year')).toHaveAccessibleName('To year');
    });

    it('trigger button has appropriate aria attributes', () => {
      render(<AdvancedFilters {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /advanced filters/i });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('trigger button updates aria-expanded when toggled', async () => {
      const user = userEvent.setup();
      render(<AdvancedFilters {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /advanced filters/i });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ==========================================================================
  // RESPONSIVE LAYOUT TESTS
  // ==========================================================================

  describe('Responsive Layout', () => {
    it('renders genre grid with responsive classes', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const genreSection = screen.getByTestId('genre-section');
      const genreGrid = genreSection.querySelector('[class*="grid"]');
      expect(genreGrid).toBeInTheDocument();
    });

    it('renders platform grid with responsive classes', () => {
      render(<AdvancedFilters {...defaultProps} defaultExpanded />);

      const platformSection = screen.getByTestId('platform-section');
      const platformGrid = platformSection.querySelector('[class*="grid"]');
      expect(platformGrid).toBeInTheDocument();
    });
  });
});

// =============================================================================
// SKELETON TESTS
// =============================================================================

describe('AdvancedFiltersSkeleton', () => {
  it('renders the skeleton with testid', () => {
    render(<AdvancedFiltersSkeleton />);

    expect(screen.getByTestId('advanced-filters-skeleton')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<AdvancedFiltersSkeleton className="custom-class" />);

    expect(screen.getByTestId('advanced-filters-skeleton')).toHaveClass(
      'custom-class'
    );
  });

  it('renders skeleton placeholders for sections', () => {
    render(<AdvancedFiltersSkeleton />);

    // Should have multiple skeleton elements
    const skeletons = screen
      .getByTestId('advanced-filters-skeleton')
      .querySelectorAll('[class*="animate-pulse"], [data-testid*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AdvancedFiltersSkeleton />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
