'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MOODS } from '@/lib/constants';
import { Skeleton } from './skeleton';
import type { MoodValue } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface MoodSelectorProps {
  /** Currently selected mood value */
  selectedMood?: MoodValue;
  /** Callback when a mood is selected */
  onSelect: (mood: MoodValue) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Accessible label for the mood selector group */
  'aria-label'?: string;
}

export interface MoodSelectorSkeletonProps {
  /** Custom class name for the skeleton container */
  className?: string;
}

// =============================================================================
// MOOD SELECTOR COMPONENT
// =============================================================================

/**
 * MoodSelector - An accessible emoji button grid for selecting user mood
 *
 * Features:
 * - Responsive grid layout (2 cols mobile, 4 cols tablet, 8 cols desktop)
 * - Full keyboard navigation support
 * - ARIA attributes for accessibility
 * - Visual feedback for selected state
 * - Supports controlled component pattern
 */
export const MoodSelector = React.forwardRef<HTMLDivElement, MoodSelectorProps>(
  (
    {
      selectedMood,
      onSelect,
      disabled = false,
      className,
      'aria-label': ariaLabel = 'Select your mood',
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        data-testid="mood-selector"
        className={cn(
          'grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8',
          className
        )}
      >
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.value;

          return (
            <button
              key={mood.value}
              type="button"
              onClick={() => onSelect(mood.value)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={cn(
                // Base styles
                'flex flex-col items-center justify-center gap-1',
                'rounded-lg border p-3 transition-all duration-200',
                'min-h-[80px]',
                // Focus styles
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                // Hover styles (when not disabled)
                !disabled && 'hover:bg-accent hover:border-accent-foreground/20',
                // Selected styles
                isSelected && [
                  'ring-2 ring-primary ring-offset-2',
                  'bg-primary/10 border-primary',
                ],
                // Unselected styles
                !isSelected && 'bg-background border-input',
                // Disabled styles
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="text-2xl" role="img" aria-hidden="true">
                {mood.emoji}
              </span>
              <span className="text-xs font-medium text-foreground">
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

MoodSelector.displayName = 'MoodSelector';

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

/**
 * MoodSelectorSkeleton - Loading skeleton for MoodSelector
 *
 * Displays placeholder elements while the mood selector data is loading.
 */
export function MoodSelectorSkeleton({ className }: MoodSelectorSkeletonProps) {
  return (
    <div
      data-testid="mood-selector-skeleton"
      className={cn(
        'grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8',
        className
      )}
    >
      {MOODS.map((mood, index) => (
        <Skeleton
          key={mood.value}
          data-testid={`mood-skeleton-${index}`}
          className="h-[80px] w-full rounded-lg"
        />
      ))}
    </div>
  );
}

MoodSelectorSkeleton.displayName = 'MoodSelectorSkeleton';
