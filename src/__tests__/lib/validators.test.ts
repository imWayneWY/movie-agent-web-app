/**
 * Unit Tests for Type Guards and Validators
 *
 * Comprehensive tests for all validation functions in validators.ts
 */

import {
  // Primitive type guards
  isObject,
  isNonEmptyString,
  isPositiveInteger,
  isNonNegativeInteger,
  // Mood validators
  isMoodValue,
  validateMood,
  isMood,
  // Genre validators
  isGenreValue,
  validateGenres,
  areAllValidGenres,
  // Platform validators
  isPlatformId,
  validatePlatforms,
  areAllValidPlatforms,
  isPlatform,
  // Runtime validators
  isRuntimeRange,
  validateRuntimeRange,
  // Year validators
  isYearRange,
  validateYearRange,
  // User input validators
  isUserInput,
  validateUserInput,
  // API validators
  validateRecommendRequest,
  isErrorResponse,
  // Movie validators
  isMovie,
  isMovieRecommendation,
  // Validation helpers
  validateUserInputWithErrors,
  validationSuccess,
  validationFailure,
} from '@/lib/validators';

// Constants imported for potential future use in test assertions
// import { RUNTIME, YEAR } from '@/lib/constants';

// =============================================================================
// PRIMITIVE TYPE GUARD TESTS
// =============================================================================

describe('Primitive Type Guards', () => {
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('a')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe('isPositiveInteger', () => {
    it('should return true for positive integers', () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(100)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isPositiveInteger(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isPositiveInteger(-1)).toBe(false);
    });

    it('should return false for floats', () => {
      expect(isPositiveInteger(1.5)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isPositiveInteger('1')).toBe(false);
      expect(isPositiveInteger(null)).toBe(false);
    });
  });

  describe('isNonNegativeInteger', () => {
    it('should return true for zero and positive integers', () => {
      expect(isNonNegativeInteger(0)).toBe(true);
      expect(isNonNegativeInteger(1)).toBe(true);
      expect(isNonNegativeInteger(100)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isNonNegativeInteger(-1)).toBe(false);
    });

    it('should return false for floats', () => {
      expect(isNonNegativeInteger(0.5)).toBe(false);
    });
  });
});

// =============================================================================
// MOOD VALIDATOR TESTS
// =============================================================================

describe('Mood Validators', () => {
  describe('isMoodValue', () => {
    it('should return true for valid mood values', () => {
      expect(isMoodValue('happy')).toBe(true);
      expect(isMoodValue('sad')).toBe(true);
      expect(isMoodValue('excited')).toBe(true);
      expect(isMoodValue('relaxed')).toBe(true);
      expect(isMoodValue('scared')).toBe(true);
      expect(isMoodValue('thoughtful')).toBe(true);
      expect(isMoodValue('romantic')).toBe(true);
      expect(isMoodValue('adventurous')).toBe(true);
    });

    it('should return false for invalid mood values', () => {
      expect(isMoodValue('angry')).toBe(false);
      expect(isMoodValue('HAPPY')).toBe(false);
      expect(isMoodValue('')).toBe(false);
      expect(isMoodValue(123)).toBe(false);
      expect(isMoodValue(null)).toBe(false);
    });
  });

  describe('validateMood', () => {
    it('should return the mood for valid values', () => {
      expect(validateMood('happy')).toBe('happy');
      expect(validateMood('scared')).toBe('scared');
    });

    it('should return undefined for invalid values', () => {
      expect(validateMood('invalid')).toBeUndefined();
      expect(validateMood(null)).toBeUndefined();
    });
  });

  describe('isMood', () => {
    it('should return true for valid Mood objects', () => {
      expect(isMood({ value: 'happy', label: 'Happy', emoji: '😊' })).toBe(true);
    });

    it('should return false for invalid Mood objects', () => {
      expect(isMood({ value: 'invalid', label: 'Happy', emoji: '😊' })).toBe(false);
      expect(isMood({ value: 'happy' })).toBe(false);
      expect(isMood(null)).toBe(false);
    });
  });
});

