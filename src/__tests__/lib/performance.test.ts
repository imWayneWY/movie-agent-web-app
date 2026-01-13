/**
 * Performance Monitoring Tests
 *
 * Tests for the performance monitoring utilities including:
 * - Web Vitals rating calculation
 * - PerformanceMonitor class
 * - Performance trackers
 * - Bundle size utilities
 */

import {
  WEB_VITALS_THRESHOLDS,
  getWebVitalRating,
  formatWebVitalValue,
  PerformanceMonitor,
  reportWebVitals,
  getPerformanceMonitor,
  resetPerformanceMonitor,
  createRenderTracker,
  createApiTracker,
  type WebVitalMetric,
  type PerformanceMetric,
} from '@/lib/performance';

// =============================================================================
// MOCKS
// =============================================================================

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

// Store original performance
const originalPerformance = global.performance;

beforeEach(() => {
  jest.clearAllMocks();
  resetPerformanceMonitor();
  
  // Mock performance API
  Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  // Restore original performance
  Object.defineProperty(global, 'performance', {
    value: originalPerformance,
    writable: true,
    configurable: true,
  });
});

// =============================================================================
// TESTS: WEB VITALS THRESHOLDS
// =============================================================================

describe('WEB_VITALS_THRESHOLDS', () => {
  it('should have thresholds for all Web Vital metrics', () => {
    expect(WEB_VITALS_THRESHOLDS).toHaveProperty('CLS');
    expect(WEB_VITALS_THRESHOLDS).toHaveProperty('FCP');
    expect(WEB_VITALS_THRESHOLDS).toHaveProperty('FID');
    expect(WEB_VITALS_THRESHOLDS).toHaveProperty('INP');
    expect(WEB_VITALS_THRESHOLDS).toHaveProperty('LCP');
    expect(WEB_VITALS_THRESHOLDS).toHaveProperty('TTFB');
  });

  it('should have good and poor thresholds for each metric', () => {
    Object.values(WEB_VITALS_THRESHOLDS).forEach((threshold) => {
      expect(threshold).toHaveProperty('good');
      expect(threshold).toHaveProperty('poor');
      expect(typeof threshold.good).toBe('number');
      expect(typeof threshold.poor).toBe('number');
      expect(threshold.poor).toBeGreaterThan(threshold.good);
    });
  });
});

// =============================================================================
// TESTS: getWebVitalRating
// =============================================================================

describe('getWebVitalRating', () => {
  describe('CLS', () => {
    it('should return "good" for values <= 0.1', () => {
      expect(getWebVitalRating('CLS', 0)).toBe('good');
      expect(getWebVitalRating('CLS', 0.05)).toBe('good');
      expect(getWebVitalRating('CLS', 0.1)).toBe('good');
    });

    it('should return "needs-improvement" for values between 0.1 and 0.25', () => {
      expect(getWebVitalRating('CLS', 0.15)).toBe('needs-improvement');
      expect(getWebVitalRating('CLS', 0.2)).toBe('needs-improvement');
      expect(getWebVitalRating('CLS', 0.25)).toBe('needs-improvement');
    });

    it('should return "poor" for values > 0.25', () => {
      expect(getWebVitalRating('CLS', 0.3)).toBe('poor');
      expect(getWebVitalRating('CLS', 0.5)).toBe('poor');
      expect(getWebVitalRating('CLS', 1)).toBe('poor');
    });
  });

  describe('LCP', () => {
    it('should return "good" for values <= 2500ms', () => {
      expect(getWebVitalRating('LCP', 1000)).toBe('good');
      expect(getWebVitalRating('LCP', 2000)).toBe('good');
      expect(getWebVitalRating('LCP', 2500)).toBe('good');
    });

    it('should return "needs-improvement" for values between 2500ms and 4000ms', () => {
      expect(getWebVitalRating('LCP', 3000)).toBe('needs-improvement');
      expect(getWebVitalRating('LCP', 3500)).toBe('needs-improvement');
      expect(getWebVitalRating('LCP', 4000)).toBe('needs-improvement');
    });

    it('should return "poor" for values > 4000ms', () => {
      expect(getWebVitalRating('LCP', 4500)).toBe('poor');
      expect(getWebVitalRating('LCP', 5000)).toBe('poor');
      expect(getWebVitalRating('LCP', 10000)).toBe('poor');
    });
  });

  describe('FID', () => {
    it('should return "good" for values <= 100ms', () => {
      expect(getWebVitalRating('FID', 50)).toBe('good');
      expect(getWebVitalRating('FID', 100)).toBe('good');
    });

    it('should return "needs-improvement" for values between 100ms and 300ms', () => {
      expect(getWebVitalRating('FID', 150)).toBe('needs-improvement');
      expect(getWebVitalRating('FID', 300)).toBe('needs-improvement');
    });

    it('should return "poor" for values > 300ms', () => {
      expect(getWebVitalRating('FID', 400)).toBe('poor');
    });
  });
});

