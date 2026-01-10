'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { PlatformAvailability, PlatformId } from '@/types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Fallback URLs for each streaming platform
 */
const PLATFORM_URLS: Record<PlatformId, string> = {
  netflix: 'https://www.netflix.com',
  prime: 'https://www.primevideo.com',
  disney: 'https://www.disneyplus.com',
  crave: 'https://www.crave.ca',
  apple: 'https://tv.apple.com',
  paramount: 'https://www.paramountplus.com',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate the platform URL for a given platform
 * Uses the provided URL if available, otherwise falls back to platform home
 *
 * @param platformId - The platform identifier
 * @param providedUrl - Optional specific URL for the content
 * @returns The URL to use for the platform link
 */
export function generatePlatformUrl(
  platformId: PlatformId,
  providedUrl?: string
): string {
  if (providedUrl) {
    return providedUrl.trim();
  }
  return PLATFORM_URLS[platformId] || '';
}

// =============================================================================
// TYPES
// =============================================================================

export type PlatformBadgeVariant = 'default' | 'compact' | 'icon-only';
export type PlatformBadgeSize = 'sm' | 'md' | 'lg';

export interface PlatformBadgeProps {
  /** The platform availability data */
  platform: PlatformAvailability;
  /** Visual variant of the badge */
  variant?: PlatformBadgeVariant;
  /** Size of the badge */
  size?: PlatformBadgeSize;
  /** Additional CSS classes */
  className?: string;
}

export interface PlatformBadgeGroupProps {
  /** Array of platforms to display */
  platforms: PlatformAvailability[];
  /** Visual variant to apply to all badges */
  badgeVariant?: PlatformBadgeVariant;
  /** Size to apply to all badges */
  badgeSize?: PlatformBadgeSize;
  /** Maximum number of badges to show (shows +N for overflow) */
  maxItems?: number;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// STYLE UTILITIES
// =============================================================================

const sizeClasses: Record<PlatformBadgeSize, { badge: string; logo: string; text: string }> = {
  sm: {
    badge: 'px-2 py-1 gap-1',
    logo: 'h-3 w-3',
    text: 'text-xs',
  },
  md: {
    badge: 'px-2.5 py-1.5 gap-1.5',
    logo: 'h-4 w-4',
    text: 'text-sm',
  },
  lg: {
    badge: 'px-3 py-2 gap-2',
    logo: 'h-5 w-5',
    text: 'text-base',
  },
};

// =============================================================================
// PLATFORM BADGE COMPONENT
// =============================================================================

/**
 * PlatformBadge displays a streaming platform with logo and link
 *
 * @example
 * ```tsx
 * <PlatformBadge
 *   platform={{
 *     id: 'netflix',
 *     name: 'Netflix',
 *     logo: '/platforms/netflix.svg',
 *     url: 'https://netflix.com/watch/123'
 *   }}
 * />
 * ```
 */
export function PlatformBadge({
  platform,
  variant = 'default',
  size = 'md',
  className,
}: PlatformBadgeProps) {
  const { id, name, logo, url } = platform;
  const href = generatePlatformUrl(id, url);
  const styles = sizeClasses[size];
  const isCompact = variant === 'compact' || variant === 'icon-only';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch on ${name}`}
      data-testid={`platform-badge-${id}`}
      className={cn(
        // Base styles
        'inline-flex items-center rounded-full',
        'border border-border bg-background',
        'transition-all duration-200 ease-in-out',
        // Hover states
        'hover:bg-accent hover:border-accent-foreground/20',
        'hover:scale-105 hover:shadow-sm',
        // Focus states for accessibility
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Active state
        'active:scale-95',
        // Size styles
        styles.badge,
        className
      )}
    >
      {/* Platform Logo */}
      <Image
        src={logo}
        alt={`${name} logo`}
        width={20}
        height={20}
        className={cn('flex-shrink-0', styles.logo)}
      />

      {/* Platform Name */}
      <span
        className={cn(
          'font-medium',
          styles.text,
          isCompact && 'sr-only'
        )}
      >
        {name}
      </span>
    </a>
  );
}

// =============================================================================
// PLATFORM BADGE GROUP COMPONENT
// =============================================================================

/**
 * PlatformBadgeGroup displays a list of platform badges
 *
 * @example
 * ```tsx
 * <PlatformBadgeGroup
 *   platforms={[
 *     { id: 'netflix', name: 'Netflix', logo: '/platforms/netflix.svg' },
 *     { id: 'prime', name: 'Prime Video', logo: '/platforms/prime.svg' },
 *   ]}
 *   maxItems={3}
 * />
 * ```
 */
export function PlatformBadgeGroup({
  platforms,
  badgeVariant = 'default',
  badgeSize = 'md',
  maxItems,
  className,
}: PlatformBadgeGroupProps) {
  // Don't render if no platforms
  if (!platforms || platforms.length === 0) {
    return null;
  }

  const displayedPlatforms = maxItems
    ? platforms.slice(0, maxItems)
    : platforms;
  const overflowCount = maxItems
    ? Math.max(0, platforms.length - maxItems)
    : 0;
  const styles = sizeClasses[badgeSize];

  return (
    <ul
      role="list"
      aria-label="Available on streaming platforms"
      data-testid="platform-badge-group"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {displayedPlatforms.map((platform) => (
        <li key={platform.id} role="listitem">
          <PlatformBadge
            platform={platform}
            variant={badgeVariant}
            size={badgeSize}
          />
        </li>
      ))}

      {overflowCount > 0 && (
        <li role="listitem">
          <span
            className={cn(
              'inline-flex items-center justify-center',
              'rounded-full border border-border bg-muted',
              'text-muted-foreground font-medium',
              styles.badge,
              styles.text
            )}
            aria-label={`${overflowCount} more platforms`}
          >
            +{overflowCount}
          </span>
        </li>
      )}
    </ul>
  );
}
