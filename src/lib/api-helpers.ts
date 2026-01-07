/**
 * API Response Helpers
 *
 * This file contains utilities for building consistent API responses,
 * handling request parsing, and managing API-related operations.
 */

import { NextResponse } from 'next/server';
import type { ErrorType, ErrorResponse, RecommendMetadata } from '@/types';
import { HTTP_STATUS, ERROR_MESSAGES } from './constants';
import { AppError, wrapError, createErrorResponse } from './errors';

// =============================================================================
// RESPONSE BUILDERS
// =============================================================================

/**
 * Build a successful JSON response
 */
export function successResponse<T>(
  data: T,
  status: number = HTTP_STATUS.OK
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Build an error JSON response
 */
export function errorResponse(
  errorType: ErrorType,
  message: string,
  status?: number,
  retryAfter?: number
): NextResponse<ErrorResponse> {
  const response = createErrorResponse(errorType, message, retryAfter);
  const statusCode = status ?? getStatusCodeForType(errorType);

  const headers: HeadersInit = {};
  if (retryAfter !== undefined) {
    headers['Retry-After'] = retryAfter.toString();
  }

  return NextResponse.json(response, { status: statusCode, headers });
}

/**
 * Build an error response from an AppError
 */
export function errorResponseFromAppError(error: AppError): NextResponse<ErrorResponse> {
  const headers: HeadersInit = {};
  if (error.retryAfter !== undefined) {
    headers['Retry-After'] = error.retryAfter.toString();
  }

  return NextResponse.json(error.toErrorResponse(), {
    status: error.statusCode,
    headers,
  });
}

/**
 * Build an error response from any error
 */
export function errorResponseFromError(error: unknown): NextResponse<ErrorResponse> {
  const appError = wrapError(error);
  return errorResponseFromAppError(appError);
}

// =============================================================================
// SPECIALIZED ERROR RESPONSES
// =============================================================================

/**
 * Build a rate limit error response
 */
export function rateLimitResponse(retryAfterSeconds: number = 60): NextResponse<ErrorResponse> {
  return errorResponse(
    'RATE_LIMIT_EXCEEDED',
    ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    retryAfterSeconds
  );
}

/**
 * Build a validation error response
 */
export function validationErrorResponse(
  message: string = ERROR_MESSAGES.VALIDATION_ERROR
): NextResponse<ErrorResponse> {
  return errorResponse('VALIDATION_ERROR', message, HTTP_STATUS.BAD_REQUEST);
}

/**
 * Build a not found error response
 */
export function notFoundResponse(
  message: string = ERROR_MESSAGES.NO_RESULTS
): NextResponse<ErrorResponse> {
  return errorResponse('NOT_FOUND', message, HTTP_STATUS.NOT_FOUND);
}

/**
 * Build an API error response
 */
export function apiErrorResponse(
  message: string = ERROR_MESSAGES.API_ERROR
): NextResponse<ErrorResponse> {
  return errorResponse('API_ERROR', message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

/**
 * Build an internal server error response
 */
export function internalServerErrorResponse(): NextResponse<ErrorResponse> {
  return errorResponse(
    'UNKNOWN_ERROR',
    ERROR_MESSAGES.UNKNOWN_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

// =============================================================================
// REQUEST PARSING
// =============================================================================

/**
 * Safely parse JSON from a request body
 */
export async function parseJsonBody<T = unknown>(
  request: Request
): Promise<[T, null] | [null, AppError]> {
  try {
    const body = await request.json();
    return [body as T, null];
  } catch (error) {
    const appError = new AppError(
      'Invalid JSON in request body',
      'VALIDATION_ERROR',
      {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        ...(error instanceof Error ? { cause: error } : {}),
      }
    );
    return [null, appError];
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers in order of preference
  const headers = new Headers(request.headers);

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain
    const firstIp = forwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : '127.0.0.1';
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback for development
  return '127.0.0.1';
}

/**
 * Get query parameters as an object
 */
export function getQueryParams(request: Request): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Get a specific query parameter with optional default
 */
export function getQueryParam(
  request: Request,
  key: string,
  defaultValue?: string
): string | undefined {
  const url = new URL(request.url);
  return url.searchParams.get(key) ?? defaultValue;
}

// =============================================================================
// METADATA BUILDERS
// =============================================================================

/**
 * Build recommendation metadata
 */
export function buildRecommendMetadata<T extends object>(
  inputParameters: T,
  totalResults: number,
  processingTimeMs?: number | undefined
): RecommendMetadata {
  const metadata: RecommendMetadata = {
    timestamp: new Date().toISOString(),
    inputParameters,
    totalResults,
  };

  if (processingTimeMs !== undefined) {
    metadata.processingTimeMs = processingTimeMs;
  }

  return metadata;
}

/**
 * Create a timer for measuring processing time
 */
export function createTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

// =============================================================================
// CORS HELPERS
// =============================================================================

/**
 * Default CORS headers for API responses
 */
export const corsHeaders: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Build a CORS preflight response
 */
export function corsPreflightResponse(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// =============================================================================
// STREAMING HELPERS
// =============================================================================

/**
 * Create a Server-Sent Events (SSE) response
 */
export function createSSEResponse(
  stream: ReadableStream<Uint8Array>
): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Create an SSE event string
 */
export function createSSEEvent(
  event: string,
  data: unknown,
  id?: string
): string {
  const lines: string[] = [];

  if (id) {
    lines.push(`id: ${id}`);
  }

  lines.push(`event: ${event}`);
  lines.push(`data: ${JSON.stringify(data)}`);
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

/**
 * Create an SSE encoder for streaming
 */
export function createSSEEncoder(): {
  encode: (event: string, data: unknown, id?: string) => Uint8Array;
} {
  const encoder = new TextEncoder();

  return {
    encode: (event: string, data: unknown, id?: string): Uint8Array => {
      return encoder.encode(createSSEEvent(event, data, id));
    },
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get HTTP status code for error type
 */
function getStatusCodeForType(errorType: ErrorType): number {
  switch (errorType) {
    case 'RATE_LIMIT_EXCEEDED':
      return HTTP_STATUS.TOO_MANY_REQUESTS;
    case 'VALIDATION_ERROR':
      return HTTP_STATUS.BAD_REQUEST;
    case 'NOT_FOUND':
      return HTTP_STATUS.NOT_FOUND;
    case 'API_ERROR':
    case 'NETWORK_ERROR':
    case 'UNKNOWN_ERROR':
    default:
      return HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
}

// =============================================================================
// REQUEST HANDLER WRAPPER
// =============================================================================

/**
 * Wrap an API route handler with error handling
 */
export function withErrorHandling<T>(
  handler: (request: Request) => Promise<NextResponse<T>>
): (request: Request) => Promise<NextResponse<T | ErrorResponse>> {
  return async (request: Request): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(request);
    } catch (error) {
      return errorResponseFromError(error);
    }
  };
}

/**
 * Compose multiple middleware functions for API routes
 */
export function composeMiddleware<T>(
  ...middleware: Array<
    (
      request: Request,
      next: () => Promise<NextResponse<T>>
    ) => Promise<NextResponse<T | ErrorResponse>>
  >
): (
  request: Request,
  handler: () => Promise<NextResponse<T>>
) => Promise<NextResponse<T | ErrorResponse>> {
  return async (
    request: Request,
    handler: () => Promise<NextResponse<T>>
  ): Promise<NextResponse<T | ErrorResponse>> => {
    let index = -1;

    const dispatch = async (i: number): Promise<NextResponse<T | ErrorResponse>> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      if (i >= middleware.length) {
        return handler();
      }

      const fn = middleware[i];
      if (!fn) {
        return handler();
      }
      return fn(request, () => dispatch(i + 1) as Promise<NextResponse<T>>);
    };

    return dispatch(0);
  };
}
