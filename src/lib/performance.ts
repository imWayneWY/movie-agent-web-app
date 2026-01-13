/**
 * Performance Monitoring Utilities
 *
 * Provides Core Web Vitals tracking, performance metrics collection,
 * and integration with Azure Application Insights for monitoring.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Web Vitals metric names
 */
export type WebVitalName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';

/**
 * Web Vitals rating thresholds
 */
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Web Vitals metric structure
 */
export interface WebVitalMetric {
  /** Metric identifier */
  id: string;
  /** Metric name */
  name: WebVitalName;
  /** Metric value */
  value: number;
  /** Metric rating */
  rating: WebVitalRating;
  /** Delta from previous measurement */
  delta: number;
  /** Navigation type */
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore';
}

/**
 * Performance entry for custom metrics
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, string | number | boolean> | undefined;
}

/**
 * Performance reporter callback type
 */
export type PerformanceReporter = (metric: WebVitalMetric | PerformanceMetric) => void;

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  /** Enable performance monitoring */
  enabled?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom reporter callback */
  onReport?: PerformanceReporter;
  /** Sample rate for metrics (0-1) */
  sampleRate?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Web Vitals thresholds based on Google's recommendations
 * @see https://web.dev/vitals/
 */
export const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get rating for a Web Vital metric value
 */
