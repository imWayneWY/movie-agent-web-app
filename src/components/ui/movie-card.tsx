'use client';

import * as React from 'react';
import Image from 'next/image';
import { Star, Clock, Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDuration, formatYear } from '@/lib/formatters';
import type { MovieRecommendation } from '@/types';

// =============================================================================
// CONSTANTS
// =============================================================================

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';

// =============================================================================
// TYPES
// =============================================================================

export interface MovieCardProps {
  /** The movie recommendation data to display */
  movie: MovieRecommendation;
  /** Additional CSS classes to apply to the card */
  className?: string;
}

export interface MovieCardSkeletonProps {
  /** Additional CSS classes to apply to the skeleton */
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the TMDb poster URL or null if no poster available
 */
function getPosterUrl(posterPath: string | null): string | null {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE_URL}/${POSTER_SIZE}${posterPath}`;
}

/**
 * Get the rating color class based on vote average
 */
function getRatingColorClass(rating: number): string {
  if (rating >= 7) return 'text-yellow-500';
  if (rating >= 5) return 'text-gray-500';
  return 'text-red-500';
}

/**
 * Get the first letter of the movie title for fallback display
 */
function getTitleInitial(title: string): string {
  return title.charAt(0).toUpperCase();
}

// =============================================================================
// MOVIE CARD COMPONENT
// =============================================================================

/**
 * MovieCard component displays a movie recommendation with poster,
 * rating, runtime, genres, and match reason.
 *
 * @example
 * ```tsx
 * <MovieCard movie={movieRecommendation} />
 * ```
 */
export function MovieCard({ movie, className }: MovieCardProps) {
  const {
    id,
    title,
    overview,
    posterPath,
    releaseDate,
    runtime,
    voteAverage,
    genres,
    matchReason,
  } = movie;

  const posterUrl = getPosterUrl(posterPath);
  const releaseYear = formatYear(releaseDate);
  const formattedRuntime = runtime ? formatDuration(runtime) : null;
  const ratingColorClass = getRatingColorClass(voteAverage);

  return (
    <Card
      className={cn('overflow-hidden', className)}
      data-testid={`movie-card-${id}`}
      role="article"
    >
      {/* Poster Section */}
      <div
        className="relative aspect-[2/3] w-full bg-muted"
        data-testid="poster-container"
      >
        {posterUrl ? (
          <Image
            key={posterUrl}
            src={posterUrl}
            alt={`${title} poster`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-muted"
            data-testid="poster-fallback"
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Film className="h-12 w-12" aria-hidden="true" />
              <span className="text-4xl font-bold">{getTitleInitial(title)}</span>
            </div>
          </div>
        )}

        {/* Rating Badge Overlay */}
        <div
          className={cn(
            'absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 backdrop-blur-sm',
            ratingColorClass
          )}
          data-testid="rating-badge"
        >
          <Star
            className="h-4 w-4 fill-current"
            aria-hidden="true"
            data-testid="star-icon"
          />
          <span className="text-sm font-semibold">
            {voteAverage.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="space-y-3 p-4">
        {/* Title and Year */}
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight">
            {title}
          </h3>

          {/* Metadata Row: Year and Runtime */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {releaseYear && (
              <span data-testid="release-year">{releaseYear}</span>
            )}

            {formattedRuntime && (
              <div
                className="flex items-center gap-1"
                data-testid="runtime-display"
              >
                <Clock
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                  data-testid="clock-icon"
                />
                <span>{formattedRuntime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Genres */}
        {genres.length > 0 && (
          <ul
            className="flex flex-wrap gap-1.5"
            data-testid="genres-container"
            role="list"
            aria-label="Movie genres"
          >
            {genres.map((genre) => (
              <li key={genre} role="listitem">
                <Badge variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        {/* Overview */}
        <p className="line-clamp-3 text-sm text-muted-foreground">{overview}</p>

        {/* Match Reason */}
        <div
          className="rounded-md bg-primary/10 p-2.5 text-sm italic text-primary"
          data-testid="match-reason"
        >
          {matchReason}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MOVIE CARD SKELETON COMPONENT
// =============================================================================

/**
 * MovieCardSkeleton displays a loading placeholder that matches
 * the MovieCard layout structure.
 *
 * @example
 * ```tsx
 * <MovieCardSkeleton />
 * ```
 */
export function MovieCardSkeleton({ className }: MovieCardSkeletonProps) {
  return (
    <Card
      className={cn('overflow-hidden', className)}
      data-testid="movie-card-skeleton"
      aria-busy="true"
      aria-label="Loading movie card"
    >
      {/* Poster Skeleton */}
      <Skeleton
        className="aspect-[2/3] w-full rounded-none"
        data-testid="skeleton-poster"
      />

      {/* Content Skeleton */}
      <CardContent className="space-y-3 p-4">
        {/* Title Skeleton */}
        <Skeleton className="h-6 w-3/4" data-testid="skeleton-title" />

        {/* Metadata Skeleton */}
        <div className="flex gap-3" data-testid="skeleton-metadata">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Genres Skeleton */}
        <div className="flex gap-1.5" data-testid="skeleton-genres">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2" data-testid="skeleton-description">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Match Reason Skeleton */}
        <Skeleton className="h-12 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
