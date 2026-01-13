/**
 * WebVitals Component Tests
 *
 * Tests for the WebVitals component including:
 * - Initialization behavior
 * - Custom reporter callback
 * - Enable/disable functionality
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { WebVitals, type WebVitalsProps } from '@/components/performance/web-vitals';

// =============================================================================
// MOCKS
// =============================================================================

// Mock the performance module
const mockInitWebVitals = jest.fn();

jest.mock('@/lib/performance', () => ({
  initWebVitals: (onReport: unknown) => mockInitWebVitals(onReport),
  getWebVitalRating: jest.fn((_name: string, value: number) => {
    if (value < 100) return 'good';
    if (value < 300) return 'needs-improvement';
    return 'poor';
  }),
}));

// =============================================================================
// SETUP
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockInitWebVitals.mockResolvedValue(undefined);
});

// =============================================================================
// HELPER
// =============================================================================

function renderWebVitals(props: Partial<WebVitalsProps> = {}) {
  return render(<WebVitals {...props} />);
}

// =============================================================================
// TESTS
// =============================================================================

describe('WebVitals', () => {
  describe('Rendering', () => {
    it('should render nothing (returns null)', () => {
      const { container } = renderWebVitals({ enabled: true });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Initialization', () => {
    it('should initialize when enabled', async () => {
      renderWebVitals({ enabled: true });

      await waitFor(() => {
        expect(mockInitWebVitals).toHaveBeenCalledTimes(1);
      });
    });

    it('should not initialize when disabled', async () => {
      renderWebVitals({ enabled: false });

      // Wait a bit to ensure it doesn't initialize
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      expect(mockInitWebVitals).not.toHaveBeenCalled();
    });

    it('should initialize only once on multiple renders', async () => {
      const { rerender } = renderWebVitals({ enabled: true });

      await waitFor(() => {
        expect(mockInitWebVitals).toHaveBeenCalledTimes(1);
      });

      // Re-render the component
      rerender(<WebVitals enabled={true} />);

      // Should still be called only once
      expect(mockInitWebVitals).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Reporter', () => {
    it('should call custom onReport callback', async () => {
      const onReport = jest.fn();
      
      renderWebVitals({ enabled: true, onReport });

      await waitFor(() => {
        expect(mockInitWebVitals).toHaveBeenCalledWith(expect.any(Function));
      });

      // Get the callback passed to initWebVitals
      const callback = mockInitWebVitals.mock.calls[0][0];

      // Simulate a metric being reported
      const mockMetric = {
        id: 'test-id',
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 100,
        navigationType: 'navigate',
      };

      callback(mockMetric);

      expect(onReport).toHaveBeenCalledWith(mockMetric);
    });
  });

  describe('Debug Mode', () => {
    it('should log when disabled in debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderWebVitals({ enabled: false, debug: true });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('[WebVitals] Disabled');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Default Props', () => {
    it('should default to disabled in non-production', () => {
      // In development/test environment (current env), 
      // the component defaults to disabled (enabled = NODE_ENV === 'production')
      renderWebVitals();

      // In development/test, should not initialize by default
      expect(mockInitWebVitals).not.toHaveBeenCalled();
    });
  });
});
