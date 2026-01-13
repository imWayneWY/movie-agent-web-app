'use client';

/**
 * Loading Indicator Components
 *
 * Various loading indicators for different use cases.
 */

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// =============================================================================
// TYPES
// =============================================================================

export interface SpinnerProps {
  /** Size of the spinner */
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  /** Additional class name */
  className?: string;
  /** Accessible label */
  label?: string;
}

export interface LoadingOverlayProps {
  /** Whether to show the overlay */
  isLoading: boolean;
  /** Loading message */
  message?: string;
  /** Whether the overlay is full screen */
  fullScreen?: boolean;
  /** Additional class name */
  className?: string;
  /** Child content to overlay */
  children?: React.ReactNode;
}

export interface LoadingStateProps {
  /** Whether loading */
  isLoading: boolean;
  /** Loading content */
  loadingContent?: React.ReactNode;
  /** Error state */
  error?: Error | null;
  /** Error content */
  errorContent?: React.ReactNode;
  /** Children to render when not loading */
  children: React.ReactNode;
}

export interface LoadingDotsProps {
  /** Additional class name */
  className?: string;
  /** Size */
  size?: 'sm' | 'default' | 'lg';
}

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Whether indeterminate */
  indeterminate?: boolean;
  /** Show percentage label */
  showLabel?: boolean;
  /** Additional class name */
  className?: string;
  /** Size */
  size?: 'sm' | 'default' | 'lg';
}

// =============================================================================
// SPINNER COMPONENT
// =============================================================================

/**
 * Spinning loader icon
 */
export function Spinner({
  size = 'default',
  className,
  label = 'Loading',
}: SpinnerProps): React.ReactElement {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2
      className={cn(sizeClasses[size], 'animate-spin', className)}
      aria-label={label}
      role="status"
    />
  );
}

// =============================================================================
// LOADING OVERLAY COMPONENT
// =============================================================================

/**
 * Loading overlay that covers content
 */
export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  fullScreen = false,
  className,
  children,
}: LoadingOverlayProps): React.ReactElement {
  if (!isLoading && children) {
    return <>{children}</>;
  }

  const overlay = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen
          ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50'
          : 'absolute inset-0 bg-background/80 backdrop-blur-sm',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <Spinner size="lg" label={message} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );

  if (children) {
    return (
      <div className="relative">
        {children}
        {isLoading && overlay}
      </div>
    );
  }

  return overlay;
}

// =============================================================================
// LOADING STATE COMPONENT
// =============================================================================

/**
 * Conditional rendering based on loading/error state
 */
export function LoadingState({
  isLoading,
  loadingContent,
  error,
  errorContent,
  children,
}: LoadingStateProps): React.ReactElement {
  if (isLoading) {
    return (
      <>
        {loadingContent || (
          <div className="flex items-center justify-center p-8">
            <Spinner size="lg" />
          </div>
        )}
      </>
    );
  }

  if (error) {
    return (
      <>
        {errorContent || (
          <div className="flex items-center justify-center p-8 text-destructive">
            <p>{error.message}</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

// =============================================================================
// LOADING DOTS COMPONENT
// =============================================================================

/**
 * Animated loading dots
 */
export function LoadingDots({
  className,
  size = 'default',
}: LoadingDotsProps): React.ReactElement {
  const sizeClasses = {
    sm: 'h-1 w-1',
    default: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  const gapClasses = {
    sm: 'gap-0.5',
    default: 'gap-1',
    lg: 'gap-1.5',
  };

  return (
    <span
      className={cn('inline-flex items-center', gapClasses[size], className)}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            sizeClasses[size],
            'rounded-full bg-current animate-pulse'
          )}
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '1s',
          }}
        />
      ))}
    </span>
  );
}

// =============================================================================
// PROGRESS BAR COMPONENT
// =============================================================================

/**
 * Progress bar for determinate/indeterminate loading
 */
export function ProgressBar({
  value,
  indeterminate = false,
  showLabel = false,
  className,
  size = 'default',
}: ProgressBarProps): React.ReactElement {
  const clampedValue = Math.min(100, Math.max(0, value));

  const sizeClasses = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-secondary',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-all duration-300',
            indeterminate && 'animate-indeterminate-progress'
          )}
          style={{
            width: indeterminate ? '30%' : `${clampedValue}%`,
          }}
        />
      </div>
      {showLabel && !indeterminate && (
        <p className="mt-1 text-xs text-muted-foreground text-right">
          {clampedValue}%
        </p>
      )}
    </div>
  );
}

// =============================================================================
// CONTENT LOADER SKELETON COMPONENTS
// =============================================================================

export interface ContentLoaderProps {
  /** Number of lines to show */
  lines?: number;
  /** Additional class name */
  className?: string;
}

/**
 * Text content skeleton loader
 */
export function ContentLoader({
  lines = 3,
  className,
}: ContentLoaderProps): React.ReactElement {
  return (
    <div className={cn('space-y-2', className)} aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            // Vary widths for more natural look
            i === lines - 1 ? 'w-4/6' : i % 2 === 0 ? 'w-full' : 'w-5/6'
          )}
        />
      ))}
    </div>
  );
}

export interface CardLoaderProps {
  /** Number of cards to show */
  count?: number;
  /** Additional class name */
  className?: string;
}

/**
 * Card skeleton loader
 */
export function CardLoader({
  count = 1,
  className,
}: CardLoaderProps): React.ReactElement {
  return (
    <div className={cn('space-y-4', className)} aria-label="Loading cards">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// INLINE LOADING COMPONENT
// =============================================================================

export interface InlineLoadingProps {
  /** Loading message */
  message?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Inline loading indicator with optional message
 */
export function InlineLoading({
  message = 'Loading',
  className,
}: InlineLoadingProps): React.ReactElement {
  return (
    <span
      className={cn('inline-flex items-center gap-2 text-muted-foreground', className)}
      role="status"
      aria-live="polite"
    >
      <Spinner size="sm" />
      <span className="text-sm">{message}</span>
    </span>
  );
}

// =============================================================================
// BUTTON LOADING STATE
// =============================================================================

export interface LoadingButtonContentProps {
  /** Whether loading */
  isLoading: boolean;
  /** Loading text */
  loadingText?: string;
  /** Normal content */
  children: React.ReactNode;
}

/**
 * Loading content for buttons
 */
export function LoadingButtonContent({
  isLoading,
  loadingText,
  children,
}: LoadingButtonContentProps): React.ReactElement {
  if (isLoading) {
    return (
      <>
        <Spinner size="sm" className="mr-2" />
        {loadingText || 'Loading...'}
      </>
    );
  }

  return <>{children}</>;
}

export default {
  Spinner,
  LoadingOverlay,
  LoadingState,
  LoadingDots,
  ProgressBar,
  ContentLoader,
  CardLoader,
  InlineLoading,
  LoadingButtonContent,
};
