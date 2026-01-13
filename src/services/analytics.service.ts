/**
 * Analytics Service - Azure Application Insights Integration
 *
 * This service provides a wrapper around Azure Application Insights
 * for tracking user events, page views, and errors in the application.
 * It supports both production and development modes with proper mocking.
 */

import { ApplicationInsights, IEventTelemetry, IExceptionTelemetry, IPageViewTelemetry, ITraceTelemetry } from '@microsoft/applicationinsights-web';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Analytics event categories
 */
export type EventCategory =
  | 'user_interaction'
  | 'recommendation'
  | 'streaming'
  | 'error'
  | 'navigation'
  | 'filter'
  | 'movie';

/**
 * Tracked event names
 */
export type EventName =
  // User interactions
  | 'mood_selected'
  | 'genre_selected'
  | 'genre_deselected'
  | 'platform_selected'
  | 'platform_deselected'
  | 'runtime_filter_changed'
  | 'year_filter_changed'
  | 'filters_expanded'
  | 'filters_collapsed'
  | 'filters_reset'
  // Recommendations
  | 'recommendations_requested'
  | 'recommendations_received'
  | 'recommendations_error'
  // Streaming
  | 'streaming_started'
  | 'streaming_completed'
  | 'streaming_stopped'
  | 'streaming_error'
  // Mode switching
  | 'mode_switched'
  // Movie interactions
  | 'movie_card_viewed'
  | 'platform_link_clicked'
  // Theme
  | 'theme_changed';

/**
 * Custom event properties
 */
export interface EventProperties {
  category: EventCategory;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Application Insights connection string */
  connectionString?: string;
  /** Enable analytics (defaults to true in production) */
  enabled?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Disable telemetry for testing */
  disableTelemetry?: boolean;
}

/**
 * Analytics service interface
 */
export interface IAnalyticsService {
  initialize(): void;
  trackEvent(name: EventName, properties?: Partial<EventProperties>): void;
  trackPageView(name: string, properties?: Record<string, string>): void;
  trackException(error: Error, properties?: Record<string, string>): void;
  trackTrace(message: string, properties?: Record<string, string>): void;
  setAuthenticatedUser(userId: string): void;
  clearAuthenticatedUser(): void;
  flush(): void;
  isInitialized(): boolean;
}

// =============================================================================
// NOOP ANALYTICS SERVICE
// =============================================================================

/**
 * No-operation analytics service for testing and disabled states
 */
class NoopAnalyticsService implements IAnalyticsService {
  private _initialized = false;

  initialize(): void {
    this._initialized = true;
  }

  trackEvent(): void {
    // No-op
  }

  trackPageView(): void {
    // No-op
  }

  trackException(): void {
    // No-op
  }

  trackTrace(): void {
    // No-op
  }

  setAuthenticatedUser(): void {
    // No-op
  }

  clearAuthenticatedUser(): void {
    // No-op
  }

  flush(): void {
    // No-op
  }

  isInitialized(): boolean {
    return this._initialized;
  }
}

// =============================================================================
// DEVELOPMENT ANALYTICS SERVICE
// =============================================================================

/**
 * Development analytics service that logs to console
 */
class DevAnalyticsService implements IAnalyticsService {
  private _initialized = false;
  private debug: boolean;

  constructor(debug = true) {
    this.debug = debug;
  }

  initialize(): void {
    this._initialized = true;
    if (this.debug) {
      console.log('[Analytics] Initialized in development mode');
    }
  }

  trackEvent(name: EventName, properties?: Partial<EventProperties>): void {
    if (this.debug) {
      console.log('[Analytics] Event:', name, properties);
    }
  }

  trackPageView(name: string, properties?: Record<string, string>): void {
    if (this.debug) {
      console.log('[Analytics] Page View:', name, properties);
    }
  }

  trackException(error: Error, properties?: Record<string, string>): void {
    if (this.debug) {
      console.log('[Analytics] Exception:', error.message, properties);
    }
  }

  trackTrace(message: string, properties?: Record<string, string>): void {
    if (this.debug) {
      console.log('[Analytics] Trace:', message, properties);
    }
  }

  setAuthenticatedUser(userId: string): void {
    if (this.debug) {
      console.log('[Analytics] User authenticated:', userId);
    }
  }

  clearAuthenticatedUser(): void {
    if (this.debug) {
      console.log('[Analytics] User cleared');
    }
  }

  flush(): void {
    if (this.debug) {
      console.log('[Analytics] Flushed');
    }
  }

  isInitialized(): boolean {
    return this._initialized;
  }
}

// =============================================================================
// PRODUCTION ANALYTICS SERVICE
// =============================================================================

/**
 * Production analytics service using Azure Application Insights
 */
class AppInsightsAnalyticsService implements IAnalyticsService {
  private appInsights: ApplicationInsights | null = null;
  private config: Required<AnalyticsConfig>;
  private _initialized = false;

