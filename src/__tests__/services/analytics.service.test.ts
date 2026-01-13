/**
 * Analytics Service Tests
 *
 * Tests for the Azure Application Insights analytics service,
 * including the factory function, noop service, dev service,
 * and production service.
 */

import {
  createAnalyticsService,
  getAnalyticsService,
  initializeAnalytics,
  resetAnalytics,
  NoopAnalyticsService,
  DevAnalyticsService,
  AppInsightsAnalyticsService,
  type AnalyticsConfig,
  type IAnalyticsService,
} from '@/services/analytics.service';

// =============================================================================
// MOCK APPLICATION INSIGHTS
// =============================================================================

// Mock the Application Insights module
jest.mock('@microsoft/applicationinsights-web', () => ({
  ApplicationInsights: jest.fn().mockImplementation(() => ({
    loadAppInsights: jest.fn(),
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
    trackException: jest.fn(),
    trackTrace: jest.fn(),
    setAuthenticatedUserContext: jest.fn(),
    clearAuthenticatedUserContext: jest.fn(),
    flush: jest.fn(),
  })),
}));

// =============================================================================
// TEST SETUP
// =============================================================================

describe('Analytics Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetAnalytics();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetAnalytics();
  });

  // ===========================================================================
  // NOOP ANALYTICS SERVICE
  // ===========================================================================

  describe('NoopAnalyticsService', () => {
    let service: NoopAnalyticsService;

    beforeEach(() => {
      service = new NoopAnalyticsService();
    });

    it('should not be initialized before calling initialize()', () => {
      expect(service.isInitialized()).toBe(false);
    });

    it('should be initialized after calling initialize()', () => {
      service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should not throw when calling trackEvent', () => {
      service.initialize();
      expect(() => service.trackEvent('mood_selected', { category: 'user_interaction' })).not.toThrow();
    });

    it('should not throw when calling trackPageView', () => {
      service.initialize();
      expect(() => service.trackPageView('test-page')).not.toThrow();
    });

    it('should not throw when calling trackException', () => {
      service.initialize();
      expect(() => service.trackException(new Error('test error'))).not.toThrow();
    });

    it('should not throw when calling trackTrace', () => {
      service.initialize();
      expect(() => service.trackTrace('test trace')).not.toThrow();
    });

    it('should not throw when calling setAuthenticatedUser', () => {
      service.initialize();
      expect(() => service.setAuthenticatedUser('user-123')).not.toThrow();
    });

    it('should not throw when calling clearAuthenticatedUser', () => {
      service.initialize();
      expect(() => service.clearAuthenticatedUser()).not.toThrow();
    });

    it('should not throw when calling flush', () => {
      service.initialize();
      expect(() => service.flush()).not.toThrow();
    });
  });

  // ===========================================================================
  // DEV ANALYTICS SERVICE
  // ===========================================================================

  describe('DevAnalyticsService', () => {
    let service: DevAnalyticsService;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    describe('with debug enabled', () => {
      beforeEach(() => {
        service = new DevAnalyticsService(true);
        service.initialize();
      });

      it('should log initialization message', () => {
        expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Initialized in development mode');
      });

      it('should log events', () => {
        service.trackEvent('mood_selected', { category: 'user_interaction', mood: 'happy' });
        expect(consoleSpy).toHaveBeenCalledWith(
          '[Analytics] Event:',
          'mood_selected',
          { category: 'user_interaction', mood: 'happy' }
        );
      });

      it('should log page views', () => {
        service.trackPageView('/home');
        expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Page View:', '/home', undefined);
      });

      it('should log exceptions', () => {
        service.trackException(new Error('Test error'));
        expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Exception:', 'Test error', undefined);
      });

      it('should log traces', () => {
        service.trackTrace('Test trace message');
        expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Trace:', 'Test trace message', undefined);
      });

      it('should log user authentication', () => {
        service.setAuthenticatedUser('user-123');
        expect(consoleSpy).toHaveBeenCalledWith('[Analytics] User authenticated:', 'user-123');
      });

      it('should log user cleared', () => {
        service.clearAuthenticatedUser();
        expect(consoleSpy).toHaveBeenCalledWith('[Analytics] User cleared');
      });

      it('should log flush', () => {
        service.flush();
        expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Flushed');
      });

      it('should be initialized after calling initialize()', () => {
        expect(service.isInitialized()).toBe(true);
      });
    });

    describe('with debug disabled', () => {
      beforeEach(() => {
        service = new DevAnalyticsService(false);
        service.initialize();
      });

      it('should not log events', () => {
        service.trackEvent('mood_selected', { category: 'user_interaction' });
        expect(consoleSpy).not.toHaveBeenCalled();
      });

      it('should still be initialized', () => {
        expect(service.isInitialized()).toBe(true);
      });
    });
  });

  // ===========================================================================
  // CREATE ANALYTICS SERVICE FACTORY
  // ===========================================================================

  describe('createAnalyticsService', () => {
    describe('in test environment', () => {
      it('should return NoopAnalyticsService', () => {
        const service = createAnalyticsService();
        expect(service).toBeInstanceOf(NoopAnalyticsService);
      });
    });

    describe('when disabled', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('should return NoopAnalyticsService when disabled', () => {
        const service = createAnalyticsService({ enabled: false });
        expect(service).toBeInstanceOf(NoopAnalyticsService);
      });
    });

    describe('in development environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('should return DevAnalyticsService', () => {
        const service = createAnalyticsService();
        expect(service).toBeInstanceOf(DevAnalyticsService);
      });

      it('should respect debug config', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const service = createAnalyticsService({ debug: false });
        service.initialize();
        
        // Debug is false, so no logs
        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('in production environment', () => {
      let consoleWarnSpy: jest.SpyInstance;

      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleWarnSpy.mockRestore();
      });

      it('should return NoopAnalyticsService without connection string', () => {
        const service = createAnalyticsService();
        expect(service).toBeInstanceOf(NoopAnalyticsService);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[Analytics] No connection string provided, analytics disabled'
        );
      });

      it('should return AppInsightsAnalyticsService with connection string', () => {
        const service = createAnalyticsService({
          connectionString: 'InstrumentationKey=test-key',
        });
        expect(service).toBeInstanceOf(AppInsightsAnalyticsService);
      });
    });
  });

  // ===========================================================================
  // SINGLETON FUNCTIONS
  // ===========================================================================

  describe('getAnalyticsService', () => {
    it('should return NoopAnalyticsService when not initialized', () => {
      const service = getAnalyticsService();
      expect(service).toBeInstanceOf(NoopAnalyticsService);
    });

    it('should return the same instance on subsequent calls', () => {
      const service1 = getAnalyticsService();
      const service2 = getAnalyticsService();
      expect(service1).toBe(service2);
    });
  });

  describe('initializeAnalytics', () => {
    it('should create and initialize the analytics service', () => {
      const service = initializeAnalytics();
      expect(service.isInitialized()).toBe(true);
    });

    it('should return the initialized service', () => {
      const service = initializeAnalytics();
      const retrieved = getAnalyticsService();
      expect(service).toBe(retrieved);
    });
  });

  describe('resetAnalytics', () => {
    it('should reset the singleton instance', () => {
      const service1 = initializeAnalytics();
      resetAnalytics();
      const service2 = getAnalyticsService();
      expect(service1).not.toBe(service2);
    });
  });

  // ===========================================================================
  // APP INSIGHTS ANALYTICS SERVICE
  // ===========================================================================

  describe('AppInsightsAnalyticsService', () => {
    let service: AppInsightsAnalyticsService;
    const mockConnectionString = 'InstrumentationKey=test-key;IngestionEndpoint=https://test.in.applicationinsights.azure.com/';

    // Mock window for browser environment
    const originalWindow = global.window;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      // @ts-expect-error - mocking window
      global.window = {};
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should not initialize without connection string', () => {
      service = new AppInsightsAnalyticsService({ connectionString: '' });
      service.initialize();
      expect(service.isInitialized()).toBe(false);
    });

    it('should not initialize when disabled', () => {
      service = new AppInsightsAnalyticsService({
        connectionString: mockConnectionString,
        enabled: false,
      });
      service.initialize();
      expect(service.isInitialized()).toBe(false);
    });

    it('should not initialize without window (SSR)', () => {
      // @ts-expect-error - removing window
      delete global.window;
      service = new AppInsightsAnalyticsService({
        connectionString: mockConnectionString,
      });
      service.initialize();
      expect(service.isInitialized()).toBe(false);
    });

    it('should initialize with valid configuration', () => {
      service = new AppInsightsAnalyticsService({
        connectionString: mockConnectionString,
      });
      service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should not initialize twice', () => {
      service = new AppInsightsAnalyticsService({
        connectionString: mockConnectionString,
      });
      service.initialize();
      service.initialize(); // Second call should be no-op
      expect(service.isInitialized()).toBe(true);
    });

    describe('when initialized', () => {
      beforeEach(() => {
        service = new AppInsightsAnalyticsService({
          connectionString: mockConnectionString,
          debug: true,
        });
        service.initialize();
      });

      it('should track events', () => {
        expect(() => {
          service.trackEvent('mood_selected', { category: 'user_interaction' });
        }).not.toThrow();
      });

      it('should track page views', () => {
        expect(() => {
          service.trackPageView('/test-page');
        }).not.toThrow();
      });

      it('should track exceptions', () => {
        expect(() => {
          service.trackException(new Error('Test error'));
        }).not.toThrow();
      });

      it('should track traces', () => {
        expect(() => {
          service.trackTrace('Test trace');
        }).not.toThrow();
      });

      it('should set authenticated user', () => {
        expect(() => {
          service.setAuthenticatedUser('user-123');
        }).not.toThrow();
      });

      it('should clear authenticated user', () => {
        expect(() => {
          service.clearAuthenticatedUser();
        }).not.toThrow();
      });

      it('should flush telemetry', () => {
        expect(() => {
          service.flush();
        }).not.toThrow();
      });
    });

    describe('when not initialized', () => {
      beforeEach(() => {
        service = new AppInsightsAnalyticsService({
          connectionString: '', // Empty to prevent initialization
        });
      });

      it('should not throw on trackEvent', () => {
        expect(() => {
          service.trackEvent('mood_selected');
        }).not.toThrow();
      });

      it('should not throw on trackPageView', () => {
        expect(() => {
          service.trackPageView('/test');
        }).not.toThrow();
      });

      it('should not throw on trackException', () => {
        expect(() => {
          service.trackException(new Error('test'));
        }).not.toThrow();
      });

      it('should not throw on flush', () => {
        expect(() => {
          service.flush();
        }).not.toThrow();
      });
    });
  });

  // ===========================================================================
  // EVENT NAMES
  // ===========================================================================

  describe('Event Names', () => {
    let service: DevAnalyticsService;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      service = new DevAnalyticsService(true);
      service.initialize();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    const eventTests = [
      { name: 'mood_selected', category: 'user_interaction' },
      { name: 'genre_selected', category: 'filter' },
      { name: 'genre_deselected', category: 'filter' },
      { name: 'platform_selected', category: 'filter' },
      { name: 'platform_deselected', category: 'filter' },
      { name: 'runtime_filter_changed', category: 'filter' },
      { name: 'year_filter_changed', category: 'filter' },
      { name: 'filters_expanded', category: 'user_interaction' },
      { name: 'filters_collapsed', category: 'user_interaction' },
      { name: 'filters_reset', category: 'user_interaction' },
      { name: 'recommendations_requested', category: 'recommendation' },
      { name: 'recommendations_received', category: 'recommendation' },
      { name: 'recommendations_error', category: 'error' },
      { name: 'streaming_started', category: 'streaming' },
      { name: 'streaming_completed', category: 'streaming' },
      { name: 'streaming_stopped', category: 'streaming' },
      { name: 'streaming_error', category: 'error' },
      { name: 'mode_switched', category: 'user_interaction' },
      { name: 'movie_card_viewed', category: 'movie' },
      { name: 'platform_link_clicked', category: 'movie' },
      { name: 'theme_changed', category: 'user_interaction' },
    ] as const;

    it.each(eventTests)('should track $name event', ({ name, category }) => {
      service.trackEvent(name as any, { category: category as any });
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Event:',
        name,
        expect.objectContaining({ category })
      );
    });
  });
});