// =============================================================================
// GENRE VALIDATOR TESTS
// =============================================================================

describe('Genre Validators', () => {
  describe('isGenreValue', () => {
    it('should return true for valid genre values', () => {
      expect(isGenreValue('Action')).toBe(true);
      expect(isGenreValue('Comedy')).toBe(true);
      expect(isGenreValue('Science Fiction')).toBe(true);
      expect(isGenreValue('Horror')).toBe(true);
    });

    it('should return false for invalid genre values', () => {
      expect(isGenreValue('action')).toBe(false); // lowercase
      expect(isGenreValue('SciFi')).toBe(false);
      expect(isGenreValue('')).toBe(false);
      expect(isGenreValue(123)).toBe(false);
    });
  });

  describe('validateGenres', () => {
    it('should return array of valid genres', () => {
      expect(validateGenres(['Action', 'Comedy'])).toEqual(['Action', 'Comedy']);
    });

    it('should filter out invalid genres', () => {
      expect(validateGenres(['Action', 'invalid', 'Comedy'])).toEqual(['Action', 'Comedy']);
    });

    it('should handle single genre string', () => {
      expect(validateGenres('Action')).toEqual(['Action']);
    });

    it('should return empty array for invalid input', () => {
      expect(validateGenres('invalid')).toEqual([]);
      expect(validateGenres(null)).toEqual([]);
      expect(validateGenres(123)).toEqual([]);
    });
  });

  describe('areAllValidGenres', () => {
    it('should return true when all genres are valid', () => {
      expect(areAllValidGenres(['Action', 'Comedy', 'Drama'])).toBe(true);
    });

    it('should return false when any genre is invalid', () => {
      expect(areAllValidGenres(['Action', 'invalid'])).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(areAllValidGenres([])).toBe(true);
    });
  });
});

// =============================================================================
// PLATFORM VALIDATOR TESTS
// =============================================================================

describe('Platform Validators', () => {
  describe('isPlatformId', () => {
    it('should return true for valid platform IDs', () => {
      expect(isPlatformId('netflix')).toBe(true);
      expect(isPlatformId('prime')).toBe(true);
      expect(isPlatformId('disney')).toBe(true);
      expect(isPlatformId('crave')).toBe(true);
      expect(isPlatformId('apple')).toBe(true);
      expect(isPlatformId('paramount')).toBe(true);
    });

    it('should return false for invalid platform IDs', () => {
      expect(isPlatformId('Netflix')).toBe(false); // case sensitive
      expect(isPlatformId('hulu')).toBe(false);
      expect(isPlatformId('')).toBe(false);
      expect(isPlatformId(123)).toBe(false);
    });
  });

  describe('validatePlatforms', () => {
    it('should return array of valid platforms', () => {
      expect(validatePlatforms(['netflix', 'disney'])).toEqual(['netflix', 'disney']);
    });

    it('should filter out invalid platforms', () => {
      expect(validatePlatforms(['netflix', 'hulu', 'disney'])).toEqual(['netflix', 'disney']);
    });

    it('should return empty array for non-array input', () => {
      expect(validatePlatforms('netflix')).toEqual([]);
      expect(validatePlatforms(null)).toEqual([]);
    });
  });

  describe('areAllValidPlatforms', () => {
    it('should return true when all platforms are valid', () => {
      expect(areAllValidPlatforms(['netflix', 'prime', 'disney'])).toBe(true);
    });

    it('should return false when any platform is invalid', () => {
      expect(areAllValidPlatforms(['netflix', 'hulu'])).toBe(false);
    });
  });

  describe('isPlatform', () => {
    it('should return true for valid Platform objects', () => {
      expect(isPlatform({ id: 'netflix', name: 'Netflix', logo: '/platforms/netflix.svg' })).toBe(true);
    });

    it('should return false for invalid Platform objects', () => {
      expect(isPlatform({ id: 'invalid', name: 'Test', logo: '/test.svg' })).toBe(false);
      expect(isPlatform({ id: 'netflix' })).toBe(false);
      expect(isPlatform(null)).toBe(false);
    });
  });
});

