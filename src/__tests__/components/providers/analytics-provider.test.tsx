/**
 * Analytics Provider Tests
 *
 * Tests for the AnalyticsProvider component that initializes
 * and provides analytics context to the application.
 */

import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { AnalyticsProvider, AnalyticsContext } from '@/components/providers';
import * as analyticsService from '@/services/analytics.service';

// =============================================================================
// MOCKS
// =============================================================================

// Mock next/navigation
const mockPathname = jest.fn().mockReturnValue('/');
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock the analytics service module
jest.mock('@/services/analytics.service', () => ({
  ...jest.requireActual('@/services/analytics.service'),
  createAnalyticsService: jest.fn(),
}));

// Mock environment config
jest.mock('@/config/env', () => ({
  env: {
    appInsightsConnectionString: 'mock-connection-string',
    isDevelopment: false,
    isTest: true,
  },
}));

// =============================================================================
// TEST SETUP
// =============================================================================

describe('AnalyticsProvider', () => {
  let mockAnalyticsService: jest.Mocked<analyticsService.IAnalyticsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/');

    // Create mock analytics service
    mockAnalyticsService = {
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

    (analyticsService.createAnalyticsService as jest.Mock).mockReturnValue(mockAnalyticsService);
  });

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('rendering', () => {
    it('should render children', () => {
      render(
        <AnalyticsProvider>
          <div data-testid="child">Test Child</div>
        </AnalyticsProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <AnalyticsProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </AnalyticsProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  describe('initialization', () => {
    it('should create analytics service on mount', async () => {
      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(analyticsService.createAnalyticsService).toHaveBeenCalled();
      });
    });

    it('should initialize the analytics service', async () => {
      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(mockAnalyticsService.initialize).toHaveBeenCalled();
      });
    });

    it('should not initialize when disabled', async () => {
      render(
        <AnalyticsProvider disabled>
          <div>Test</div>
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(analyticsService.createAnalyticsService).not.toHaveBeenCalled();
      });
    });

    it('should pass debug config to analytics service', async () => {
      render(
        <AnalyticsProvider debug>
          <div>Test</div>
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(analyticsService.createAnalyticsService).toHaveBeenCalledWith(
          expect.objectContaining({
            debug: true,
          })
        );
      });
    });

    it('should pass custom config to analytics service', async () => {
      render(
        <AnalyticsProvider config={{ disableTelemetry: true }}>
          <div>Test</div>
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(analyticsService.createAnalyticsService).toHaveBeenCalledWith(
          expect.objectContaining({
            disableTelemetry: true,
          })
        );
      });
    });
  });

  // ===========================================================================
  // PAGE VIEW TRACKING
  // ===========================================================================

  describe('page view tracking', () => {
    it('should track initial page view', async () => {
      mockPathname.mockReturnValue('/home');

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(mockAnalyticsService.trackPageView).toHaveBeenCalledWith('/home');
      });
    });

    it('should track page view when pathname changes', async () => {
      mockPathname.mockReturnValue('/page1');

      const { rerender } = render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(mockAnalyticsService.trackPageView).toHaveBeenCalledWith('/page1');
      });

      mockPathname.mockReturnValue('/page2');

      rerender(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(mockAnalyticsService.trackPageView).toHaveBeenCalledWith('/page2');
      });
    });
  });

  // ===========================================================================
  // CONTEXT PROVISION
  // ===========================================================================

  describe('context provision', () => {
    it('should provide analytics service through context', async () => {
      let contextValue: analyticsService.IAnalyticsService | null = null;

      function TestComponent() {
        contextValue = useContext(AnalyticsContext);
        return <div>Test</div>;
      }

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBe(mockAnalyticsService);
      });
    });

    it('should provide null context when disabled', async () => {
      let contextValue: analyticsService.IAnalyticsService | null | undefined;

      function TestComponent() {
        contextValue = useContext(AnalyticsContext);
        return <div>Test</div>;
      }

      render(
        <AnalyticsProvider disabled>
          <TestComponent />
        </AnalyticsProvider>
      );

      // When disabled, the context should be null
      await waitFor(() => {
        expect(contextValue).toBeNull();
      });
    });
  });

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  describe('cleanup', () => {
    it('should flush analytics on unmount', async () => {
      const { unmount } = render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(mockAnalyticsService.initialize).toHaveBeenCalled();
      });

      unmount();

      expect(mockAnalyticsService.flush).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // DISPLAY NAME
  // ===========================================================================

  describe('display name', () => {
    it('should have correct display name', () => {
      expect(AnalyticsProvider.displayName).toBe('AnalyticsProvider');
    });
  });

  // ===========================================================================
  // INTEGRATION WITH USEANALYTICS
  // ===========================================================================

  describe('integration with useAnalytics hook', () => {
    it('should allow tracking events through context', async () => {
      function TestComponent() {
        const analytics = useContext(AnalyticsContext);
        React.useEffect(() => {
          analytics?.trackEvent('mood_selected', { category: 'user_interaction' });
        }, [analytics]);
        return <div>Test</div>;
      }

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      await waitFor(() => {
        expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('mood_selected', {
          category: 'user_interaction',
        });
      });
    });
  });
});
