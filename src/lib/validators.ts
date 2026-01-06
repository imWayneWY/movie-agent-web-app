/**
 * Type Guards and Validators
 *
 * This file contains type guard functions and validation utilities
 * for runtime type checking and data validation.
 */

import type {
  MoodValue,
  GenreValue,
  PlatformId,
  RuntimeRange,
  YearRange,
  UserInput,
  RecommendRequest,
  ErrorResponse,
  Movie,
  MovieRecommendation,
  Platform,
  Mood,
} from '@/types';

import {
  MOOD_VALUES,
  GENRE_VALUES,
  PLATFORM_IDS,
  RUNTIME,
  YEAR,
} from './constants';

// =============================================================================
// PRIMITIVE TYPE GUARDS
// =============================================================================

/**
 * Check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a positive integer
 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Check if a value is a non-negative integer
 */
export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

// =============================================================================
// MOOD TYPE GUARDS & VALIDATORS
// =============================================================================

/**
 * Type guard to check if a string is a valid MoodValue
 */
export function isMoodValue(value: unknown): value is MoodValue {
  return typeof value === 'string' && MOOD_VALUES.has(value as MoodValue);
}

/**
 * Validate mood value and return it or undefined
 */
export function validateMood(value: unknown): MoodValue | undefined {
  return isMoodValue(value) ? value : undefined;
}

/**
 * Type guard to check if an object is a valid Mood
 */
export function isMood(value: unknown): value is Mood {
  return (
    isObject(value) &&
    isMoodValue(value.value) &&
    typeof value.label === 'string' &&
    typeof value.emoji === 'string'
  );
}

// =============================================================================
// GENRE TYPE GUARDS & VALIDATORS
// =============================================================================

/**
 * Type guard to check if a string is a valid GenreValue
 */
export function isGenreValue(value: unknown): value is GenreValue {
  return typeof value === 'string' && GENRE_VALUES.has(value as GenreValue);
}

/**
 * Validate an array of genres and return only valid ones
 */
export function validateGenres(values: unknown): GenreValue[] {
  if (!Array.isArray(values)) {
    // Handle single genre string
    if (isGenreValue(values)) {
      return [values];
    }
    return [];
  }
  return values.filter(isGenreValue);
}

/**
 * Check if all values in an array are valid genres
 */
export function areAllValidGenres(values: unknown[]): values is GenreValue[] {
  return values.every(isGenreValue);
}

// =============================================================================
// PLATFORM TYPE GUARDS & VALIDATORS
// =============================================================================

/**
 * Type guard to check if a string is a valid PlatformId
 */
export function isPlatformId(value: unknown): value is PlatformId {
  return typeof value === 'string' && PLATFORM_IDS.has(value as PlatformId);
}

/**
 * Validate an array of platform IDs and return only valid ones
 */
export function validatePlatforms(values: unknown): PlatformId[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.filter(isPlatformId);
}

/**
 * Check if all values in an array are valid platform IDs
 */
export function areAllValidPlatforms(
  values: unknown[]
): values is PlatformId[] {
  return values.every(isPlatformId);
}

/**
 * Type guard to check if an object is a valid Platform
 */
export function isPlatform(value: unknown): value is Platform {
  return (
    isObject(value) &&
    isPlatformId(value.id) &&
    typeof value.name === 'string' &&
    typeof value.logo === 'string'
  );
}

// =============================================================================
// RUNTIME RANGE VALIDATORS
// =============================================================================

/**
 * Type guard to check if a value is a valid RuntimeRange
 */
export function isRuntimeRange(value: unknown): value is RuntimeRange {
  if (!isObject(value)) {
    return false;
  }

  const { min, max } = value as RuntimeRange;

  // Both are optional
  if (min === undefined && max === undefined) {
    return true;
  }

  // If min is present, validate it
  if (min !== undefined && !isNonNegativeInteger(min)) {
    return false;
  }

  // If max is present, validate it
  if (max !== undefined && !isPositiveInteger(max)) {
    return false;
  }

  // If both present, min should be <= max
  if (min !== undefined && max !== undefined && min > max) {
    return false;
  }

  return true;
}

/**
 * Validate and normalize a runtime range
 */
export function validateRuntimeRange(value: unknown): RuntimeRange {
  if (!isObject(value)) {
    return {};
  }

  const result: RuntimeRange = {};
  const { min, max } = value as RuntimeRange;

  if (typeof min === 'number' && min >= RUNTIME.MIN && min <= RUNTIME.MAX) {
    result.min = Math.floor(min);
  }

  if (typeof max === 'number' && max >= RUNTIME.MIN && max <= RUNTIME.MAX) {
    result.max = Math.floor(max);
  }

  // Ensure min <= max
  if (result.min !== undefined && result.max !== undefined) {
    if (result.min > result.max) {
      [result.min, result.max] = [result.max, result.min];
    }
  }

  return result;
}

// =============================================================================
// YEAR RANGE VALIDATORS
// =============================================================================

/**
 * Type guard to check if a value is a valid YearRange
 */
