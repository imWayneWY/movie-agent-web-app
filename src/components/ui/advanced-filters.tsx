'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GENRES, PLATFORMS, RUNTIME, YEAR } from '@/lib/constants';
import { Checkbox } from './checkbox';
import { Slider } from './slider';
import { Skeleton } from './skeleton';
import type { GenreValue, PlatformId, RuntimeRange, YearRange } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface AdvancedFiltersProps {
  /** Currently selected genres */
  selectedGenres: GenreValue[];
  /** Currently selected platform IDs */
  selectedPlatforms: PlatformId[];
  /** Current runtime range (in minutes) */
  runtimeRange: RuntimeRange;
  /** Current release year range */
  yearRange: YearRange;
  /** Callback when genres change */
  onGenresChange: (genres: GenreValue[]) => void;
  /** Callback when platforms change */
  onPlatformsChange: (platforms: PlatformId[]) => void;
  /** Callback when runtime range changes */
  onRuntimeChange: (range: RuntimeRange) => void;
  /** Callback when year range changes */
  onYearChange: (range: YearRange) => void;
  /** Whether to start expanded */
  defaultExpanded?: boolean;
  /** Whether all inputs are disabled */
  disabled?: boolean;
  /** Custom class name for the container */
  className?: string;
}

export interface AdvancedFiltersSkeletonProps {
  /** Custom class name for the skeleton container */
  className?: string;
}

// =============================================================================
// ADVANCED FILTERS COMPONENT
// =============================================================================

/**
 * AdvancedFilters - A collapsible accordion containing movie filter options
 *
 * Features:
 * - Collapsible accordion with smooth animation
 * - Genre multi-select with checkboxes
 * - Platform checkboxes with logos
 * - Runtime range slider
 * - Year range inputs
 * - Full keyboard navigation
 * - ARIA attributes for accessibility
 */
export const AdvancedFilters = React.forwardRef<
  HTMLDivElement,
  AdvancedFiltersProps
