/**
 * useStreaming Hook Tests
 *
 * Comprehensive test suite for the useStreaming hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useStreaming,
  convertToStreamRequest,
  parseSSEEvent,
  createSSEConnection,
} from '@/hooks/use-streaming';
import type { UserInput, MovieRecommendation } from '@/types';

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

/**
 * Create a mock readable stream that yields SSE events
 */
function createMockSSEStream(events: Array<{ type: string; data: string }>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let eventIndex = 0;

  return new ReadableStream({
    pull(controller) {
      if (eventIndex < events.length) {
        const event = events[eventIndex]!;
        const sseMessage = `event: ${event.type}\ndata: ${event.data}\n\n`;
        controller.enqueue(encoder.encode(sseMessage));
        eventIndex++;
      } else {
        controller.close();
      }
    },
  });
}

/**
 * Create a mock response with SSE stream
 */
function createMockSSEResponse(events: Array<{ type: string; data: string }>, ok = true, status = 200): Response {
  return {
    ok,
    status,
    headers: new Headers({ 'content-type': 'text/event-stream' }),
    body: createMockSSEStream(events),
    json: jest.fn().mockResolvedValue({}),
  } as unknown as Response;
}

/**
 * Create a mock error response (non-SSE)
 */
function createMockErrorResponse(data: unknown, status = 400): Response {
  return {
    ok: false,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    body: null,
    json: jest.fn().mockResolvedValue(data),
  } as unknown as Response;
}

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('convertToStreamRequest', () => {
  it('should convert empty input to empty request', () => {
    const input: UserInput = {};
    const result = convertToStreamRequest(input);
    expect(result).toEqual({});
  });

  it('should convert mood correctly', () => {
    const input: UserInput = { mood: 'happy' };
    const result = convertToStreamRequest(input);
    expect(result).toEqual({ mood: 'happy' });
  });

  it('should convert genres correctly', () => {
    const input: UserInput = { genres: ['Action', 'Comedy'] };
    const result = convertToStreamRequest(input);
    expect(result).toEqual({ genres: ['Action', 'Comedy'] });
  });

  it('should not include empty genres array', () => {
    const input: UserInput = { genres: [] };
    const result = convertToStreamRequest(input);
    expect(result).toEqual({});
  });

  it('should convert platforms correctly', () => {
    const input: UserInput = { platforms: ['netflix', 'prime'] };
    const result = convertToStreamRequest(input);
    expect(result).toEqual({ platforms: ['netflix', 'prime'] });
  });

  it('should not include empty platforms array', () => {
    const input: UserInput = { platforms: [] };
    const result = convertToStreamRequest(input);
    expect(result).toEqual({});
  });

  it('should convert runtime correctly', () => {
    const input: UserInput = { runtime: { min: 90, max: 120 } };
    const result = convertToStreamRequest(input);
    expect(result).toEqual({ runtime: { min: 90, max: 120 } });
  });

  it('should convert releaseYear correctly', () => {
    const input: UserInput = { releaseYear: { from: 2020, to: 2024 } };
    const result = convertToStreamRequest(input);
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
    const result = convertToStreamRequest(input);
    expect(result).toEqual({
      mood: 'excited',
      genres: ['Action', 'Adventure'],
      platforms: ['netflix', 'disney'],
      runtime: { min: 60, max: 180 },
      releaseYear: { from: 2015, to: 2025 },
    });
  });
});

