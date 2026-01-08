/**
 * Error Handling Utilities
 *
 * This file contains error classes, error creators, and error handling
 * utilities for consistent error management throughout the application.
 */

import type { ErrorType, ErrorResponse } from '@/types';
import { HTTP_STATUS, ERROR_MESSAGES } from './constants';

// =============================================================================
// ERROR CLASS
// =============================================================================

/**
 * Custom application error class with additional metadata
 */
export class AppError extends Error {
  /** Error type for categorization */
  readonly errorType: ErrorType;
  /** HTTP status code */
  readonly statusCode: number;
  /** Whether the error is recoverable/retryable */
  readonly isRetryable: boolean;
  /** Retry after seconds (for rate limit errors) */
  readonly retryAfter: number | undefined;
  /** Original error that caused this error */
  readonly cause: Error | undefined;
  /** Timestamp when the error occurred */
  readonly timestamp: Date;
  /** Additional context data */
  readonly context: Record<string, unknown> | undefined;

  constructor(
    message: string,
    errorType: ErrorType,
    options: {
      statusCode?: number;
      isRetryable?: boolean;
      retryAfter?: number;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.errorType = errorType;
    this.statusCode = options.statusCode ?? getStatusCodeForErrorType(errorType);
    this.isRetryable = options.isRetryable ?? isErrorTypeRetryable(errorType);
    this.retryAfter = options.retryAfter;
    this.cause = options.cause;
    this.timestamp = new Date();
    this.context = options.context;

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert to ErrorResponse for API responses
   */
  toErrorResponse(): ErrorResponse {
    const response: ErrorResponse = {
      error: true,
      errorType: this.errorType,
      message: this.message,
    };

    if (this.retryAfter !== undefined) {
      response.retryAfter = this.retryAfter;
    }

    return response;
  }

  /**
   * Create a JSON-serializable representation
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      errorType: this.errorType,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      retryAfter: this.retryAfter,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Rate limit error class with additional rate limit metadata
 */
export class RateLimitError extends AppError {
  /** Number of requests made */
  readonly requestCount: number;
  /** Maximum allowed requests */
  readonly maxRequests: number;
  /** Time window in milliseconds */
  readonly windowMs: number;
  /** Time when the limit will reset */
  readonly resetTime: number;

  constructor(
    requestCount: number,
    maxRequests: number,
    windowMs: number,
    resetTime: number,
    retryAfterSeconds: number
  ) {
    const message = `Rate limit exceeded. ${requestCount} requests made. Maximum ${maxRequests} requests allowed per ${windowMs}ms. Try again in ${retryAfterSeconds} seconds.`;
    
    super(message, 'RATE_LIMIT_EXCEEDED', {
      retryAfter: retryAfterSeconds,
      isRetryable: true,
      context: {
        requestCount,
        maxRequests,
        windowMs,
        resetTime,
      },
    });

    this.name = 'RateLimitError';
    this.requestCount = requestCount;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.resetTime = resetTime;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }

  /**
   * Convert to ErrorResponse with rate limit headers
   */
  toErrorResponse(): ErrorResponse {
    const response: ErrorResponse = {
      error: true,
      errorType: this.errorType,
      message: this.message,
    };

    if (this.retryAfter !== undefined) {
      response.retryAfter = this.retryAfter;
    }

    return response;
  }

  /**
   * Get rate limit headers for HTTP responses
   */
  getRateLimitHeaders(): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(this.maxRequests),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.floor(this.resetTime / 1000)),
      'Retry-After': String(this.retryAfter ?? 60),
    };
  }
}

// =============================================================================
// ERROR TYPE HELPERS
// =============================================================================

/**
 * Get the default HTTP status code for an error type
 */