// =============================================================================
// TESTS: formatWebVitalValue
// =============================================================================

describe('formatWebVitalValue', () => {
  it('should format CLS with 3 decimal places', () => {
    expect(formatWebVitalValue('CLS', 0.1)).toBe('0.100');
    expect(formatWebVitalValue('CLS', 0.123)).toBe('0.123');
    expect(formatWebVitalValue('CLS', 0.1234)).toBe('0.123');
  });

  it('should format time-based metrics in milliseconds', () => {
    expect(formatWebVitalValue('LCP', 2500)).toBe('2500ms');
    expect(formatWebVitalValue('FCP', 1800)).toBe('1800ms');
    expect(formatWebVitalValue('FID', 100)).toBe('100ms');
    expect(formatWebVitalValue('TTFB', 800)).toBe('800ms');
    expect(formatWebVitalValue('INP', 200)).toBe('200ms');
  });

  it('should round time values to integers', () => {
    expect(formatWebVitalValue('LCP', 2500.7)).toBe('2501ms');
    expect(formatWebVitalValue('FCP', 1800.3)).toBe('1800ms');
  });
});

// =============================================================================
// TESTS: PerformanceMonitor
// =============================================================================

describe('PerformanceMonitor', () => {
  describe('constructor', () => {
    it('should create with default config', () => {
      const monitor = new PerformanceMonitor();
      expect(monitor).toBeDefined();
    });

    it('should create with custom config', () => {
      const onReport = jest.fn();
      const monitor = new PerformanceMonitor({
        enabled: true,
        debug: true,
        onReport,
        sampleRate: 0.5,
      });
      expect(monitor).toBeDefined();
    });
  });

  describe('mark and measure', () => {
    it('should record marks and return duration', () => {
      let currentTime = 1000;
      mockPerformance.now.mockImplementation(() => {
        const time = currentTime;
        currentTime += 100;
        return time;
      });

      const monitor = new PerformanceMonitor({ enabled: true });
      monitor.mark('test-operation');
      
      const duration = monitor.measure('test-operation');
      expect(duration).toBe(100);
    });

    it('should return null for non-existent mark', () => {
      const monitor = new PerformanceMonitor({ enabled: true });
      const duration = monitor.measure('non-existent');
      expect(duration).toBeNull();
    });

    it('should call onReport when measuring', () => {
      const onReport = jest.fn();
      let currentTime = 0;
      mockPerformance.now.mockImplementation(() => {
        const time = currentTime;
        currentTime += 50;
        return time;
      });

      const monitor = new PerformanceMonitor({
        enabled: true,
        onReport,
        sampleRate: 1,
      });

      monitor.mark('api-call');
      monitor.measure('api-call', { endpoint: '/api/test' });

      expect(onReport).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'api-call',
          value: 50,
          unit: 'ms',
          metadata: expect.objectContaining({
            endpoint: '/api/test',
          }),
        })
      );
    });

    it('should not record when disabled', () => {
      const onReport = jest.fn();
      const monitor = new PerformanceMonitor({
        enabled: false,
        onReport,
      });

      monitor.mark('test');
      const duration = monitor.measure('test');

      expect(duration).toBeNull();
      expect(onReport).not.toHaveBeenCalled();
    });
  });

  describe('recordMetric', () => {
    it('should record custom metrics', () => {
      const onReport = jest.fn();
      const monitor = new PerformanceMonitor({
        enabled: true,
        onReport,
        sampleRate: 1,
      });

      monitor.recordMetric('bundle-size', 150000, 'bytes', { chunk: 'main' });

      expect(onReport).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'bundle-size',
          value: 150000,
          unit: 'bytes',
          metadata: { chunk: 'main' },
        })
      );
    });
  });

  describe('getMetrics', () => {
    it('should return all recorded metrics', () => {
      const monitor = new PerformanceMonitor({ enabled: true });
      
      monitor.recordMetric('metric1', 100, 'ms');
      monitor.recordMetric('metric2', 200, 'ms');

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(2);
      expect(metrics[0].name).toBe('metric1');
      expect(metrics[1].name).toBe('metric2');
    });
  });

  describe('clearMetrics', () => {
    it('should clear all recorded metrics', () => {
      const monitor = new PerformanceMonitor({ enabled: true });
      
      monitor.recordMetric('metric1', 100, 'ms');
      monitor.clearMetrics();

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(0);
    });
  });

  describe('sampling', () => {
    it('should respect sample rate', () => {
      const onReport = jest.fn();
      const monitor = new PerformanceMonitor({
        enabled: true,
        onReport,
        sampleRate: 0, // Never sample
      });

      monitor.recordMetric('test', 100, 'ms');
      expect(onReport).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// TESTS: reportWebVitals
// =============================================================================

describe('reportWebVitals', () => {
  it('should log metric in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const metric: WebVitalMetric = {
      id: 'test-id',
      name: 'LCP',
      value: 2000,
      rating: 'good',
      delta: 100,
      navigationType: 'navigate',
    };

    reportWebVitals(metric);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Web Vitals]'),
      expect.anything()
    );

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});

// =============================================================================
// TESTS: getPerformanceMonitor (Singleton)
// =============================================================================

describe('getPerformanceMonitor', () => {
  it('should return the same instance', () => {
    const monitor1 = getPerformanceMonitor();
    const monitor2 = getPerformanceMonitor();
    expect(monitor1).toBe(monitor2);
  });

  it('should return new instance after reset', () => {
    const monitor1 = getPerformanceMonitor();
    resetPerformanceMonitor();
    const monitor2 = getPerformanceMonitor();
    expect(monitor1).not.toBe(monitor2);
  });
});

// =============================================================================
// TESTS: createRenderTracker
// =============================================================================

describe('createRenderTracker', () => {
  it('should create tracker with start and end methods', () => {
    const tracker = createRenderTracker('TestComponent');
    
    expect(tracker).toHaveProperty('start');
    expect(tracker).toHaveProperty('end');
    expect(typeof tracker.start).toBe('function');
    expect(typeof tracker.end).toBe('function');
  });

  it('should track render timing', () => {
    let currentTime = 0;
    mockPerformance.now.mockImplementation(() => {
      const time = currentTime;
      currentTime += 16; // ~60fps
      return time;
    });

    const tracker = createRenderTracker('MyComponent');
    
    tracker.start();
    const duration = tracker.end({ props: 'test' });

    expect(duration).toBe(16);
  });
});

// =============================================================================
// TESTS: createApiTracker
// =============================================================================

describe('createApiTracker', () => {
  it('should create tracker with start and end methods', () => {
    const tracker = createApiTracker('/api/recommend');
    
    expect(tracker).toHaveProperty('start');
    expect(tracker).toHaveProperty('end');
  });

  it('should track API call timing', () => {
    let currentTime = 0;
    mockPerformance.now.mockImplementation(() => {
      const time = currentTime;
      currentTime += 200;
      return time;
    });

    const tracker = createApiTracker('/api/recommend');
    
    tracker.start();
    const duration = tracker.end(true, { status: 200 });

    expect(duration).toBe(200);
  });
});