>(
  (
    {
      selectedGenres,
      selectedPlatforms,
      runtimeRange,
      yearRange,
      onGenresChange,
      onPlatformsChange,
      onRuntimeChange,
      onYearChange,
      defaultExpanded = false,
      disabled = false,
      className,
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    const contentId = React.useId();

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleGenreToggle = React.useCallback(
      (genre: GenreValue) => {
        if (disabled) return;

        const newGenres = selectedGenres.includes(genre)
          ? selectedGenres.filter((g) => g !== genre)
          : [...selectedGenres, genre];
        onGenresChange(newGenres);
      },
      [selectedGenres, onGenresChange, disabled]
    );

    const handlePlatformToggle = React.useCallback(
      (platformId: PlatformId) => {
        if (disabled) return;

        const newPlatforms = selectedPlatforms.includes(platformId)
          ? selectedPlatforms.filter((p) => p !== platformId)
          : [...selectedPlatforms, platformId];
        onPlatformsChange(newPlatforms);
      },
      [selectedPlatforms, onPlatformsChange, disabled]
    );

    const handleRuntimeChange = React.useCallback(
      (values: number[]) => {
        if (disabled) return;
        const newRange: RuntimeRange = {};
        if (values[0] !== undefined) newRange.min = values[0];
        if (values[1] !== undefined) newRange.max = values[1];
        onRuntimeChange(newRange);
      },
      [onRuntimeChange, disabled]
    );

    const handleYearFromChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          const newRange: YearRange = { from: value };
          if (yearRange.to !== undefined) newRange.to = yearRange.to;
          onYearChange(newRange);
        }
      },
      [yearRange.to, onYearChange, disabled]
    );

    const handleYearToChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          const newRange: YearRange = { to: value };
          if (yearRange.from !== undefined) newRange.from = yearRange.from;
          onYearChange(newRange);
        }
      },
      [yearRange.from, onYearChange, disabled]
    );

    // =========================================================================
    // RENDER HELPERS
    // =========================================================================

    const formatRuntime = (minutes: number): string => {
      if (minutes >= RUNTIME.MAX) return `${RUNTIME.MAX}+ min`;
      return `${minutes} min`;
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
      <div
        ref={ref}
        data-testid="advanced-filters"
        className={cn('w-full rounded-lg border bg-card', className)}
      >
        {/* Accordion Trigger */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className={cn(
            'flex w-full items-center justify-between px-4 py-3',
            'text-left font-medium',
            'transition-colors hover:bg-accent/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'rounded-lg'
          )}
        >
          <span>Advanced Filters</span>
          <ChevronDown
            data-testid="chevron-icon"
            className={cn(
              'h-5 w-5 shrink-0 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </button>

        {/* Accordion Content */}
        {isExpanded && (
          <div
            id={contentId}
            data-testid="filters-content"
            className="border-t px-4 py-4"
          >
            <div className="space-y-6">
              {/* Genre Section */}
              <section data-testid="genre-section" aria-labelledby="genre-heading">
                <h3 id="genre-heading" className="mb-3 text-sm font-semibold">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => {
                    const genreId = `genre-${genre.toLowerCase().replace(/\s+/g, '-')}`;
                    return (
                      <div
                        key={genre}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-2',
                          'transition-colors hover:bg-accent/50',
                          'border border-transparent',
                          selectedGenres.includes(genre) && 'border-primary/50 bg-accent/30',
                          disabled && 'opacity-50'
                        )}
                      >
                        <Checkbox
                          id={genreId}
                          checked={selectedGenres.includes(genre)}
                          onCheckedChange={() => handleGenreToggle(genre)}
                          disabled={disabled}
                        />
                        <label
                          htmlFor={genreId}
                          className={cn(
                            'text-sm whitespace-nowrap select-none',
                            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                          )}
                        >
                          {genre}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Platform Section */}
              <section
                data-testid="platform-section"
                aria-labelledby="platform-heading"
              >
                <h3 id="platform-heading" className="mb-3 text-sm font-semibold">
                  Streaming Platforms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const platformId = `platform-${platform.id}`;
                    return (
                      <div
                        key={platform.id}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-2',
                          'transition-colors hover:bg-accent/50',
                          'border border-transparent',
                          selectedPlatforms.includes(platform.id) && 'border-primary/50 bg-accent/30',
                          disabled && 'opacity-50'
                        )}
                      >
                        <Checkbox
                          id={platformId}
                          checked={selectedPlatforms.includes(platform.id)}
                          onCheckedChange={() => handlePlatformToggle(platform.id)}
                          disabled={disabled}
                        />
                        <label
                          htmlFor={platformId}
                          className={cn(
                            'flex items-center gap-2',
                            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                          )}
                        >
                          <img
                            src={platform.logo}
                            alt=""
                            className="h-5 w-5 object-contain"
                            aria-hidden="true"
                          />
                          <span className="text-sm whitespace-nowrap select-none">{platform.name}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Runtime Section */}
              <section
                data-testid="runtime-section"
                aria-labelledby="runtime-heading"
              >
                <h3 id="runtime-heading" className="mb-3 text-sm font-semibold">
                  Runtime
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatRuntime(runtimeRange.min ?? RUNTIME.DEFAULT_MIN)}</span>
                    <span>{formatRuntime(runtimeRange.max ?? RUNTIME.DEFAULT_MAX)}</span>
                  </div>
                  <Slider
                    data-testid="runtime-slider"
                    aria-label="Runtime range"
                    value={[
                      runtimeRange.min ?? RUNTIME.DEFAULT_MIN,
                      runtimeRange.max ?? RUNTIME.DEFAULT_MAX,
                    ]}
                    onValueChange={handleRuntimeChange}
                    min={RUNTIME.MIN}
                    max={RUNTIME.MAX}
                    step={RUNTIME.STEP}
                    disabled={disabled}
                    className="py-2"
                  />
                </div>
              </section>

              {/* Year Range Section */}
              <section data-testid="year-section" aria-labelledby="year-heading">
                <h3 id="year-heading" className="mb-3 text-sm font-semibold">
                  Release Year
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label htmlFor="year-from" className="sr-only">
                      From year
                    </label>
                    <input
                      id="year-from"
                      type="number"
                      aria-label="From year"
                      value={yearRange.from ?? YEAR.DEFAULT_FROM}
                      onChange={handleYearFromChange}
                      min={YEAR.MIN}
                      max={YEAR.MAX}
                      disabled={disabled}
                      className={cn(
                        'w-full rounded-md border border-input bg-background px-3 py-2',
                        'text-sm ring-offset-background',
                        'placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    />
                  </div>
                  <span className="text-muted-foreground">to</span>
                  <div className="flex-1">
                    <label htmlFor="year-to" className="sr-only">
                      To year
                    </label>
                    <input
                      id="year-to"
                      type="number"
                      aria-label="To year"
                      value={yearRange.to ?? YEAR.DEFAULT_TO}
                      onChange={handleYearToChange}
                      min={YEAR.MIN}
                      max={YEAR.MAX}
                      disabled={disabled}
                      className={cn(
                        'w-full rounded-md border border-input bg-background px-3 py-2',
                        'text-sm ring-offset-background',
                        'placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AdvancedFilters.displayName = 'AdvancedFilters';

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

/**
 * AdvancedFiltersSkeleton - Loading skeleton for AdvancedFilters
 *
 * Displays placeholder elements while the filters are loading.
 */
export function AdvancedFiltersSkeleton({
  className,
}: AdvancedFiltersSkeletonProps) {
  return (
    <div
      data-testid="advanced-filters-skeleton"
      className={cn('w-full rounded-lg border bg-card', className)}
    >
      {/* Trigger skeleton */}
      <div className="flex items-center justify-between px-4 py-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-5" />
      </div>

      {/* Content skeleton */}
      <div className="border-t px-4 py-4">
        <div className="space-y-6">
          {/* Genre section skeleton */}
          <div>
            <Skeleton className="mb-3 h-4 w-16" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-md" />
              ))}
            </div>
          </div>

          {/* Platform section skeleton */}
          <div>
            <Skeleton className="mb-3 h-4 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-28 rounded-md" />
              ))}
            </div>
          </div>

          {/* Runtime section skeleton */}
          <div>
            <Skeleton className="mb-3 h-4 w-16" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>

          {/* Year section skeleton */}
          <div>
            <Skeleton className="mb-3 h-4 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-10 flex-1 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

AdvancedFiltersSkeleton.displayName = 'AdvancedFiltersSkeleton';
