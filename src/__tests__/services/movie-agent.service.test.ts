/**
 * Movie Agent Service Tests
 *
 * Comprehensive test suite for movie-agent integration layer
 */

import { MovieAgentService, createMovieAgentService } from '@/services/movie-agent.service';
import { AppError } from '@/lib/errors';
import type { AgentRequest, AgentResponse } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock the env module
jest.mock('@/config/env', () => ({
  env: {
    llmProvider: 'gemini',
  },
}));

// Mock successful agent response
const mockSuccessResponse: AgentResponse = {
  recommendations: [
    {
      id: 1,
      title: 'The Shawshank Redemption',
      overview: 'Two imprisoned men bond over years...',
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
          logo: '/platforms/netflix.png',
          url: 'https://netflix.com/title/123',
        },
      ],
    },
  ],
  reasoning: 'Based on your thoughtful mood...',
};

// =============================================================================
// TEST SUITE
// =============================================================================

describe('MovieAgentService', () => {
  let service: MovieAgentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MovieAgentService();
  });

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const config = service.getConfig();
      expect(config.provider).toBe('gemini');
      expect(config.timeout).toBe(30000);
      expect(config.maxRetries).toBe(3);
      expect(config.retryDelay).toBe(1000);
    });

    it('should initialize with custom config', () => {
      const customService = new MovieAgentService({
        provider: 'azure',
        timeout: 60000,
        maxRetries: 5,
        retryDelay: 2000,
      });

      const config = customService.getConfig();
      expect(config.provider).toBe('azure');
      expect(config.timeout).toBe(60000);
      expect(config.maxRetries).toBe(5);
      expect(config.retryDelay).toBe(2000);
    });

    it('should create instance via factory function', () => {
      const factoryService = createMovieAgentService({ provider: 'azure' });
      expect(factoryService.getConfig().provider).toBe('azure');
    });
  });

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  describe('configuration', () => {
    it('should update config', () => {
      service.updateConfig({ timeout: 45000 });
      expect(service.getConfig().timeout).toBe(45000);
    });

    it('should partially update config', () => {
      const originalProvider = service.getConfig().provider;
      service.updateConfig({ timeout: 20000 });

      const config = service.getConfig();
      expect(config.timeout).toBe(20000);
      expect(config.provider).toBe(originalProvider);
    });

    it('should update retry options when maxRetries changes', () => {
      service.updateConfig({ maxRetries: 5 });
      expect(service.getConfig().maxRetries).toBe(5);
    });
  });

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe('request validation', () => {
    it('should reject empty request', async () => {
      const request: AgentRequest = {};

      await expect(service.getRecommendations(request)).rejects.toThrow(AppError);
      await expect(service.getRecommendations(request)).rejects.toThrow(
        'At least one filter (mood, genre, or platform) is required'
      );
    });

    it('should accept request with mood only', async () => {
      const request: AgentRequest = { mood: 'happy' };

      // Mock the callAgent method to avoid actual implementation
      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
    });

    it('should accept request with genres only', async () => {
      const request: AgentRequest = { genres: ['Action'] };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
    });

    it('should accept request with platforms only', async () => {
      const request: AgentRequest = { platforms: ['netflix'] };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
    });

    it('should reject invalid runtime range', async () => {
      const request: AgentRequest = {
        mood: 'happy',
        runtime: { min: 120, max: 60 },
      };

      await expect(service.getRecommendations(request)).rejects.toThrow(AppError);
      await expect(service.getRecommendations(request)).rejects.toThrow(
        'Invalid runtime range'
      );
    });

    it('should reject invalid year range', async () => {
      const request: AgentRequest = {
        mood: 'happy',
        releaseYear: { from: 2020, to: 2010 },
      };

      await expect(service.getRecommendations(request)).rejects.toThrow(AppError);
      await expect(service.getRecommendations(request)).rejects.toThrow(
        'Invalid year range'
      );
    });

    it('should accept valid runtime range', async () => {
      const request: AgentRequest = {
        mood: 'happy',
        runtime: { min: 60, max: 120 },
      };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
    });

    it('should accept valid year range', async () => {
      const request: AgentRequest = {
        mood: 'happy',
        releaseYear: { from: 2010, to: 2020 },
      };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
    });
  });

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('successful recommendations', () => {
    it('should return recommendations on success', async () => {
      const request: AgentRequest = { mood: 'happy' };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toEqual(mockSuccessResponse);
      expect(response.recommendations).toHaveLength(1);
      expect(response.recommendations[0]?.title).toBe('The Shawshank Redemption');
    });

    it('should handle complex request', async () => {
      const request: AgentRequest = {
        mood: 'thoughtful',
        genres: ['Drama', 'Crime'],
        platforms: ['netflix', 'prime'],
        runtime: { min: 90, max: 180 },
        releaseYear: { from: 1990, to: 2020 },
      };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
      expect(response.recommendations).toBeDefined();
    });
  });

  // ===========================================================================
  // RETRY LOGIC
  // ===========================================================================

  describe('retry logic', () => {
    it('should retry on retryable error', async () => {
      const request: AgentRequest = { mood: 'happy' };
      let callCount = 0;

      jest.spyOn(service as any, 'callAgent').mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new AppError('Temporary error', 'NETWORK_ERROR', {
            isRetryable: true,
          });
        }
        return Promise.resolve(mockSuccessResponse);
      });

      const response = await service.getRecommendations(request);
      expect(response).toEqual(mockSuccessResponse);
      expect(callCount).toBe(3);
    });

    it('should not retry on non-retryable error', async () => {
      const request: AgentRequest = { mood: 'happy' };
      let callCount = 0;

      jest.spyOn(service as any, 'callAgent').mockImplementation(() => {
        callCount++;
        throw new AppError('Validation error', 'VALIDATION_ERROR', {
          isRetryable: false,
        });
      });

      await expect(service.getRecommendations(request)).rejects.toThrow(AppError);
      expect(callCount).toBe(1);
    });

    it('should respect max retries', async () => {
      const request: AgentRequest = { mood: 'happy' };
      let callCount = 0;

      jest.spyOn(service as any, 'callAgent').mockImplementation(() => {
        callCount++;
        throw new AppError('Network error', 'NETWORK_ERROR', {
          isRetryable: true,
        });
      });

      await expect(service.getRecommendations(request)).rejects.toThrow();
      expect(callCount).toBe(4); // Initial + 3 retries
    }, 10000); // Increase timeout to 10s

    it('should use exponential backoff', async () => {
      const request: AgentRequest = { mood: 'happy' };
      const delays: number[] = [];
      let lastTime = Date.now();

      jest.spyOn(service as any, 'callAgent').mockImplementation(() => {
        const now = Date.now();
        if (lastTime) {
          delays.push(now - lastTime);
        }
        lastTime = now;
        throw new AppError('Network error', 'NETWORK_ERROR', {
          isRetryable: true,
        });
      });

      await expect(service.getRecommendations(request)).rejects.toThrow();

      // Verify delays increase (exponential backoff)
      // Skip first delay as it's unreliable
      if (delays.length > 2) {
        expect(delays[2]).toBeGreaterThan(delays[1]);
      }
    }, 15000);
  });

  // ===========================================================================
  // TIMEOUT HANDLING
  // ===========================================================================

  describe('timeout handling', () => {
    it('should timeout after configured duration', async () => {
      const quickService = new MovieAgentService({
        timeout: 100,
        maxRetries: 0, // Disable retries for faster test
      });
      const request: AgentRequest = { mood: 'happy' };

      jest.spyOn(quickService as any, 'callAgent').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      await expect(quickService.getRecommendations(request)).rejects.toThrow(
        AppError
      );
      await expect(quickService.getRecommendations(request)).rejects.toThrow(
        /timeout/i
      );
    });

    it('should not timeout for fast responses', async () => {
      const request: AgentRequest = { mood: 'happy' };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toEqual(mockSuccessResponse);
    });

    it('should treat timeout as retryable', async () => {
      const quickService = new MovieAgentService({
        timeout: 50,
        maxRetries: 2,
      });
      const request: AgentRequest = { mood: 'happy' };
      let callCount = 0;

      jest.spyOn(quickService as any, 'callAgent').mockImplementation(() => {
        callCount++;
        return new Promise((resolve) => setTimeout(resolve, 1000));
      });

      await expect(quickService.getRecommendations(request)).rejects.toThrow();
      expect(callCount).toBeGreaterThan(1); // Should retry
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('error handling', () => {
    it('should wrap generic errors in AppError', async () => {
      const request: AgentRequest = { mood: 'happy' };

      jest.spyOn(service as any, 'callAgent').mockRejectedValue(
        new Error('Generic error')
      );

      await expect(service.getRecommendations(request)).rejects.toThrow(AppError);
      await expect(service.getRecommendations(request)).rejects.toThrow(
        /Generic error/
      );
    });

    it('should preserve AppError', async () => {
      const request: AgentRequest = { mood: 'happy' };
      const appError = new AppError('Custom error', 'AGENT_ERROR');

      jest.spyOn(service as any, 'callAgent').mockRejectedValue(appError);

      await expect(service.getRecommendations(request)).rejects.toThrow(appError);
    });

    it('should include retry attempt in error context', async () => {
      const request: AgentRequest = { mood: 'happy' };
      let callCount = 0;

      jest.spyOn(service as any, 'callAgent').mockImplementation(() => {
        callCount++;
        // Throw regular Error (not AppError) so context gets added
        throw new Error('Persistent error');
      });

      try {
        await service.getRecommendations(request);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        if (error instanceof AppError) {
          expect(error.context).toBeDefined();
          expect(error.context?.retryAttempt).toBe(0); // No retries for non-retryable Error
          expect(error.message).toContain('Persistent error');
        }
      }
    });

    it('should handle non-Error objects', async () => {
      const request: AgentRequest = { mood: 'happy' };

      jest.spyOn(service as any, 'callAgent').mockRejectedValue('String error');

      await expect(service.getRecommendations(request)).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle empty recommendations', async () => {
      const request: AgentRequest = { mood: 'happy' };
      const emptyResponse: AgentResponse = { recommendations: [] };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(emptyResponse);

      const response = await service.getRecommendations(request);
      expect(response.recommendations).toHaveLength(0);
    });

    it('should handle recommendations without reasoning', async () => {
      const request: AgentRequest = { mood: 'happy' };
      const responseNoReasoning: AgentResponse = {
        recommendations: mockSuccessResponse.recommendations,
      };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(responseNoReasoning);

      const response = await service.getRecommendations(request);
      expect(response.reasoning).toBeUndefined();
    });

    it('should handle runtime range with only min', async () => {
      const request: AgentRequest = {
        mood: 'happy',
        runtime: { min: 90 },
      };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
    });

    it('should handle runtime range with only max', async () => {
      const request: AgentRequest = {
        mood: 'happy',
        runtime: { max: 120 },
      };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
    });

    it('should handle year range with only from', async () => {
      const request: AgentRequest = {
        mood: 'happy',
        releaseYear: { from: 2010 },
      };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
    });

    it('should handle year range with only to', async () => {
      const request: AgentRequest = {
        mood: 'happy',
        releaseYear: { to: 2020 },
      };

      jest.spyOn(service as any, 'callAgent').mockResolvedValue(mockSuccessResponse);

      const response = await service.getRecommendations(request);
      expect(response).toBeDefined();
    });
  });
});
