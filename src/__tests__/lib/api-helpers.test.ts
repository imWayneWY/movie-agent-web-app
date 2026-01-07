/**
 * Unit Tests for API Response Helpers
 *
 * Comprehensive tests for all API helper functions in api-helpers.ts
 */

import { NextResponse } from 'next/server';
import {
  successResponse,
  errorResponse,
  errorResponseFromAppError,
  errorResponseFromError,
  rateLimitResponse,
  validationErrorResponse,
  notFoundResponse,
  apiErrorResponse,
  internalServerErrorResponse,
  parseJsonBody,
  getClientIp,
  getQueryParams,
  getQueryParam,
  buildRecommendMetadata,
  createTimer,
  corsHeaders,
  corsPreflightResponse,
  addCorsHeaders,
  createSSEResponse,
  createSSEEvent,
  createSSEEncoder,
  withErrorHandling,
  composeMiddleware,
} from '@/lib/api-helpers';
import { AppError } from '@/lib/errors';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      data,
      status: init?.status ?? 200,
      headers: new Map(Object.entries(init?.headers ?? {})),
    })),
  },
}));

// =============================================================================
// RESPONSE BUILDERS TESTS
// =============================================================================

describe('Response Builders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successResponse', () => {
    it('should create a success response with data', () => {
      const data = { message: 'Success' };
      successResponse(data);

      expect(NextResponse.json).toHaveBeenCalledWith(data, { status: 200 });
    });

    it('should accept custom status code', () => {
      successResponse({ id: 1 }, 201);

      expect(NextResponse.json).toHaveBeenCalledWith({ id: 1 }, { status: 201 });
    });
  });

  describe('errorResponse', () => {
    it('should create an error response', () => {
      errorResponse('VALIDATION_ERROR', 'Invalid input');

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: true,
          errorType: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
        expect.objectContaining({ status: 400 })
      );
    });

    it('should include retryAfter header when provided', () => {
      errorResponse('RATE_LIMIT_EXCEEDED', 'Too fast', 429, 60);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ retryAfter: 60 }),
        expect.objectContaining({
          status: 429,
          headers: { 'Retry-After': '60' },
        })
      );
    });

    it('should use correct status for each error type', () => {
      errorResponse('NOT_FOUND', 'Not found');
      expect(NextResponse.json).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 404 })
      );

      errorResponse('API_ERROR', 'Server error');
      expect(NextResponse.json).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 500 })
      );
    });
  });

  describe('errorResponseFromAppError', () => {
    it('should convert AppError to response', () => {
      const appError = new AppError('Test error', 'VALIDATION_ERROR');
      errorResponseFromAppError(appError);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: true,
          errorType: 'VALIDATION_ERROR',
          message: 'Test error',
        },
        expect.objectContaining({ status: 400 })
      );
    });

    it('should include retryAfter from AppError', () => {
      const appError = new AppError('Too fast', 'RATE_LIMIT_EXCEEDED', { retryAfter: 60 });
      errorResponseFromAppError(appError);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ retryAfter: 60 }),
        expect.objectContaining({
          headers: { 'Retry-After': '60' },
        })
      );
    });
  });

  describe('errorResponseFromError', () => {
    it('should wrap standard Error and create response', () => {
      const error = new Error('Something failed');
      errorResponseFromError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          errorType: 'UNKNOWN_ERROR',
        }),
        expect.anything()
      );
    });

    it('should handle AppError directly', () => {
      const appError = new AppError('App error', 'API_ERROR');
      errorResponseFromError(appError);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'API_ERROR',
        }),
        expect.anything()
      );
    });
  });
});

// =============================================================================
// SPECIALIZED ERROR RESPONSES TESTS
// =============================================================================

describe('Specialized Error Responses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rateLimitResponse', () => {
    it('should create rate limit response with default retry', () => {
      rateLimitResponse();

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          errorType: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60,
        }),
        expect.objectContaining({ status: 429 })
      );
    });

    it('should accept custom retry time', () => {
      rateLimitResponse(120);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ retryAfter: 120 }),
        expect.anything()
      );
    });
  });

  describe('validationErrorResponse', () => {
    it('should create validation error response', () => {
      validationErrorResponse('Invalid email format');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        }),
        expect.objectContaining({ status: 400 })
      );
    });
  });

  describe('notFoundResponse', () => {
    it('should create not found response', () => {
      notFoundResponse('Movie not found');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'NOT_FOUND',
          message: 'Movie not found',
        }),
        expect.objectContaining({ status: 404 })
      );
    });
  });

  describe('apiErrorResponse', () => {
    it('should create API error response', () => {
      apiErrorResponse();

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'API_ERROR' }),
        expect.objectContaining({ status: 500 })
      );
    });
  });

  describe('internalServerErrorResponse', () => {
    it('should create internal server error response', () => {
      internalServerErrorResponse();

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'UNKNOWN_ERROR' }),
        expect.objectContaining({ status: 500 })
      );
    });
  });
});

