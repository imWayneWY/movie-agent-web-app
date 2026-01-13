'use client';

/**
 * Loading Boundary Component
 *
 * Provides a Suspense boundary with customizable fallback loading states.
 * Used for lazy-loaded components and async data fetching.
 */

import * as React from 'react';
import { Suspense, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface LoadingBoundaryProps {
  /** Content to render within the Suspense boundary */
  children: ReactNode;
  /** Custom fallback to show while loading */
  fallback?: ReactNode;
  /** Fallback variant when no custom fallback provided */
  variant?: 'card' | 'inline' | 'fullscreen' | 'minimal';
  /** Additional classes for the fallback container */
  className?: string;
}

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
  /** Label for accessibility */
  label?: string;
}

export interface LoadingCardProps {
  /** Number of skeleton lines to show */
  lines?: number | undefined;
  /** Whether to show a header skeleton */
  showHeader?: boolean | undefined;
  /** Additional classes */
  className?: string | undefined;
}

// =============================================================================
// LOADING SPINNER COMPONENT
// =============================================================================

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * LoadingSpinner - Animated loading spinner
 */
export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex items-center justify-center', className)}
    >
      <svg
        className={cn(
          'animate-spin text-primary',
          spinnerSizes[size]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

// =============================================================================
// LOADING CARD COMPONENT
// =============================================================================

/**
 * LoadingCard - Card with skeleton content
 */
export function LoadingCard({
  lines = 4,
  showHeader = true,
  className,
}: LoadingCardProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardContent className="p-6 space-y-4">
        {showHeader && <Skeleton className="h-6 w-1/2" />}
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'h-4',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// DEFAULT FALLBACKS
// =============================================================================

function CardFallback({ className }: { className?: string | undefined }) {
  return <LoadingCard className={className} />;
}

function InlineFallback({ className }: { className?: string | undefined }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size="sm" />
      <span className="text-muted-foreground text-sm">Loading...</span>
    </div>
  );
}

function FullscreenFallback({ className }: { className?: string | undefined }) {
  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm z-50',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function MinimalFallback({ className }: { className?: string | undefined }) {
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <LoadingSpinner size="md" />
    </div>
  );
}

// =============================================================================
// LOADING BOUNDARY COMPONENT
// =============================================================================

/**
 * LoadingBoundary - Suspense boundary with customizable fallback
 *
 * @example
 * ```tsx
 * <LoadingBoundary variant="card">
 *   <LazyComponent />
 * </LoadingBoundary>
 *
 * <LoadingBoundary fallback={<CustomLoading />}>
 *   <LazyComponent />
 * </LoadingBoundary>
 * ```
 */
export function LoadingBoundary({
  children,
  fallback,
  variant = 'card',
  className,
}: LoadingBoundaryProps) {
  // Use custom fallback if provided
  if (fallback) {
    return <Suspense fallback={fallback}>{children}</Suspense>;
  }

  // Use variant-based fallback
  let defaultFallback: ReactNode;
  switch (variant) {
    case 'inline':
      defaultFallback = <InlineFallback className={className} />;
      break;
    case 'fullscreen':
      defaultFallback = <FullscreenFallback className={className} />;
      break;
    case 'minimal':
      defaultFallback = <MinimalFallback className={className} />;
      break;
    case 'card':
    default:
      defaultFallback = <CardFallback className={className} />;
      break;
  }

  return <Suspense fallback={defaultFallback}>{children}</Suspense>;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default LoadingBoundary;
