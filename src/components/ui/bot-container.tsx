'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RUNTIME, YEAR } from '@/lib/constants';
import { Button } from './button';
import { Card, CardContent, CardHeader } from './card';
import { MoodSelector } from './mood-selector';
import { AdvancedFilters } from './advanced-filters';
import { Skeleton } from './skeleton';
import type {
  MoodValue,
  GenreValue,
  PlatformId,
  RuntimeRange,
  YearRange,
  UserInput,
} from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface BotContainerProps {
  /** Callback when form is submitted with user input */
  onSubmit: (input: UserInput) => void;
  /** Whether the form is in loading state */
  isLoading?: boolean;
  /** Whether all form inputs are disabled */
  disabled?: boolean;
  /** Custom class name for the container */
  className?: string;

  // Initial values (uncontrolled mode)
  /** Initial mood selection */
  initialMood?: MoodValue;
  /** Initial genres selection */
  initialGenres?: GenreValue[];
  /** Initial platforms selection */
  initialPlatforms?: PlatformId[];
  /** Initial runtime range */
  initialRuntimeRange?: RuntimeRange;
  /** Initial year range */
  initialYearRange?: YearRange;

  // Controlled mode props
  /** Controlled mood value */
  mood?: MoodValue;
  /** Callback when mood changes (controlled mode) */
  onMoodChange?: (mood: MoodValue) => void;

  // Filter visibility
  /** Whether filters should be expanded by default */
  defaultFiltersExpanded?: boolean;

  // Validation
  /** Whether to show validation messages */
  showValidation?: boolean;

  // Reset functionality
  /** Whether to show reset button */
  showReset?: boolean;
  /** Callback when reset is clicked */
  onReset?: () => void;

  // State change callbacks
  /** Callback when genres change */
  onGenresChange?: (genres: GenreValue[]) => void;
  /** Callback when platforms change */
  onPlatformsChange?: (platforms: PlatformId[]) => void;
  /** Callback when runtime range changes */
  onRuntimeChange?: (range: RuntimeRange) => void;
  /** Callback when year range changes */
  onYearChange?: (range: YearRange) => void;
}

