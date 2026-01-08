/**
 * Rate Limit Middleware Tests
 * 
 * Tests for rate limit middleware including:
 * - IP extraction from headers
 * - Rate limit header creation
 * - Middleware integration
 */

import {
  getClientIP,
  createRateLimitHeaders,
  createRateLimitMiddleware,
} from '@/middleware/rate-limit';
import { RateLimitError } from '@/lib/errors';

// Helper to create mock NextRequest
function createMockRequest(headers: Record<string, string> = {}): any {
  return {
    headers: {
      get: (name: string) => {
        const key = Object.keys(headers).find(
          k => k.toLowerCase() === name.toLowerCase()
        );
        return key ? headers[key] : null;
      },
    },
  };
}

describe('Rate Limit Middleware', () => {
  describe('getClientIP', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.100',
      });

      const ip = getClientIP(request as any);
      expect(ip).toBe('192.168.1.100');
    });

    it('should use first IP from X-Forwarded-For list', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
      });

      const ip = getClientIP(request as any);
      expect(ip).toBe('192.168.1.100');
    });

    it('should extract IP from X-Real-IP header', () => {
      const request = createMockRequest({
        'x-real-ip': '192.168.1.200',
      });

      const ip = getClientIP(request as any);
      expect(ip).toBe('192.168.1.200');
    });

    it('should prefer X-Forwarded-For over X-Real-IP', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.100',
        'x-real-ip': '192.168.1.200',
      });

      const ip = getClientIP(request as any);
      expect(ip).toBe('192.168.1.100');
    });

    it('should return unknown when no IP headers present', () => {
      const request = createMockRequest();
      const ip = getClientIP(request as any);
      expect(ip).toBe('unknown');
    });
  });

  describe('createRateLimitHeaders', () => {
    it('should create standard rate limit headers', () => {
      const headers = createRateLimitHeaders(100, 75, 1609459200000);

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('75');
      expect(headers['X-RateLimit-Reset']).toBe('1609459200');
    });

    it('should not allow negative remaining requests', () => {
      const headers = createRateLimitHeaders(100, -5, 1609459200000);

      expect(headers['X-RateLimit-Remaining']).toBe('0');
    });
  });

  describe('RateLimitError', () => {
    it('should create error with proper message', () => {
      const error = new RateLimitError(101, 100, 60000, Date.now() + 30000, 30);

      expect(error.message).toContain('Rate limit exceeded');
      expect(error.retryAfter).toBe(30);
    });

    it('should provide rate limit headers', () => {
      const resetTime = Date.now() + 60000;
      const error = new RateLimitError(101, 100, 60000, resetTime, 60);
      
      const headers = error.getRateLimitHeaders();
      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('0');
      expect(headers['Retry-After']).toBe('60');
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should allow requests under limit', () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 5,
        windowMs: 60000,
      });

      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
      });

      for (let i = 0; i < 5; i++) {
        const result = middleware(request as any);
        expect(result).toBeNull();
      }
    });

    it('should block requests over limit', () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 3,
        windowMs: 60000,
      });

      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.2',
      });

      for (let i = 0; i < 3; i++) {
        middleware(request as any);
      }

      const result = middleware(request as any);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.status).toBe(429);
      }
    });

    it('should track different IPs independently', () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 2,
        windowMs: 60000,
      });

      const request1 = createMockRequest({ 'x-forwarded-for': '192.168.1.3' });
      const request2 = createMockRequest({ 'x-forwarded-for': '192.168.1.4' });

      middleware(request1 as any);
      middleware(request1 as any);
      const blocked = middleware(request1 as any);
      expect(blocked).not.toBeNull();

      const allowed = middleware(request2 as any);
      expect(allowed).toBeNull();
    });
  });
});