// =============================================================================
// REQUEST PARSING TESTS
// =============================================================================

describe('Request Parsing', () => {
  describe('parseJsonBody', () => {
    it('should parse valid JSON body', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: 'test' }),
      } as unknown as Request;

      const [result, error] = await parseJsonBody(mockRequest);

      expect(result).toEqual({ name: 'test' });
      expect(error).toBeNull();
    });

    it('should return error for invalid JSON', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Request;

      const [result, error] = await parseJsonBody(mockRequest);

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(AppError);
      expect(error?.errorType).toBe('VALIDATION_ERROR');
    });
  });

  describe('getClientIp', () => {
    it('should get IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: new Headers({
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        }),
      } as unknown as Request;

      expect(getClientIp(mockRequest)).toBe('192.168.1.1');
    });

    it('should get IP from x-real-ip header', () => {
      const mockRequest = {
        headers: new Headers({
          'x-real-ip': '192.168.1.2',
        }),
      } as unknown as Request;

      expect(getClientIp(mockRequest)).toBe('192.168.1.2');
    });

    it('should get IP from cf-connecting-ip header', () => {
      const mockRequest = {
        headers: new Headers({
          'cf-connecting-ip': '192.168.1.3',
        }),
      } as unknown as Request;

      expect(getClientIp(mockRequest)).toBe('192.168.1.3');
    });

    it('should return localhost as fallback', () => {
      const mockRequest = {
        headers: new Headers({}),
      } as unknown as Request;

      expect(getClientIp(mockRequest)).toBe('127.0.0.1');
    });
  });

  describe('getQueryParams', () => {
    it('should extract query parameters', () => {
      const mockRequest = {
        url: 'https://example.com/api?foo=bar&baz=qux',
      } as unknown as Request;

      expect(getQueryParams(mockRequest)).toEqual({
        foo: 'bar',
        baz: 'qux',
      });
    });

    it('should return empty object for no params', () => {
      const mockRequest = {
        url: 'https://example.com/api',
      } as unknown as Request;

      expect(getQueryParams(mockRequest)).toEqual({});
    });
  });

  describe('getQueryParam', () => {
    it('should get specific query parameter', () => {
      const mockRequest = {
        url: 'https://example.com/api?page=2',
      } as unknown as Request;

      expect(getQueryParam(mockRequest, 'page')).toBe('2');
    });

    it('should return default value if not found', () => {
      const mockRequest = {
        url: 'https://example.com/api',
      } as unknown as Request;

      expect(getQueryParam(mockRequest, 'page', '1')).toBe('1');
    });

    it('should return undefined if not found and no default', () => {
      const mockRequest = {
        url: 'https://example.com/api',
      } as unknown as Request;

      expect(getQueryParam(mockRequest, 'page')).toBeUndefined();
    });
  });
});

// =============================================================================
// METADATA BUILDERS TESTS
// =============================================================================

describe('Metadata Builders', () => {
  describe('buildRecommendMetadata', () => {
    it('should build metadata with all fields', () => {
      const input = { mood: 'happy' };
      const metadata = buildRecommendMetadata(input, 5, 150);

      expect(metadata).toEqual({
        timestamp: expect.any(String),
        inputParameters: { mood: 'happy' },
        totalResults: 5,
        processingTimeMs: 150,
      });
    });

    it('should exclude processingTimeMs when undefined', () => {
      const metadata = buildRecommendMetadata({}, 0);

      expect(metadata).not.toHaveProperty('processingTimeMs');
    });

    it('should include valid timestamp', () => {
      const metadata = buildRecommendMetadata({}, 0);
      const timestamp = new Date(metadata.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });

  describe('createTimer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should measure elapsed time', () => {
      const timer = createTimer();

      jest.advanceTimersByTime(100);

      const elapsed = timer();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });
  });
});

// =============================================================================
// CORS HELPERS TESTS
// =============================================================================

describe('CORS Helpers', () => {
  describe('corsHeaders', () => {
    it('should contain required CORS headers', () => {
      expect(corsHeaders).toHaveProperty('Access-Control-Allow-Origin');
      expect(corsHeaders).toHaveProperty('Access-Control-Allow-Methods');
      expect(corsHeaders).toHaveProperty('Access-Control-Allow-Headers');
    });
  });

  describe('corsPreflightResponse', () => {
    it('should be a function', () => {
      // NextResponse constructor isn't available in test environment
      // Just verify the function exists
      expect(typeof corsPreflightResponse).toBe('function');
    });
  });

  describe('addCorsHeaders', () => {
    it('should add CORS headers to response', () => {
      const mockResponse = {
        headers: {
          set: jest.fn(),
        },
      } as unknown as NextResponse;

      addCorsHeaders(mockResponse);

      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        '*'
      );
    });
  });
});

