'use client';

/**
 * MovieList Component
 *
 * Displays a responsive grid of movie recommendation cards.
 * Supports loading states with skeletons, empty states, and error states.
 */

import * as React from 'react';
import { AlertCircle, Film, RefreshCw } from 'lucide-react';
import { MovieCard, MovieCardSkeleton } from '@/components/ui/movie-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MovieRecommendation } from '@/types';
import type { RecommendationsError } from '@/hooks/use-recommendations';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default number of skeleton cards to show during loading */
const DEFAULT_SKELETON_COUNT = 6;

// =============================================================================
// TYPES
// =============================================================================

export interface MovieListProps {
  /** Array of movie recommendations to display */
  movies: MovieRecommendation[];
  /** Whether the list is currently loading */
  isLoading?: boolean;
  /** Error object if loading failed */
  error?: RecommendationsError | null;
  /** Number of skeleton cards to show during loading */
  skeletonCount?: number;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Empty state title override */
  emptyTitle?: string;
  /** Empty state description override */
  emptyDescription?: string;
}

export interface MovieListSkeletonProps {
  /** Number of skeleton cards to display */
  count?: number | undefined;
  /** Additional CSS classes */
  className?: string | undefined;
}

export interface MovieListEmptyProps {
  /** Empty state title */
  title?: string | undefined;
  /** Empty state description */
  description?: string | undefined;
  /** Additional CSS classes */
  className?: string | undefined;
}

export interface MovieListErrorProps {
  /** Error information */
  error: RecommendationsError;
  /** Callback when retry button is clicked */
  onRetry?: (() => void) | undefined;
  /** Additional CSS classes */
  className?: string | undefined;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get error message based on error type
 */
function getErrorMessage(error: RecommendationsError): string {
  switch (error.type) {
    case 'RATE_LIMIT_EXCEEDED':
      return error.retryAfter
        ? `Too many requests. Please try again in ${error.retryAfter} seconds.`
        : 'Too many requests. Please try again later.';
    case 'NETWORK_ERROR':
      return 'Unable to connect. Please check your internet connection.';
    case 'TIMEOUT_ERROR':
      return 'Request timed out. Please try again.';
    case 'API_ERROR':
    case 'AGENT_ERROR':
      return 'Something went wrong on our end. Please try again later.';
    case 'VALIDATION_ERROR':
      return error.message || 'Invalid request. Please check your filters.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}

/**
 * Get error title based on error type
 */
function getErrorTitle(error: RecommendationsError): string {
  switch (error.type) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'Rate Limit Exceeded';
    case 'NETWORK_ERROR':
      return 'Connection Error';
    case 'TIMEOUT_ERROR':
      return 'Request Timeout';
    case 'API_ERROR':
    case 'AGENT_ERROR':
      return 'Server Error';
    case 'VALIDATION_ERROR':
      return 'Invalid Request';
    default:
      return 'Error';
  }
}

// =============================================================================
// MOVIE LIST SKELETON COMPONENT
// =============================================================================

/**
 * MovieListSkeleton displays a loading state with skeleton cards
 * in a responsive grid layout.
 *
 * @example
 * ```tsx
 * <MovieListSkeleton count={6} />
 * ```
 */
export function MovieListSkeleton({
  count = DEFAULT_SKELETON_COUNT,
  className,
}: MovieListSkeletonProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
      data-testid="movie-list-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading movie recommendations"
    >
      {Array.from({ length: count }, (_, index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </div>
  );
}

// =============================================================================
// MOVIE LIST EMPTY COMPONENT
// =============================================================================

/**
 * MovieListEmpty displays an empty state when no movies are available.
 *
 * @example
 * ```tsx
 * <MovieListEmpty title="No movies found" description="Try adjusting your filters" />
 * ```
 */
export function MovieListEmpty({
  title = 'No recommendations yet',
  description = 'Select a mood and adjust filters to get personalized movie recommendations.',
  className,
}: MovieListEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center',
        className
      )}
      data-testid="movie-list-empty"
      role="status"
      aria-label="No movie recommendations"
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <Film
          className="h-8 w-8 text-muted-foreground"
          aria-hidden="true"
          data-testid="empty-icon"
        />
      </div>
      <h3
        className="mb-2 text-lg font-semibold"
        data-testid="empty-title"
      >
        {title}
      </h3>
      <p
        className="max-w-sm text-sm text-muted-foreground"
        data-testid="empty-description"
      >
        {description}
      </p>
    </div>
  );
}

// =============================================================================
// MOVIE LIST ERROR COMPONENT
// =============================================================================

/**
 * MovieListError displays an error state with retry functionality.
 *
 * @example
 * ```tsx
 * <MovieListError error={error} onRetry={() => refetch()} />
 * ```
 */
export function MovieListError({
  error,
  onRetry,
  className,
}: MovieListErrorProps) {
  const errorTitle = getErrorTitle(error);
  const errorMessage = getErrorMessage(error);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-12 text-center',
        className
      )}
      data-testid="movie-list-error"
      role="alert"
      aria-live="assertive"
    >
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertCircle
          className="h-8 w-8 text-destructive"
          aria-hidden="true"
          data-testid="error-icon"
        />
      </div>
      <h3
        className="mb-2 text-lg font-semibold text-destructive"
        data-testid="error-title"
      >
        {errorTitle}
      </h3>
      <p
        className="mb-6 max-w-sm text-sm text-muted-foreground"
        data-testid="error-message"
      >
        {errorMessage}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="gap-2"
          data-testid="retry-button"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// MOVIE LIST COMPONENT
// =============================================================================

/**
 * MovieList component displays a responsive grid of movie recommendations.
 * Handles loading, empty, and error states automatically.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <MovieList movies={recommendations} isLoading={isLoading} error={error} />
 *
 * // With retry functionality
 * <MovieList
 *   movies={recommendations}
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={() => refetch()}
 * />
 *
 * // With custom empty state
 * <MovieList
 *   movies={[]}
 *   emptyTitle="No matches found"
 *   emptyDescription="Try different filters"
 * />
 * ```
 */
export function MovieList({
  movies,
  isLoading = false,
  error = null,
  skeletonCount = DEFAULT_SKELETON_COUNT,
  onRetry,
  className,
  emptyTitle,
  emptyDescription,
}: MovieListProps) {
  // Show loading skeleton
  if (isLoading) {
    return <MovieListSkeleton count={skeletonCount} className={className} />;
  }

  // Show error state
  if (error) {
    return (
      <MovieListError error={error} onRetry={onRetry} className={className} />
    );
  }

  // Show empty state
  if (movies.length === 0) {
    return (
      <MovieListEmpty
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  // Show movie grid
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
      data-testid="movie-list"
      role="list"
      aria-label="Movie recommendations"
    >
      {movies.map((movie, index) => (
        <div key={movie.id ?? `movie-${index}`} role="listitem">
          <MovieCard movie={movie} />
        </div>
      ))}
    </div>
  );
}