// =============================================================================
// RUNTIME RANGE VALIDATOR TESTS
// =============================================================================

describe('Runtime Range Validators', () => {
  describe('isRuntimeRange', () => {
    it('should return true for valid runtime ranges', () => {
      expect(isRuntimeRange({ min: 60, max: 120 })).toBe(true);
      expect(isRuntimeRange({ min: 90 })).toBe(true);
      expect(isRuntimeRange({ max: 150 })).toBe(true);
      expect(isRuntimeRange({})).toBe(true);
    });

    it('should return false when min > max', () => {
      expect(isRuntimeRange({ min: 150, max: 60 })).toBe(false);
    });

    it('should return false for negative values', () => {
      expect(isRuntimeRange({ min: -10 })).toBe(false);
    });

    it('should return false for non-integers', () => {
      expect(isRuntimeRange({ min: 60.5 })).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isRuntimeRange(null)).toBe(false);
      expect(isRuntimeRange('60-120')).toBe(false);
    });
  });

  describe('validateRuntimeRange', () => {
    it('should return normalized runtime range', () => {
      expect(validateRuntimeRange({ min: 60, max: 120 })).toEqual({ min: 60, max: 120 });
    });

    it('should swap min and max if reversed', () => {
      expect(validateRuntimeRange({ min: 150, max: 60 })).toEqual({ min: 60, max: 150 });
    });

    it('should exclude values outside valid range', () => {
      // -10 is below MIN (0), and 500 is above MAX (300), so both are excluded
      expect(validateRuntimeRange({ min: -10, max: 500 })).toEqual({});
      // Only max is valid (within 0-300)
      expect(validateRuntimeRange({ min: -10, max: 150 })).toEqual({ max: 150 });
    });

    it('should floor decimal values', () => {
      expect(validateRuntimeRange({ min: 60.7, max: 120.3 })).toEqual({ min: 60, max: 120 });
    });

    it('should return empty object for invalid input', () => {
      expect(validateRuntimeRange(null)).toEqual({});
      expect(validateRuntimeRange('invalid')).toEqual({});
    });
  });
});

// =============================================================================
// YEAR RANGE VALIDATOR TESTS
// =============================================================================

describe('Year Range Validators', () => {
  const currentYear = new Date().getFullYear();

  describe('isYearRange', () => {
    it('should return true for valid year ranges', () => {
      expect(isYearRange({ from: 2000, to: 2020 })).toBe(true);
      expect(isYearRange({ from: 2010 })).toBe(true);
      expect(isYearRange({ to: 2024 })).toBe(true);
      expect(isYearRange({})).toBe(true);
    });

    it('should return false when from > to', () => {
      expect(isYearRange({ from: 2020, to: 2000 })).toBe(false);
    });

    it('should return false for years before minimum', () => {
      expect(isYearRange({ from: 1800 })).toBe(false);
    });

    it('should return false for years after maximum', () => {
      expect(isYearRange({ to: currentYear + 10 })).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isYearRange(null)).toBe(false);
      expect(isYearRange(2020)).toBe(false);
    });
  });

  describe('validateYearRange', () => {
    it('should return normalized year range', () => {
      expect(validateYearRange({ from: 2000, to: 2020 })).toEqual({ from: 2000, to: 2020 });
    });

    it('should swap from and to if reversed', () => {
      expect(validateYearRange({ from: 2020, to: 2000 })).toEqual({ from: 2000, to: 2020 });
    });

    it('should handle single year value', () => {
      expect(validateYearRange(2020)).toEqual({ from: 2020, to: 2020 });
    });

    it('should filter out invalid years', () => {
      expect(validateYearRange({ from: 1800, to: 2020 })).toEqual({ to: 2020 });
    });

    it('should return empty object for invalid input', () => {
      expect(validateYearRange(null)).toEqual({});
      expect(validateYearRange('2020')).toEqual({});
    });
  });
});

