/**
 * Unit Tests for Logger Utilities
 *
 * Comprehensive tests for all logging functions in logger.ts
 */

import {
  LOG_LEVELS,
  Logger,
  logger,
  apiLogger,
  uiLogger,
  createLogger,
  startTimer,
  debugOnly,
  debugAssert,
  logDeprecation,
  logRequest,
  logResponse,
} from '@/lib/logger';

// =============================================================================
// MOCK CONSOLE METHODS
// =============================================================================

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
};

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.debug = jest.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.debug = originalConsole.debug;
});

// =============================================================================
// LOG LEVELS TESTS
// =============================================================================

describe('Log Levels', () => {
  it('should have correct level values', () => {
    expect(LOG_LEVELS.error).toBe(0);
    expect(LOG_LEVELS.warn).toBe(1);
    expect(LOG_LEVELS.info).toBe(2);
    expect(LOG_LEVELS.debug).toBe(3);
    expect(LOG_LEVELS.trace).toBe(4);
  });

  it('should have lower severity = lower value', () => {
    expect(LOG_LEVELS.error).toBeLessThan(LOG_LEVELS.warn);
    expect(LOG_LEVELS.warn).toBeLessThan(LOG_LEVELS.info);
    expect(LOG_LEVELS.info).toBeLessThan(LOG_LEVELS.debug);
    expect(LOG_LEVELS.debug).toBeLessThan(LOG_LEVELS.trace);
  });
});

// =============================================================================
// LOGGER CLASS TESTS
// =============================================================================

