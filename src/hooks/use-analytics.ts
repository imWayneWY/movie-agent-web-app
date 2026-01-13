/**
 * useAnalytics Hook
 *
 * React hook for tracking analytics events throughout the application.
 * Provides easy-to-use methods for tracking user interactions, page views,
 * and errors with proper typing.
 */

'use client';

import { useCallback, useContext, useMemo } from 'react';
import { AnalyticsContext } from '@/components/providers';
import type { EventName, EventProperties, IAnalyticsService } from '@/services/analytics.service';
import type { MoodValue, GenreValue, PlatformId } from '@/types';
import type { FetchMode } from '@/components/providers';

// =============================================================================
// TYPES
// =============================================================================

export interface UseAnalyticsReturn {
  /** Track a generic event */
  trackEvent: (name: EventName, properties?: Partial<EventProperties>) => void;
  /** Track page view */
  trackPageView: (name: string, properties?: Record<string, string>) => void;
  /** Track an exception/error */
  trackException: (error: Error, properties?: Record<string, string>) => void;
  /** Track a trace message */
  trackTrace: (message: string, properties?: Record<string, string>) => void;

  // User interaction tracking helpers
  /** Track mood selection */
  trackMoodSelected: (mood: MoodValue) => void;
  /** Track genre selection */
  trackGenreSelected: (genre: GenreValue) => void;
  /** Track genre deselection */
  trackGenreDeselected: (genre: GenreValue) => void;
  /** Track platform selection */
  trackPlatformSelected: (platform: PlatformId) => void;
  /** Track platform deselection */
  trackPlatformDeselected: (platform: PlatformId) => void;
  /** Track runtime filter change */
  trackRuntimeFilterChanged: (min: number, max: number) => void;
  /** Track year filter change */
  trackYearFilterChanged: (startYear?: number, endYear?: number) => void;
  /** Track filters expanded */
  trackFiltersExpanded: () => void;
  /** Track filters collapsed */
  trackFiltersCollapsed: () => void;
  /** Track filters reset */
  trackFiltersReset: () => void;

  // Recommendation tracking helpers
  /** Track recommendations requested */
  trackRecommendationsRequested: (mood: MoodValue, genreCount: number, platformCount: number) => void;
  /** Track recommendations received */
  trackRecommendationsReceived: (count: number, durationMs: number) => void;
  /** Track recommendations error */
  trackRecommendationsError: (errorMessage: string, errorCode?: string) => void;

  // Streaming tracking helpers
  /** Track streaming started */
  trackStreamingStarted: (mood: MoodValue) => void;
  /** Track streaming completed */
  trackStreamingCompleted: (movieCount: number, durationMs: number) => void;
  /** Track streaming stopped by user */
  trackStreamingStopped: () => void;
  /** Track streaming error */
  trackStreamingError: (errorMessage: string) => void;

  // Mode switching
  /** Track mode switch */
  trackModeSwitched: (newMode: FetchMode) => void;

  // Movie interaction tracking
  /** Track movie card viewed */
  trackMovieCardViewed: (movieId: string, movieTitle: string) => void;
  /** Track platform link clicked */
  trackPlatformLinkClicked: (platform: PlatformId, movieTitle: string) => void;

  // Theme tracking
  /** Track theme change */
  trackThemeChanged: (theme: 'light' | 'dark' | 'system') => void;

