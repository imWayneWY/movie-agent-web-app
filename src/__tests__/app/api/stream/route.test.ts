/**
 * Tests for POST /api/stream endpoint
 *
 * Comprehensive test coverage including:
 * - Successful streaming
 * - Request validation
 * - Rate limiting
 * - Error handling
 * - Stream interruption
 * - Cleanup on connection close
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stream/route';
import type { StreamEvent, MovieRecommendation } from '@/types';
import { HTTP_STATUS } from '@/lib/constants';

// Access the exported mock function - MUST be after jest.mock but will be hoisted
const { __mockGetRecommendationsStream: mockGetRecommendationsStream } = jest.requireMock('@/services');

// =============================================================================
// MOCKS
// =============================================================================

// Mock the movie agent service
jest.mock('@/services', () => {
  const mockGetRecommendationsStream = jest.fn();
  return {
    MovieAgentService: jest.fn().mockImplementation(() => ({
      getRecommendations: jest.fn(),
      getRecommendationsStream: mockGetRecommendationsStream,
    })),
    __mockGetRecommendationsStream: mockGetRecommendationsStream, // Export for access in tests
  };
});

// Mock the logger to avoid console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock rate limiter - initially allow all requests
jest.mock('@/middleware', () => ({
  rateLimiters: {
    standard: jest.fn(() => null), // null means rate limit not exceeded
  },
}));

// =============================================================================
// TEST DATA
// =============================================================================

const mockMovieRecommendation: MovieRecommendation = {
  id: 550,
  title: 'Fight Club',
  overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
  posterPath: '/path/to/poster.jpg',
  backdropPath: '/path/to/backdrop.jpg',
  releaseDate: '1999-10-15',
  runtime: 139,
  voteAverage: 8.4,
  voteCount: 26000,
  genres: ['Drama', 'Thriller'],
  originalLanguage: 'en',
  matchReason: 'Perfect for a thoughtful mood with intense drama',
  platforms: [
    {
      id: 'netflix',
      name: 'Netflix',
      logo: '/platforms/netflix.svg',
      url: 'https://netflix.com/title/550',
    },
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a mock NextRequest
 */
function createMockRequest(
  body: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  const url = 'http://localhost:3000/api/stream';
  const init = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  } as const;

  return new NextRequest(url, init);
}

/**
 * Create a mock stream generator
 */
async function* createMockStreamGenerator(
  events: StreamEvent[]
): AsyncGenerator<StreamEvent> {
  for (const event of events) {
    yield event;
  }
}

/**
 * Create a delayed mock stream generator
 */
async function* createDelayedMockStreamGenerator(
  events: StreamEvent[],
  delayMs: number = 10
): AsyncGenerator<StreamEvent> {
  for (const event of events) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield event;
  }
}

/**
 * Parse SSE events from response body text
 */
function parseSSEEventsFromText(text: string): StreamEvent[] {
  const events: StreamEvent[] = [];
  const lines = text.split('\n');
  let currentEvent: { type?: string; data?: string } = {};

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent.type = line.slice(7);
    } else if (line.startsWith('data: ')) {
      currentEvent.data = line.slice(6);
    } else if (line === '' && currentEvent.type) {
      // End of event
      let parsedData: unknown = currentEvent.data;
      try {
        parsedData = JSON.parse(currentEvent.data || 'null');
      } catch {
        // Keep as string if not valid JSON
      }
      events.push({
        type: currentEvent.type as StreamEvent['type'],
        data: parsedData as StreamEvent['data'],
      });
      currentEvent = {};
    }
  }

  return events;
}

/**
 * Read all text from a Response body - handles both Node and Web streams
 */
async function readResponseBody(response: Response): Promise<string> {
  // For Node.js environment with native Response
  if (response.body) {
    // Use arrayBuffer() which works in both environments
    try {
      const buffer = await response.arrayBuffer();
      return new TextDecoder().decode(buffer);
    } catch {
      // Fallback for older Node versions
    }
  }
  
  // Fallback: try text()
  try {
    return await response.text();
  } catch {
    return '';
  }
}

/**
 * Parse SSE events from response
 */
async function parseSSEEvents(response: Response): Promise<StreamEvent[]> {
  const text = await readResponseBody(response);
  return parseSSEEventsFromText(text);
}

// =============================================================================
// TESTS
// =============================================================================

