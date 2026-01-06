/**
 * Application Constants
 *
 * This file contains all constant values used throughout the application,
 * including moods, genres, and streaming platforms.
 */

import type {
  Mood,
  MoodValue,
  GenreValue,
  Platform,
  PlatformId,
} from '@/types';

// =============================================================================
// MOOD CONSTANTS
// =============================================================================

/**
 * Available mood options for movie recommendations
 */
export const MOODS: readonly Mood[] = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'excited', label: 'Excited', emoji: '🎉' },
  { value: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { value: 'scared', label: 'Scared', emoji: '😱' },
  { value: 'thoughtful', label: 'Thoughtful', emoji: '🤔' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'adventurous', label: 'Adventurous', emoji: '🗺️' },
] as const;

/**
 * Set of valid mood values for O(1) lookup
 */
export const MOOD_VALUES: ReadonlySet<MoodValue> = new Set(
  MOODS.map((m) => m.value)
);

/**
 * Map of mood values to mood objects for O(1) lookup
 */
export const MOOD_MAP: ReadonlyMap<MoodValue, Mood> = new Map(
  MOODS.map((m) => [m.value, m])
);

// =============================================================================
// GENRE CONSTANTS
// =============================================================================

/**
 * Available movie genres (TMDb standard genres)
 */
export const GENRES: readonly GenreValue[] = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Thriller',
  'War',
  'Western',
] as const;

/**
 * Set of valid genre values for O(1) lookup
 */
export const GENRE_VALUES: ReadonlySet<GenreValue> = new Set(GENRES);

// =============================================================================
// PLATFORM CONSTANTS
// =============================================================================

/**
 * Available streaming platforms (Canada region)
 */
export const PLATFORMS: readonly Platform[] = [
  { id: 'netflix', name: 'Netflix', logo: '/platforms/netflix.svg' },
  { id: 'prime', name: 'Prime Video', logo: '/platforms/prime.svg' },
  { id: 'disney', name: 'Disney+', logo: '/platforms/disney.svg' },
  { id: 'crave', name: 'Crave', logo: '/platforms/crave.svg' },
  { id: 'apple', name: 'Apple TV+', logo: '/platforms/apple.svg' },
  { id: 'paramount', name: 'Paramount+', logo: '/platforms/paramount.svg' },
] as const;

/**
 * Set of valid platform IDs for O(1) lookup
 */
export const PLATFORM_IDS: ReadonlySet<PlatformId> = new Set(
  PLATFORMS.map((p) => p.id)
);

/**
 * Map of platform IDs to platform objects for O(1) lookup
 */
export const PLATFORM_MAP: ReadonlyMap<PlatformId, Platform> = new Map(
  PLATFORMS.map((p) => [p.id, p])
);

// =============================================================================
// RUNTIME CONSTANTS
// =============================================================================

/**
 * Runtime filter constraints (in minutes)
 */
export const RUNTIME = {
  /** Minimum allowed runtime value */
  MIN: 0,
  /** Maximum allowed runtime value */
  MAX: 300,
  /** Default minimum runtime */
  DEFAULT_MIN: 60,
  /** Default maximum runtime */
  DEFAULT_MAX: 180,
  /** Step value for slider */
  STEP: 15,
} as const;

// =============================================================================
// YEAR CONSTANTS
// =============================================================================

/**
 * Release year filter constraints
 */
export const YEAR = {
  /** Earliest year allowed */
  MIN: 1900,
  /** Latest year (current year + 1 for upcoming releases) */
  get MAX(): number {
    return new Date().getFullYear() + 1;
  },
  /** Default start year for filter */
  DEFAULT_FROM: 2000,
  /** Default end year for filter */
  get DEFAULT_TO(): number {
    return new Date().getFullYear();
  },
} as const;

// =============================================================================
// RATE LIMITING CONSTANTS
// =============================================================================

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT = {
  /** Maximum requests per window */
  MAX_REQUESTS: 10,
  /** Time window in milliseconds (1 minute) */
  WINDOW_MS: 60000,
  /** Retry-After header value in seconds */
  RETRY_AFTER_SECONDS: 60,
} as const;

// =============================================================================
// API CONSTANTS
// =============================================================================

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  /** Structured recommendations endpoint */
  RECOMMEND: '/api/recommend',
  /** Streaming recommendations endpoint */
  STREAM: '/api/stream',
} as const;

/**
 * HTTP status codes used in the application
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// =============================================================================
// UI CONSTANTS
// =============================================================================

/**
 * Breakpoints for responsive design (in pixels)
 */
export const BREAKPOINTS = {
  /** Mobile breakpoint */
  SM: 640,
  /** Tablet breakpoint */
  MD: 768,
  /** Desktop breakpoint */
  LG: 1024,
  /** Large desktop breakpoint */
  XL: 1280,
} as const;

/**
 * Maximum number of recommendations to display
 */
export const MAX_RECOMMENDATIONS = 10;

/**
 * Default card description truncation length
 */
export const DESCRIPTION_TRUNCATE_LENGTH = 150;

// =============================================================================
// ANALYTICS CONSTANTS
// =============================================================================

/**
 * Analytics event names as constants
 */
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  MOOD_SELECTED: 'mood_selected',
  FILTERS_EXPANDED: 'filters_expanded',
  GENRE_SELECTED: 'genre_selected',
  PLATFORM_SELECTED: 'platform_selected',
  SEARCH_SUBMITTED: 'search_submitted',
  RESULTS_LOADED: 'results_loaded',
  MOVIE_CARD_CLICKED: 'movie_card_clicked',
  PLATFORM_LINK_CLICKED: 'platform_link_clicked',
  ERROR_OCCURRED: 'error_occurred',
} as const;

// =============================================================================
// ERROR MESSAGES
// =============================================================================

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  RATE_LIMIT_EXCEEDED:
    "You're exploring fast! Please wait a moment before trying again.",
  NO_RESULTS:
    'No movies found matching your criteria. Try different filters!',
  API_ERROR: 'Oops! Something went wrong. Please try again.',
  NETWORK_ERROR: "Can't connect. Check your internet connection.",
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;

// =============================================================================
// BOT MESSAGES
// =============================================================================

/**
 * Bot personality messages
 */
export const BOT_MESSAGES = {
  GREETING: "Hey! What mood are you in tonight? I'll find the perfect movie for you! 🎬",
  LOADING: 'Finding the perfect movies for you...',
  SUCCESS: 'Here are some movies you might enjoy:',
  NO_MOOD: 'Please select a mood to get started!',
} as const;
