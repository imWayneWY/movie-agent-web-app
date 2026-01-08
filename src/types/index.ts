/**
 * Core Type Definitions for Movie Agent Web App
 *
 * This file contains all shared TypeScript types and interfaces
 * used throughout the application.
 */

// =============================================================================
// MOOD TYPES
// =============================================================================

/**
 * Valid mood values that users can select
 */
export type MoodValue =
  | 'happy'
  | 'sad'
  | 'excited'
  | 'relaxed'
  | 'scared'
  | 'thoughtful'
  | 'romantic'
  | 'adventurous';

/**
 * Mood option with display information
 */
export interface Mood {
  value: MoodValue;
  label: string;
  emoji: string;
}

// =============================================================================
// GENRE TYPES
// =============================================================================

/**
 * Valid genre values (TMDb standard genres)
 */
export type GenreValue =
  | 'Action'
  | 'Adventure'
  | 'Animation'
  | 'Comedy'
  | 'Crime'
  | 'Documentary'
  | 'Drama'
  | 'Family'
  | 'Fantasy'
  | 'History'
  | 'Horror'
  | 'Music'
  | 'Mystery'
  | 'Romance'
  | 'Science Fiction'
  | 'Thriller'
  | 'War'
  | 'Western';

// =============================================================================
// PLATFORM TYPES
// =============================================================================

/**
 * Valid streaming platform identifiers
 */
export type PlatformId =
  | 'netflix'
  | 'prime'
  | 'disney'
  | 'crave'
  | 'apple'
  | 'paramount';

/**
 * Streaming platform with display information
 */
export interface Platform {
  id: PlatformId;
  name: string;
  logo: string;
}

/**
 * Platform availability for a movie
 */
export interface PlatformAvailability {
  id: PlatformId;
  name: string;
  logo: string;
  url?: string;
}

// =============================================================================
// MOVIE TYPES
// =============================================================================

/**
 * Core movie data from TMDb
 */
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  runtime: number | null;
  voteAverage: number;
  voteCount: number;
  genres: string[];
  originalLanguage: string;
}

/**
 * Movie recommendation with additional context
 */
export interface MovieRecommendation extends Movie {
  /** Why this movie was recommended (AI-generated reason) */
  matchReason: string;
  /** Available streaming platforms */
  platforms: PlatformAvailability[];
}

// =============================================================================
// FILTER TYPES
// =============================================================================

/**
 * Runtime range filter (in minutes)
 */
export interface RuntimeRange {
  min?: number;
  max?: number;
}

/**
 * Release year range filter
 */
export interface YearRange {
  from?: number;
  to?: number;
}

// =============================================================================
// USER INPUT TYPES
// =============================================================================

/**
 * User input for movie recommendations
 */
export interface UserInput {
  mood?: MoodValue;
  genres?: GenreValue[];
  platforms?: PlatformId[];
  runtime?: RuntimeRange;
  releaseYear?: YearRange;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request body for /api/recommend endpoint
 */
export interface RecommendRequest {
  mood?: string;
  genres?: string | string[];
  platforms?: string[];
  runtime?: RuntimeRange;
  releaseYear?: number | YearRange;
}

/**
 * Successful response from /api/recommend endpoint
 */
export interface RecommendResponse {
  recommendations: MovieRecommendation[];
  metadata: RecommendMetadata;
}

/**
 * Metadata included in recommendation responses
 */
export interface RecommendMetadata {
  timestamp: string;
  inputParameters: RecommendRequest;
  totalResults: number;
  processingTimeMs?: number;
}

/**
 * Error response from API endpoints
 */
export interface ErrorResponse {
  error: true;
  errorType: ErrorType;
  message: string;
  retryAfter?: number; // For rate limit errors (seconds)
}

/**
 * Types of errors that can occur
 */
export type ErrorType =
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'AGENT_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * API response union type
 */
export type ApiResponse<T> = T | ErrorResponse;

// =============================================================================
// MOVIE AGENT TYPES
// =============================================================================

/**
 * Movie agent request options
 */
export interface AgentRequest {
  mood?: MoodValue;
  genres?: GenreValue[];
  platforms?: PlatformId[];
  runtime?: RuntimeRange;
  releaseYear?: YearRange;
}

/**
 * Movie agent response
 */
export interface AgentResponse {
  recommendations: MovieRecommendation[];
  reasoning?: string;
}

/**
 * Movie agent configuration
 */
export interface AgentConfig {
  provider: 'gemini' | 'azure';
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Retry options for agent calls
 */
export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// =============================================================================
// STREAMING TYPES
// =============================================================================

/**
 * Request body for /api/stream endpoint
 */
export interface StreamRequest {
  mood?: string;
  genres?: string | string[];
  platforms?: string[];
  runtime?: RuntimeRange;
  releaseYear?: number | YearRange;
}

/**
 * Streaming event types for SSE
 */
export type StreamEventType = 'text' | 'movie' | 'done' | 'error';

/**
 * Streaming event data
 */
export interface StreamEvent {
  type: StreamEventType;
  data: string | MovieRecommendation | null;
}

/**
 * Error event data for streaming
 */
export interface StreamErrorData {
  error: true;
  errorType: ErrorType;
  message: string;
}

// =============================================================================
// APPLICATION STATE TYPES
// =============================================================================

/**
 * View mode for displaying results
 */
export type ViewMode = 'cards' | 'streaming';

/**
 * Application state for React context
 */
export interface AppState {
  // Input state
  selectedMood: MoodValue | null;
  selectedGenres: GenreValue[];
  selectedPlatforms: PlatformId[];
  runtime: RuntimeRange;
  releaseYear: YearRange;

  // Output state
  recommendations: MovieRecommendation[] | null;
  streamingContent: string;

  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  viewMode: ViewMode;
}

/**
 * Initial application state
 */
export const initialAppState: AppState = {
  selectedMood: null,
  selectedGenres: [],
  selectedPlatforms: [],
  runtime: {},
  releaseYear: {},
  recommendations: null,
  streamingContent: '',
  isLoading: false,
  isStreaming: false,
  error: null,
  viewMode: 'cards',
};

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

/**
 * Analytics event names
 */
export type AnalyticsEventName =
  | 'page_view'
  | 'mood_selected'
  | 'filters_expanded'
  | 'genre_selected'
  | 'platform_selected'
  | 'search_submitted'
  | 'results_loaded'
  | 'movie_card_clicked'
  | 'platform_link_clicked'
  | 'error_occurred';

/**
 * Analytics event properties
 */
export interface AnalyticsEventProperties {
  page_view: { path: string };
  mood_selected: { mood: MoodValue };
  filters_expanded: Record<string, never>;
  genre_selected: { genres: GenreValue[] };
  platform_selected: { platforms: PlatformId[] };
  search_submitted: UserInput;
  results_loaded: { count: number; durationMs: number };
  movie_card_clicked: { movieId: number; title: string };
  platform_link_clicked: { platform: PlatformId; movieId: number };
  error_occurred: { errorType: ErrorType; message: string };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Extract only nullable keys from a type
 */
export type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

/**
 * Make nullable properties optional
 */
export type NullableToOptional<T> = PartialBy<T, NullableKeys<T>>;

/**
 * Strict omit that only allows keys that exist
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Non-empty array type
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Branded type for type-safe IDs
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Movie ID branded type
 */
export type MovieId = Brand<number, 'MovieId'>;

/**
 * Extract element type from array
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

/**
 * Value of type (for extracting values from const objects)
 */
export type ValueOf<T> = T[keyof T];