describe('POST /api/stream', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset rate limiter mock to allow requests by default
    const { rateLimiters } = require('@/middleware');
    rateLimiters.standard.mockReturnValue(null);
  });

  // ===========================================================================
  // SUCCESSFUL STREAMING
  // ===========================================================================

  describe('Successful streaming', () => {
    it('should return SSE stream for valid mood parameter', async () => {
      const events: StreamEvent[] = [
        { type: 'text', data: 'Looking for happy movies...' },
        { type: 'movie', data: mockMovieRecommendation },
        { type: 'done', data: null },
      ];

      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-transform'
      );

      const receivedEvents = await parseSSEEvents(response);
      
      // Should have text, movie, and two done events (one from stream, one from route)
      expect(receivedEvents.length).toBeGreaterThanOrEqual(3);
      expect(receivedEvents[0]).toEqual({
        type: 'text',
        data: 'Looking for happy movies...',
      });
      expect(receivedEvents[1]).toEqual({
        type: 'movie',
        data: mockMovieRecommendation,
      });
    });

    it('should stream multiple movie recommendations', async () => {
      const movie2: MovieRecommendation = {
        ...mockMovieRecommendation,
        id: 551,
        title: 'The Matrix',
      };

      const events: StreamEvent[] = [
        { type: 'text', data: 'Finding action movies...' },
        { type: 'movie', data: mockMovieRecommendation },
        { type: 'movie', data: movie2 },
        { type: 'done', data: null },
      ];

      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ genres: ['Action'] });
      const response = await POST(request);

      expect(response.status).toBe(200);

      const receivedEvents = await parseSSEEvents(response);
      const movieEvents = receivedEvents.filter((e) => e.type === 'movie');
      expect(movieEvents.length).toBe(2);
    });

    it('should handle combined filters in streaming request', async () => {
      const events: StreamEvent[] = [
        { type: 'text', data: 'Searching...' },
        { type: 'done', data: null },
      ];

      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({
        mood: 'excited',
        genres: ['Action', 'Adventure'],
        platforms: ['netflix'],
        runtime: { min: 90, max: 150 },
        releaseYear: { from: 2010, to: 2023 },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockGetRecommendationsStream).toHaveBeenCalledWith({
        mood: 'excited',
        genres: ['Action', 'Adventure'],
        platforms: ['netflix'],
        runtime: { min: 90, max: 150 },
        releaseYear: { from: 2010, to: 2023 },
      });
    });

    it('should send done event at the end of stream', async () => {
      const events: StreamEvent[] = [
        { type: 'text', data: 'Done' },
        { type: 'done', data: null },
      ];

      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      const receivedEvents = await parseSSEEvents(response);
      const doneEvents = receivedEvents.filter((e) => e.type === 'done');
      expect(doneEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // VALIDATION ERRORS
  // ===========================================================================

  describe('Validation errors', () => {
    it('should return 400 for invalid JSON', async () => {
      const url = 'http://localhost:3000/api/stream';
      const request = new NextRequest(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json{',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error).toBe(true);
      expect(data.errorType).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when no parameters provided', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error).toBe(true);
      expect(data.errorType).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('At least one parameter');
    });

    it('should handle empty object body', async () => {
      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should handle genres as comma-separated string', async () => {
      const events: StreamEvent[] = [{ type: 'done', data: null }];
      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ genres: 'Action, Comedy, Drama' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockGetRecommendationsStream).toHaveBeenCalledWith(
        expect.objectContaining({
          genres: ['Action', 'Comedy', 'Drama'],
        })
      );
    });

    it('should handle releaseYear as number', async () => {
      const events: StreamEvent[] = [{ type: 'done', data: null }];
      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ releaseYear: 2020 });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockGetRecommendationsStream).toHaveBeenCalledWith(
        expect.objectContaining({
          releaseYear: { from: 2020, to: 2020 },
        })
      );
    });
  });

  // ===========================================================================
  // RATE LIMITING
  // ===========================================================================

  describe('Rate limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      const { rateLimiters } = require('@/middleware');
      const mockRateLimitResponse = {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        json: async () => ({
          error: true,
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          retryAfter: 60,
        }),
      };
      rateLimiters.standard.mockReturnValue(mockRateLimitResponse);

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      expect(response).toBe(mockRateLimitResponse);
      expect(response.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    });

    it('should not call agent service when rate limited', async () => {
      const { rateLimiters } = require('@/middleware');
      rateLimiters.standard.mockReturnValue({
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        json: async () => ({ error: true }),
      });

      const request = createMockRequest({ mood: 'happy' });
      await POST(request);

      expect(mockGetRecommendationsStream).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error handling', () => {
    it('should stream error event when agent throws', async () => {
      mockGetRecommendationsStream.mockImplementation(async function* () {
        throw new Error('Agent connection failed');
      });

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      expect(response.status).toBe(200); // SSE always starts with 200

      const body = await readResponseBody(response);
      expect(body).toContain('event: error');
      expect(body).toContain('Agent connection failed');
    });

    it('should include error type in error event', async () => {
      const { AppError } = require('@/lib/errors');
      mockGetRecommendationsStream.mockImplementation(async function* () {
        throw new AppError('Timeout error', 'TIMEOUT_ERROR', {
          statusCode: 408,
        });
      });

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      const body = await readResponseBody(response);
      expect(body).toContain('event: error');
      expect(body).toContain('TIMEOUT_ERROR');
    });

    it('should handle mid-stream errors', async () => {
      mockGetRecommendationsStream.mockImplementation(async function* () {
        yield { type: 'text', data: 'Starting...' };
        yield { type: 'movie', data: mockMovieRecommendation };
        throw new Error('Mid-stream error');
      });

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      const body = await readResponseBody(response);
      
      // Should have received events before error
      expect(body).toContain('event: text');
      expect(body).toContain('event: movie');
      expect(body).toContain('event: error');
      expect(body).toContain('Mid-stream error');
    });
  });

  // ===========================================================================
  // STREAM INTERRUPTION AND CLEANUP
  // ===========================================================================

  describe('Stream interruption and cleanup', () => {
    it('should handle stream cancellation gracefully', async () => {
      // Create a slow stream that can be cancelled
      const events: StreamEvent[] = [
        { type: 'text', data: 'Processing...' },
        { type: 'movie', data: mockMovieRecommendation },
        { type: 'done', data: null },
      ];

      mockGetRecommendationsStream.mockReturnValue(
        createDelayedMockStreamGenerator(events, 50)
      );

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      if (reader) {
        // Read first chunk
        await reader.read();
        // Cancel the stream
        await reader.cancel();
        reader.releaseLock();
      }

      // Should not throw
    });

    it('should set proper SSE headers', async () => {
      const events: StreamEvent[] = [{ type: 'done', data: null }];
      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-transform'
      );
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('X-Accel-Buffering')).toBe('no');
    });

    it('should format SSE messages correctly', async () => {
      const events: StreamEvent[] = [
        { type: 'text', data: 'Hello World' },
        { type: 'done', data: null },
      ];

      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      const body = await readResponseBody(response);
      
      // Check SSE format: "event: <type>\ndata: <data>\n\n"
      expect(body).toMatch(/event: text\ndata: Hello World\n\n/);
      expect(body).toMatch(/event: done\ndata: null\n\n/);
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge cases', () => {
    it('should handle empty stream', async () => {
      mockGetRecommendationsStream.mockReturnValue(createMockStreamGenerator([]));

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      
      const body = await readResponseBody(response);
      // Should still send done event
      expect(body).toContain('event: done');
    });

    it('should handle stream with only text events', async () => {
      const events: StreamEvent[] = [
        { type: 'text', data: 'Thinking...' },
        { type: 'text', data: 'Still thinking...' },
        { type: 'text', data: 'Almost done...' },
        { type: 'done', data: null },
      ];

      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      const receivedEvents = await parseSSEEvents(response);
      const textEvents = receivedEvents.filter((e) => e.type === 'text');
      expect(textEvents.length).toBe(3);
    });

    it('should handle special characters in text events', async () => {
      const events: StreamEvent[] = [
        { type: 'text', data: 'Special chars: <>&"\'' },
        { type: 'done', data: null },
      ];

      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      const body = await readResponseBody(response);
      expect(body).toContain('Special chars: <>&"\'');
    });

    it('should handle unicode in text events', async () => {
      const events: StreamEvent[] = [
        { type: 'text', data: 'Unicode: 🎬 🍿 🎥' },
        { type: 'done', data: null },
      ];

      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);

      const body = await readResponseBody(response);
      expect(body).toContain('🎬');
      expect(body).toContain('🍿');
      expect(body).toContain('🎥');
    });

    it('should pass through platforms for streaming', async () => {
      const events: StreamEvent[] = [{ type: 'done', data: null }];
      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ platforms: ['netflix', 'prime'] });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockGetRecommendationsStream).toHaveBeenCalledWith(
        expect.objectContaining({
          platforms: ['netflix', 'prime'],
        })
      );
    });

    it('should pass through runtime for streaming', async () => {
      const events: StreamEvent[] = [{ type: 'done', data: null }];
      mockGetRecommendationsStream.mockReturnValue(
        createMockStreamGenerator(events)
      );

      const request = createMockRequest({ runtime: { min: 90, max: 120 } });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockGetRecommendationsStream).toHaveBeenCalledWith(
        expect.objectContaining({
          runtime: { min: 90, max: 120 },
        })
      );
    });
  });
});
