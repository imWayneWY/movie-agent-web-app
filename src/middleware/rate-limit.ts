/**
 * Rate Limiting Middleware
 * 
 * Provides middleware for protecting API routes with IP-based rate limiting.
 * Automatically adds rate limit headers and returns proper error responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, type RateLimiterConfig } from '@/lib/rate-limiter';
import { RateLimitError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * Extract client IP from Next.js request
 * 
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIP(request: NextRequest): string {
  // Check X-Forwarded-For header (common for proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, use the first one
    const firstIP = forwardedFor.split(',')[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }

  // Check X-Real-IP header (common for nginx)
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Fallback to connection IP (if available in the future)
  // For now, use 'unknown' as Next.js doesn't expose connection IP directly
  return 'unknown';
}

/**
 * Create rate limit headers
 * 
 * @param limit - Maximum requests allowed
 * @param remaining - Remaining requests in window
 * @param resetTime - Timestamp when the limit resets
 * @returns Headers object
 */
export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(Math.floor(resetTime / 1000)),
  };
}

/**
 * Create rate limit exceeded response
 * 
 * @param error - RateLimitError instance
 * @returns NextResponse with error and headers
 */
export function createRateLimitResponse(error: RateLimitError): NextResponse {
  const response = NextResponse.json(
    error.toErrorResponse(),
    { status: HTTP_STATUS.TOO_MANY_REQUESTS }
  );

  // Add rate limit headers
  const headers = error.getRateLimitHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create rate limiter middleware
 * 
 * @param config - Rate limiter configuration
 * @returns Middleware function
 * 
 * @example
 * const limiter = createRateLimitMiddleware({
 *   maxRequests: 100,
 *   windowMs: 60000 // 1 minute
 * });
 * 
 * export async function GET(request: NextRequest) {
 *   const limitResult = await limiter(request);
 *   if (limitResult) return limitResult;
 *   
 *   // Handle request...
 * }
 */
export function createRateLimitMiddleware(
  config: RateLimiterConfig
): (request: NextRequest) => NextResponse | null {
  const rateLimiter = new RateLimiter(config);

  return (request: NextRequest): NextResponse | null => {
    const clientIP = getClientIP(request);
    const limitInfo = rateLimiter.check(clientIP);

    // If rate limit exceeded, return error response
    if (limitInfo.limited) {
      const retryAfterSeconds = Math.ceil(limitInfo.remaining / 1000);
      const error = new RateLimitError(
        limitInfo.count,
        config.maxRequests,
        config.windowMs,
        limitInfo.resetTime,
        retryAfterSeconds
      );

      return createRateLimitResponse(error);
    }

    // Rate limit not exceeded, but we can't add headers to null
    // The calling route handler should add these headers if needed
    return null;
  };
}

/**
 * Shared rate limiter instances for common use cases
 */
export const rateLimiters = {
  /** Strict limit: 10 requests per minute */
  strict: createRateLimitMiddleware({
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  }),

  /** Standard limit: 100 requests per minute */
  standard: createRateLimitMiddleware({
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  }),

  /** Generous limit: 1000 requests per hour */
  generous: createRateLimitMiddleware({
    maxRequests: 1000,
    windowMs: 3600000, // 1 hour
  }),
};

/**
 * Apply rate limit middleware with custom success handler
 * 
 * @param request - Next.js request
 * @param limiter - Rate limiter middleware
 * @param handler - Success handler function
 * @returns Response from handler or rate limit error
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   return applyRateLimit(request, rateLimiters.standard, async (req) => {
 *     const data = await fetchData();
 *     return NextResponse.json({ data });
 *   });
 * }
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: (request: NextRequest) => NextResponse | null,
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  // Check rate limit
  const limitResult = limiter(request);
  if (limitResult) {
    return limitResult;
  }

  // Execute handler
  return handler(request);
}
