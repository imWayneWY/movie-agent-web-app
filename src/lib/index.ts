/**
 * Library Barrel Export
 *
 * Central export point for all utility modules.
 * Import from '@/lib' for convenient access to all utilities.
 */

// Class name utilities
export { cn } from './utils';

// General utilities
export {
  // Async utilities
  sleep,
  debounce,
  throttle,
  // Object utilities
  deepClone,
  isEmpty,
  pick,
  omit,
  removeNullish,
  // Array utilities
  unique,
  uniqueBy,
  chunk,
  shuffle,
  groupBy,
  // String utilities
  generateId,
  generateUUID,
  slugify,
  escapeHtml,
  // URL utilities
  buildUrl,
  parseQueryParams,
  // Number utilities
  clamp,
  round,
  percentage,
  // Environment utilities
  isBrowser,
  isDev,
  isProd,
  isTest,
} from './utils';

// Formatters
export {
  // Date formatters
  formatDate,
  formatYear,
  formatRelativeTime,
  // Number formatters
  formatNumber,
  formatCompactNumber,
  formatPercentage,
  formatRating,
  formatVoteCount,
  // Duration formatters
  formatDuration,
  formatDurationFull,
  formatMilliseconds,
  // Text formatters
  truncate,
  capitalize,
  toTitleCase,
  pluralize,
  // File size formatters
  formatFileSize,
  // Array/List formatters
  formatList,
  formatGenres,
  // URL formatters
  formatPosterUrl,
  formatBackdropUrl,
} from './formatters';

// Error handling
export {
  AppError,
  RateLimitError,
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
} from './errors';

// API helpers
export {
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
} from './api-helpers';

// Logger
export {
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
} from './logger';
export type { LogLevel, LogEntry, LoggerConfig, PerformanceTimer } from './logger';

// Validators (re-export existing)
export * from './validators';

// Constants (re-export existing)
export * from './constants';

// Rate limiting
export {
  RateLimiter,
  createRateLimiter,
} from './rate-limiter';
export type { RateLimiterConfig, RateLimitInfo } from './rate-limiter';

// Performance monitoring
export {
  // Constants
  WEB_VITALS_THRESHOLDS,
  // Utility functions
  getWebVitalRating,
  formatWebVitalValue,
  // Class
  PerformanceMonitor,
  // Web Vitals
  reportWebVitals,
  initWebVitals,
  // Singleton
  getPerformanceMonitor,
  resetPerformanceMonitor,
  // Trackers
  createRenderTracker,
  createApiTracker,
  // Bundle size utilities
  getTransferredSize,
  getTotalJsBundleSize,
  getTotalCssBundleSize,
} from './performance';
export type {
  WebVitalName,
  WebVitalRating,
  WebVitalMetric,
  PerformanceMetric,
  PerformanceReporter,
  PerformanceMonitorConfig,
} from './performance';
