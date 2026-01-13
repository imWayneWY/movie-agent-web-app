# Analytics Integration

This document describes the analytics integration for the Movie Agent Web App using Azure Application Insights.

## Overview

The application uses Azure Application Insights for tracking user interactions, page views, errors, and performance metrics. The analytics system is designed to:

- Work in development mode with console logging
- Connect to Azure Application Insights in production
- Be completely disabled in test environments
- Provide type-safe event tracking

## Setup

### Environment Variables

Add the Application Insights connection string to your environment:

```bash
# .env.local
NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key;IngestionEndpoint=https://your-region.in.applicationinsights.azure.com/
```

### Azure Portal Setup

1. Create an Application Insights resource in Azure Portal
2. Copy the Connection String from the Overview page
3. Add it to your environment variables

## Architecture

### Components

| Component | Purpose |
|-----------|---------|
| `analytics.service.ts` | Core service with Azure Application Insights integration |
| `analytics-provider.tsx` | React context provider for app-wide analytics |
| `use-analytics.ts` | React hook for component-level tracking |

### Service Modes

| Environment | Service Used | Behavior |
|-------------|--------------|----------|
| `test` | `NoopAnalyticsService` | No tracking, no side effects |
| `development` | `DevAnalyticsService` | Console logging for debugging |
| `production` | `AppInsightsAnalyticsService` | Real telemetry to Azure |

## Usage

### Basic Usage with Hook

```tsx
import { useAnalytics } from '@/hooks/use-analytics';

function MyComponent() {
  const { trackMoodSelected, trackEvent } = useAnalytics();

  const handleMoodClick = (mood: string) => {
    trackMoodSelected(mood);
    // ... other logic
  };

  return <button onClick={() => handleMoodClick('happy')}>Happy</button>;
}
```

### Tracking Custom Events

```tsx
const { trackEvent } = useAnalytics();

trackEvent('mood_selected', {
  category: 'user_interaction',
  mood: 'happy',
  source: 'mood_grid',
});
```

### Server-Side Tracking (API Routes)

```typescript
import { createAnalyticsHelpers, initializeAnalytics } from '@/services/analytics.service';

const analytics = initializeAnalytics({
  connectionString: process.env.APPINSIGHTS_CONNECTION_STRING,
});

const helpers = createAnalyticsHelpers(analytics);
helpers.trackRecommendationsRequested('happy', 2, 1);
```

## Tracked Events

### User Interaction Events

| Event Name | Category | Description | Properties |
|------------|----------|-------------|------------|
| `mood_selected` | `user_interaction` | User selects a mood | `mood` |
| `genre_selected` | `filter` | User selects a genre | `genre` |
| `genre_deselected` | `filter` | User deselects a genre | `genre` |
| `platform_selected` | `filter` | User selects a platform | `platform` |
| `platform_deselected` | `filter` | User deselects a platform | `platform` |
| `runtime_filter_changed` | `filter` | User changes runtime range | `minRuntime`, `maxRuntime` |
| `year_filter_changed` | `filter` | User changes year range | `startYear`, `endYear` |
| `filters_expanded` | `user_interaction` | User expands filter panel | - |
| `filters_collapsed` | `user_interaction` | User collapses filter panel | - |
| `filters_reset` | `user_interaction` | User resets all filters | - |
| `mode_switched` | `user_interaction` | User switches between structured/streaming | `mode` |
| `theme_changed` | `user_interaction` | User changes theme | `theme` |

### Recommendation Events

| Event Name | Category | Description | Properties |
|------------|----------|-------------|------------|
| `recommendations_requested` | `recommendation` | User requests recommendations | `mood`, `genreCount`, `platformCount` |
| `recommendations_received` | `recommendation` | Recommendations successfully returned | `movieCount`, `durationMs` |
| `recommendations_error` | `error` | Error getting recommendations | `errorMessage`, `errorCode` |

### Streaming Events

| Event Name | Category | Description | Properties |
|------------|----------|-------------|------------|
| `streaming_started` | `streaming` | Streaming session begins | `mood` |
| `streaming_completed` | `streaming` | Streaming session completes | `movieCount`, `durationMs` |
| `streaming_stopped` | `streaming` | User stops streaming | - |
| `streaming_error` | `error` | Error during streaming | `errorMessage` |

### Movie Interaction Events

| Event Name | Category | Description | Properties |
|------------|----------|-------------|------------|
| `movie_card_viewed` | `movie` | User views a movie card | `movieId`, `movieTitle` |
| `platform_link_clicked` | `movie` | User clicks platform link | `platform`, `movieTitle` |

### Page Views

Page views are automatically tracked when the route changes. The page name corresponds to the pathname.

## Helper Methods

The `useAnalytics` hook provides convenient helper methods for common tracking scenarios:

```tsx
const {
  // Base methods
  trackEvent,
  trackPageView,
  trackException,
  trackTrace,
  
  // User interaction helpers
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
  
  // Recommendation helpers
  trackRecommendationsRequested,
  trackRecommendationsReceived,
  trackRecommendationsError,
  
  // Streaming helpers
  trackStreamingStarted,
  trackStreamingCompleted,
  trackStreamingStopped,
  trackStreamingError,
  
  // Mode switching
  trackModeSwitched,
  
  // Movie interaction helpers
  trackMovieCardViewed,
  trackPlatformLinkClicked,
  
  // Theme
  trackThemeChanged,
  
  // State
  isInitialized,
} = useAnalytics();
```

## Testing

### Mocking Analytics in Tests

The analytics service automatically returns a `NoopAnalyticsService` in test environments, so no special mocking is required for most tests.

For testing analytics-specific behavior:

```tsx
import { AnalyticsContext } from '@/components/providers';
import type { IAnalyticsService } from '@/services/analytics.service';

const mockAnalytics: IAnalyticsService = {
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

render(
  <AnalyticsContext.Provider value={mockAnalytics}>
    <YourComponent />
  </AnalyticsContext.Provider>
);

// Verify tracking
expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('mood_selected', {
  category: 'user_interaction',
  mood: 'happy',
});
```

## Development Mode

In development mode, all analytics events are logged to the console with the `[Analytics]` prefix:

```
[Analytics] Initialized in development mode
[Analytics] Event: mood_selected { category: 'user_interaction', mood: 'happy' }
[Analytics] Page View: /home
```

This makes it easy to debug tracking without sending real telemetry.

## Best Practices

1. **Use helper methods** - Prefer `trackMoodSelected('happy')` over `trackEvent('mood_selected', {...})`
2. **Include context** - Always provide relevant context in event properties
3. **Track user journeys** - Track key steps in user flows to understand behavior
4. **Track errors** - Use `trackRecommendationsError` and `trackStreamingError` for error tracking
5. **Test tracking** - Write tests that verify important events are tracked correctly

## Viewing Analytics

Once deployed with a valid connection string, view analytics in Azure Portal:

1. Navigate to your Application Insights resource
2. Use **Logs** for custom queries
3. Use **Events** for custom event analysis
4. Use **Users** for user behavior insights
5. Use **Performance** for latency analysis

### Sample Kusto Queries

```kusto
// Most popular moods
customEvents
| where name == "mood_selected"
| extend mood = tostring(customDimensions.mood)
| summarize count() by mood
| order by count_ desc

// Average recommendation latency
customEvents
| where name == "recommendations_received"
| extend durationMs = toint(customDimensions.durationMs)
| summarize avg(durationMs), percentile(durationMs, 95)

// Error rate
customEvents
| where name in ("recommendations_error", "streaming_error")
| summarize errors = count() by bin(timestamp, 1h)
```
