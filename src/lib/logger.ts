/**
 * Logging and Debugging Utilities
 *
 * This file provides a structured logging system for the application
 * with support for different log levels, environments, and formatting.
 */

// =============================================================================
// LOG LEVELS
// =============================================================================

/**
 * Log level values (lower = more severe)
 */
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

// =============================================================================
// LOG ENTRY TYPE
// =============================================================================

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// =============================================================================
// LOGGER CONFIGURATION
// =============================================================================

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;
  /** Whether to include timestamps */
  includeTimestamp: boolean;
  /** Whether to output as JSON */
  jsonOutput: boolean;
  /** Custom prefix for log messages */
  prefix?: string;
  /** Whether logging is enabled */
  enabled: boolean;
}

/**
 * Default configuration based on environment
 */
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  includeTimestamp: true,
  jsonOutput: process.env.NODE_ENV === 'production',
  enabled: process.env.NODE_ENV !== 'test',
};

// =============================================================================
// LOGGER CLASS
// =============================================================================

/**
 * Logger class with configurable output and formatting
 */
class Logger {
  private config: LoggerConfig;
  private name: string | undefined;

  constructor(name?: string | undefined, config: Partial<LoggerConfig> = {}) {
    this.name = name;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return LOG_LEVELS[level] <= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Format a log entry for output
   */
  private formatEntry(entry: LogEntry): string {
    if (this.config.jsonOutput) {
      return JSON.stringify({
        ...entry,
        name: this.name,
        prefix: this.config.prefix,
      });
    }

    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    if (this.name) {
      parts.push(`[${this.name}]`);
    }

    parts.push(entry.message);

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context));
    }

    if (entry.error) {
      parts.push(`\n  Error: ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\n  Stack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Create a log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        ...(error.stack ? { stack: error.stack } : {}),
      };
    }

    return entry;
  }

  /**
   * Output a log entry
   */
  private output(entry: LogEntry): void {
    const formatted = this.formatEntry(entry);

    switch (entry.level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
      case 'trace':
        console.debug(formatted);
        break;
      case 'info':
      default:
        console.log(formatted);
        break;
    }
  }

  /**
   * Log at a specific level
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createEntry(level, message, context, error);
    this.output(entry);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Log a trace message
   */
  trace(message: string, context?: Record<string, unknown>): void {
    this.log('trace', message, context);
  }

  /**
   * Create a child logger with additional context
   */
  child(name: string, additionalConfig: Partial<LoggerConfig> = {}): Logger {
    const childName = this.name ? `${this.name}:${name}` : name;
    return new Logger(childName, { ...this.config, ...additionalConfig });
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Temporarily disable logging
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Enable logging
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Check if logger is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.minLevel;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }
}

// =============================================================================
// DEFAULT LOGGER INSTANCE
// =============================================================================

/**
 * Default application logger
 */
export const logger = new Logger('app');

// =============================================================================
// SPECIALIZED LOGGERS
// =============================================================================

/**
 * API logger for request/response logging
 */
export const apiLogger = new Logger('api');

/**
 * UI logger for client-side logging
 */
export const uiLogger = new Logger('ui', {
  minLevel: 'warn', // Less verbose on client
});

// =============================================================================
// LOGGER FACTORY
// =============================================================================

/**
 * Create a new logger instance
 */
export function createLogger(
  name: string,
  config: Partial<LoggerConfig> = {}
): Logger {
  return new Logger(name, config);
}

// =============================================================================
// PERFORMANCE LOGGING
// =============================================================================

/**
 * Performance timer for measuring operation duration
 */
export interface PerformanceTimer {
  /** End the timer and log the duration */
  end: (context?: Record<string, unknown>) => number;
  /** Get the elapsed time without ending */
  elapsed: () => number;
  /** Cancel the timer without logging */
  cancel: () => void;
}

/**
 * Create a performance timer
 */
export function startTimer(
  operation: string,
  parentLogger: Logger = logger
): PerformanceTimer {
  const start = performance.now();
  let ended = false;

  return {
    end: (context?: Record<string, unknown>): number => {
      if (ended) {
        return 0;
      }
      ended = true;
      const duration = Math.round(performance.now() - start);
      parentLogger.info(`${operation} completed`, { ...context, durationMs: duration });
      return duration;
    },
    elapsed: (): number => {
      return Math.round(performance.now() - start);
    },
    cancel: (): void => {
      ended = true;
    },
  };
}

// =============================================================================
// DEBUG UTILITIES
// =============================================================================

/**
 * Debug utility for conditional logging in development
 */
export function debugOnly(message: string, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, context);
  }
}

/**
 * Assert and log if condition is false (development only)
 */
export function debugAssert(
  condition: boolean,
  message: string,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development' && !condition) {
    logger.warn(`Assertion failed: ${message}`, context);
  }
}

/**
 * Log a deprecation warning
 */
export function logDeprecation(
  feature: string,
  alternative?: string,
  removeVersion?: string
): void {
  const context: Record<string, unknown> = { feature };
  if (alternative) {
    context.alternative = alternative;
  }
  if (removeVersion) {
    context.removeVersion = removeVersion;
  }

  logger.warn(`DEPRECATION: ${feature} is deprecated`, context);
}

// =============================================================================
// REQUEST LOGGING HELPERS
// =============================================================================

/**
 * Log an incoming API request
 */
export function logRequest(
  method: string,
  path: string,
  context?: Record<string, unknown>
): void {
  apiLogger.info(`${method} ${path}`, context);
}

/**
 * Log an API response
 */
export function logResponse(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  context?: Record<string, unknown> | undefined
): void {
  const logContext = {
    ...context,
    status,
    durationMs,
  };

  if (status >= 500) {
    apiLogger.error(`${method} ${path} - ${status}`, undefined, logContext);
  } else if (status >= 400) {
    apiLogger.warn(`${method} ${path} - ${status}`, logContext);
  } else {
    apiLogger.info(`${method} ${path} - ${status}`, logContext);
  }
}

// =============================================================================
// EXPORT LOGGER CLASS
// =============================================================================

export { Logger };
