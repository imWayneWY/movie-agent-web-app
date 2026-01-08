/**
 * Rate Limiter Tests
 * 
 * Comprehensive tests for rate limiter class including:
 * - Basic rate limiting functionality
 * - Sliding window behavior
 * - Reset and cleanup operations
 * - Edge cases (overflow, concurrent requests)
 * - Statistics and configuration
 */

import { RateLimiter, createRateLimiter } from '@/lib/rate-limiter';

describe('RateLimiter', () => {
  describe('Basic Functionality', () => {
    it('should allow requests under the limit', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      for (let i = 0; i < 5; i++) {
        const result = limiter.check('192.168.1.1');
        expect(result.limited).toBe(false);
        expect(result.count).toBe(i + 1);
      }
    });

    it('should block requests over the limit', () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
      });

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const result = limiter.check('192.168.1.1');
        expect(result.limited).toBe(false);
      }

      // 4th request should be limited
      const result = limiter.check('192.168.1.1');
      expect(result.limited).toBe(true);
      expect(result.count).toBe(3); // Count capped at maxRequests
    });

    it('should track different IPs independently', () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      // IP 1 makes 2 requests
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.1');

      // IP 2 should still have full quota
      const result1 = limiter.check('192.168.1.2');
      expect(result1.limited).toBe(false);
      expect(result1.count).toBe(1);

      // IP 1 should be limited
      const result2 = limiter.check('192.168.1.1');
      expect(result2.limited).toBe(true);
    });
  });

  describe('Sliding Window', () => {
    it('should allow requests after window expires', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 100, // 100ms window
      });

      // Make 2 requests
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.1');

      // 3rd request should be limited
      let result = limiter.check('192.168.1.1');
      expect(result.limited).toBe(true);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 110));

      // Should allow new requests after window
      result = limiter.check('192.168.1.1');
      expect(result.limited).toBe(false);
      expect(result.count).toBe(1);
    });

    it('should remove old timestamps from sliding window', async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 100,
      });

      // Make 2 requests
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.1');

      // Wait for first requests to expire
      await new Promise((resolve) => setTimeout(resolve, 110));

      // Should have room for 3 new requests (old ones expired)
      const result1 = limiter.check('192.168.1.1');
      expect(result1.limited).toBe(false);
      expect(result1.count).toBe(1); // Only counts current request

      const result2 = limiter.check('192.168.1.1');
      expect(result2.limited).toBe(false);
      expect(result2.count).toBe(2);

      const result3 = limiter.check('192.168.1.1');
      expect(result3.limited).toBe(false);
      expect(result3.count).toBe(3);

      // 4th request should be limited
      const result4 = limiter.check('192.168.1.1');
      expect(result4.limited).toBe(true);
    });
  });

  describe('Reset Operations', () => {
    it('should reset rate limit for specific IP', () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      // Hit the limit
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.1');
      let result = limiter.check('192.168.1.1');
      expect(result.limited).toBe(true);

      // Reset this IP
      limiter.reset('192.168.1.1');

      // Should allow requests again
      result = limiter.check('192.168.1.1');
      expect(result.limited).toBe(false);
      expect(result.count).toBe(1);
    });

    it('should reset all rate limits', () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      });

      // Multiple IPs hit their limits
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.2');
      limiter.check('192.168.1.2');

      // Reset all
      limiter.resetAll();

      // Both IPs should have fresh quotas
      const result1 = limiter.check('192.168.1.1');
      const result2 = limiter.check('192.168.1.2');
      expect(result1.limited).toBe(false);
      expect(result2.limited).toBe(false);
    });

    it('should not affect other IPs when resetting one', () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      });

      // Both IPs make requests
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.2');

      // Reset IP 1
      limiter.reset('192.168.1.1');

      // IP 1 should be reset, IP 2 should still be limited
      const result1 = limiter.check('192.168.1.1');
      const result2 = limiter.check('192.168.1.2');
      expect(result1.limited).toBe(false);
      expect(result2.limited).toBe(true);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup expired records', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 100,
        cleanupIntervalMs: 50,
      });

      // Make requests from multiple IPs
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.2');
      limiter.check('192.168.1.3');

      let stats = limiter.getStats();
      expect(stats.totalIPs).toBe(3);

      // Wait for records to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Trigger manual cleanup
      limiter.cleanup();

      // All records should be cleaned up
      stats = limiter.getStats();
      expect(stats.totalIPs).toBe(0);
      expect(stats.activeRequests).toBe(0);

      limiter.destroy();
    });

    it('should not cleanup recently accessed records', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 200,
      });

      // Make initial requests
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.2');

      // Wait a bit but keep accessing IP 1
      await new Promise((resolve) => setTimeout(resolve, 100));
      limiter.check('192.168.1.1');

      // Cleanup
      limiter.cleanup();

      // IP 1 should still be tracked (recent access)
      // IP 2 might be cleaned if all timestamps expired
      const stats = limiter.getStats();
      expect(stats.totalIPs).toBeGreaterThanOrEqual(1);

      limiter.destroy();
    });

    it('should automatically cleanup at intervals', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 50,
        cleanupIntervalMs: 100,
      });

      // Make requests
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.2');

      // Wait for cleanup interval to run twice
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Records should be cleaned
      const stats = limiter.getStats();
      expect(stats.totalIPs).toBe(0);

      limiter.destroy();
    }, 10000);
  });

  describe('Edge Cases', () => {
    it('should handle rapid concurrent requests', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 1000,
      });

      // Simulate 20 concurrent requests
      const results = Array.from({ length: 20 }, () => 
        limiter.check('192.168.1.1')
      );

      // First 10 should succeed, rest should be limited
      const successful = results.filter(r => !r.limited);
      const limited = results.filter(r => r.limited);

      expect(successful.length).toBe(10);
      expect(limited.length).toBe(10);
    });

    it('should handle overflow with many requests', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        limiter.check('192.168.1.1');
      }

      // Count should be capped
      const result = limiter.check('192.168.1.1');
      expect(result.count).toBe(5);
      expect(result.limited).toBe(true);
    });

    it('should handle zero window correctly', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 0, // Effectively no window
      });

      // All requests should be fresh
      for (let i = 0; i < 10; i++) {
        const result = limiter.check('192.168.1.1');
        // With 0 window, old requests immediately expire
        expect(result.count).toBeGreaterThanOrEqual(1);
      }
    });

    it('should handle very large window', () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 3600000, // 1 hour
      });

      // Make 3 requests
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.1');

      // Should be limited for the entire hour
      const result = limiter.check('192.168.1.1');
      expect(result.limited).toBe(true);
      expect(result.remaining).toBeGreaterThan(3500000); // Almost 1 hour remaining
    });

    it('should handle empty identifier', () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      // Empty string is a valid identifier
      const result1 = limiter.check('');
      const result2 = limiter.check('');
      const result3 = limiter.check('');

      expect(result1.limited).toBe(false);
      expect(result2.limited).toBe(false);
      expect(result3.limited).toBe(true);
    });
  });

  describe('Rate Limit Info', () => {
    it('should provide accurate reset time', () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      const before = Date.now();
      const result = limiter.check('192.168.1.1');
      const after = Date.now();

      // Reset time should be current time + window
      expect(result.resetTime).toBeGreaterThanOrEqual(before + 1000);
      expect(result.resetTime).toBeLessThanOrEqual(after + 1000 + 10); // +10ms tolerance
    });

    it('should provide accurate remaining time', () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      });

      limiter.check('192.168.1.1');
      const result = limiter.check('192.168.1.1'); // Should be limited

      expect(result.limited).toBe(true);
      expect(result.remaining).toBeGreaterThan(900); // Should be close to 1000ms
      expect(result.remaining).toBeLessThanOrEqual(1000);
    });

    it('should track request count accurately', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      for (let i = 1; i <= 7; i++) {
        const result = limiter.check('192.168.1.1');
        if (i <= 5) {
          expect(result.count).toBe(i);
          expect(result.limited).toBe(false);
        } else {
          expect(result.count).toBe(5); // Capped at max
          expect(result.limited).toBe(true);
        }
      }
    });
  });

  describe('Statistics', () => {
    it('should track total IPs', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      limiter.check('192.168.1.1');
      limiter.check('192.168.1.2');
      limiter.check('192.168.1.3');

      const stats = limiter.getStats();
      expect(stats.totalIPs).toBe(3);
    });

    it('should track active requests', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 1000,
      });

      limiter.check('192.168.1.1');
      limiter.check('192.168.1.1');
      limiter.check('192.168.1.2');
      limiter.check('192.168.1.2');
      limiter.check('192.168.1.2');

      const stats = limiter.getStats();
      expect(stats.activeRequests).toBe(5); // 2 from IP1 + 3 from IP2
    });

    it('should exclude expired requests from active count', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 100,
      });

      limiter.check('192.168.1.1');
      limiter.check('192.168.1.1');

      await new Promise((resolve) => setTimeout(resolve, 110));

      // Old requests expired
      const stats = limiter.getStats();
      expect(stats.activeRequests).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should expose configuration', () => {
      const limiter = new RateLimiter({
        maxRequests: 100,
        windowMs: 60000,
        cleanupIntervalMs: 30000,
      });

      const config = limiter.getConfig();
      expect(config.maxRequests).toBe(100);
      expect(config.windowMs).toBe(60000);
      expect(config.cleanupIntervalMs).toBe(30000);
    });

    it('should use default cleanup interval', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 1000,
      });

      const config = limiter.getConfig();
      expect(config.cleanupIntervalMs).toBe(60000); // Default
    });

    it('should accept custom cleanup interval', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 1000,
        cleanupIntervalMs: 5000,
      });

      const config = limiter.getConfig();
      expect(config.cleanupIntervalMs).toBe(5000);
    });
  });

  describe('Lifecycle', () => {
    it('should cleanup resources on destroy', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      limiter.check('192.168.1.1');
      limiter.check('192.168.1.2');

      let stats = limiter.getStats();
      expect(stats.totalIPs).toBe(2);

      limiter.destroy();

      stats = limiter.getStats();
      expect(stats.totalIPs).toBe(0);
    });

    it('should stop cleanup timer on destroy', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 50,
        cleanupIntervalMs: 100,
      });

      limiter.check('192.168.1.1');
      limiter.destroy();

      // Wait for what would be cleanup interval
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Manually check that new requests work (timer shouldn't interfere)
      const result = limiter.check('192.168.1.2');
      expect(result.limited).toBe(false);
    });
  });

  describe('Factory Function', () => {
    it('should create rate limiter with factory', () => {
      const limiter = createRateLimiter({
        maxRequests: 50,
        windowMs: 30000,
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
      
      const config = limiter.getConfig();
      expect(config.maxRequests).toBe(50);
      expect(config.windowMs).toBe(30000);

      limiter.destroy();
    });
  });
});
