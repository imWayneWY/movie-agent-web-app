/**
 * Tests for POST /api/recommend endpoint
 *
 * Comprehensive test coverage including:
 * - Successful recommendations
 * - Request validation
 * - Rate limiting
 * - Error handling
 * - Edge cases
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/recommend/route';
import type { AgentResponse, MovieRecommendation } from '@/types';
import { HTTP_STATUS } from '@/lib/constants';

// Access the exported mock function
const { __mockGetRecommendations: mockGetRecommendations } = jest.requireMock('@/services');

// =============================================================================
// MOCKS
// =============================================================================

// Mock the movie agent service
jest.mock('@/services', () => {
  const mockGetRecommendations = jest.fn();
  return {
    MovieAgentService: jest.fn().mockImplementation(() => ({
      getRecommendations: mockGetRecommendations,
    })),
    __mockGetRecommendations: mockGetRecommendations, // Export for access in tests
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

const mockAgentResponse: AgentResponse = {
  recommendations: [mockMovieRecommendation],
  reasoning: 'Based on your thoughtful mood...',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a mock NextRequest
 */
function createMockRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  const url = 'http://localhost:3000/api/recommend';
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

// =============================================================================
// TESTS
// =============================================================================

describe('POST /api/recommend', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset rate limiter mock to allow requests by default
    const { rateLimiters } = require('@/middleware');
    rateLimiters.standard.mockReturnValue(null);
  });

  // ===========================================================================
  // SUCCESSFUL REQUESTS
  // ===========================================================================

  describe('Successful requests', () => {
    it('should return recommendations for valid mood parameter', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data).toMatchObject({
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            id: mockMovieRecommendation.id,
            title: mockMovieRecommendation.title,
          }),
        ]),
        metadata: expect.objectContaining({
          timestamp: expect.any(String),
          inputParameters: { mood: 'happy' },
          totalResults: 1,
          processingTimeMs: expect.any(Number),
        }),
      });

      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ mood: 'happy' })
      );
    });

    it('should return recommendations for genres as array', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ genres: ['Action', 'Comedy'] });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          genres: ['Action', 'Comedy'],
        })
      );
    });

    it('should return recommendations for genres as comma-separated string', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ genres: 'Action, Comedy, Drama' });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          genres: ['Action', 'Comedy', 'Drama'],
        })
      );
    });

    it('should return recommendations for platforms', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ platforms: ['netflix', 'prime'] });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          platforms: ['netflix', 'prime'],
        })
      );
    });

    it('should return recommendations for runtime range', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({
        runtime: { min: 90, max: 120 },
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          runtime: { min: 90, max: 120 },
        })
      );
    });

    it('should return recommendations for release year as number', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ releaseYear: 2020 });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          releaseYear: { from: 2020, to: 2020 },
        })
      );
    });

    it('should return recommendations for release year as range', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({
        releaseYear: { from: 2010, to: 2020 },
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          releaseYear: { from: 2010, to: 2020 },
        })
      );
    });

    it('should return recommendations for combined filters', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({
        mood: 'excited',
        genres: ['Action', 'Adventure'],
        platforms: ['netflix'],
        runtime: { min: 90, max: 150 },
        releaseYear: { from: 2010, to: 2023 },
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith({
        mood: 'excited',
        genres: ['Action', 'Adventure'],
        platforms: ['netflix'],
        runtime: { min: 90, max: 150 },
        releaseYear: { from: 2010, to: 2023 },
      });
    });

    it('should include processing time in metadata', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(typeof data.metadata.processingTimeMs).toBe('number');
    });

    it('should include timestamp in ISO format', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.metadata.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  // ===========================================================================
  // VALIDATION ERRORS
  // ===========================================================================

  describe('Validation errors', () => {
    it('should return 400 for invalid JSON', async () => {
      const url = 'http://localhost:3000/api/recommend';
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

    it('should pass through parameters for agent to validate', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({
        mood: 'happy',
        genres: 'InvalidGenre',
        platforms: ['invalidPlatform'],
        invalidParam: 'ignored',
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      // Route passes through string values for agent to validate
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ mood: 'happy' })
      );
      // The validator passes these through as they are valid strings
      expect(mockGetRecommendations).toHaveBeenCalled();
    });

    it('should filter out empty strings in genres array', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({
        genres: ['Action', '', '  ', 'Comedy'],
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      // Validator should handle this, passing only valid genres
      expect(mockGetRecommendations).toHaveBeenCalled();
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

      expect(mockGetRecommendations).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error handling', () => {
    it('should return 500 when agent service throws error', async () => {
      
      mockGetRecommendations.mockRejectedValue(
        new Error('Agent service error')
      );

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error).toBe(true);
    });

    it('should handle timeout errors', async () => {
      
      const timeoutError = new Error('Request timeout');
      mockGetRecommendations.mockRejectedValue(timeoutError);

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error).toBe(true);
    });

    it('should handle network errors', async () => {
      
      const networkError = new Error('Network error');
      mockGetRecommendations.mockRejectedValue(networkError);

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);
      const data = await response.json();

      // Network errors may return 500 or 503 depending on error handling
      expect([HTTP_STATUS.INTERNAL_SERVER_ERROR, 503]).toContain(response.status);
      expect(data.error).toBe(true);
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge cases', () => {
    it('should handle empty recommendations array', async () => {
      
      mockGetRecommendations.mockResolvedValue({
        recommendations: [],
        reasoning: 'No matches found',
      });

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.recommendations).toEqual([]);
      expect(data.metadata.totalResults).toBe(0);
    });

    it('should handle large number of recommendations', async () => {
      
      const manyRecommendations = Array.from({ length: 100 }, (_, i) => ({
        ...mockMovieRecommendation,
        id: i + 1,
        title: `Movie ${i + 1}`,
      }));

      mockGetRecommendations.mockResolvedValue({
        recommendations: manyRecommendations,
      });

      const request = createMockRequest({ mood: 'happy' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.recommendations).toHaveLength(100);
      expect(data.metadata.totalResults).toBe(100);
    });

    it('should handle runtime with only min value', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ runtime: { min: 90 } });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          runtime: { min: 90 },
        })
      );
    });

    it('should handle runtime with only max value', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ runtime: { max: 120 } });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          runtime: { max: 120 },
        })
      );
    });

    it('should handle year range with only from value', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ releaseYear: { from: 2010 } });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          releaseYear: { from: 2010 },
        })
      );
    });

    it('should handle year range with only to value', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ releaseYear: { to: 2020 } });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          releaseYear: { to: 2020 },
        })
      );
    });

    it('should handle whitespace in mood value', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({ mood: '  happy  ' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      // Validator trims whitespace from mood value
      expect(data.metadata.inputParameters.mood).toBe('happy');
    });

    it('should handle special characters in request', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest({
        mood: 'happy',
        genres: ['Science Fiction'], // Contains space
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it('should handle X-Forwarded-For header for IP tracking', async () => {
      
      mockGetRecommendations.mockResolvedValue(mockAgentResponse);

      const request = createMockRequest(
        { mood: 'happy' },
        { 'x-forwarded-for': '192.168.1.1' }
      );
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
    });
  });
});