  constructor(config: AnalyticsConfig) {
    this.config = {
      connectionString: config.connectionString ?? '',
      enabled: config.enabled ?? true,
      debug: config.debug ?? false,
      disableTelemetry: config.disableTelemetry ?? false,
    };
  }

  initialize(): void {
    if (this._initialized || !this.config.connectionString || !this.config.enabled) {
      return;
    }

    // Only initialize in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    try {
      this.appInsights = new ApplicationInsights({
        config: {
          connectionString: this.config.connectionString,
          enableAutoRouteTracking: true,
          enableCorsCorrelation: true,
          enableRequestHeaderTracking: true,
          enableResponseHeaderTracking: true,
          disableTelemetry: this.config.disableTelemetry,
          enableDebug: this.config.debug,
        },
      });

      this.appInsights.loadAppInsights();
      this._initialized = true;

      if (this.config.debug) {
        console.log('[Analytics] Application Insights initialized');
      }
    } catch (error) {
      console.error('[Analytics] Failed to initialize Application Insights:', error);
    }
  }

  trackEvent(name: EventName, properties?: Partial<EventProperties>): void {
    if (!this._initialized || !this.appInsights) {
      return;
    }

    const telemetry: IEventTelemetry = {
      name,
      properties: properties as Record<string, string>,
    };

    this.appInsights.trackEvent(telemetry);

    if (this.config.debug) {
      console.log('[Analytics] Event tracked:', name, properties);
    }
  }

  trackPageView(name: string, properties?: Record<string, string>): void {
    if (!this._initialized || !this.appInsights) {
      return;
    }

    const telemetry: IPageViewTelemetry = {
      name,
      ...(properties && { properties }),
    };

    this.appInsights.trackPageView(telemetry);

    if (this.config.debug) {
      console.log('[Analytics] Page view tracked:', name);
    }
  }

  trackException(error: Error, properties?: Record<string, string>): void {
    if (!this._initialized || !this.appInsights) {
      return;
    }

    const telemetry: IExceptionTelemetry = {
      exception: error,
      ...(properties && { properties }),
    };

    this.appInsights.trackException(telemetry);

    if (this.config.debug) {
      console.log('[Analytics] Exception tracked:', error.message);
    }
  }

  trackTrace(message: string, properties?: Record<string, string>): void {
    if (!this._initialized || !this.appInsights) {
      return;
    }

    const telemetry: ITraceTelemetry = {
      message,
      ...(properties && { properties }),
    };

    this.appInsights.trackTrace(telemetry);

    if (this.config.debug) {
      console.log('[Analytics] Trace tracked:', message);
    }
  }

  setAuthenticatedUser(userId: string): void {
    if (!this._initialized || !this.appInsights) {
      return;
    }

    this.appInsights.setAuthenticatedUserContext(userId);

    if (this.config.debug) {
      console.log('[Analytics] User context set:', userId);
    }
  }

  clearAuthenticatedUser(): void {
    if (!this._initialized || !this.appInsights) {
      return;
    }

    this.appInsights.clearAuthenticatedUserContext();

    if (this.config.debug) {
      console.log('[Analytics] User context cleared');
    }
  }

  flush(): void {
    if (!this._initialized || !this.appInsights) {
      return;
    }

    this.appInsights.flush();

    if (this.config.debug) {
      console.log('[Analytics] Telemetry flushed');
    }
  }

  isInitialized(): boolean {
    return this._initialized;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create an analytics service instance based on configuration
 */
export function createAnalyticsService(config?: AnalyticsConfig): IAnalyticsService {
  // Test environment - return noop
  if (process.env.NODE_ENV === 'test') {
    return new NoopAnalyticsService();
  }

  // If disabled, return noop
  if (config?.enabled === false) {
    return new NoopAnalyticsService();
  }

  // Development mode - return dev service
  if (process.env.NODE_ENV === 'development') {
    return new DevAnalyticsService(config?.debug ?? true);
  }

  // Production mode - return App Insights service
  if (config?.connectionString) {
    return new AppInsightsAnalyticsService(config);
  }

  // No connection string in production - return noop
  console.warn('[Analytics] No connection string provided, analytics disabled');
  return new NoopAnalyticsService();
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let analyticsInstance: IAnalyticsService | null = null;

/**
 * Get the analytics service singleton instance
 */
export function getAnalyticsService(): IAnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new NoopAnalyticsService();
  }
  return analyticsInstance;
}

/**
 * Initialize the analytics service with configuration
 */
export function initializeAnalytics(config?: AnalyticsConfig): IAnalyticsService {
  analyticsInstance = createAnalyticsService(config);
  analyticsInstance.initialize();
  return analyticsInstance;
}

/**
 * Reset analytics instance (for testing)
 */
export function resetAnalytics(): void {
  analyticsInstance = null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  NoopAnalyticsService,
  DevAnalyticsService,
  AppInsightsAnalyticsService,
};