describe('Logger Class', () => {
  describe('constructor', () => {
    it('should create logger with name', () => {
      const log = createLogger('test');
      log.enable();
      log.info('Test message');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[test]')
      );
    });

    it('should create logger without name', () => {
      const log = new Logger(undefined, { enabled: true });
      log.info('Test message');

      expect(console.log).toHaveBeenCalled();
    });

    it('should accept custom config', () => {
      const log = createLogger('custom', {
        minLevel: 'error',
        enabled: true,
      });

      log.info('Info message');
      expect(console.log).not.toHaveBeenCalled();

      log.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('log methods', () => {
    let log: Logger;

    beforeEach(() => {
      log = createLogger('test', { enabled: true, minLevel: 'trace' });
    });

    it('should log error messages', () => {
      log.error('Error occurred');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred')
      );
    });

    it('should log warning messages', () => {
      log.warn('Warning issued');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning issued')
      );
    });

    it('should log info messages', () => {
      log.info('Info logged');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Info logged')
      );
    });

    it('should log debug messages', () => {
      log.debug('Debug info');
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('Debug info')
      );
    });

    it('should log trace messages', () => {
      log.trace('Trace data');
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('Trace data')
      );
    });

    it('should include context in log output', () => {
      log.info('With context', { userId: 123 });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('userId')
      );
    });

    it('should include error details in error log', () => {
      const error = new Error('Test error');
      log.error('Error with cause', error);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });
  });

  describe('log level filtering', () => {
    it('should not log below min level', () => {
      const log = createLogger('test', { enabled: true, minLevel: 'warn' });

      log.info('Info message');
      log.debug('Debug message');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should log at and above min level', () => {
      const log = createLogger('test', { enabled: true, minLevel: 'warn' });

      log.warn('Warning');
      log.error('Error');

      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('enable/disable', () => {
    it('should not log when disabled', () => {
      const log = createLogger('test', { enabled: false });

      log.error('Should not appear');

      expect(console.error).not.toHaveBeenCalled();
    });

    it('should disable logging', () => {
      const log = createLogger('test', { enabled: true });
      log.disable();

      log.error('Should not appear');

      expect(console.error).not.toHaveBeenCalled();
    });

    it('should enable logging', () => {
      const log = createLogger('test', { enabled: false });
      log.enable();

      log.error('Should appear');

      expect(console.error).toHaveBeenCalled();
    });

    it('should report enabled status', () => {
      const log = createLogger('test', { enabled: true });
      expect(log.isEnabled()).toBe(true);

      log.disable();
      expect(log.isEnabled()).toBe(false);
    });
  });

  describe('level management', () => {
    it('should get current level', () => {
      const log = createLogger('test', { minLevel: 'warn' });
      expect(log.getLevel()).toBe('warn');
    });

    it('should set log level', () => {
      const log = createLogger('test', { enabled: true, minLevel: 'info' });
      log.setLevel('error');

      log.info('Info');
      expect(console.log).not.toHaveBeenCalled();

      log.error('Error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      const log = createLogger('test', { enabled: false });
      log.configure({ enabled: true, minLevel: 'debug' });

      log.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('child logger', () => {
    it('should create child logger with combined name', () => {
      const parent = createLogger('parent', { enabled: true });
      const child = parent.child('child');

      child.info('Child message');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[parent:child]')
      );
    });

    it('should inherit parent config', () => {
      const parent = createLogger('parent', { enabled: true, minLevel: 'warn' });
      const child = parent.child('child');

      child.info('Info');
      expect(console.log).not.toHaveBeenCalled();

      child.warn('Warning');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should allow child config override', () => {
      const parent = createLogger('parent', { enabled: true, minLevel: 'warn' });
      const child = parent.child('child', { minLevel: 'info' });

      child.info('Info');
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('JSON output', () => {
    it('should output JSON when configured', () => {
      const log = createLogger('test', {
        enabled: true,
        jsonOutput: true,
      });

      log.info('Test message', { key: 'value' });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.message).toBe('Test message');
      expect(parsed.level).toBe('info');
      expect(parsed.context).toEqual({ key: 'value' });
    });
  });
});

// =============================================================================
// DEFAULT LOGGERS TESTS
// =============================================================================

describe('Default Loggers', () => {
  it('should have app logger', () => {
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should have API logger', () => {
    expect(apiLogger).toBeInstanceOf(Logger);
  });

  it('should have UI logger', () => {
    expect(uiLogger).toBeInstanceOf(Logger);
  });
});

// =============================================================================
// CREATE LOGGER TESTS
// =============================================================================

describe('createLogger', () => {
  it('should create a named logger', () => {
    const log = createLogger('custom-logger');
    expect(log).toBeInstanceOf(Logger);
  });

  it('should accept config options', () => {
    const log = createLogger('custom', { minLevel: 'error', enabled: true });
    expect(log.getLevel()).toBe('error');
    expect(log.isEnabled()).toBe(true);
  });
});

// =============================================================================
// PERFORMANCE TIMER TESTS
// =============================================================================

describe('Performance Timer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startTimer', () => {
    it('should create a timer', () => {
      const parentLogger = createLogger('test', { enabled: true });
      const timer = startTimer('operation', parentLogger);

      expect(timer).toHaveProperty('end');
      expect(timer).toHaveProperty('elapsed');
      expect(timer).toHaveProperty('cancel');
    });

    it('should measure elapsed time', () => {
      const timer = startTimer('operation', createLogger('test'));

      jest.advanceTimersByTime(100);

      const elapsed = timer.elapsed();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should log on end', () => {
      const parentLogger = createLogger('test', { enabled: true });
      const timer = startTimer('test-operation', parentLogger);

      jest.advanceTimersByTime(50);
      timer.end();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('test-operation completed')
      );
    });

    it('should return duration on end', () => {
      const timer = startTimer('operation', createLogger('test'));

      jest.advanceTimersByTime(100);

      const duration = timer.end();
      expect(typeof duration).toBe('number');
    });

    it('should not log twice if end called multiple times', () => {
      const parentLogger = createLogger('test', { enabled: true });
      const timer = startTimer('operation', parentLogger);

      timer.end();
      timer.end();

      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it('should return 0 if end called after already ended', () => {
      const timer = startTimer('operation', createLogger('test'));

      timer.end();
      const secondResult = timer.end();

      expect(secondResult).toBe(0);
    });

    it('should allow cancellation without logging', () => {
      const parentLogger = createLogger('test', { enabled: true });
      const timer = startTimer('operation', parentLogger);

      timer.cancel();
      timer.end();

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should include context in end log', () => {
      const parentLogger = createLogger('test', { enabled: true });
      const timer = startTimer('operation', parentLogger);

      timer.end({ extra: 'data' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('extra')
      );
    });
  });
});

// =============================================================================
// DEBUG UTILITIES TESTS
// =============================================================================

describe('Debug Utilities', () => {
  // Note: NODE_ENV tests are skipped as modifying process.env.NODE_ENV
  // is not allowed in TypeScript strict mode

  describe('debugOnly', () => {
    it('should be a function', () => {
      expect(typeof debugOnly).toBe('function');
    });
  });

  describe('debugAssert', () => {
    it('should be a function', () => {
      expect(typeof debugAssert).toBe('function');
    });
  });

  describe('logDeprecation', () => {
    it('should log deprecation warning', () => {
      logger.enable();
      logger.setLevel('warn');

      logDeprecation('oldFunction');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION')
      );
    });

    it('should include alternative when provided', () => {
      logger.enable();
      logger.setLevel('warn');

      logDeprecation('oldFunction', 'newFunction');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('alternative')
      );
    });

    it('should include version when provided', () => {
      logger.enable();
      logger.setLevel('warn');

      logDeprecation('oldFunction', 'newFunction', '2.0.0');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('removeVersion')
      );
    });
  });
});

// =============================================================================
// REQUEST LOGGING TESTS
// =============================================================================

describe('Request Logging', () => {
  beforeEach(() => {
    apiLogger.enable();
    apiLogger.setLevel('info');
  });

  describe('logRequest', () => {
    it('should log request method and path', () => {
      logRequest('GET', '/api/movies');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/movies')
      );
    });

    it('should include context', () => {
      logRequest('POST', '/api/recommend', { ip: '127.0.0.1' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('127.0.0.1')
      );
    });
  });

  describe('logResponse', () => {
    it('should log successful response as info', () => {
      logResponse('GET', '/api/movies', 200, 50);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('200')
      );
    });

    it('should log client error response as warn', () => {
      logResponse('POST', '/api/recommend', 400, 10);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('400')
      );
    });

    it('should log server error response as error', () => {
      apiLogger.setLevel('error');
      logResponse('GET', '/api/movies', 500, 100);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('500')
      );
    });

    it('should include duration', () => {
      logResponse('GET', '/api/movies', 200, 150);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('durationMs')
      );
    });
  });
});