// =============================================================================
// USER INPUT VALIDATOR TESTS
// =============================================================================

describe('User Input Validators', () => {
  describe('isUserInput', () => {
    it('should return true for valid user input', () => {
      expect(isUserInput({
        mood: 'happy',
        genres: ['Action', 'Comedy'],
        platforms: ['netflix', 'disney'],
        runtime: { min: 60, max: 120 },
        releaseYear: { from: 2000, to: 2020 },
      })).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(isUserInput({})).toBe(true);
    });

    it('should return true for partial input', () => {
      expect(isUserInput({ mood: 'happy' })).toBe(true);
      expect(isUserInput({ genres: ['Action'] })).toBe(true);
    });

    it('should return false for invalid mood', () => {
      expect(isUserInput({ mood: 'invalid' })).toBe(false);
    });

    it('should return false for invalid genres', () => {
      expect(isUserInput({ genres: ['invalid'] })).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isUserInput(null)).toBe(false);
      expect(isUserInput('input')).toBe(false);
    });
  });

  describe('validateUserInput', () => {
    it('should return sanitized user input', () => {
      const input = {
        mood: 'happy',
        genres: ['Action', 'invalid', 'Comedy'],
        platforms: ['netflix', 'hulu'],
        extraField: 'ignored',
      };
      const result = validateUserInput(input);
      expect(result).toEqual({
        mood: 'happy',
        genres: ['Action', 'Comedy'],
        platforms: ['netflix'],
      });
    });

    it('should return empty object for invalid input', () => {
      expect(validateUserInput(null)).toEqual({});
      expect(validateUserInput('string')).toEqual({});
    });

    it('should omit empty arrays', () => {
      const result = validateUserInput({
        mood: 'happy',
        genres: [],
        platforms: ['invalid'],
      });
      expect(result).toEqual({ mood: 'happy' });
    });
  });
});

// =============================================================================
// API REQUEST VALIDATOR TESTS
// =============================================================================

describe('API Request Validators', () => {
  describe('validateRecommendRequest', () => {
    it('should validate full request', () => {
      const request = {
        mood: 'happy',
        genres: ['Action', 'Comedy'],
        platforms: ['netflix'],
        runtime: { min: 60, max: 120 },
        releaseYear: 2020,
      };
      const result = validateRecommendRequest(request);
      expect(result).toEqual({
        mood: 'happy',
        genres: ['Action', 'Comedy'],
        platforms: ['netflix'],
        runtime: { min: 60, max: 120 },
        releaseYear: 2020,
      });
    });

    it('should handle single genre string', () => {
      const result = validateRecommendRequest({ genres: 'Action' });
      expect(result).toEqual({ genres: 'Action' });
    });

    it('should handle year as object', () => {
      const result = validateRecommendRequest({ releaseYear: { from: 2000, to: 2020 } });
      expect(result).toEqual({ releaseYear: { from: 2000, to: 2020 } });
    });

    it('should return empty object for invalid input', () => {
      expect(validateRecommendRequest(null)).toEqual({});
    });

    it('should trim mood string', () => {
      const result = validateRecommendRequest({ mood: '  happy  ' });
      expect(result).toEqual({ mood: 'happy' });
    });
  });

  describe('isErrorResponse', () => {
    it('should return true for valid error response', () => {
      expect(isErrorResponse({
        error: true,
        errorType: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      })).toBe(true);
    });

    it('should return false for success response', () => {
      expect(isErrorResponse({
        recommendations: [],
        metadata: {},
      })).toBe(false);
    });

    it('should return false when error is not true', () => {
      expect(isErrorResponse({
        error: false,
        errorType: 'ERROR',
        message: 'error',
      })).toBe(false);
    });
  });
});

