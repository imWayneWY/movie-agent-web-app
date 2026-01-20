'use client';

/**
 * Home Page Components
 *
 * Internal components for the home page that are exported separately
 * to allow testing while keeping the page.tsx file clean.
 */

import * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import {
  BotContainer,
  BotContainerSkeleton,
  MovieList,
  StreamingOutput,
} from '@/components/ui';
import {
  useAppContext,
} from '@/components/providers';
import { useRecommendations } from '@/hooks/use-recommendations';
import { useStreaming } from '@/hooks/use-streaming';
import { useAnalytics } from '@/hooks/use-analytics';
import type { UserInput, MoodValue } from '@/types';
import { cn } from '@/lib/utils';

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
  } = useAppContext();

  const {
    userInput,
    recommendations,
    isLoading,
    error,
    streamingContent,
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
    trackFiltersReset,
  } = useAnalytics();

  // Ref for tracking request timing
  const requestStartTime = useRef<number>(0);

  // Hooks for API communication
  const {
    fetchRecommendations,
    reset: resetRecommendations,
    recommendations: hookRecommendations,
    isLoading: hookIsLoading,
    error: hookError,
  } = useRecommendations();

  // Derive effective loading state from both hook and context
  // Context isLoading is used for test mocking, hook isLoading for real fetches
  const effectiveIsLoading = isLoading || hookIsLoading;

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
      trackStreamingCompleted(recommendations.length, durationMs);
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
    if (recommendations.length > 0 && prevRecommendationsLength.current === 0 && !effectiveIsLoading) {
      const durationMs = Date.now() - requestStartTime.current;
      trackRecommendationsReceived(recommendations.length, durationMs);
    }
    prevRecommendationsLength.current = recommendations.length;
  }, [recommendations.length, effectiveIsLoading, trackRecommendationsReceived]);

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

      // Clear previous states
      streamingActions.clearStreaming();
      recommendationsActions.clearRecommendations();

      // Start streaming for AI insights
      streamingActions.setStreaming(true);
      if (mood) {
        trackStreamingStarted(mood);
      }
      startStreaming(input);

      // Also fetch structured recommendations for the movie list
      try {
        await fetchRecommendations(input);
        // Note: Success tracking is handled in the effect that watches recommendations
      } catch (err) {
        // Track error
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        trackRecommendationsError(errorMessage);
      }
    },
    [
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
  const hasStreamingContent = streamingContent.length > 0;
  const showResults = hasResults || effectiveIsLoading || error;
  const showStreaming = hasStreamingContent || isStreaming || streamingError;

  // Determine if the form is actively processing
  const isProcessing = isStreaming || effectiveIsLoading;

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

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(320px,400px)_1fr]">
        {/* Left Column - Form + AI Insights */}
        <div className="order-1 space-y-6">
          <BotContainer
            onSubmit={handleSubmit}
            isLoading={isProcessing}
            showReset={hasResults || hasStreamingContent}
            onReset={handleReset}
            defaultFiltersExpanded={false}
          />

          {/* AI Insights Section */}
          <div data-testid="ai-insights-section">
            {showStreaming ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">AI Insights</h2>
                <StreamingOutput
                  content={streamingContent}
                  isStreaming={isStreaming}
                  isConnected={isConnected}
                  isComplete={isStreamingComplete}
                  enableTypingAnimation={true}
                  enableMarkdown={true}
                  showCursor={true}
                />

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
            ) : null}
          </div>
        </div>

        {/* Right Column - Movie List */}
        <div className="order-2 min-h-[300px]" data-testid="results-section">
          {showResults ? (
            <MovieList
              movies={recommendations}
              isLoading={effectiveIsLoading}
              error={error}
              onRetry={handleRetry}
              emptyTitle="No recommendations yet"
              emptyDescription="Select a mood and click 'Get Recommendations' to discover movies that match your vibe."
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

export function EmptyState() {
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
        Select a mood and optional filters, then click &quot;Get Recommendations&quot; to find your next favorite movie with AI-powered insights.
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
