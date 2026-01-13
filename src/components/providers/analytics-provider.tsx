/**
 * Analytics Provider Component
 *
 * Provides analytics context to the application, initializing Azure Application Insights
 * and making the analytics service available throughout the component tree.
 */

'use client';

import * as React from 'react';
import { createContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  createAnalyticsService,
  type IAnalyticsService,
  type AnalyticsConfig,
} from '@/services/analytics.service';
import { env } from '@/config/env';

// =============================================================================
// CONTEXT
// =============================================================================

/**
 * Analytics context - provides access to the analytics service
 */
export const AnalyticsContext = createContext<IAnalyticsService | null>(null);

// =============================================================================
// PROVIDER PROPS
// =============================================================================

export interface AnalyticsProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Optional configuration override (mainly for testing) */
  config?: Partial<AnalyticsConfig>;
  /** Enable debug mode */
  debug?: boolean;
  /** Disable analytics completely */
  disabled?: boolean;
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

/**
 * AnalyticsProvider
 *
 * Wraps the application to provide analytics tracking capabilities.
 * Automatically tracks page views when the route changes.
 *
 * @example
 * ```tsx
 * <AnalyticsProvider>
 *   <App />
 * </AnalyticsProvider>
 * ```
 */
export function AnalyticsProvider({
  children,
  config,
  debug,
  disabled,
}: AnalyticsProviderProps): React.ReactElement {
  const [analytics, setAnalytics] = useState<IAnalyticsService | null>(null);
  const pathname = usePathname();

  // Initialize analytics on mount
  useEffect(() => {
    // Don't initialize if disabled
    if (disabled) {
      return;
    }

    // Create analytics configuration
    const analyticsConfig: AnalyticsConfig = {
      enabled: !disabled,
      debug: debug ?? env.isDevelopment,
      disableTelemetry: env.isTest,
      ...config,
    };

    // Only add connectionString if it exists
    if (env.appInsightsConnectionString) {
      analyticsConfig.connectionString = env.appInsightsConnectionString;
    }

    // Create and initialize the service
    const service = createAnalyticsService(analyticsConfig);
    service.initialize();
    setAnalytics(service);

    // Cleanup on unmount
    return () => {
      service.flush();
    };
  }, [config, debug, disabled]);

  // Track page views when pathname changes
  useEffect(() => {
    if (analytics && pathname) {
      analytics.trackPageView(pathname);
    }
  }, [analytics, pathname]);

  // Memoize context value
  const contextValue = useMemo(() => analytics, [analytics]);

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// =============================================================================
// DISPLAY NAME
// =============================================================================

AnalyticsProvider.displayName = 'AnalyticsProvider';
