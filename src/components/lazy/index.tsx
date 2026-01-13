'use client';

/**
 * Lazy Loading Components
 *
 * Dynamic imports for code splitting heavy components.
 * These components are loaded only when needed, reducing initial bundle size.
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// =============================================================================
// LOADING SKELETONS
// =============================================================================

/**
 * Skeleton for AdvancedFilters component
 */
function AdvancedFiltersSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" data-testid="advanced-filters-skeleton">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      {/* Filter sections */}
      <div className="space-y-4 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for StreamingOutput component
 */
function StreamingOutputSkeleton() {
  return (
    <Card className="animate-pulse" data-testid="streaming-output-skeleton">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for MovieList component
 */
function MovieListSkeleton() {
  return (
    <div
      className={cn(
        'grid gap-4',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      )}
      data-testid="movie-list-skeleton"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden animate-pulse">
          <Skeleton className="aspect-[2/3] w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton for BotContainer component
 */
function BotContainerSkeleton() {
  return (
    <Card className="animate-pulse" data-testid="bot-container-skeleton">
      <CardContent className="p-6 space-y-6">
        {/* Mood selector skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
        {/* Advanced filters toggle */}
        <Skeleton className="h-10 w-full" />
        {/* Submit button */}
        <Skeleton className="h-12 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// =============================================================================
// DYNAMIC IMPORTS
// =============================================================================

/**
 * Lazy-loaded AdvancedFilters component
 * Only loaded when the user expands the filters section
 */
export const LazyAdvancedFilters = dynamic(
  () => import('@/components/ui/advanced-filters').then((mod) => mod.AdvancedFilters),
  {
    loading: () => <AdvancedFiltersSkeleton />,
    ssr: true,
  }
);

/**
 * Lazy-loaded StreamingOutput component
 * Only loaded when streaming mode is selected
 */
export const LazyStreamingOutput = dynamic(
  () => import('@/components/ui/streaming-output').then((mod) => mod.StreamingOutput),
  {
    loading: () => <StreamingOutputSkeleton />,
    ssr: false, // Streaming doesn't need SSR
  }
);

/**
 * Lazy-loaded MovieList component
 * Can be lazy loaded for initial page load optimization
 */
export const LazyMovieList = dynamic(
  () => import('@/components/ui/movie-list').then((mod) => mod.MovieList),
  {
    loading: () => <MovieListSkeleton />,
    ssr: true,
  }
);

/**
 * Lazy-loaded BotContainer component
 * The main form component
 */
export const LazyBotContainer = dynamic(
  () => import('@/components/ui/bot-container').then((mod) => mod.BotContainer),
  {
    loading: () => <BotContainerSkeleton />,
    ssr: true,
  }
);

// =============================================================================
// SKELETON EXPORTS
// =============================================================================

export {
  AdvancedFiltersSkeleton,
  StreamingOutputSkeleton,
  MovieListSkeleton,
  BotContainerSkeleton,
};
