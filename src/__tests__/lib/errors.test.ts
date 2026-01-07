/**
 * Unit Tests for Error Handling Utilities
 *
 * Comprehensive tests for all error handling functions in errors.ts
 */

import {
  AppError,
  getStatusCodeForErrorType,
  isErrorTypeRetryable,
  getUserFriendlyMessage,
  createRateLimitError,
  createValidationError,
  createNotFoundError,
  createApiError,
  createNetworkError,
  createUnknownError,
  wrapError,
  getErrorMessage,
  isAppErrorOfType,
  isRetryableError,
  tryCatch,
  tryCatchSync,
  withRetry,
  isErrorResponse,
  createErrorResponse,
} from '@/lib/errors';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/lib/constants';

// =============================================================================
// APP ERROR CLASS TESTS
// =============================================================================

describe('AppError', () => {
  it('should create an error with required properties', () => {
    const error = new AppError('Test error', 'VALIDATION_ERROR');

    expect(error.message).toBe('Test error');
    expect(error.errorType).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('AppError');
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should set correct default status code', () => {
    const error = new AppError('Test', 'RATE_LIMIT_EXCEEDED');
    expect(error.statusCode).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
  });

  it('should set correct default retryable status', () => {
    const retryable = new AppError('Test', 'NETWORK_ERROR');
    expect(retryable.isRetryable).toBe(true);

    const notRetryable = new AppError('Test', 'VALIDATION_ERROR');
    expect(notRetryable.isRetryable).toBe(false);
  });

  it('should accept custom options', () => {
    const cause = new Error('Original error');
    const context = { field: 'email' };

    const error = new AppError('Test', 'API_ERROR', {
      statusCode: 503,
      isRetryable: true,
      retryAfter: 30,
      cause,
      context,
    });

    expect(error.statusCode).toBe(503);
    expect(error.isRetryable).toBe(true);
    expect(error.retryAfter).toBe(30);
    expect(error.cause).toBe(cause);
    expect(error.context).toEqual(context);
  });

  describe('toErrorResponse', () => {
    it('should convert to ErrorResponse format', () => {
      const error = new AppError('Test message', 'VALIDATION_ERROR');
      const response = error.toErrorResponse();

      expect(response).toEqual({
        error: true,
        errorType: 'VALIDATION_ERROR',
        message: 'Test message',
      });
    });

    it('should include retryAfter when set', () => {
      const error = new AppError('Test', 'RATE_LIMIT_EXCEEDED', { retryAfter: 60 });
      const response = error.toErrorResponse();

      expect(response.retryAfter).toBe(60);
    });
  });

  describe('toJSON', () => {
    it('should create JSON-serializable object', () => {
      const error = new AppError('Test', 'API_ERROR');
      const json = error.toJSON();

      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test');
      expect(json.errorType).toBe('API_ERROR');
      expect(typeof json.timestamp).toBe('string');
    });
  });
});

// =============================================================================
// ERROR TYPE HELPER TESTS
// =============================================================================

