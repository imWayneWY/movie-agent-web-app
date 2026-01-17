/**
 * Movie Agent Service
 *
 * Service wrapper for movie-agent integration with:
 * - Error handling
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Provider configuration (Gemini/Azure)
 */

import { MovieAgentFactory, type MovieAgent } from 'movie-agent';
import type {
  AgentRequest,
  AgentResponse,
  AgentConfig,
  RetryOptions,
  StreamEvent,
  MovieRecommendation,
  PlatformAvailability,
} from '@/types';
import { AppError } from '@/lib/errors';
import { env } from '@/config/env';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second
const DEFAULT_MAX_RETRY_DELAY = 10000; // 10 seconds
const DEFAULT_BACKOFF_MULTIPLIER = 2;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(
  attempt: number,
  options: RetryOptions
): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isRetryable;
  }
  // Network errors are generally retryable
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED')
    );
  }
  return false;
}

// =============================================================================
// MOVIE AGENT SERVICE
// =============================================================================

/**
 * Movie Agent Service Class
 *
 * Handles all interactions with the movie-agent package
 */
export class MovieAgentService {
  private config: Required<AgentConfig>;
  private retryOptions: RetryOptions;
  private agent: MovieAgent;

  constructor(config?: Partial<AgentConfig>) {
    this.config = {
      provider: config?.provider ?? env.llmProvider,
      timeout: config?.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: config?.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryDelay: config?.retryDelay ?? DEFAULT_RETRY_DELAY,
    };

    this.retryOptions = {
      maxRetries: this.config.maxRetries,
      initialDelay: this.config.retryDelay,
      maxDelay: DEFAULT_MAX_RETRY_DELAY,
      backoffMultiplier: DEFAULT_BACKOFF_MULTIPLIER,
    };

    // Initialize the movie-agent
    this.agent = this.createAgent();
  }

  /**
   * Create a movie-agent instance with current config
   */
  private createAgent(): MovieAgent {
    const baseConfig = {
      tmdbApiKey: env.tmdbApiKey,
      tmdbRegion: 'CA' as const,
    };

    if (this.config.provider === 'azure') {
      const azureApiKey = env.azureOpenAiApiKey;
      const azureEndpoint = env.azureOpenAiEndpoint;
      const azureDeployment = env.azureOpenAiDeployment;

      if (!azureApiKey || !azureEndpoint || !azureDeployment) {
        throw new AppError(
          'Azure OpenAI configuration is incomplete. Please set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT.',
          'AGENT_ERROR',
          { statusCode: 500 }
        );
      }

      return MovieAgentFactory.create({
        ...baseConfig,
        llmProvider: 'azure',
        azureOpenAiApiKey: azureApiKey,
        azureOpenAiEndpoint: azureEndpoint,
        azureOpenAiDeployment: azureDeployment,
      });
    }

    return MovieAgentFactory.create({
      ...baseConfig,
      llmProvider: 'gemini',
      geminiApiKey: env.geminiApiKey,
    });
  }

  /**
   * Get movie recommendations from the agent
   */
  async getRecommendations(request: AgentRequest): Promise<AgentResponse> {
    return this.executeWithRetry(async () => {
      return this.callAgent(request);
    });
  }