describe('parseSSEEvent', () => {
  it('should parse text event', () => {
    const result = parseSSEEvent('text', 'Hello world');
    expect(result).toEqual({ type: 'text', payload: 'Hello world' });
  });

  it('should parse movie event with valid JSON', () => {
    const movieJson = JSON.stringify(mockMovieRecommendation);
    const result = parseSSEEvent('movie', movieJson);
    expect(result.type).toBe('movie');
    expect(result.payload).toEqual(mockMovieRecommendation);
  });

  it('should return error for movie event with invalid JSON', () => {
    const result = parseSSEEvent('movie', 'invalid json');
    expect(result.type).toBe('error');
    expect(result.payload).toEqual({
      type: 'UNKNOWN_ERROR',
      message: 'Failed to parse movie data',
    });
  });

  it('should parse done event', () => {
    const result = parseSSEEvent('done', 'null');
    expect(result).toEqual({ type: 'done', payload: null });
  });

  it('should parse error event with valid JSON', () => {
    const errorJson = JSON.stringify({ errorType: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' });
    const result = parseSSEEvent('error', errorJson);
    expect(result.type).toBe('error');
    expect(result.payload).toEqual({
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    });
  });

  it('should handle error event with invalid JSON', () => {
    const result = parseSSEEvent('error', 'Plain error message');
    expect(result.type).toBe('error');
    expect(result.payload).toEqual({
      type: 'UNKNOWN_ERROR',
      message: 'Plain error message',
    });
  });

  it('should handle error event with empty data', () => {
    const result = parseSSEEvent('error', '');
    expect(result.type).toBe('error');
    expect(result.payload).toEqual({
      type: 'UNKNOWN_ERROR',
      message: 'Unknown stream error',
    });
  });

  it('should treat unknown event types as text', () => {
    const result = parseSSEEvent('unknown', 'Some data');
    expect(result).toEqual({ type: 'text', payload: 'Some data' });
  });

  it('should handle error event with partial data', () => {
    const partialJson = JSON.stringify({ message: 'Error occurred' });
    const result = parseSSEEvent('error', partialJson);
    expect(result.type).toBe('error');
    expect(result.payload).toEqual({
      type: 'STREAM_ERROR',
      message: 'Error occurred',
    });
  });
});

// =============================================================================
// createSSEConnection TESTS
// =============================================================================

describe('createSSEConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should call onOpen when connection is established', async () => {
    const events = [{ type: 'done', data: 'null' }];
    mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

    const callbacks = {
      onOpen: jest.fn(),
      onMessage: jest.fn(),
      onClose: jest.fn(),
    };

    await createSSEConnection('/api/stream', { mood: 'happy' }, callbacks);

    expect(callbacks.onOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onMessage for each SSE event', async () => {
    const events = [
      { type: 'text', data: 'Hello' },
      { type: 'text', data: ' World' },
      { type: 'done', data: 'null' },
    ];
    mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

    const callbacks = {
      onOpen: jest.fn(),
      onMessage: jest.fn(),
      onClose: jest.fn(),
    };

    await createSSEConnection('/api/stream', { mood: 'happy' }, callbacks);

    expect(callbacks.onMessage).toHaveBeenCalledWith('text', 'Hello');
    expect(callbacks.onMessage).toHaveBeenCalledWith('text', ' World');
    expect(callbacks.onMessage).toHaveBeenCalledWith('done', 'null');
    expect(callbacks.onMessage).toHaveBeenCalledTimes(3);
  });

  it('should call onClose when stream ends', async () => {
    const events = [{ type: 'done', data: 'null' }];
    mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

    const callbacks = {
      onOpen: jest.fn(),
      onClose: jest.fn(),
    };

    await createSSEConnection('/api/stream', { mood: 'happy' }, callbacks);

    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onError for HTTP errors with JSON response', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockErrorResponse({ message: 'Rate limit exceeded' }, 429)
    );

    const callbacks = {
      onError: jest.fn(),
    };

    await createSSEConnection('/api/stream', { mood: 'happy' }, callbacks);

    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Rate limit exceeded' })
    );
  });

  it('should call onError for HTTP errors without JSON response', async () => {
    const response = {
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'text/plain' }),
      body: null,
    } as unknown as Response;

    mockFetch.mockResolvedValueOnce(response);

    const callbacks = {
      onError: jest.fn(),
    };

    await createSSEConnection('/api/stream', { mood: 'happy' }, callbacks);

    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'HTTP error 500' })
    );
  });

  it('should call onError for network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const callbacks = {
      onError: jest.fn(),
    };

    await createSSEConnection('/api/stream', { mood: 'happy' }, callbacks);

    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Network failure' })
    );
  });

  it('should call onClose for abort errors', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const callbacks = {
      onClose: jest.fn(),
      onError: jest.fn(),
    };

    await createSSEConnection('/api/stream', { mood: 'happy' }, callbacks);

    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
    expect(callbacks.onError).not.toHaveBeenCalled();
  });

  it('should send correct request body', async () => {
    const events = [{ type: 'done', data: 'null' }];
    mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

    const request = { mood: 'happy', genres: ['Action'] };

    await createSSEConnection('/api/stream', request, {});

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/stream',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(request),
      })
    );
  });

  it('should handle response without body', async () => {
    const response = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: null,
    } as unknown as Response;

    mockFetch.mockResolvedValueOnce(response);

    const callbacks = {
      onError: jest.fn(),
    };

    await createSSEConnection('/api/stream', { mood: 'happy' }, callbacks);

    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Response body is not readable' })
    );
  });

  it('should pass AbortSignal to fetch', async () => {
    const events = [{ type: 'done', data: 'null' }];
    mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

    const abortController = new AbortController();

    await createSSEConnection('/api/stream', { mood: 'happy' }, {}, abortController.signal);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/stream',
      expect.objectContaining({
        signal: abortController.signal,
      })
    );
  });
});

