'use client';

/**
 * WebVitals Component
 *
 * Reports Core Web Vitals metrics to analytics.
 * This component should be rendered once at the root of the application.
 */

import { useEffect, useRef } from 'react';
import { initWebVitals, type WebVitalMetric } from '@/lib/performance';

// =============================================================================
// TYPES
// =============================================================================

export interface WebVitalsProps {
  /**
   * Enable reporting (defaults to true in production)
   */
  enabled?: boolean;
  /**
   * Custom reporter callback
   */
  onReport?: (metric: WebVitalMetric) => void;
  /**
   * Enable debug logging
   */
  debug?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * WebVitals component for reporting Core Web Vitals
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <WebVitals />
 *
 * // With custom reporter
 * <WebVitals onReport={(metric) => sendToAnalytics(metric)} />
 * ```
 */
export function WebVitals({
  enabled = process.env.NODE_ENV === 'production',
  onReport,
  debug = false,
}: WebVitalsProps) {
  const initialized = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initialized.current) return;
    if (!enabled) {
      if (debug) {
        console.log('[WebVitals] Disabled');
      }
      return;
    }

    initialized.current = true;

    const handleMetric = (metric: WebVitalMetric) => {
      if (debug) {
        console.log('[WebVitals] Metric:', metric.name, metric.value, metric.rating);
      }

      // Call custom reporter if provided
      if (onReport) {
        onReport(metric);
      }

      // Send to analytics (e.g., Application Insights)
      try {
        // Track as custom event via analytics service
        if (typeof window !== 'undefined') {
          const win = window as unknown as {
            appInsights?: {
              trackMetric: (metric: {
                name: string;
                average: number;
                properties?: Record<string, string>;
              }) => void;
            };
          };
          if (win.appInsights) {
            win.appInsights.trackMetric({
              name: `WebVital_${metric.name}`,
              average: metric.value,
              properties: {
                rating: metric.rating,
                navigationType: metric.navigationType,
                id: metric.id,
              },
            });
          }
        }
      } catch {
        // Silently fail if analytics is not available
      }
    };

    // Initialize Web Vitals tracking
    initWebVitals(handleMetric).catch((error) => {
      if (debug) {
        console.warn('[WebVitals] Failed to initialize:', error);
      }
    });
  }, [enabled, onReport, debug]);

  // This component doesn't render anything
  return null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default WebVitals;