describe('Error Type Helpers', () => {
  describe('getStatusCodeForErrorType', () => {
    it('should return correct status codes', () => {
      expect(getStatusCodeForErrorType('RATE_LIMIT_EXCEEDED')).toBe(429);
      expect(getStatusCodeForErrorType('VALIDATION_ERROR')).toBe(400);
      expect(getStatusCodeForErrorType('NOT_FOUND')).toBe(404);
      expect(getStatusCodeForErrorType('API_ERROR')).toBe(500);
      expect(getStatusCodeForErrorType('NETWORK_ERROR')).toBe(503);
      expect(getStatusCodeForErrorType('UNKNOWN_ERROR')).toBe(500);
    });
  });

  describe('isErrorTypeRetryable', () => {
    it('should identify retryable error types', () => {
      expect(isErrorTypeRetryable('RATE_LIMIT_EXCEEDED')).toBe(true);
      expect(isErrorTypeRetryable('NETWORK_ERROR')).toBe(true);
    });

    it('should identify non-retryable error types', () => {
      expect(isErrorTypeRetryable('VALIDATION_ERROR')).toBe(false);
      expect(isErrorTypeRetryable('NOT_FOUND')).toBe(false);
      expect(isErrorTypeRetryable('API_ERROR')).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly messages for all error types', () => {
      expect(getUserFriendlyMessage('RATE_LIMIT_EXCEEDED')).toBe(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      expect(getUserFriendlyMessage('VALIDATION_ERROR')).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
      expect(getUserFriendlyMessage('NOT_FOUND')).toBe(ERROR_MESSAGES.NO_RESULTS);
      expect(getUserFriendlyMessage('API_ERROR')).toBe(ERROR_MESSAGES.API_ERROR);
      expect(getUserFriendlyMessage('NETWORK_ERROR')).toBe(ERROR_MESSAGES.NETWORK_ERROR);
      expect(getUserFriendlyMessage('UNKNOWN_ERROR')).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });
  });
});

// =============================================================================
// ERROR CREATOR TESTS
// =============================================================================

describe('Error Creators', () => {
  describe('createRateLimitError', () => {
    it('should create rate limit error with default retry', () => {
      const error = createRateLimitError();

      expect(error.errorType).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.retryAfter).toBe(60);
      expect(error.isRetryable).toBe(true);
    });

    it('should accept custom retry time', () => {
      const error = createRateLimitError(120);
      expect(error.retryAfter).toBe(120);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with default message', () => {
      const error = createValidationError();

      expect(error.errorType).toBe('VALIDATION_ERROR');
      expect(error.message).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
      expect(error.isRetryable).toBe(false);
    });

    it('should accept custom message and context', () => {
      const error = createValidationError('Invalid email', { field: 'email' });

      expect(error.message).toBe('Invalid email');
      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('createNotFoundError', () => {
    it('should create not found error', () => {
      const error = createNotFoundError();

      expect(error.errorType).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('should accept custom message', () => {
      const error = createNotFoundError('Movie not found');
      expect(error.message).toBe('Movie not found');
    });
  });

  describe('createApiError', () => {
    it('should create API error', () => {
      const error = createApiError();

      expect(error.errorType).toBe('API_ERROR');
      expect(error.isRetryable).toBe(false);
    });

    it('should preserve cause', () => {
      const cause = new Error('Original');
      const error = createApiError('API failed', cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('createNetworkError', () => {
    it('should create network error', () => {
      const error = createNetworkError();

      expect(error.errorType).toBe('NETWORK_ERROR');
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('createUnknownError', () => {
    it('should create unknown error', () => {
      const error = createUnknownError();

      expect(error.errorType).toBe('UNKNOWN_ERROR');
    });
  });
});

// =============================================================================
// ERROR WRAPPING TESTS
// =============================================================================

describe('Error Wrapping', () => {
  describe('wrapError', () => {
    it('should return AppError as-is', () => {
      const original = new AppError('Test', 'API_ERROR');
      const wrapped = wrapError(original);

      expect(wrapped).toBe(original);
    });

    it('should wrap standard Error', () => {
      const original = new Error('Standard error');
      const wrapped = wrapError(original);

      expect(wrapped).toBeInstanceOf(AppError);
      expect(wrapped.cause).toBe(original);
    });

    it('should detect network errors from message', () => {
      const networkError = new Error('Network request failed');
      const wrapped = wrapError(networkError);

      expect(wrapped.errorType).toBe('NETWORK_ERROR');
    });

    it('should detect AbortError', () => {
      const abortError = new Error('abort');
      abortError.name = 'AbortError';
      const wrapped = wrapError(abortError);

      expect(wrapped.errorType).toBe('NETWORK_ERROR');
    });

    it('should wrap string as unknown error', () => {
      const wrapped = wrapError('Something went wrong');

      expect(wrapped).toBeInstanceOf(AppError);
      expect(wrapped.message).toBe('Something went wrong');
    });

    it('should handle non-error types', () => {
      const wrapped = wrapError(null);

      expect(wrapped).toBeInstanceOf(AppError);
      expect(wrapped.errorType).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getErrorMessage', () => {
    it('should get message from AppError', () => {
      const error = new AppError('App error message', 'API_ERROR');
      expect(getErrorMessage(error)).toBe('App error message');
    });

    it('should get message from standard Error', () => {
      const error = new Error('Standard message');
      expect(getErrorMessage(error)).toBe('Standard message');
    });

    it('should return string as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return default for unknown types', () => {
      expect(getErrorMessage(null)).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });
  });

  describe('isAppErrorOfType', () => {
    it('should return true for matching type', () => {
      const error = new AppError('Test', 'VALIDATION_ERROR');
      expect(isAppErrorOfType(error, 'VALIDATION_ERROR')).toBe(true);
    });

    it('should return false for non-matching type', () => {
      const error = new AppError('Test', 'VALIDATION_ERROR');
      expect(isAppErrorOfType(error, 'API_ERROR')).toBe(false);
    });

    it('should return false for non-AppError', () => {
      const error = new Error('Standard error');
      expect(isAppErrorOfType(error, 'VALIDATION_ERROR')).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should check AppError isRetryable property', () => {
      const retryable = new AppError('Test', 'NETWORK_ERROR');
      expect(isRetryableError(retryable)).toBe(true);

      const notRetryable = new AppError('Test', 'VALIDATION_ERROR');
      expect(isRetryableError(notRetryable)).toBe(false);
    });

    it('should detect network-related standard errors', () => {
      const networkError = new Error('Network timeout');
      expect(isRetryableError(networkError)).toBe(true);

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      expect(isRetryableError(abortError)).toBe(true);
    });

    it('should return false for non-retryable standard errors', () => {
      const error = new Error('Regular error');
      expect(isRetryableError(error)).toBe(false);
    });
  });
});

// =============================================================================
// ASYNC ERROR HANDLING TESTS
// =============================================================================

describe('Async Error Handling', () => {
  describe('tryCatch', () => {
    it('should return result tuple on success', async () => {
      const [result, error] = await tryCatch(async () => 'success');

      expect(result).toBe('success');
      expect(error).toBeNull();
    });

    it('should return error tuple on failure', async () => {
      const [result, error] = await tryCatch(async () => {
        throw new Error('Failed');
      });

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('tryCatchSync', () => {
    it('should return result tuple on success', () => {
      const [result, error] = tryCatchSync(() => 'success');

      expect(result).toBe('success');
      expect(error).toBeNull();
    });

    it('should return error tuple on failure', () => {
      const [result, error] = tryCatchSync(() => {
        throw new Error('Failed');
      });

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(createNetworkError())
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const fn = jest.fn().mockRejectedValue(createValidationError());

      await expect(
        withRetry(fn, { maxRetries: 3, initialDelayMs: 10 })
      ).rejects.toBeInstanceOf(AppError);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries', async () => {
      const fn = jest.fn().mockRejectedValue(createNetworkError());

      await expect(
        withRetry(fn, { maxRetries: 2, initialDelayMs: 10 })
      ).rejects.toBeInstanceOf(AppError);

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use custom shouldRetry function', async () => {
      const fn = jest.fn().mockRejectedValue(createApiError());
      const shouldRetry = jest.fn().mockReturnValue(true);

      await expect(
        withRetry(fn, { maxRetries: 1, initialDelayMs: 10, shouldRetry })
      ).rejects.toBeInstanceOf(AppError);

      expect(shouldRetry).toHaveBeenCalled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

// =============================================================================
// ERROR RESPONSE TESTS
// =============================================================================

describe('Error Response', () => {
  describe('isErrorResponse', () => {
    it('should return true for valid ErrorResponse', () => {
      const response = {
        error: true,
        errorType: 'API_ERROR',
        message: 'Something went wrong',
      };

      expect(isErrorResponse(response)).toBe(true);
    });

    it('should return true for ErrorResponse with retryAfter', () => {
      const response = {
        error: true,
        errorType: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        retryAfter: 60,
      };

      expect(isErrorResponse(response)).toBe(true);
    });

    it('should return false for non-error response', () => {
      expect(isErrorResponse({ data: 'success' })).toBe(false);
      expect(isErrorResponse({ error: false })).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isErrorResponse(null)).toBe(false);
      expect(isErrorResponse(undefined)).toBe(false);
    });
  });

  describe('createErrorResponse', () => {
    it('should create ErrorResponse object', () => {
      const response = createErrorResponse('VALIDATION_ERROR', 'Invalid input');

      expect(response).toEqual({
        error: true,
        errorType: 'VALIDATION_ERROR',
        message: 'Invalid input',
      });
    });

    it('should include retryAfter when provided', () => {
      const response = createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too fast', 60);

      expect(response.retryAfter).toBe(60);
    });
  });
});