  /** Check if analytics is initialized */
  isInitialized: boolean;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for accessing analytics tracking functionality
 */
export function useAnalytics(): UseAnalyticsReturn {
  const analytics = useContext(AnalyticsContext);

  // Base tracking methods
  const trackEvent = useCallback(
    (name: EventName, properties?: Partial<EventProperties>) => {
      analytics?.trackEvent(name, properties);
    },
    [analytics]
  );

  const trackPageView = useCallback(
    (name: string, properties?: Record<string, string>) => {
      analytics?.trackPageView(name, properties);
    },
    [analytics]
  );

  const trackException = useCallback(
    (error: Error, properties?: Record<string, string>) => {
      analytics?.trackException(error, properties);
    },
    [analytics]
  );

  const trackTrace = useCallback(
    (message: string, properties?: Record<string, string>) => {
      analytics?.trackTrace(message, properties);
    },
    [analytics]
  );

  // User interaction helpers
  const trackMoodSelected = useCallback(
    (mood: MoodValue) => {
      analytics?.trackEvent('mood_selected', {
        category: 'user_interaction',
        mood,
      });
    },
    [analytics]
  );

  const trackGenreSelected = useCallback(
    (genre: GenreValue) => {
      analytics?.trackEvent('genre_selected', {
        category: 'filter',
        genre,
      });
    },
    [analytics]
  );

  const trackGenreDeselected = useCallback(
    (genre: GenreValue) => {
      analytics?.trackEvent('genre_deselected', {
        category: 'filter',
        genre,
      });
    },
    [analytics]
  );

  const trackPlatformSelected = useCallback(
    (platform: PlatformId) => {
      analytics?.trackEvent('platform_selected', {
        category: 'filter',
        platform,
      });
    },
    [analytics]
  );

  const trackPlatformDeselected = useCallback(
    (platform: PlatformId) => {
      analytics?.trackEvent('platform_deselected', {
        category: 'filter',
        platform,
      });
    },
    [analytics]
  );

  const trackRuntimeFilterChanged = useCallback(
    (min: number, max: number) => {
      analytics?.trackEvent('runtime_filter_changed', {
        category: 'filter',
        minRuntime: min,
        maxRuntime: max,
      });
    },
    [analytics]
  );

  const trackYearFilterChanged = useCallback(
    (startYear?: number, endYear?: number) => {
      analytics?.trackEvent('year_filter_changed', {
        category: 'filter',
        startYear: startYear ?? 0,
        endYear: endYear ?? 0,
      });
    },
    [analytics]
  );

  const trackFiltersExpanded = useCallback(() => {
    analytics?.trackEvent('filters_expanded', {
      category: 'user_interaction',
    });
  }, [analytics]);

  const trackFiltersCollapsed = useCallback(() => {
    analytics?.trackEvent('filters_collapsed', {
      category: 'user_interaction',
    });
  }, [analytics]);

  const trackFiltersReset = useCallback(() => {
    analytics?.trackEvent('filters_reset', {
      category: 'user_interaction',
    });
  }, [analytics]);

  // Recommendation helpers
  const trackRecommendationsRequested = useCallback(
    (mood: MoodValue, genreCount: number, platformCount: number) => {
      analytics?.trackEvent('recommendations_requested', {
        category: 'recommendation',
        mood,
        genreCount,
        platformCount,
      });
    },
    [analytics]
  );

  const trackRecommendationsReceived = useCallback(
    (count: number, durationMs: number) => {
      analytics?.trackEvent('recommendations_received', {
        category: 'recommendation',
        movieCount: count,
        durationMs,
      });
    },
    [analytics]
  );

  const trackRecommendationsError = useCallback(
    (errorMessage: string, errorCode?: string) => {
      analytics?.trackEvent('recommendations_error', {
        category: 'error',
        errorMessage,
        errorCode: errorCode ?? 'unknown',
      });
    },
    [analytics]
  );

  // Streaming helpers
  const trackStreamingStarted = useCallback(
    (mood: MoodValue) => {
      analytics?.trackEvent('streaming_started', {
        category: 'streaming',
        mood,
      });
    },
    [analytics]
  );

  const trackStreamingCompleted = useCallback(
    (movieCount: number, durationMs: number) => {
      analytics?.trackEvent('streaming_completed', {
        category: 'streaming',
        movieCount,
        durationMs,
      });
    },
    [analytics]
  );

  const trackStreamingStopped = useCallback(() => {
    analytics?.trackEvent('streaming_stopped', {
      category: 'streaming',
    });
  }, [analytics]);

  const trackStreamingError = useCallback(
    (errorMessage: string) => {
      analytics?.trackEvent('streaming_error', {
        category: 'error',
        errorMessage,
      });
    },
    [analytics]
  );

  // Mode switching
  const trackModeSwitched = useCallback(
    (newMode: FetchMode) => {
      analytics?.trackEvent('mode_switched', {
        category: 'user_interaction',
        mode: newMode,
      });
    },
    [analytics]
  );

  // Movie interaction helpers
  const trackMovieCardViewed = useCallback(
    (movieId: string, movieTitle: string) => {
      analytics?.trackEvent('movie_card_viewed', {
        category: 'movie',
        movieId,
        movieTitle,
      });
    },
    [analytics]
  );

  const trackPlatformLinkClicked = useCallback(
    (platform: PlatformId, movieTitle: string) => {
      analytics?.trackEvent('platform_link_clicked', {
        category: 'movie',
        platform,
        movieTitle,
      });
    },
    [analytics]
  );

  // Theme helpers
  const trackThemeChanged = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      analytics?.trackEvent('theme_changed', {
        category: 'user_interaction',
        theme,
      });
    },
    [analytics]
  );

  return useMemo(
    () => ({
      trackEvent,
      trackPageView,
      trackException,
      trackTrace,
      trackMoodSelected,
      trackGenreSelected,
      trackGenreDeselected,
      trackPlatformSelected,
      trackPlatformDeselected,
      trackRuntimeFilterChanged,
      trackYearFilterChanged,
      trackFiltersExpanded,
      trackFiltersCollapsed,
      trackFiltersReset,
      trackRecommendationsRequested,
      trackRecommendationsReceived,
      trackRecommendationsError,
      trackStreamingStarted,
      trackStreamingCompleted,
      trackStreamingStopped,
      trackStreamingError,
      trackModeSwitched,
      trackMovieCardViewed,
      trackPlatformLinkClicked,
      trackThemeChanged,
      isInitialized: analytics?.isInitialized() ?? false,
    }),
    [
      trackEvent,
      trackPageView,
      trackException,
      trackTrace,
      trackMoodSelected,
      trackGenreSelected,
      trackGenreDeselected,
      trackPlatformSelected,
      trackPlatformDeselected,
      trackRuntimeFilterChanged,
      trackYearFilterChanged,
      trackFiltersExpanded,
      trackFiltersCollapsed,
      trackFiltersReset,
      trackRecommendationsRequested,
      trackRecommendationsReceived,
      trackRecommendationsError,
      trackStreamingStarted,
      trackStreamingCompleted,
      trackStreamingStopped,
      trackStreamingError,
      trackModeSwitched,
      trackMovieCardViewed,
      trackPlatformLinkClicked,
      trackThemeChanged,
      analytics,
    ]
  );
}