export function isYearRange(value: unknown): value is YearRange {
  if (!isObject(value)) {
    return false;
  }

  const { from, to } = value as YearRange;
  const maxYear = YEAR.MAX;

  // Both are optional
  if (from === undefined && to === undefined) {
    return true;
  }

  // Validate from year
  if (from !== undefined) {
    if (!isPositiveInteger(from) || from < YEAR.MIN || from > maxYear) {
      return false;
    }
  }

  // Validate to year
  if (to !== undefined) {
    if (!isPositiveInteger(to) || to < YEAR.MIN || to > maxYear) {
      return false;
    }
  }

  // If both present, from should be <= to
  if (from !== undefined && to !== undefined && from > to) {
    return false;
  }

  return true;
}

/**
 * Validate and normalize a year range
 */
export function validateYearRange(value: unknown): YearRange {
  if (!isObject(value)) {
    // Handle single year value
    if (isPositiveInteger(value) && value >= YEAR.MIN && value <= YEAR.MAX) {
      return { from: value, to: value };
    }
    return {};
  }

  const result: YearRange = {};
  const { from, to } = value as YearRange;
  const maxYear = YEAR.MAX;

  if (typeof from === 'number' && from >= YEAR.MIN && from <= maxYear) {
    result.from = Math.floor(from);
  }

  if (typeof to === 'number' && to >= YEAR.MIN && to <= maxYear) {
    result.to = Math.floor(to);
  }

  // Ensure from <= to
  if (result.from !== undefined && result.to !== undefined) {
    if (result.from > result.to) {
      [result.from, result.to] = [result.to, result.from];
    }
  }

  return result;
}

// =============================================================================
// USER INPUT VALIDATORS
// =============================================================================

/**
 * Type guard to check if a value is a valid UserInput
 */
export function isUserInput(value: unknown): value is UserInput {
  if (!isObject(value)) {
    return false;
  }

  const input = value as UserInput;

  // Validate mood (optional)
  if (input.mood !== undefined && !isMoodValue(input.mood)) {
    return false;
  }

  // Validate genres (optional)
  if (input.genres !== undefined) {
    if (!Array.isArray(input.genres) || !areAllValidGenres(input.genres)) {
      return false;
    }
  }

  // Validate platforms (optional)
  if (input.platforms !== undefined) {
    if (
      !Array.isArray(input.platforms) ||
      !areAllValidPlatforms(input.platforms)
    ) {
      return false;
    }
  }

  // Validate runtime (optional)
  if (input.runtime !== undefined && !isRuntimeRange(input.runtime)) {
    return false;
  }

  // Validate releaseYear (optional)
  if (input.releaseYear !== undefined && !isYearRange(input.releaseYear)) {
    return false;
  }

  return true;
}

/**
 * Validate and sanitize user input
 */
export function validateUserInput(value: unknown): UserInput {
  if (!isObject(value)) {
    return {};
  }

  const input = value as Record<string, unknown>;
  const result: UserInput = {};

  // Validate mood
  const mood = validateMood(input.mood);
  if (mood) {
    result.mood = mood;
  }

  // Validate genres
  const genres = validateGenres(input.genres);
  if (genres.length > 0) {
    result.genres = genres;
  }

  // Validate platforms
  const platforms = validatePlatforms(input.platforms);
  if (platforms.length > 0) {
    result.platforms = platforms;
  }

  // Validate runtime
  const runtime = validateRuntimeRange(input.runtime);
  if (Object.keys(runtime).length > 0) {
    result.runtime = runtime;
  }

  // Validate releaseYear
  const releaseYear = validateYearRange(input.releaseYear);
  if (Object.keys(releaseYear).length > 0) {
    result.releaseYear = releaseYear;
  }

  return result;
}

// =============================================================================
// API REQUEST VALIDATORS
// =============================================================================

/**
 * Validate and transform a RecommendRequest
 */
export function validateRecommendRequest(value: unknown): RecommendRequest {
  if (!isObject(value)) {
    return {};
  }

  const input = value as Record<string, unknown>;
  const result: RecommendRequest = {};

  // Mood - accept string
  if (typeof input.mood === 'string' && input.mood.trim()) {
    result.mood = input.mood.trim();
  }

  // Genres - accept string or array
  if (input.genres !== undefined) {
    if (typeof input.genres === 'string') {
      result.genres = input.genres;
    } else if (Array.isArray(input.genres)) {
      const validGenres = input.genres.filter(
        (g) => typeof g === 'string' && g.trim()
      );
      if (validGenres.length > 0) {
        result.genres = validGenres;
      }
    }
  }

  // Platforms - accept array
  if (Array.isArray(input.platforms)) {
    const validPlatforms = input.platforms.filter(
      (p) => typeof p === 'string' && p.trim()
    );
    if (validPlatforms.length > 0) {
      result.platforms = validPlatforms;
    }
  }

  // Runtime
  if (isObject(input.runtime)) {
    result.runtime = validateRuntimeRange(input.runtime);
  }

  // Release year - accept number or object
  if (typeof input.releaseYear === 'number') {
    result.releaseYear = input.releaseYear;
  } else if (isObject(input.releaseYear)) {
    result.releaseYear = validateYearRange(input.releaseYear);
  }

  return result;
}

