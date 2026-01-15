'use client';

/**
 * Home Page Components
 *
 * Internal components for the home page that are exported separately
 * to allow testing while keeping the page.tsx file clean.
 */

import * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BotContainer,
  BotContainerSkeleton,
  MovieList,
  StreamingOutput,
} from '@/components/ui';
import {
  useAppContext,
  type FetchMode,
} from '@/components/providers';
import { useRecommendations } from '@/hooks/use-recommendations';
import { useStreaming } from '@/hooks/use-streaming';
import { useAnalytics } from '@/hooks/use-analytics';
import type { UserInput, MoodValue } from '@/types';
import { cn } from '@/lib/utils';

// =============================================================================
// CONSTANTS
// =============================================================================

const TAB_LABELS = {
  structured: 'Quick Results',
  streaming: 'AI Insights',
} as const;

// =============================================================================
// INNER CONTENT COMPONENT
// =============================================================================

export interface HomeContentProps {
  /** Test ID for testing */
  testId?: string;
}

/**
 * HomeContent - Inner component that uses context
 * Separated to allow AppProvider wrapping at the page level
 */
export function HomeContent({ testId }: HomeContentProps) {
  const {
    state,
    userInputActions,
    recommendationsActions,
    streamingActions,
    appActions,
  } = useAppContext();

  const {
    fetchMode,
    userInput,
    recommendations,
    isLoading,
    error,
    streamingContent,
    streamingMovies,
    isStreaming,
    isConnected,
    isStreamingComplete,
    streamingError,
  } = state;

  // Analytics hook for tracking user interactions
  const {
    trackRecommendationsRequested,
    trackRecommendationsReceived,
    trackRecommendationsError,
    trackStreamingStarted,
    trackStreamingCompleted,
    trackStreamingError,
    trackStreamingStopped,
    trackModeSwitched,
    trackFiltersReset,
  } = useAnalytics();

  // Ref for tracking request timing
  const requestStartTime = useRef<number>(0);

  // Hooks for API communication
  const {
    fetchRecommendations,
    reset: resetRecommendations,
    recommendations: hookRecommendations,
    error: hookError,
  } = useRecommendations();

  // Sync hook state to context when recommendations change
  React.useEffect(() => {
    if (hookRecommendations.length > 0) {
      recommendationsActions.setRecommendations(hookRecommendations);
    }
  }, [hookRecommendations, recommendationsActions]);

  // Sync hook error to context
  React.useEffect(() => {
    if (hookError) {
      recommendationsActions.setError(hookError);
    }
  }, [hookError, recommendationsActions]);

  const {
    startStreaming,
    stopStreaming,
    reset: resetStreaming,
  } = useStreaming({
    onText: (text) => {
      streamingActions.appendStreamingContent(text);
    },
    onMovie: (movie) => {
      streamingActions.addStreamingMovie(movie);
    },
    onComplete: () => {
      streamingActions.setStreamingComplete(true);
      streamingActions.setStreaming(false);
      streamingActions.setConnected(false);
      // Track streaming completion
      const durationMs = Date.now() - requestStartTime.current;
      trackStreamingCompleted(streamingMovies.length, durationMs);
    },
    onError: (err) => {
      streamingActions.setStreamingError(err);
      streamingActions.setStreaming(false);
      streamingActions.setConnected(false);
      // Track streaming error
      trackStreamingError(err.message);
    },
  });

  // Track when recommendations are successfully received
  const prevRecommendationsLength = useRef(0);
  useEffect(() => {
    // Only track when we go from 0 to some recommendations (initial load)
    if (recommendations.length > 0 && prevRecommendationsLength.current === 0 && !isLoading) {
      const durationMs = Date.now() - requestStartTime.current;
      trackRecommendationsReceived(recommendations.length, durationMs);
    }
    prevRecommendationsLength.current = recommendations.length;
  }, [recommendations.length, isLoading, trackRecommendationsReceived]);

  // Clean up streaming on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (input: UserInput) => {
      // Store user input in context
      userInputActions.setUserInput(input);

      // Track the request start time
      requestStartTime.current = Date.now();

      // Track analytics - recommendations requested
      const mood = input.mood as MoodValue | undefined;
      if (mood) {
        trackRecommendationsRequested(
          mood,
          input.genres?.length ?? 0,
          input.platforms?.length ?? 0
        );
      }

      if (fetchMode === 'streaming') {
        // Clear previous streaming state
        streamingActions.clearStreaming();
        streamingActions.setStreaming(true);

        // Track streaming started
        if (mood) {
          trackStreamingStarted(mood);
        }

        // Start streaming
        startStreaming(input);
      } else {
        // Clear previous recommendations
        recommendationsActions.clearRecommendations();
        recommendationsActions.setLoading(true);

        try {
          await fetchRecommendations(input);
          // Note: Success tracking is handled in the effect that watches recommendations
        } catch (err) {
          // Track error
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          trackRecommendationsError(errorMessage);
        } finally {
          recommendationsActions.setLoading(false);
        }
      }
    },
    [
      fetchMode,
      userInputActions,
      recommendationsActions,
      streamingActions,
      fetchRecommendations,
      startStreaming,
      trackRecommendationsRequested,
      trackRecommendationsError,
      trackStreamingStarted,
    ]
  );

  /**
   * Handle fetch mode change
   */
  const handleModeChange = useCallback(
    (mode: string) => {
      const newMode = mode as FetchMode;
      appActions.setFetchMode(newMode);

      // Track mode switch
      trackModeSwitched(newMode);

      // Clear results when switching modes
      if (newMode === 'streaming') {
        recommendationsActions.clearRecommendations();
      } else {
        streamingActions.clearStreaming();
        stopStreaming();
        // Track streaming stopped if it was running
        if (isStreaming) {
          trackStreamingStopped();
        }
      }
    },
    [appActions, recommendationsActions, streamingActions, stopStreaming, isStreaming, trackModeSwitched, trackStreamingStopped]
  );

  /**
   * Handle reset
   */
  const handleReset = useCallback(() => {
    userInputActions.clearUserInput();
    recommendationsActions.clearRecommendations();
    streamingActions.clearStreaming();
    resetRecommendations();
    resetStreaming();
    // Track filters/form reset
    trackFiltersReset();
  }, [
    userInputActions,
    recommendationsActions,
    streamingActions,
    resetRecommendations,
    resetStreaming,
    trackFiltersReset,
  ]);

  /**
   * Handle retry
   */
  const handleRetry = useCallback(() => {
    if (Object.keys(userInput).length > 0) {
      handleSubmit(userInput);
    }
  }, [userInput, handleSubmit]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const hasResults = recommendations.length > 0;
  const hasStreamingContent = streamingContent.length > 0 || streamingMovies.length > 0;
  const showResults = fetchMode === 'structured' && (hasResults || isLoading || error);
  const showStreaming = fetchMode === 'streaming' && (hasStreamingContent || isStreaming || streamingError);

  // Determine if the form is actively processing
  const isProcessing = fetchMode === 'streaming' ? isStreaming : isLoading;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div
      className={cn(
        'flex flex-1 flex-col',
        'p-4 sm:p-6 lg:p-8',
        'max-w-7xl mx-auto w-full'
      )}
      data-testid={testId}
    >
      {/* Header Section */}
      <header className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
          🎬 Movie Agent
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          AI-Powered Movie Recommendations
        </p>
      </header>

      {/* Mode Selector */}
      <div className="flex justify-center mb-6">
        <Tabs
          value={fetchMode}
          onValueChange={handleModeChange}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="structured"
              data-testid="mode-structured"
              disabled={isProcessing}
            >
              {TAB_LABELS.structured}
            </TabsTrigger>
            <TabsTrigger
              value="streaming"
              data-testid="mode-streaming"
              disabled={isProcessing}
            >
              {TAB_LABELS.streaming}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(320px,400px)_1fr]">
        {/* Left Column - Form */}
        <div className="order-1">
          <BotContainer
            onSubmit={handleSubmit}
            isLoading={isProcessing}
            showReset={hasResults || hasStreamingContent}
            onReset={handleReset}
            defaultFiltersExpanded={false}
            className="sticky top-4"
          />
        </div>

        {/* Right Column - Results */}
        <div className="order-2 min-h-[300px]">
          {/* Structured Results */}
          {fetchMode === 'structured' && (
            <div data-testid="results-structured">
              {showResults ? (
                <MovieList
                  movies={recommendations}
                  isLoading={isLoading}
                  error={error}
                  onRetry={handleRetry}
                  emptyTitle="No recommendations yet"
                  emptyDescription="Select a mood and click 'Get Recommendations' to discover movies that match your vibe."
                />
              ) : (
                <EmptyState mode="structured" />
              )}
            </div>
          )}

          {/* Streaming Results */}
          {fetchMode === 'streaming' && (
            <div data-testid="results-streaming">
              {showStreaming ? (
                <div className="space-y-6">
                  {/* Streaming Text Content */}
                  <StreamingOutput
                    content={streamingContent}
                    isStreaming={isStreaming}
                    isConnected={isConnected}
                    isComplete={isStreamingComplete}
                    enableTypingAnimation={true}
                    enableMarkdown={true}
                    showCursor={true}
                  />

                  {/* Streaming Movies */}
                  {streamingMovies.length > 0 && (
                    <div className="mt-6">
                      <h2 className="text-xl font-semibold mb-4">
                        Recommended Movies
                      </h2>
                      <MovieList
                        movies={streamingMovies}
                        isLoading={false}
                        error={null}
                      />
                    </div>
                  )}

                  {/* Streaming Error */}
                  {streamingError && (
                    <div
                      className="p-4 rounded-lg bg-destructive/10 text-destructive"
                      role="alert"
                      data-testid="streaming-error"
                    >
                      <p className="font-medium">
                        {streamingError.message || 'An error occurred during streaming'}
                      </p>
                      <button
                        onClick={handleRetry}
                        className="mt-2 text-sm underline hover:no-underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState mode="streaming" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

export interface EmptyStateProps {
  mode: FetchMode;
}

export function EmptyState({ mode }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'min-h-[300px] p-8',
        'rounded-lg border border-dashed',
        'text-center'
      )}
      data-testid="empty-state"
    >
      <div className="text-6xl mb-4">🎬</div>
      <h2 className="text-xl font-semibold mb-2">Ready to discover?</h2>
      <p className="text-muted-foreground max-w-md">
        {mode === 'structured'
          ? 'Select a mood and optional filters, then click "Get Recommendations" to find your next favorite movie.'
          : 'Select a mood and let our AI guide you through personalized movie recommendations with detailed insights.'}
      </p>
    </div>
  );
}

// =============================================================================
// LOADING STATE COMPONENT
// =============================================================================

export function HomeLoading() {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col',
        'p-4 sm:p-6 lg:p-8',
        'max-w-7xl mx-auto w-full'
      )}
    >
      {/* Header Skeleton */}
      <header className="text-center mb-6 sm:mb-8">
        <div className="h-10 w-64 bg-muted rounded mx-auto mb-2" />
        <div className="h-6 w-48 bg-muted rounded mx-auto" />
      </header>

      {/* Mode Selector Skeleton */}
      <div className="flex justify-center mb-6">
        <div className="h-10 w-full max-w-md bg-muted rounded" />
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(320px,400px)_1fr]">
        <div className="order-1">
          <BotContainerSkeleton />
        </div>
        <div className="order-2 min-h-[300px]">
          <div className="h-full bg-muted/50 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
