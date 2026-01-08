/**
 * Rate Limiter Implementation
 * 
 * Implements IP-based rate limiting using a sliding window algorithm.
 * Provides configurable limits, automatic cleanup, and production-ready tracking.
 */

export interface RateLimiterConfig {
  /** Maximum number of requests allowed per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional cleanup interval in milliseconds (default: 60000ms) */
  cleanupIntervalMs?: number;
}

export interface RateLimitInfo {
  /** Number of requests made in current window */
  count: number;
  /** Timestamp when the rate limit will reset */
  resetTime: number;
  /** Whether the rate limit has been exceeded */
  limited: boolean;
  /** Time remaining until reset in milliseconds */
  remaining: number;
}

interface RequestRecord {
  timestamps: number[];
  lastCleanup: number;
}

/**
 * IP-based rate limiter using sliding window algorithm
 * 
 * @example
 * const limiter = new RateLimiter({
 *   maxRequests: 100,
 *   windowMs: 60000 // 1 minute
 * });
 * 
 * const info = limiter.check('192.168.1.1');
 * if (info.limited) {
 *   throw new Error('Rate limit exceeded');
 * }
 */
export class RateLimiter {
  private records: Map<string, RequestRecord> = new Map();
  private config: Required<RateLimiterConfig>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: RateLimiterConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      cleanupIntervalMs: config.cleanupIntervalMs ?? 60000,
    };

    // Start automatic cleanup
    this.startCleanup();
  }

  /**
   * Check if an IP address has exceeded the rate limit
   * 
   * @param identifier - IP address or unique identifier
   * @returns Rate limit information
   */
  check(identifier: string): RateLimitInfo {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create record
    let record = this.records.get(identifier);
    if (!record) {
      record = { timestamps: [], lastCleanup: now };
      this.records.set(identifier, record);
    }

    // Remove timestamps outside the window (sliding window)
    record.timestamps = record.timestamps.filter(
      (timestamp) => timestamp > windowStart
    );

    // Add current request
    record.timestamps.push(now);
    record.lastCleanup = now;

    const count = record.timestamps.length;
    const limited = count > this.config.maxRequests;
    
    // Calculate reset time (oldest timestamp + window)
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTime = oldestTimestamp + this.config.windowMs;
    const remaining = Math.max(0, resetTime - now);

    return {
      count: limited ? this.config.maxRequests : count,
      resetTime,
      limited,
      remaining,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   * 
   * @param identifier - IP address or unique identifier
   */
  reset(identifier: string): void {
    this.records.delete(identifier);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.records.clear();
  }

  /**
   * Get current statistics
   * 
   * @returns Object with total tracked IPs and active requests
   */
  getStats(): { totalIPs: number; activeRequests: number } {
    let activeRequests = 0;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const record of Array.from(this.records.values())) {
      activeRequests += record.timestamps.filter(
        (timestamp: number) => timestamp > windowStart
      ).length;
    }

    return {
      totalIPs: this.records.size,
      activeRequests,
    };
  }

  /**
   * Manually trigger cleanup of expired records
   */
  cleanup(): void {
    const now = Date.now();
    const expiryThreshold = now - this.config.windowMs;

    for (const [identifier, record] of Array.from(this.records.entries())) {
      // Remove timestamps outside the window
      record.timestamps = record.timestamps.filter(
        (timestamp: number) => timestamp > expiryThreshold
      );

      // Delete record if no active requests and not recently accessed
      if (
        record.timestamps.length === 0 &&
        record.lastCleanup < expiryThreshold
      ) {
        this.records.delete(identifier);
      }
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);

    // Don't prevent Node.js from exiting
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Stop automatic cleanup and clear all records
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.records.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): Required<RateLimiterConfig> {
    return { ...this.config };
  }
}

/**
 * Create a rate limiter with default configuration
 * 
 * @param config - Rate limiter configuration
 * @returns RateLimiter instance
 */
export function createRateLimiter(
  config: RateLimiterConfig
): RateLimiter {
  return new RateLimiter(config);
}