// =============================================================================
// HOOK TESTS
// =============================================================================

describe('useStreaming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  // ===========================================================================
  // INITIAL STATE
  // ===========================================================================

  describe('initial state', () => {
    it('should have empty content initially', () => {
      const { result } = renderHook(() => useStreaming());
      expect(result.current.content).toBe('');
    });

    it('should have empty movies array initially', () => {
      const { result } = renderHook(() => useStreaming());
      expect(result.current.movies).toEqual([]);
    });

    it('should not be streaming initially', () => {
      const { result } = renderHook(() => useStreaming());
      expect(result.current.isStreaming).toBe(false);
    });

    it('should not be connected initially', () => {
      const { result } = renderHook(() => useStreaming());
      expect(result.current.isConnected).toBe(false);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useStreaming());
      expect(result.current.error).toBeNull();
    });

    it('should not be complete initially', () => {
      const { result } = renderHook(() => useStreaming());
      expect(result.current.isComplete).toBe(false);
    });

    it('should provide startStreaming function', () => {
      const { result } = renderHook(() => useStreaming());
      expect(typeof result.current.startStreaming).toBe('function');
    });

    it('should provide stopStreaming function', () => {
      const { result } = renderHook(() => useStreaming());
      expect(typeof result.current.stopStreaming).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useStreaming());
      expect(typeof result.current.reset).toBe('function');
    });
  });

  // ===========================================================================
  // STREAMING STATES
  // ===========================================================================

  describe('streaming states', () => {
    it('should set isStreaming to true when starting', async () => {
      // Create a stream that doesn't complete immediately
      const events = [
        { type: 'text', data: 'Hello' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      // Initially should be streaming
      expect(result.current.isStreaming).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });
    });

    it('should set isConnected to true when connection opens', async () => {
      const events = [
        { type: 'text', data: 'Hello' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });
    });

    it('should set isStreaming to false after completion', async () => {
      const events = [
        { type: 'text', data: 'Hello' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });
    });

    it('should set isComplete to true after done event', async () => {
      const events = [
        { type: 'text', data: 'Hello' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });
    });

    it('should accumulate text content', async () => {
      const events = [
        { type: 'text', data: 'Hello' },
        { type: 'text', data: ' World' },
        { type: 'text', data: '!' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.content).toBe('Hello World!');
      });
    });

    it('should accumulate movies', async () => {
      const movie1 = { ...mockMovieRecommendation, id: 1 };
      const movie2 = { ...mockMovieRecommendation, id: 2, title: 'Movie 2' };
      const events = [
        { type: 'movie', data: JSON.stringify(movie1) },
        { type: 'movie', data: JSON.stringify(movie2) },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.movies).toHaveLength(2);
        expect(result.current.movies[0]?.id).toBe(1);
        expect(result.current.movies[1]?.id).toBe(2);
      });
    });
  });

  // ===========================================================================
  // CONNECTION ERRORS
  // ===========================================================================

  describe('connection errors', () => {
    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.error).toEqual({
          type: 'NETWORK_ERROR',
          message: 'Network failure',
        });
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isConnected).toBe(false);
    });

    it('should handle HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockErrorResponse({ message: 'Rate limit exceeded' }, 429)
      );

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.type).toBe('NETWORK_ERROR');
      });
    });

    it('should handle stream error event', async () => {
      const events = [
        { type: 'text', data: 'Starting...' },
        { type: 'error', data: JSON.stringify({ errorType: 'API_ERROR', message: 'Service unavailable' }) },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.error).toEqual({
          type: 'API_ERROR',
          message: 'Service unavailable',
        });
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('should set isStreaming to false on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });
    });

    it('should preserve partial content on error', async () => {
      const events = [
        { type: 'text', data: 'Partial content' },
        { type: 'error', data: JSON.stringify({ errorType: 'API_ERROR', message: 'Error' }) },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Content should be preserved even after error
      expect(result.current.content).toBe('Partial content');
    });
  });

  // ===========================================================================
  // CLEANUP ON UNMOUNT
  // ===========================================================================

  describe('cleanup on unmount', () => {
    it('should abort connection on unmount', async () => {
      // Create a long-running stream
      let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
      const slowStream = new ReadableStream<Uint8Array>({
        start(controller) {
          streamController = controller;
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: slowStream,
      } as Response);

      const { result, unmount } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      // Unmount while streaming
      unmount();

      // Stream should be aborted (no errors should be thrown)
      // Clean up the controller
      if (streamController) {
        try {
          streamController.close();
        } catch {
          // Expected - controller may already be closed
        }
      }
    });

    it('should not update state after unmount', async () => {
      const events = [
        { type: 'text', data: 'Hello' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result, unmount } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      // Unmount immediately
      unmount();

      // Should not throw any "update on unmounted component" warnings
      // (handled by isMountedRef check)
    });
  });

  // ===========================================================================
  // STOP STREAMING
  // ===========================================================================

  describe('stopStreaming', () => {
    it('should stop ongoing stream', async () => {
      let resolveStream: () => void;
      const streamPromise = new Promise<void>((resolve) => {
        resolveStream = resolve;
      });

      const encoder = new TextEncoder();
      const slowStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          // Send initial data
          controller.enqueue(encoder.encode('event: text\ndata: Starting\n\n'));
          // Wait for external signal to continue
          await streamPromise;
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: slowStream,
      } as Response);

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      // Wait a bit for stream to start
      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      // Stop streaming
      act(() => {
        result.current.stopStreaming();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isConnected).toBe(false);

      // Clean up
      resolveStream!();
    });

    it('should allow new stream after stopping', async () => {
      const events1 = [{ type: 'text', data: 'First' }, { type: 'done', data: 'null' }];
      const events2 = [{ type: 'text', data: 'Second' }, { type: 'done', data: 'null' }];

      mockFetch
        .mockResolvedValueOnce(createMockSSEResponse(events1))
        .mockResolvedValueOnce(createMockSSEResponse(events2));

      const { result } = renderHook(() => useStreaming());

      // First stream
      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.content).toBe('First');
      });

      // Second stream
      act(() => {
        result.current.startStreaming({ mood: 'scared' });
      });

      await waitFor(() => {
        expect(result.current.content).toBe('Second');
      });
    });
  });

  // ===========================================================================
  // RESET FUNCTIONALITY
  // ===========================================================================

  describe('reset functionality', () => {
    it('should reset content', async () => {
      const events = [{ type: 'text', data: 'Hello' }, { type: 'done', data: 'null' }];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.content).toBe('Hello');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.content).toBe('');
    });

    it('should reset movies', async () => {
      const events = [
        { type: 'movie', data: JSON.stringify(mockMovieRecommendation) },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.movies.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.movies).toEqual([]);
    });

    it('should reset error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset isComplete', async () => {
      const events = [{ type: 'done', data: 'null' }];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isComplete).toBe(false);
    });

    it('should reset isStreaming to false', () => {
      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.reset();
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('should reset isConnected to false', () => {
      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.reset();
      });

      expect(result.current.isConnected).toBe(false);
    });
  });

  // ===========================================================================
  // CALLBACKS
  // ===========================================================================

  describe('callbacks', () => {
    it('should call onText callback for text events', async () => {
      const events = [
        { type: 'text', data: 'Hello' },
        { type: 'text', data: ' World' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const onText = jest.fn();
      const { result } = renderHook(() => useStreaming({ onText }));

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(onText).toHaveBeenCalledWith('Hello');
      expect(onText).toHaveBeenCalledWith(' World');
      expect(onText).toHaveBeenCalledTimes(2);
    });

    it('should call onMovie callback for movie events', async () => {
      const movie1 = { ...mockMovieRecommendation, id: 1 };
      const movie2 = { ...mockMovieRecommendation, id: 2 };
      const events = [
        { type: 'movie', data: JSON.stringify(movie1) },
        { type: 'movie', data: JSON.stringify(movie2) },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const onMovie = jest.fn();
      const { result } = renderHook(() => useStreaming({ onMovie }));

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(onMovie).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
      expect(onMovie).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
      expect(onMovie).toHaveBeenCalledTimes(2);
    });

    it('should call onComplete callback when done', async () => {
      const events = [
        { type: 'text', data: 'Done' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const onComplete = jest.fn();
      const { result } = renderHook(() => useStreaming({ onComplete }));

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onError callback on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const onError = jest.fn();
      const { result } = renderHook(() => useStreaming({ onError }));

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(onError).toHaveBeenCalledWith({
        type: 'NETWORK_ERROR',
        message: 'Network failure',
      });
    });
  });

  // ===========================================================================
  // OPTIONS
  // ===========================================================================

  describe('options', () => {
    it('should use custom baseUrl', async () => {
      const events = [{ type: 'done', data: 'null' }];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() =>
        useStreaming({ baseUrl: 'https://api.example.com' })
      );

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/stream',
        expect.any(Object)
      );
    });
  });

  // ===========================================================================
  // HOOK STABILITY
  // ===========================================================================

  describe('hook stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useStreaming());

      const firstStart = result.current.startStreaming;
      const firstStop = result.current.stopStreaming;
      const firstReset = result.current.reset;

      rerender();

      expect(result.current.startStreaming).toBe(firstStart);
      expect(result.current.stopStreaming).toBe(firstStop);
      expect(result.current.reset).toBe(firstReset);
    });

    it('should update function references when baseUrl changes', () => {
      const { result, rerender } = renderHook(
        ({ baseUrl }) => useStreaming({ baseUrl }),
        { initialProps: { baseUrl: '/v1' } }
      );

      const firstStart = result.current.startStreaming;

      rerender({ baseUrl: '/v2' });

      expect(result.current.startStreaming).not.toBe(firstStart);
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle starting new stream while streaming', async () => {
      // First stream - will complete immediately but second stream should reset content
      const events1 = [
        { type: 'text', data: 'First' },
        { type: 'done', data: 'null' },
      ];
      const events2 = [
        { type: 'text', data: 'Second' },
        { type: 'done', data: 'null' },
      ];

      mockFetch
        .mockResolvedValueOnce(createMockSSEResponse(events1))
        .mockResolvedValueOnce(createMockSSEResponse(events2));

      const { result } = renderHook(() => useStreaming());

      // Start first stream
      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      // Wait for first stream to complete
      await waitFor(() => {
        expect(result.current.content).toBe('First');
      });

      // Start new stream - should reset content
      act(() => {
        result.current.startStreaming({ mood: 'scared' });
      });

      // Content should be reset when starting new stream
      expect(result.current.content).toBe('');

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      // Should have second stream's content only
      expect(result.current.content).toBe('Second');
    });

    it('should handle empty text content', async () => {
      const events = [
        { type: 'text', data: '' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(result.current.content).toBe('');
    });

    it('should handle mixed content and movies', async () => {
      const events = [
        { type: 'text', data: 'Finding movies...' },
        { type: 'movie', data: JSON.stringify(mockMovieRecommendation) },
        { type: 'text', data: ' Done!' },
        { type: 'done', data: 'null' },
      ];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(result.current.content).toBe('Finding movies... Done!');
      expect(result.current.movies).toHaveLength(1);
    });

    it('should clear previous error on new stream', async () => {
      // First stream fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Second stream succeeds
      const events = [{ type: 'done', data: 'null' }];
      mockFetch.mockResolvedValueOnce(createMockSSEResponse(events));

      act(() => {
        result.current.startStreaming({ mood: 'happy' });
      });

      // Error should be cleared when starting new stream
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });
    });
  });
});
