/**
 * useRecommendations Hook Tests
 *
 * Comprehensive test suite for the useRecommendations hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useRecommendations,
  convertToRequest,
  isErrorResponse,
} from '@/hooks/use-recommendations';
import type {
  UserInput,
  RecommendResponse,
  ErrorResponse,
  MovieRecommendation,
} from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// =============================================================================
// TEST DATA
// =============================================================================

const mockMovieRecommendation: MovieRecommendation = {
  id: 1,
  title: 'The Shawshank Redemption',
  overview: 'Two imprisoned men bond over a number of years...',
  posterPath: '/poster.jpg',
  backdropPath: '/backdrop.jpg',
  releaseDate: '1994-09-23',
  runtime: 142,
  voteAverage: 8.7,
  voteCount: 20000,
  genres: ['Drama'],
  originalLanguage: 'en',
  matchReason: 'Perfect for a thoughtful mood',
  platforms: [
    {
      id: 'netflix',
      name: 'Netflix',
      logo: '/platforms/netflix.svg',
      url: 'https://netflix.com/title/123',
    },
  ],
};

const mockSuccessResponse: RecommendResponse = {
  recommendations: [mockMovieRecommendation],
  metadata: {
    timestamp: '2026-01-10T12:00:00.000Z',
    inputParameters: { mood: 'happy' },
    totalResults: 1,
    processingTimeMs: 150,
  },
};

const mockErrorResponse: ErrorResponse = {
  error: true,
  errorType: 'VALIDATION_ERROR',
  message: 'Invalid mood value',
};

const mockRateLimitResponse: ErrorResponse = {
  error: true,
  errorType: 'RATE_LIMIT_EXCEEDED',
  message: 'Too many requests',
  retryAfter: 60,
};

const createMockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(data),
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('convertToRequest', () => {
  it('should convert empty input to empty request', () => {
    const input: UserInput = {};
    const result = convertToRequest(input);
    expect(result).toEqual({});
  });

  it('should convert mood correctly', () => {
    const input: UserInput = { mood: 'happy' };
    const result = convertToRequest(input);
    expect(result).toEqual({ mood: 'happy' });
  });

  it('should convert genres correctly', () => {
    const input: UserInput = { genres: ['Action', 'Comedy'] };
    const result = convertToRequest(input);
    expect(result).toEqual({ genres: ['Action', 'Comedy'] });
  });

  it('should not include empty genres array', () => {
    const input: UserInput = { genres: [] };
    const result = convertToRequest(input);
    expect(result).toEqual({});
  });

  it('should convert platforms correctly', () => {
    const input: UserInput = { platforms: ['netflix', 'prime'] };
    const result = convertToRequest(input);
    expect(result).toEqual({ platforms: ['netflix', 'prime'] });
  });

  it('should not include empty platforms array', () => {
    const input: UserInput = { platforms: [] };
    const result = convertToRequest(input);
    expect(result).toEqual({});
  });

  it('should convert runtime correctly', () => {
    const input: UserInput = { runtime: { min: 90, max: 120 } };
    const result = convertToRequest(input);
    expect(result).toEqual({ runtime: { min: 90, max: 120 } });
  });

  it('should convert releaseYear correctly', () => {
    const input: UserInput = { releaseYear: { from: 2020, to: 2024 } };
    const result = convertToRequest(input);
    expect(result).toEqual({ releaseYear: { from: 2020, to: 2024 } });
  });

  it('should convert full input correctly', () => {
    const input: UserInput = {
      mood: 'excited',
      genres: ['Action', 'Adventure'],
      platforms: ['netflix', 'disney'],
      runtime: { min: 60, max: 180 },
      releaseYear: { from: 2015, to: 2025 },
    };
    const result = convertToRequest(input);
    expect(result).toEqual({
      mood: 'excited',
      genres: ['Action', 'Adventure'],
      platforms: ['netflix', 'disney'],
      runtime: { min: 60, max: 180 },
      releaseYear: { from: 2015, to: 2025 },
    });
  });
});

describe('isErrorResponse', () => {
  it('should return true for valid error response', () => {
    expect(isErrorResponse(mockErrorResponse)).toBe(true);
  });

  it('should return true for rate limit error response', () => {
    expect(isErrorResponse(mockRateLimitResponse)).toBe(true);
  });

  it('should return false for success response', () => {
    expect(isErrorResponse(mockSuccessResponse)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isErrorResponse(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isErrorResponse(undefined)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isErrorResponse('string')).toBe(false);
    expect(isErrorResponse(123)).toBe(false);
    expect(isErrorResponse(true)).toBe(false);
  });

  it('should return false for object without error property', () => {
    expect(isErrorResponse({ message: 'test' })).toBe(false);
  });

  it('should return false for object with error: false', () => {
    expect(isErrorResponse({ error: false })).toBe(false);
  });
});

// =============================================================================
// HOOK TESTS
// =============================================================================

describe('useRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  // ===========================================================================
  // INITIAL STATE
  // ===========================================================================

  describe('initial state', () => {
    it('should have empty recommendations initially', () => {
      const { result } = renderHook(() => useRecommendations());
      expect(result.current.recommendations).toEqual([]);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useRecommendations());
      expect(result.current.isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useRecommendations());
      expect(result.current.error).toBeNull();
    });

    it('should have no metadata initially', () => {
      const { result } = renderHook(() => useRecommendations());
      expect(result.current.metadata).toBeNull();
    });

    it('should provide fetchRecommendations function', () => {
      const { result } = renderHook(() => useRecommendations());
      expect(typeof result.current.fetchRecommendations).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useRecommendations());
      expect(typeof result.current.reset).toBe('function');
    });
  });

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('loading states', () => {
    it('should set isLoading to true when fetching', async () => {
      // Create a promise we can resolve manually
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockImplementation(() => pendingPromise);

      const { result } = renderHook(() => useRecommendations());

      // Start fetching
      act(() => {
        result.current.fetchRecommendations({ mood: 'happy' });
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!(createMockResponse(mockSuccessResponse));
        await Promise.resolve();
      });

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set isLoading to false after success', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to false after error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockErrorResponse, false, 400)
      );

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'invalid' as any });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to false after network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // SUCCESS FLOW
  // ===========================================================================

  describe('success flow', () => {
    it('should fetch recommendations successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.recommendations).toEqual([mockMovieRecommendation]);
      expect(result.current.error).toBeNull();
    });

    it('should set metadata on success', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.metadata).toEqual(mockSuccessResponse.metadata);
    });

    it('should call fetch with correct URL', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/recommend',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should call fetch with correct body', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() => useRecommendations());
      const input: UserInput = {
        mood: 'happy',
        genres: ['Comedy'],
        platforms: ['netflix'],
      };

      await act(async () => {
        await result.current.fetchRecommendations(input);
      });

      const calledWith = mockFetch.mock.calls[0][1];
      const parsedBody = JSON.parse(calledWith.body);
      expect(parsedBody).toEqual({
        mood: 'happy',
        genres: ['Comedy'],
        platforms: ['netflix'],
      });
    });

    it('should use custom baseUrl', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() =>
        useRecommendations({ baseUrl: 'https://api.example.com' })
      );

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/recommend',
        expect.any(Object)
      );
    });

    it('should clear previous error on new fetch', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockErrorResponse, false, 400)
      );

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'invalid' as any });
      });

      expect(result.current.error).not.toBeNull();

      // Second call succeeds
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle multiple successful fetches', async () => {
      const firstResponse: RecommendResponse = {
        ...mockSuccessResponse,
        recommendations: [{ ...mockMovieRecommendation, id: 1 }],
      };
      const secondResponse: RecommendResponse = {
        ...mockSuccessResponse,
        recommendations: [{ ...mockMovieRecommendation, id: 2 }],
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(firstResponse));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.recommendations[0]?.id).toBe(1);

      mockFetch.mockResolvedValueOnce(createMockResponse(secondResponse));

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'sad' });
      });

      expect(result.current.recommendations[0]?.id).toBe(2);
    });

    it('should handle empty recommendations', async () => {
      const emptyResponse: RecommendResponse = {
        recommendations: [],
        metadata: {
          timestamp: '2026-01-10T12:00:00.000Z',
          inputParameters: { mood: 'happy' },
          totalResults: 0,
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(emptyResponse));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.recommendations).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.metadata?.totalResults).toBe(0);
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('error handling', () => {
    it('should handle validation error response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockErrorResponse, false, 400)
      );

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'invalid' as any });
      });

      expect(result.current.error).toEqual({
        type: 'VALIDATION_ERROR',
        message: 'Invalid mood value',
      });
      expect(result.current.recommendations).toEqual([]);
    });

    it('should handle rate limit error with retryAfter', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockRateLimitResponse, false, 429)
      );

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.error).toEqual({
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        retryAfter: 60,
      });
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.error).toEqual({
        type: 'NETWORK_ERROR',
        message: 'Failed to fetch',
      });
      expect(result.current.recommendations).toEqual([]);
    });

    it('should handle abort error', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.error).toEqual({
        type: 'TIMEOUT_ERROR',
        message: 'Request was cancelled or timed out',
      });
    });

    it('should handle server error (500)', async () => {
      const serverError: ErrorResponse = {
        error: true,
        errorType: 'API_ERROR',
        message: 'Internal server error',
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse(serverError, false, 500)
      );

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.error?.type).toBe('API_ERROR');
    });

    it('should clear metadata on error', async () => {
      // First successful request
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.metadata).not.toBeNull();

      // Second request fails
      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockErrorResponse, false, 400)
      );

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'invalid' as any });
      });

      expect(result.current.metadata).toBeNull();
    });

    it('should handle non-Error thrown objects', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.error).toEqual({
        type: 'NETWORK_ERROR',
        message: 'Failed to fetch recommendations',
      });
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      });

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.error?.type).toBe('NETWORK_ERROR');
    });

    it('should handle unknown error response structure', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ unknown: 'structure' }, false, 400)
      );

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.error).toEqual({
        type: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      });
    });
  });

  // ===========================================================================
  // RESET FUNCTIONALITY
  // ===========================================================================

  describe('reset functionality', () => {
    it('should reset recommendations', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.recommendations.length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.recommendations).toEqual([]);
    });

    it('should reset error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset metadata', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() => useRecommendations());

      await act(async () => {
        await result.current.fetchRecommendations({ mood: 'happy' });
      });

      expect(result.current.metadata).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.metadata).toBeNull();
    });

    it('should reset isLoading to false', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSuccessResponse));

      const { result } = renderHook(() => useRecommendations());

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // HOOK STABILITY
  // ===========================================================================

  describe('hook stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useRecommendations());

      const firstFetch = result.current.fetchRecommendations;
      const firstReset = result.current.reset;

      rerender();

      expect(result.current.fetchRecommendations).toBe(firstFetch);
      expect(result.current.reset).toBe(firstReset);
    });

    it('should update function references when baseUrl changes', () => {
      const { result, rerender } = renderHook(
        ({ baseUrl }) => useRecommendations({ baseUrl }),
        { initialProps: { baseUrl: '/v1' } }
      );

      const firstFetch = result.current.fetchRecommendations;

      rerender({ baseUrl: '/v2' });

      expect(result.current.fetchRecommendations).not.toBe(firstFetch);
    });
  });
});