export function getWebVitalRating(
  name: WebVitalName,
  value: number
): WebVitalRating {
  const thresholds = WEB_VITALS_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Format Web Vital value for display
 */
export function formatWebVitalValue(name: WebVitalName, value: number): string {
  switch (name) {
    case 'CLS':
      return value.toFixed(3);
    case 'FCP':
    case 'FID':
    case 'INP':
    case 'LCP':
    case 'TTFB':
      return `${Math.round(value)}ms`;
    default:
      return String(value);
  }
}

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if performance API is available
 */
function isPerformanceSupported(): boolean {
  return isBrowser() && 'performance' in window;
}

/**
 * Generate a unique metric ID
 */
function generateMetricId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// =============================================================================
// PERFORMANCE MEASUREMENT CLASS
// =============================================================================

/**
 * PerformanceMonitor class for tracking performance metrics
 */
export class PerformanceMonitor {
  private config: Required<PerformanceMonitorConfig>;
  private marks: Map<string, number> = new Map();
  private metrics: PerformanceMetric[] = [];

  constructor(config: PerformanceMonitorConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      debug: config.debug ?? false,
      onReport: config.onReport ?? (() => {}),
      sampleRate: config.sampleRate ?? 1,
    };
  }

  /**
   * Check if this metric should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Log debug message
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[Performance] ${message}`, data ?? '');
    }
  }

  /**
   * Start a performance mark
   */
  mark(name: string): void {
    if (!this.config.enabled || !isPerformanceSupported()) return;

    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    
    // Also use native Performance API
    try {
      performance.mark(`app-${name}-start`);
    } catch {
      // Ignore if mark already exists
    }

    this.log(`Mark started: ${name}`, { timestamp });
  }

  /**
   * End a performance mark and record the duration
   */
  measure(name: string, metadata?: Record<string, string | number | boolean>): number | null {
    if (!this.config.enabled || !isPerformanceSupported()) return null;

    const startTime = this.marks.get(name);
    if (startTime === undefined) {
      this.log(`No mark found for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Clean up the mark
    this.marks.delete(name);

    // Record metric
    const metric: PerformanceMetric = {
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    
    if (this.shouldSample()) {
      this.config.onReport(metric);
    }

    this.log(`Measure completed: ${name}`, { duration, metadata });

    return duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    metadata?: Record<string, string | number | boolean>
  ): void {
    if (!this.config.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    
    if (this.shouldSample()) {
      this.config.onReport(metric);
    }

    this.log(`Metric recorded: ${name}`, { value, unit, metadata });
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Get navigation timing metrics
   */
  getNavigationTiming(): Record<string, number> | null {
    if (!isPerformanceSupported()) return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!navigation) return null;

    return {
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      serverResponse: navigation.responseEnd - navigation.requestStart,
      domParsing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
      resourceLoading: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
      totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
    };
  }

  /**
   * Get resource timing entries
   */
  getResourceTimings(resourceType?: string): PerformanceResourceTiming[] {
    if (!isPerformanceSupported()) return [];

    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    if (resourceType) {
      return entries.filter(entry => entry.initiatorType === resourceType);
    }
    
    return entries;
  }

  /**
   * Get memory usage (Chrome only)
   */
  getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number } | null {
    if (!isBrowser()) return null;
    
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    if (!memory) return null;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
    };
  }
}

// =============================================================================
// WEB VITALS REPORTER
// =============================================================================

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: WebVitalMetric): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const rating = getWebVitalRating(metric.name, metric.value);
    const formattedValue = formatWebVitalValue(metric.name, metric.value);
    console.log(
      `[Web Vitals] ${metric.name}: ${formattedValue} (${rating})`,
      { id: metric.id, delta: metric.delta }
    );
  }
}

/**
 * Initialize Web Vitals tracking
 * Must be called in a client component or useEffect
 */
export async function initWebVitals(
  onReport: (metric: WebVitalMetric) => void = reportWebVitals
): Promise<void> {
  if (!isBrowser()) return;

  try {
    // Dynamically import web-vitals to reduce bundle size
    const { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } = await import('web-vitals');

    const handleMetric = (metric: {
      id: string;
      name: WebVitalName;
      value: number;
      delta: number;
      navigationType: WebVitalMetric['navigationType'];
    }) => {
      const webVitalMetric: WebVitalMetric = {
        ...metric,
        rating: getWebVitalRating(metric.name, metric.value),
      };
      onReport(webVitalMetric);
    };

    onCLS(handleMetric);
    onFCP(handleMetric);
    onFID(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  } catch (error) {
    console.warn('[Performance] Failed to initialize Web Vitals:', error);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let performanceMonitor: PerformanceMonitor | null = null;

/**
 * Get the global PerformanceMonitor instance
 */
export function getPerformanceMonitor(
  config?: PerformanceMonitorConfig
): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(config);
  }
  return performanceMonitor;
}

/**
 * Reset the global PerformanceMonitor instance (useful for testing)
 */
export function resetPerformanceMonitor(): void {
  performanceMonitor = null;
}

// =============================================================================
// HOOKS FOR REACT COMPONENTS
// =============================================================================

/**
 * Create a performance tracker for component render timing
 */
export function createRenderTracker(componentName: string) {
  const monitor = getPerformanceMonitor();
  
  return {
    start: () => monitor.mark(`render-${componentName}`),
    end: (metadata?: Record<string, string | number | boolean>) =>
      monitor.measure(`render-${componentName}`, {
        component: componentName,
        ...metadata,
      }),
  };
}

/**
 * Create a performance tracker for API calls
 */
export function createApiTracker(endpoint: string) {
  const monitor = getPerformanceMonitor();
  const markName = `api-${endpoint}-${generateMetricId()}`;
  
  return {
    start: () => monitor.mark(markName),
    end: (success: boolean, metadata?: Record<string, string | number | boolean>) =>
      monitor.measure(markName, {
        endpoint,
        success,
        ...metadata,
      }),
  };
}

// =============================================================================
// BUNDLE SIZE UTILITIES
// =============================================================================

/**
 * Estimate transferred size for a resource
 */
export function getTransferredSize(url: string): number | null {
  if (!isPerformanceSupported()) return null;

  const entries = performance.getEntriesByName(url) as PerformanceResourceTiming[];
  const entry = entries[0];
  
  return entry?.transferSize ?? null;
}

/**
 * Get total JavaScript bundle size from resource timing
 */
export function getTotalJsBundleSize(): number {
  if (!isPerformanceSupported()) return 0;

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return entries
    .filter(entry => entry.initiatorType === 'script')
    .reduce((total, entry) => total + (entry.transferSize || 0), 0);
}

/**
 * Get total CSS bundle size from resource timing
 */
export function getTotalCssBundleSize(): number {
  if (!isPerformanceSupported()) return 0;

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return entries
    .filter(entry => entry.initiatorType === 'link' || entry.name.endsWith('.css'))
    .reduce((total, entry) => total + (entry.transferSize || 0), 0);
}