// =============================================================================
// MOVIE VALIDATOR TESTS
// =============================================================================

describe('Movie Validators', () => {
  const validMovie = {
    id: 123,
    title: 'Test Movie',
    overview: 'A test movie description',
    posterPath: '/poster.jpg',
    backdropPath: '/backdrop.jpg',
    releaseDate: '2024-01-01',
    runtime: 120,
    voteAverage: 7.5,
    voteCount: 1000,
    genres: ['Action', 'Comedy'],
    originalLanguage: 'en',
  };

  describe('isMovie', () => {
    it('should return true for valid movie', () => {
      expect(isMovie(validMovie)).toBe(true);
    });

    it('should return true with null posterPath', () => {
      expect(isMovie({ ...validMovie, posterPath: null })).toBe(true);
    });

    it('should return true with null runtime', () => {
      expect(isMovie({ ...validMovie, runtime: null })).toBe(true);
    });

    it('should return false for missing required fields', () => {
      expect(isMovie({ id: 123 })).toBe(false);
      expect(isMovie({ ...validMovie, id: 'string' })).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isMovie(null)).toBe(false);
      expect(isMovie('movie')).toBe(false);
    });
  });

  describe('isMovieRecommendation', () => {
    const validRecommendation = {
      ...validMovie,
      matchReason: 'Great for your mood',
      platforms: [{ id: 'netflix', name: 'Netflix', logo: '/netflix.svg' }],
    };

    it('should return true for valid movie recommendation', () => {
      expect(isMovieRecommendation(validRecommendation)).toBe(true);
    });

    it('should return false without matchReason', () => {
      expect(isMovieRecommendation({ ...validMovie, platforms: [] })).toBe(false);
    });

    it('should return false without platforms', () => {
      expect(isMovieRecommendation({ ...validMovie, matchReason: 'reason' })).toBe(false);
    });

    it('should return false for invalid movie base', () => {
      expect(isMovieRecommendation({ matchReason: 'reason', platforms: [] })).toBe(false);
    });
  });
});

// =============================================================================
// VALIDATION HELPER TESTS
// =============================================================================

describe('Validation Helpers', () => {
  describe('validationSuccess', () => {
    it('should return success result with data', () => {
      const result = validationSuccess({ mood: 'happy' });
      expect(result).toEqual({
        success: true,
        data: { mood: 'happy' },
      });
    });
  });

  describe('validationFailure', () => {
    it('should return failure result with errors', () => {
      const errors = [{ field: 'mood', message: 'Invalid mood' }];
      const result = validationFailure(errors);
      expect(result).toEqual({
        success: false,
        errors,
      });
    });
  });

  describe('validateUserInputWithErrors', () => {
    it('should return success for valid input', () => {
      const result = validateUserInputWithErrors({
        mood: 'happy',
        genres: ['Action'],
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        mood: 'happy',
        genres: ['Action'],
      });
    });

    it('should return errors for invalid mood', () => {
      const result = validateUserInputWithErrors({ mood: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.field).toBe('mood');
    });

    it('should return errors for invalid genres', () => {
      const result = validateUserInputWithErrors({ genres: 'not-an-array' });
      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe('genres');
    });

    it('should return errors for invalid runtime', () => {
      const result = validateUserInputWithErrors({ runtime: { min: -10, max: 500 } });
      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe('runtime');
    });

    it('should return error for non-object input', () => {
      const result = validateUserInputWithErrors('invalid');
      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe('root');
    });

    it('should collect multiple errors', () => {
      const result = validateUserInputWithErrors({
        mood: 'invalid',
        genres: 'not-array',
        platforms: 'not-array',
      });
      expect(result.success).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(1);
    });
  });
});