// =============================================================================
// ERROR RESPONSE TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a response is an ErrorResponse
 */
export function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    isObject(value) &&
    value.error === true &&
    typeof value.errorType === 'string' &&
    typeof value.message === 'string'
  );
}

// =============================================================================
// MOVIE TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a value is a valid Movie
 */
export function isMovie(value: unknown): value is Movie {
  if (!isObject(value)) {
    return false;
  }

  const movie = value as Record<string, unknown>;

  return (
    isPositiveInteger(movie.id) &&
    typeof movie.title === 'string' &&
    typeof movie.overview === 'string' &&
    (movie.posterPath === null || typeof movie.posterPath === 'string') &&
    (movie.backdropPath === null || typeof movie.backdropPath === 'string') &&
    typeof movie.releaseDate === 'string' &&
    (movie.runtime === null || isNonNegativeInteger(movie.runtime)) &&
    typeof movie.voteAverage === 'number' &&
    isNonNegativeInteger(movie.voteCount) &&
    Array.isArray(movie.genres) &&
    typeof movie.originalLanguage === 'string'
  );
}

/**
 * Type guard to check if a value is a valid MovieRecommendation
 */
export function isMovieRecommendation(
  value: unknown
): value is MovieRecommendation {
  if (!isMovie(value)) {
    return false;
  }

  const rec = value as unknown as Record<string, unknown>;

  return (
    typeof rec.matchReason === 'string' &&
    Array.isArray(rec.platforms)
  );
}

// =============================================================================
// VALIDATION ERROR HELPERS
// =============================================================================

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Create a successful validation result
 */
export function validationSuccess<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}

/**
 * Create a failed validation result
 */
export function validationFailure<T>(
  errors: ValidationError[]
): ValidationResult<T> {
  return { success: false, errors };
}

/**
 * Validate user input with detailed error messages
 */
export function validateUserInputWithErrors(
  value: unknown
): ValidationResult<UserInput> {
  const errors: ValidationError[] = [];

  if (!isObject(value)) {
    return validationFailure([
      { field: 'root', message: 'Input must be an object' },
    ]);
  }

  const input = value as Record<string, unknown>;
  const result: UserInput = {};

  // Validate mood
  if (input.mood !== undefined) {
    if (!isMoodValue(input.mood)) {
      errors.push({
        field: 'mood',
        message: `Invalid mood value. Must be one of: ${Array.from(MOOD_VALUES).join(', ')}`,
        value: input.mood,
      });
    } else {
      result.mood = input.mood;
    }
  }

  // Validate genres
  if (input.genres !== undefined) {
    if (!Array.isArray(input.genres)) {
      errors.push({
        field: 'genres',
        message: 'Genres must be an array',
        value: input.genres,
      });
    } else {
      const invalidGenres = input.genres.filter((g) => !isGenreValue(g));
      if (invalidGenres.length > 0) {
        errors.push({
          field: 'genres',
          message: `Invalid genre values: ${invalidGenres.join(', ')}`,
          value: invalidGenres,
        });
      }
      result.genres = validateGenres(input.genres);
    }
  }

  // Validate platforms
  if (input.platforms !== undefined) {
    if (!Array.isArray(input.platforms)) {
      errors.push({
        field: 'platforms',
        message: 'Platforms must be an array',
        value: input.platforms,
      });
    } else {
      const invalidPlatforms = input.platforms.filter((p) => !isPlatformId(p));
      if (invalidPlatforms.length > 0) {
        errors.push({
          field: 'platforms',
          message: `Invalid platform IDs: ${invalidPlatforms.join(', ')}`,
          value: invalidPlatforms,
        });
      }
      result.platforms = validatePlatforms(input.platforms);
    }
  }

  // Validate runtime
  if (input.runtime !== undefined) {
    if (!isObject(input.runtime)) {
      errors.push({
        field: 'runtime',
        message: 'Runtime must be an object with min and/or max properties',
        value: input.runtime,
      });
    } else if (!isRuntimeRange(input.runtime)) {
      errors.push({
        field: 'runtime',
        message: `Runtime values must be between ${RUNTIME.MIN} and ${RUNTIME.MAX} minutes`,
        value: input.runtime,
      });
    } else {
      result.runtime = input.runtime as RuntimeRange;
    }
  }

  // Validate releaseYear
  if (input.releaseYear !== undefined) {
    if (!isObject(input.releaseYear)) {
      errors.push({
        field: 'releaseYear',
        message: 'Release year must be an object with from and/or to properties',
        value: input.releaseYear,
      });
    } else if (!isYearRange(input.releaseYear)) {
      errors.push({
        field: 'releaseYear',
        message: `Year values must be between ${YEAR.MIN} and ${YEAR.MAX}`,
        value: input.releaseYear,
      });
    } else {
      result.releaseYear = input.releaseYear as YearRange;
    }
  }

  if (errors.length > 0) {
    return validationFailure(errors);
  }

  return validationSuccess(result);
}