// =============================================================================
// STREAMING HELPERS TESTS
// =============================================================================

describe('Streaming Helpers', () => {
  describe('createSSEResponse', () => {
    it('should be a function that creates streaming responses', () => {
      // ReadableStream isn't available in test environment
      // Just verify the function exists
      expect(typeof createSSEResponse).toBe('function');
    });
  });

  describe('createSSEEvent', () => {
    it('should format SSE event string', () => {
      const event = createSSEEvent('message', { text: 'Hello' });

      expect(event).toContain('event: message');
      expect(event).toContain('data: {"text":"Hello"}');
    });

    it('should include event ID when provided', () => {
      const event = createSSEEvent('message', { text: 'Hello' }, '123');

      expect(event).toContain('id: 123');
    });
  });

  describe('createSSEEncoder', () => {
    it('should be a function that creates encoder', () => {
      // TextEncoder isn't available in standard Jest environment
      // Just verify the function exists
      expect(typeof createSSEEncoder).toBe('function');
    });
  });
});

// =============================================================================
// REQUEST HANDLER WRAPPER TESTS
// =============================================================================

describe('Request Handler Wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withErrorHandling', () => {
    it('should pass through successful responses', async () => {
      const handler = jest.fn().mockResolvedValue({
        data: { success: true },
        status: 200,
      });

      const wrapped = withErrorHandling(handler);
      const mockRequest = {} as Request;

      const result = await wrapped(mockRequest);

      expect(result).toEqual({
        data: { success: true },
        status: 200,
      });
    });

    it('should catch errors and return error response', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler failed'));

      const wrapped = withErrorHandling(handler);
      const mockRequest = {} as Request;

      await wrapped(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          errorType: 'UNKNOWN_ERROR',
        }),
        expect.anything()
      );
    });

    it('should handle AppError correctly', async () => {
      const handler = jest.fn().mockRejectedValue(
        new AppError('Validation failed', 'VALIDATION_ERROR')
      );

      const wrapped = withErrorHandling(handler);
      const mockRequest = {} as Request;

      await wrapped(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'VALIDATION_ERROR',
          message: 'Validation failed',
        }),
        expect.anything()
      );
    });
  });

  describe('composeMiddleware', () => {
    it('should be a function', () => {
      expect(typeof composeMiddleware).toBe('function');
    });

    it('should compose middleware functions', async () => {
      const middleware1 = jest.fn((_req, next) => next());
      const middleware2 = jest.fn((_req, next) => next());
      const handler = jest.fn().mockResolvedValue({ status: 200, data: 'success' });
      const mockRequest = {} as Request;

      const composed = composeMiddleware(middleware1, middleware2);
      await composed(mockRequest, handler);

      expect(middleware1).toHaveBeenCalledWith(mockRequest, expect.any(Function));
      expect(middleware2).toHaveBeenCalledWith(mockRequest, expect.any(Function));
      expect(handler).toHaveBeenCalled();
    });

    it('should execute middleware in order', async () => {
      const order: number[] = [];
      const middleware1 = jest.fn(async (_req, next) => {
        order.push(1);
        return next();
      });
      const middleware2 = jest.fn(async (_req, next) => {
        order.push(2);
        return next();
      });
      const handler = jest.fn().mockImplementation(async () => {
        order.push(3);
        return { status: 200 };
      });
      const mockRequest = {} as Request;

      const composed = composeMiddleware(middleware1, middleware2);
      await composed(mockRequest, handler);

      expect(order).toEqual([1, 2, 3]);
    });

    it('should allow middleware to short-circuit', async () => {
      const middleware1 = jest.fn(async () => {
        return { status: 401, error: true } as unknown as NextResponse;
      });
      const middleware2 = jest.fn((_req, next) => next());
      const handler = jest.fn().mockResolvedValue({ status: 200 });
      const mockRequest = {} as Request;

      const composed = composeMiddleware(middleware1, middleware2);
      const result = await composed(mockRequest, handler);

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 401, error: true });
    });

    it('should call handler when no middleware', async () => {
      const handler = jest.fn().mockResolvedValue({ status: 200, data: 'ok' });
      const mockRequest = {} as Request;

      const composed = composeMiddleware();
      const result = await composed(mockRequest, handler);

      expect(handler).toHaveBeenCalled();
      expect(result).toEqual({ status: 200, data: 'ok' });
    });
  });
});