// =============================================================================
// HELPER FUNCTION FOR NON-HOOK CONTEXTS
// =============================================================================

/**
 * Create analytics tracking functions from a service instance
 * Useful for non-React contexts like API routes
 */
export function createAnalyticsHelpers(service: IAnalyticsService) {
  return {
    trackRecommendationsRequested: (mood: string, genreCount: number, platformCount: number) => {
      service.trackEvent('recommendations_requested', {
        category: 'recommendation',
        mood,
        genreCount,
        platformCount,
      });
    },
    trackRecommendationsReceived: (count: number, durationMs: number) => {
      service.trackEvent('recommendations_received', {
        category: 'recommendation',
        movieCount: count,
        durationMs,
      });
    },
    trackRecommendationsError: (errorMessage: string, errorCode?: string) => {
      service.trackEvent('recommendations_error', {
        category: 'error',
        errorMessage,
        errorCode: errorCode ?? 'unknown',
      });
    },
    trackStreamingStarted: (mood: string) => {
      service.trackEvent('streaming_started', {
        category: 'streaming',
        mood,
      });
    },
    trackStreamingCompleted: (movieCount: number, durationMs: number) => {
      service.trackEvent('streaming_completed', {
        category: 'streaming',
        movieCount,
        durationMs,
      });
    },
    trackStreamingError: (errorMessage: string) => {
      service.trackEvent('streaming_error', {
        category: 'error',
        errorMessage,
      });
    },
  };
}
