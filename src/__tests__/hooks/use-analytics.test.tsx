/**
 * useAnalytics Hook Tests
 *
 * Tests for the useAnalytics hook that provides analytics tracking
 * capabilities to React components.
 */

import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAnalytics, createAnalyticsHelpers } from '@/hooks/use-analytics';
import { AnalyticsContext } from '@/components/providers';
import type { IAnalyticsService } from '@/services/analytics.service';

// =============================================================================
// MOCK ANALYTICS SERVICE
// =============================================================================

const createMockAnalyticsService = (): jest.Mocked<IAnalyticsService> => ({
  initialize: jest.fn(),
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
  trackException: jest.fn(),
  trackTrace: jest.fn(),
  setAuthenticatedUser: jest.fn(),
  clearAuthenticatedUser: jest.fn(),
  flush: jest.fn(),
  isInitialized: jest.fn().mockReturnValue(true),
});

// =============================================================================
// TEST SETUP
// =============================================================================

describe('useAnalytics', () => {
  let mockAnalytics: jest.Mocked<IAnalyticsService>;

  const createWrapper = (analytics: IAnalyticsService | null) => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <AnalyticsContext.Provider value={analytics}>
          {children}
        </AnalyticsContext.Provider>
      );
    };
  };

  beforeEach(() => {
    mockAnalytics = createMockAnalyticsService();
    jest.clearAllMocks();
  });

  // ===========================================================================
  // BASE TRACKING METHODS
  // ===========================================================================

  describe('base tracking methods', () => {
    it('should provide trackEvent function', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      expect(result.current.trackEvent).toBeDefined();
    });

    it('should call analytics.trackEvent with correct parameters', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackEvent('mood_selected', { category: 'user_interaction' });
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('mood_selected', {
        category: 'user_interaction',
      });
    });

    it('should call analytics.trackPageView with correct parameters', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackPageView('/home', { source: 'navigation' });
      });

      expect(mockAnalytics.trackPageView).toHaveBeenCalledWith('/home', {
        source: 'navigation',
      });
    });

    it('should call analytics.trackException with correct parameters', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });
      const error = new Error('Test error');

      act(() => {
        result.current.trackException(error, { context: 'test' });
      });

      expect(mockAnalytics.trackException).toHaveBeenCalledWith(error, {
        context: 'test',
      });
    });

    it('should call analytics.trackTrace with correct parameters', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackTrace('Debug message', { level: 'debug' });
      });

      expect(mockAnalytics.trackTrace).toHaveBeenCalledWith('Debug message', {
        level: 'debug',
      });
    });
  });

  // ===========================================================================
  // USER INTERACTION HELPERS
  // ===========================================================================

  describe('user interaction helpers', () => {
    it('should track mood selection', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackMoodSelected('happy');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('mood_selected', {
        category: 'user_interaction',
        mood: 'happy',
      });
    });

    it('should track genre selection', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackGenreSelected('Action');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('genre_selected', {
        category: 'filter',
        genre: 'Action',
      });
    });

    it('should track genre deselection', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackGenreDeselected('Comedy');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('genre_deselected', {
        category: 'filter',
        genre: 'Comedy',
      });
    });

    it('should track platform selection', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackPlatformSelected('netflix');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('platform_selected', {
        category: 'filter',
        platform: 'netflix',
      });
    });

    it('should track platform deselection', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackPlatformDeselected('disney');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('platform_deselected', {
        category: 'filter',
        platform: 'disney',
      });
    });

    it('should track runtime filter change', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackRuntimeFilterChanged(60, 180);
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('runtime_filter_changed', {
        category: 'filter',
        minRuntime: 60,
        maxRuntime: 180,
      });
    });

    it('should track year filter change', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackYearFilterChanged(2000, 2024);
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('year_filter_changed', {
        category: 'filter',
        startYear: 2000,
        endYear: 2024,
      });
    });

    it('should track year filter change with undefined values', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackYearFilterChanged();
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('year_filter_changed', {
        category: 'filter',
        startYear: 0,
        endYear: 0,
      });
    });

    it('should track filters expanded', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackFiltersExpanded();
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('filters_expanded', {
        category: 'user_interaction',
      });
    });

    it('should track filters collapsed', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackFiltersCollapsed();
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('filters_collapsed', {
        category: 'user_interaction',
      });
    });

    it('should track filters reset', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackFiltersReset();
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('filters_reset', {
        category: 'user_interaction',
      });
    });
  });

  // ===========================================================================
  // RECOMMENDATION HELPERS
  // ===========================================================================

  describe('recommendation helpers', () => {
    it('should track recommendations requested', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackRecommendationsRequested('excited', 3, 2);
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('recommendations_requested', {
        category: 'recommendation',
        mood: 'excited',
        genreCount: 3,
        platformCount: 2,
      });
    });

    it('should track recommendations received', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackRecommendationsReceived(5, 1500);
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('recommendations_received', {
        category: 'recommendation',
        movieCount: 5,
        durationMs: 1500,
      });
    });

    it('should track recommendations error with code', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackRecommendationsError('API timeout', 'TIMEOUT');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('recommendations_error', {
        category: 'error',
        errorMessage: 'API timeout',
        errorCode: 'TIMEOUT',
      });
    });

    it('should track recommendations error without code', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackRecommendationsError('Unknown error');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('recommendations_error', {
        category: 'error',
        errorMessage: 'Unknown error',
        errorCode: 'unknown',
      });
    });
  });

  // ===========================================================================
  // STREAMING HELPERS
  // ===========================================================================

  describe('streaming helpers', () => {
    it('should track streaming started', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackStreamingStarted('relaxed');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('streaming_started', {
        category: 'streaming',
        mood: 'relaxed',
      });
    });

    it('should track streaming completed', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackStreamingCompleted(3, 5000);
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('streaming_completed', {
        category: 'streaming',
        movieCount: 3,
        durationMs: 5000,
      });
    });

    it('should track streaming stopped', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackStreamingStopped();
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('streaming_stopped', {
        category: 'streaming',
      });
    });

    it('should track streaming error', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackStreamingError('Connection lost');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('streaming_error', {
        category: 'error',
        errorMessage: 'Connection lost',
      });
    });
  });

  // ===========================================================================
  // MODE SWITCHING
  // ===========================================================================

  describe('mode switching', () => {
    it('should track mode switched to structured', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackModeSwitched('structured');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('mode_switched', {
        category: 'user_interaction',
        mode: 'structured',
      });
    });

    it('should track mode switched to streaming', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackModeSwitched('streaming');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('mode_switched', {
        category: 'user_interaction',
        mode: 'streaming',
      });
    });
  });

  // ===========================================================================
  // MOVIE INTERACTION HELPERS
  // ===========================================================================

  describe('movie interaction helpers', () => {
    it('should track movie card viewed', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackMovieCardViewed('movie-123', 'The Matrix');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('movie_card_viewed', {
        category: 'movie',
        movieId: 'movie-123',
        movieTitle: 'The Matrix',
      });
    });

    it('should track platform link clicked', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackPlatformLinkClicked('netflix', 'Inception');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('platform_link_clicked', {
        category: 'movie',
        platform: 'netflix',
        movieTitle: 'Inception',
      });
    });
  });

  // ===========================================================================
  // THEME HELPERS
  // ===========================================================================

  describe('theme helpers', () => {
    it('should track theme changed to light', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackThemeChanged('light');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('theme_changed', {
        category: 'user_interaction',
        theme: 'light',
      });
    });

    it('should track theme changed to dark', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackThemeChanged('dark');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('theme_changed', {
        category: 'user_interaction',
        theme: 'dark',
      });
    });

    it('should track theme changed to system', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.trackThemeChanged('system');
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('theme_changed', {
        category: 'user_interaction',
        theme: 'system',
      });
    });
  });

  // ===========================================================================
  // INITIALIZATION STATE
  // ===========================================================================

  describe('initialization state', () => {
    it('should return isInitialized true when analytics is initialized', () => {
      mockAnalytics.isInitialized.mockReturnValue(true);
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      expect(result.current.isInitialized).toBe(true);
    });

    it('should return isInitialized false when analytics is not initialized', () => {
      mockAnalytics.isInitialized.mockReturnValue(false);
      const wrapper = createWrapper(mockAnalytics);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      expect(result.current.isInitialized).toBe(false);
    });

    it('should return isInitialized false when analytics context is null', () => {
      const wrapper = createWrapper(null);
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      expect(result.current.isInitialized).toBe(false);
    });
  });

  // ===========================================================================
  // NULL CONTEXT HANDLING
  // ===========================================================================

  describe('null context handling', () => {
    it('should not throw when analytics context is null', () => {
      const wrapper = createWrapper(null);

      expect(() => {
        const { result } = renderHook(() => useAnalytics(), { wrapper });
        result.current.trackEvent('mood_selected');
        result.current.trackMoodSelected('happy');
        result.current.trackRecommendationsRequested('happy', 0, 0);
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // MEMOIZATION
  // ===========================================================================

  describe('memoization', () => {
    it('should return stable function references', () => {
      const wrapper = createWrapper(mockAnalytics);
      const { result, rerender } = renderHook(() => useAnalytics(), { wrapper });

      const initialTrackEvent = result.current.trackEvent;
      const initialTrackMoodSelected = result.current.trackMoodSelected;

      rerender();

      expect(result.current.trackEvent).toBe(initialTrackEvent);
      expect(result.current.trackMoodSelected).toBe(initialTrackMoodSelected);
    });
  });
});

// =============================================================================
// CREATE ANALYTICS HELPERS
// =============================================================================

describe('createAnalyticsHelpers', () => {
  let mockService: jest.Mocked<IAnalyticsService>;

  beforeEach(() => {
    mockService = {
      initialize: jest.fn(),
      trackEvent: jest.fn(),
      trackPageView: jest.fn(),
      trackException: jest.fn(),
      trackTrace: jest.fn(),
      setAuthenticatedUser: jest.fn(),
      clearAuthenticatedUser: jest.fn(),
      flush: jest.fn(),
      isInitialized: jest.fn().mockReturnValue(true),
    };
  });

  it('should create helpers for tracking recommendations', () => {
    const helpers = createAnalyticsHelpers(mockService);

    helpers.trackRecommendationsRequested('happy', 2, 1);

    expect(mockService.trackEvent).toHaveBeenCalledWith('recommendations_requested', {
      category: 'recommendation',
      mood: 'happy',
      genreCount: 2,
      platformCount: 1,
    });
  });

  it('should create helpers for tracking recommendations received', () => {
    const helpers = createAnalyticsHelpers(mockService);

    helpers.trackRecommendationsReceived(5, 2000);

    expect(mockService.trackEvent).toHaveBeenCalledWith('recommendations_received', {
      category: 'recommendation',
      movieCount: 5,
      durationMs: 2000,
    });
  });

  it('should create helpers for tracking recommendations error', () => {
    const helpers = createAnalyticsHelpers(mockService);

    helpers.trackRecommendationsError('Test error', 'ERROR_CODE');

    expect(mockService.trackEvent).toHaveBeenCalledWith('recommendations_error', {
      category: 'error',
      errorMessage: 'Test error',
      errorCode: 'ERROR_CODE',
    });
  });

  it('should create helpers for tracking streaming started', () => {
    const helpers = createAnalyticsHelpers(mockService);

    helpers.trackStreamingStarted('excited');

    expect(mockService.trackEvent).toHaveBeenCalledWith('streaming_started', {
      category: 'streaming',
      mood: 'excited',
    });
  });

  it('should create helpers for tracking streaming completed', () => {
    const helpers = createAnalyticsHelpers(mockService);

    helpers.trackStreamingCompleted(3, 4000);

    expect(mockService.trackEvent).toHaveBeenCalledWith('streaming_completed', {
      category: 'streaming',
      movieCount: 3,
      durationMs: 4000,
    });
  });

  it('should create helpers for tracking streaming error', () => {
    const helpers = createAnalyticsHelpers(mockService);

    helpers.trackStreamingError('Connection failed');

    expect(mockService.trackEvent).toHaveBeenCalledWith('streaming_error', {
      category: 'error',
      errorMessage: 'Connection failed',
    });
  });
});