export function getStatusCodeForErrorType(errorType: ErrorType): number {
  switch (errorType) {
    case 'RATE_LIMIT_EXCEEDED':
      return HTTP_STATUS.TOO_MANY_REQUESTS;
    case 'VALIDATION_ERROR':
      return HTTP_STATUS.BAD_REQUEST;
    case 'NOT_FOUND':
      return HTTP_STATUS.NOT_FOUND;
    case 'API_ERROR':
      return HTTP_STATUS.INTERNAL_SERVER_ERROR;
    case 'NETWORK_ERROR':
      return HTTP_STATUS.SERVICE_UNAVAILABLE;
    case 'UNKNOWN_ERROR':
    default:
      return HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Determine if an error type is typically retryable
 */
export function isErrorTypeRetryable(errorType: ErrorType): boolean {
  switch (errorType) {
    case 'RATE_LIMIT_EXCEEDED':
    case 'NETWORK_ERROR':
      return true;
    case 'VALIDATION_ERROR':
    case 'NOT_FOUND':
    case 'API_ERROR':
    case 'UNKNOWN_ERROR':
    default:
      return false;
  }
}

/**
 * Get user-friendly message for an error type
 */
export function getUserFriendlyMessage(errorType: ErrorType): string {
  switch (errorType) {
    case 'RATE_LIMIT_EXCEEDED':
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    case 'VALIDATION_ERROR':
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 'API_ERROR':
      return ERROR_MESSAGES.API_ERROR;
    case 'NETWORK_ERROR':
      return ERROR_MESSAGES.NETWORK_ERROR;
    case 'NOT_FOUND':
      return ERROR_MESSAGES.NO_RESULTS;
    case 'UNKNOWN_ERROR':
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

// =============================================================================
// ERROR CREATORS
// =============================================================================

/**
 * Create a rate limit exceeded error
 */
export function createRateLimitError(retryAfterSeconds: number = 60): AppError {
  return new AppError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, 'RATE_LIMIT_EXCEEDED', {
    retryAfter: retryAfterSeconds,
    isRetryable: true,
  });
}

/**
 * Create a validation error
 */
export function createValidationError(
  message: string = ERROR_MESSAGES.VALIDATION_ERROR,
  context?: Record<string, unknown> | undefined
): AppError {
  return new AppError(message, 'VALIDATION_ERROR', {
    ...(context ? { context } : {}),
    isRetryable: false,
  });
}

/**
 * Create a not found error
 */
export function createNotFoundError(
  message: string = ERROR_MESSAGES.NO_RESULTS
): AppError {
  return new AppError(message, 'NOT_FOUND', {
    isRetryable: false,
  });
}

/**
 * Create an API error
 */
export function createApiError(
  message: string = ERROR_MESSAGES.API_ERROR,
  cause?: Error | undefined
): AppError {
  return new AppError(message, 'API_ERROR', {
    ...(cause ? { cause } : {}),
    isRetryable: false,
  });
}

/**
 * Create a network error
 */
export function createNetworkError(cause?: Error | undefined): AppError {
  return new AppError(ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR', {
    ...(cause ? { cause } : {}),
    isRetryable: true,
  });
}

/**
 * Create an unknown error
 */
export function createUnknownError(cause?: Error | undefined): AppError {
  return new AppError(ERROR_MESSAGES.UNKNOWN_ERROR, 'UNKNOWN_ERROR', {
    ...(cause ? { cause } : {}),
    isRetryable: false,
  });
}

// =============================================================================
// ERROR WRAPPING
// =============================================================================

/**
 * Wrap any error in an AppError
 */
export function wrapError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for specific error types based on message or name
    if (error.name === 'AbortError' || error.message.includes('abort')) {
      return createNetworkError(error);
    }

    if (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('connection')
    ) {
      return createNetworkError(error);
    }

    return createUnknownError(error);
  }

  // String error
  if (typeof error === 'string') {
    return new AppError(error, 'UNKNOWN_ERROR');
  }

  // Unknown error type
  return createUnknownError();
}

/**
 * Extract error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Check if an error is an AppError of a specific type
 */
export function isAppErrorOfType(error: unknown, errorType: ErrorType): boolean {
  return error instanceof AppError && error.errorType === errorType;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isRetryable;
  }

  // Check for network-related standard errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      error.name === 'AbortError' ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection')
    );
  }

  return false;
}

// =============================================================================
// ASYNC ERROR HANDLING
// =============================================================================

/**
 * Execute an async function with error wrapping
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, AppError]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, wrapError(error)];
  }
}

/**
 * Execute a sync function with error wrapping
 */
export function tryCatchSync<T>(fn: () => T): [T, null] | [null, AppError] {
  try {
    const result = fn();
    return [result, null];
  } catch (error) {
    return [null, wrapError(error)];
  }
}

/**
 * Retry an async function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: AppError, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = (error) => error.isRetryable,
  } = options;

  let lastError: AppError | undefined;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = wrapError(error);

      // Check if we should retry
      if (attempt >= maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError ?? createUnknownError();
}

// =============================================================================
// ERROR RESPONSE VALIDATION
// =============================================================================

/**
 * Check if a value is an ErrorResponse
 */
export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    obj.error === true &&
    typeof obj.errorType === 'string' &&
    typeof obj.message === 'string'
  );
}

/**
 * Create an ErrorResponse object
 */
export function createErrorResponse(
  errorType: ErrorType,
  message: string,
  retryAfter?: number
): ErrorResponse {
  const response: ErrorResponse = {
    error: true,
    errorType,
    message,
  };

  if (retryAfter !== undefined) {
    response.retryAfter = retryAfter;
  }

  return response;
}