export interface BotContainerSkeletonProps {
  /** Custom class name for the skeleton container */
  className?: string;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const getDefaultRuntimeRange = (): RuntimeRange => ({
  min: RUNTIME.DEFAULT_MIN,
  max: RUNTIME.DEFAULT_MAX,
});

const getDefaultYearRange = (): YearRange => ({
  from: YEAR.DEFAULT_FROM,
  to: YEAR.DEFAULT_TO,
});

// =============================================================================
// BOTCONTAINER COMPONENT
// =============================================================================

/**
 * BotContainer - Main form container for movie recommendations
 *
 * Features:
 * - Integrates MoodSelector and AdvancedFilters components
 * - Form validation (requires mood selection)
 * - Supports controlled and uncontrolled modes
 * - Loading and disabled states
 * - Reset functionality
 * - Full keyboard navigation and accessibility
 */
export const BotContainer = React.forwardRef<HTMLDivElement, BotContainerProps>(
  (
    {
      onSubmit,
      isLoading = false,
      disabled = false,
      className,
      // Initial values
      initialMood,
      initialGenres = [],
      initialPlatforms = [],
      initialRuntimeRange,
      initialYearRange,
      // Controlled mode
      mood: controlledMood,
      onMoodChange,
      // Filter visibility
      defaultFiltersExpanded = false,
      // Validation
      showValidation = false,
      // Reset
      showReset = false,
      onReset,
      // State change callbacks
      onGenresChange,
      onPlatformsChange,
      onRuntimeChange,
      onYearChange,
    },
    ref
  ) => {
    // =========================================================================
    // STATE
    // =========================================================================

    // Mood state (supports controlled and uncontrolled modes)
    const [internalMood, setInternalMood] = React.useState<
      MoodValue | undefined
    >(initialMood);

    // Filter states
    const [genres, setGenres] = React.useState<GenreValue[]>(initialGenres);
    const [platforms, setPlatforms] =
      React.useState<PlatformId[]>(initialPlatforms);
    const [runtimeRange, setRuntimeRange] = React.useState<RuntimeRange>(
      initialRuntimeRange ?? getDefaultRuntimeRange()
    );
    const [yearRange, setYearRange] = React.useState<YearRange>(
      initialYearRange ?? getDefaultYearRange()
    );

    // Determine if we're in controlled mode
    const isControlled = controlledMood !== undefined;
    const currentMood = isControlled ? controlledMood : internalMood;

    // Form validation
    const isValid = currentMood !== undefined;
    const isDisabled = disabled || isLoading;

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleMoodSelect = React.useCallback(
      (mood: MoodValue) => {
        if (isDisabled) return;

        if (isControlled) {
          onMoodChange?.(mood);
        } else {
          setInternalMood(mood);
        }
      },
      [isControlled, isDisabled, onMoodChange]
    );

    const handleGenresChange = React.useCallback(
      (newGenres: GenreValue[]) => {
        setGenres(newGenres);
        onGenresChange?.(newGenres);
      },
      [onGenresChange]
    );

    const handlePlatformsChange = React.useCallback(
      (newPlatforms: PlatformId[]) => {
        setPlatforms(newPlatforms);
        onPlatformsChange?.(newPlatforms);
      },
      [onPlatformsChange]
    );

    const handleRuntimeChange = React.useCallback(
      (range: RuntimeRange) => {
        setRuntimeRange(range);
        onRuntimeChange?.(range);
      },
      [onRuntimeChange]
    );

    const handleYearChange = React.useCallback(
      (range: YearRange) => {
        setYearRange(range);
        onYearChange?.(range);
      },
      [onYearChange]
    );

    const handleSubmit = React.useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValid || isDisabled || !currentMood) return;

        const input: UserInput = {
          mood: currentMood,
          runtime: runtimeRange,
          releaseYear: yearRange,
        };

        // Only add optional arrays if they have values
        if (genres.length > 0) {
          input.genres = genres;
        }
        if (platforms.length > 0) {
          input.platforms = platforms;
        }

        onSubmit(input);
      },
      [
        isValid,
        isDisabled,
        currentMood,
        genres,
        platforms,
        runtimeRange,
        yearRange,
        onSubmit,
      ]
    );

    const handleReset = React.useCallback(() => {
      if (!isControlled) {
        setInternalMood(undefined);
      }
      setGenres([]);
      setPlatforms([]);
      setRuntimeRange(getDefaultRuntimeRange());
      setYearRange(getDefaultYearRange());
      onReset?.();
    }, [isControlled, onReset]);

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
      <div
        ref={ref}
        data-testid="bot-container"
        className={cn('w-full', className)}
      >
        <Card>
          <CardHeader className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              How are you feeling today?
            </h2>
            <p className="text-muted-foreground">
              Select your mood and we&apos;ll find personalized movie
              recommendations for you
            </p>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              role="form"
              aria-label="Movie recommendation form"
              className="space-y-6"
            >
              {/* Mood Selection */}
              <div className="space-y-4">
                <MoodSelector
                  selectedMood={currentMood}
                  onSelect={handleMoodSelect}
                  disabled={isDisabled}
                />

                {showValidation && !isValid && (
                  <p className="text-sm text-destructive" role="alert">
                    Please select a mood to continue
                  </p>
                )}
              </div>

              {/* Advanced Filters */}
              <AdvancedFilters
                selectedGenres={genres}
                selectedPlatforms={platforms}
                runtimeRange={runtimeRange}
                yearRange={yearRange}
                onGenresChange={handleGenresChange}
                onPlatformsChange={handlePlatformsChange}
                onRuntimeChange={handleRuntimeChange}
                onYearChange={handleYearChange}
                defaultExpanded={defaultFiltersExpanded}
                disabled={isDisabled}
              />

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {showReset && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isDisabled}
                  >
                    Reset
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={!isValid || isDisabled}
                  aria-busy={isLoading}
                  className="min-w-[200px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        data-testid="loading-spinner"
                      />
                      Searching...
                    </>
                  ) : (
                    'Get Recommendations'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
);

BotContainer.displayName = 'BotContainer';

// =============================================================================
// BOTCONTAINERSKELETON COMPONENT
// =============================================================================

/**
 * BotContainerSkeleton - Loading skeleton for BotContainer
 */
export const BotContainerSkeleton: React.FC<BotContainerSkeletonProps> = ({
  className,
}) => {
  return (
    <div
      data-testid="bot-container-skeleton"
      aria-label="Loading movie recommendation form"
      aria-busy="true"
      className={cn('w-full', className)}
    >
      <Card>
        <CardHeader className="text-center space-y-2">
          {/* Title skeleton */}
          <Skeleton className="h-8 w-3/4 mx-auto" />
          {/* Subtitle skeleton */}
          <Skeleton className="h-5 w-full mx-auto" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mood selector skeleton - grid of 8 buttons */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[80px] rounded-lg" />
            ))}
          </div>

          {/* Filters skeleton - collapsed accordion */}
          <Skeleton className="h-12 w-full rounded-lg" />

          {/* Submit button skeleton */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-[200px] rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

BotContainerSkeleton.displayName = 'BotContainerSkeleton';