  /**
   * Get movie recommendations as a stream
   * Yields streaming events for real-time response
   */
  async *getRecommendationsStream(request: AgentRequest): AsyncGenerator<StreamEvent> {
    // Validate request
    this.validateRequest(request);

    // Map platform IDs to display names expected by movie-agent
    const platformMap: Record<string, string> = {
      'netflix': 'Netflix',
      'prime': 'Prime Video',
      'disney': 'Disney+',
      'crave': 'Crave',
      'apple': 'Apple TV+',
      'paramount': 'Paramount+',
    };

    // Build input for movie-agent - only include defined properties
    const agentInput: Record<string, unknown> = {};
    if (request.mood) agentInput.mood = request.mood;
    if (request.genres) agentInput.genre = request.genres;
    if (request.platforms) agentInput.platforms = request.platforms.map(p => platformMap[p] || p);
    if (request.runtime) agentInput.runtime = request.runtime;
    if (request.releaseYear) agentInput.releaseYear = request.releaseYear;

    // Use movie-agent's stream method
    let streamText = '';
    
    try {
      await this.agent.stream(agentInput, (chunk: string) => {
        streamText += chunk;
      });

      // Yield the complete text as a single event after streaming completes
      yield { type: 'text' as const, data: streamText };
      yield { type: 'done' as const, data: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stream failed';
      yield { 
        type: 'error' as const, 
        data: message 
      };
    }
  }

  /**
   * Execute a function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt = 0
  ): Promise<T> {
    try {
      return await this.withTimeout(fn());
    } catch (error) {
      // Check if we should retry
      if (
        attempt < this.retryOptions.maxRetries &&
        isRetryableError(error)
      ) {
        const delay = calculateRetryDelay(attempt, this.retryOptions);
        await sleep(delay);
        return this.executeWithRetry(fn, attempt + 1);
      }

      // Max retries exceeded or non-retryable error
      throw this.handleError(error, attempt);
    }
  }

  /**
   * Execute a function with timeout
   */
  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new AppError(
                `Request timeout after ${this.config.timeout}ms`,
                'TIMEOUT_ERROR',
                { statusCode: 408, isRetryable: true }
              )
            ),
          this.config.timeout
        )
      ),
    ]);
  }

  /**
   * Call the movie-agent package
   */
  private async callAgent(request: AgentRequest): Promise<AgentResponse> {
    // Validate request
    this.validateRequest(request);

    // Map platform IDs to display names expected by movie-agent
    const platformMap: Record<string, string> = {
      'netflix': 'Netflix',
      'prime': 'Prime Video',
      'disney': 'Disney+',
      'crave': 'Crave',
      'apple': 'Apple TV+',
      'paramount': 'Paramount+',
    };

    // Build input for movie-agent - only include defined properties
    const agentInput: Record<string, unknown> = {};
    if (request.mood) agentInput.mood = request.mood;
    if (request.genres) agentInput.genre = request.genres;
    if (request.platforms) agentInput.platforms = request.platforms.map(p => platformMap[p] || p);
    if (request.runtime) agentInput.runtime = request.runtime;
    if (request.releaseYear) agentInput.releaseYear = request.releaseYear;

    const result = await this.agent.getRecommendations(agentInput);

    // Check for error response
    if ('error' in result && result.error) {
      throw new AppError(
        result.message || 'Movie agent error',
        'AGENT_ERROR',
        { statusCode: 500 }
      );
    }

    // At this point, result is AgentResponse (not ErrorResponse)
    // Use type assertion via unknown to handle movie-agent's return type
    const agentResult = result as unknown as { 
      recommendations: Array<{
        tmdbId?: number;
        title: string;
        description?: string;
        overview?: string;
        posterUrl?: string | null;
        releaseYear?: number | string;
        runtime?: number;
        genres?: string[];
        streamingPlatforms?: Array<{ name: string; logo?: string; link?: string; type?: string }>;
        matchReason?: string;
        voteAverage?: number;
        voteCount?: number;
        originalLanguage?: string;
      }> 
    };

    // Map movie-agent response to our types
    const recommendations: MovieRecommendation[] = agentResult.recommendations.map((rec, index) => {
      const platforms: PlatformAvailability[] = (rec.streamingPlatforms || []).map((p) => {
        const platform: PlatformAvailability = {
          id: p.name.toLowerCase().replace(/[^a-z]/g, '') as PlatformAvailability['id'],
          name: p.name,
          logo: p.logo || `/platforms/${p.name.toLowerCase().replace(/[^a-z]/g, '')}.svg`,
        };
        if (p.link) {
          platform.url = p.link;
        }
        return platform;
      });

      // Use description if overview is not available
      const overview = rec.overview || rec.description || '';
      
      // Convert releaseYear to string for releaseDate
      const releaseDate = rec.releaseYear ? String(rec.releaseYear) : '';

      // Extract posterPath from full posterUrl if available
      // posterUrl format: https://image.tmdb.org/t/p/w500/abc123.jpg
      const posterPath = rec.posterUrl 
        ? rec.posterUrl.replace(/^https:\/\/image\.tmdb\.org\/t\/p\/w\d+/, '')
        : null;

      return {
        id: rec.tmdbId ?? index + 1, // Use index as fallback ID
        title: rec.title,
        overview,
        posterPath,
        backdropPath: null,
        releaseDate,
        runtime: rec.runtime || null,
        voteAverage: rec.voteAverage || 0,
        voteCount: rec.voteCount || 0,
        genres: rec.genres || [],
        originalLanguage: rec.originalLanguage || 'en',
        matchReason: rec.matchReason || '',
        platforms,
      };
    });

    return { recommendations };
  }

  /**
   * Validate agent request
   */
  private validateRequest(request: AgentRequest): void {
    // Basic validation
    if (!request.mood && !request.genres?.length && !request.platforms?.length) {
      throw new AppError(
        'At least one filter (mood, genre, or platform) is required',
        'VALIDATION_ERROR',
        { statusCode: 400, isRetryable: false }
      );
    }

    // Validate runtime range
    if (request.runtime) {
      if (
        request.runtime.min !== undefined &&
        request.runtime.max !== undefined &&
        request.runtime.min > request.runtime.max
      ) {
        throw new AppError(
          'Invalid runtime range: min cannot be greater than max',
          'VALIDATION_ERROR',
          { statusCode: 400, isRetryable: false }
        );
      }
    }

    // Validate year range
    if (request.releaseYear) {
      if (
        request.releaseYear.from !== undefined &&
        request.releaseYear.to !== undefined &&
        request.releaseYear.from > request.releaseYear.to
      ) {
        throw new AppError(
          'Invalid year range: from cannot be greater than to',
          'VALIDATION_ERROR',
          { statusCode: 400, isRetryable: false }
        );
      }
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown, retryAttempt: number): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Convert to AppError
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    const errorOptions: {
      statusCode?: number;
      isRetryable?: boolean;
      retryAfter?: number;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {
      statusCode: 500,
      isRetryable: false,
      context: { retryAttempt },
    };

    if (error instanceof Error) {
      errorOptions.cause = error;
    }

    return new AppError(
      `Agent call failed after ${retryAttempt} retries: ${errorMessage}`,
      'AGENT_ERROR',
      errorOptions
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<AgentConfig>> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AgentConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    if (config.maxRetries !== undefined || config.retryDelay !== undefined) {
      this.retryOptions = {
        ...this.retryOptions,
        maxRetries: config.maxRetries ?? this.config.maxRetries,
        initialDelay: config.retryDelay ?? this.config.retryDelay,
      };
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Default movie agent service instance
 */
export const movieAgentService = new MovieAgentService();

/**
 * Create a new movie agent service instance with custom config
 */
export function createMovieAgentService(
  config?: Partial<AgentConfig>
): MovieAgentService {
  return new MovieAgentService(config);
}
