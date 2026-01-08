/**
 * Movie Agent Service
 *
 * Service wrapper for movie-agent integration with:
 * - Error handling
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Provider configuration (Gemini/Azure)
 */

import type {
  AgentRequest,
  AgentResponse,
  AgentConfig,
  RetryOptions,
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
   * This is a placeholder that will be replaced with actual movie-agent integration
   */
  private async callAgent(request: AgentRequest): Promise<AgentResponse> {
    // Validate request
    this.validateRequest(request);

    // TODO: Replace with actual movie-agent call
    // For now, this is a mock implementation
    // In production, this will call the movie-agent package:
    // const agent = new MovieAgent({ provider: this.config.provider });
    // const result = await agent.recommend(request);

    // Mock implementation for testing
    if (process.env.NODE_ENV === 'test') {
      // This will be mocked in tests
      throw new Error('Agent not implemented - should be mocked in tests');
    }

    // Production placeholder
    throw new AppError(
      'Movie agent integration not yet implemented',
      'AGENT_ERROR',
      { statusCode: 501 }
    );
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
