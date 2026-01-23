/**
 * Unit Tests for Type Definitions
 *
 * These tests verify that type definitions are correctly structured
 * and that utility types work as expected.
 */

import type {
  MoodValue,
  Mood,
  GenreValue,
  PlatformId,
  Platform,
  PlatformAvailability,
  Movie,
  MovieRecommendation,
  RuntimeRange,
  YearRange,
  UserInput,
  RecommendRequest,
  RecommendResponse,
  ErrorResponse,
  ApiResponse,
  StreamEventType,
  StreamEvent,
  ViewMode,
  AppState,
  AnalyticsEventName,
  PartialBy,
  RequiredBy,
  DeepPartial,
  NonEmptyArray,
  MovieId,
  ArrayElement,
  ValueOf,
} from '@/types';

import { initialAppState } from '@/types';

// =============================================================================
// TYPE STRUCTURE TESTS
// =============================================================================

describe('Type Definitions', () => {
  describe('MoodValue type', () => {
    it('should accept valid mood strings', () => {
      const mood: MoodValue = 'happy';
      expect(mood).toBe('happy');
    });

    it('should work with all mood values', () => {
      const moods: MoodValue[] = [
        'happy',
        'excited',
        'relaxed',
        'scared',
        'thoughtful',
      ];
      expect(moods).toHaveLength(5);
    });
  });

  describe('Mood interface', () => {
    it('should have correct structure', () => {
      const mood: Mood = {
        value: 'happy',
        label: 'Happy',
        emoji: '😊',
      };
      expect(mood.value).toBe('happy');
      expect(mood.label).toBe('Happy');
      expect(mood.emoji).toBe('😊');
    });
  });

  describe('GenreValue type', () => {
    it('should accept valid genre strings', () => {
      const genre: GenreValue = 'Action';
      expect(genre).toBe('Action');
    });
  });

  describe('PlatformId type', () => {
    it('should accept valid platform IDs', () => {
      const platform: PlatformId = 'netflix';
      expect(platform).toBe('netflix');
    });
  });

  describe('Platform interface', () => {
    it('should have correct structure', () => {
      const platform: Platform = {
        id: 'netflix',
        name: 'Netflix',
        logo: '/platforms/netflix.svg',
      };
      expect(platform.id).toBe('netflix');
      expect(platform.name).toBe('Netflix');
      expect(platform.logo).toBe('/platforms/netflix.svg');
    });
  });

  describe('PlatformAvailability interface', () => {
    it('should have optional url property', () => {
      const withUrl: PlatformAvailability = {
        id: 'netflix',
        name: 'Netflix',
        logo: '/platforms/netflix.svg',
        url: 'https://netflix.com/title/123',
      };
      const withoutUrl: PlatformAvailability = {
        id: 'netflix',
        name: 'Netflix',
        logo: '/platforms/netflix.svg',
      };
      expect(withUrl.url).toBeDefined();
      expect(withoutUrl.url).toBeUndefined();
    });
  });
});

// =============================================================================
// MOVIE TYPE TESTS
// =============================================================================

describe('Movie Types', () => {
  describe('Movie interface', () => {
    it('should have correct structure', () => {
      const movie: Movie = {
        id: 123,
        title: 'Test Movie',
        overview: 'A great movie',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024-01-01',
        runtime: 120,
        voteAverage: 8.5,
        voteCount: 1000,
        genres: ['Action', 'Comedy'],
        originalLanguage: 'en',
      };
      expect(movie.id).toBe(123);
      expect(movie.genres).toContain('Action');
    });

    it('should allow null for optional image paths', () => {
      const movie: Movie = {
        id: 123,
        title: 'Test Movie',
        overview: 'A great movie',
        posterPath: null,
        backdropPath: null,
        releaseDate: '2024-01-01',
        runtime: null,
        voteAverage: 8.5,
        voteCount: 1000,
        genres: ['Action'],
        originalLanguage: 'en',
      };
      expect(movie.posterPath).toBeNull();
      expect(movie.runtime).toBeNull();
    });
  });

  describe('MovieRecommendation interface', () => {
    it('should extend Movie with additional fields', () => {
      const recommendation: MovieRecommendation = {
        id: 123,
        title: 'Test Movie',
        overview: 'A great movie',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '2024-01-01',
        runtime: 120,
        voteAverage: 8.5,
        voteCount: 1000,
        genres: ['Action'],
        originalLanguage: 'en',
        matchReason: 'Perfect for your happy mood!',
        platforms: [
          { id: 'netflix', name: 'Netflix', logo: '/platforms/netflix.svg' },
        ],
      };
      expect(recommendation.matchReason).toBeDefined();
      expect(recommendation.platforms).toHaveLength(1);
    });
  });
});

// =============================================================================
// FILTER TYPE TESTS
// =============================================================================

describe('Filter Types', () => {
  describe('RuntimeRange interface', () => {
    it('should allow all optional properties', () => {
      const empty: RuntimeRange = {};
      const minOnly: RuntimeRange = { min: 60 };
      const maxOnly: RuntimeRange = { max: 120 };
      const both: RuntimeRange = { min: 60, max: 120 };
      
      expect(empty).toEqual({});
      expect(minOnly.min).toBe(60);
      expect(maxOnly.max).toBe(120);
      expect(both).toEqual({ min: 60, max: 120 });
    });
  });

  describe('YearRange interface', () => {
    it('should allow all optional properties', () => {
      const empty: YearRange = {};
      const fromOnly: YearRange = { from: 2000 };
      const toOnly: YearRange = { to: 2024 };
      const both: YearRange = { from: 2000, to: 2024 };
      
      expect(empty).toEqual({});
      expect(fromOnly.from).toBe(2000);
      expect(toOnly.to).toBe(2024);
      expect(both).toEqual({ from: 2000, to: 2024 });
    });
  });
});

// =============================================================================
// USER INPUT TYPE TESTS
// =============================================================================

describe('User Input Types', () => {
  describe('UserInput interface', () => {
    it('should allow empty object', () => {
      const input: UserInput = {};
      expect(input).toEqual({});
    });

    it('should allow partial input', () => {
      const input: UserInput = {
        mood: 'happy',
        genres: ['Action'],
      };
      expect(input.mood).toBe('happy');
      expect(input.genres).toEqual(['Action']);
    });

    it('should allow full input', () => {
      const input: UserInput = {
        mood: 'happy',
        genres: ['Action', 'Comedy'],
        platforms: ['netflix', 'disney'],
        runtime: { min: 60, max: 120 },
        releaseYear: { from: 2000, to: 2024 },
      };
      expect(Object.keys(input)).toHaveLength(5);
    });
  });
});

// =============================================================================
// API TYPE TESTS
// =============================================================================

describe('API Types', () => {
  describe('RecommendRequest interface', () => {
    it('should accept genres as string or array', () => {
      const withString: RecommendRequest = { genres: 'Action' };
      const withArray: RecommendRequest = { genres: ['Action', 'Comedy'] };
      
      expect(withString.genres).toBe('Action');
      expect(withArray.genres).toEqual(['Action', 'Comedy']);
    });

    it('should accept releaseYear as number or object', () => {
      const withNumber: RecommendRequest = { releaseYear: 2024 };
      const withObject: RecommendRequest = { releaseYear: { from: 2000, to: 2024 } };
      
      expect(withNumber.releaseYear).toBe(2024);
      expect(withObject.releaseYear).toEqual({ from: 2000, to: 2024 });
    });
  });

  describe('RecommendResponse interface', () => {
    it('should have recommendations and metadata', () => {
      const response: RecommendResponse = {
        recommendations: [],
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
          inputParameters: { mood: 'happy' },
          totalResults: 0,
        },
      };
      expect(response.recommendations).toEqual([]);
      expect(response.metadata.timestamp).toBeDefined();
    });
  });

  describe('ErrorResponse interface', () => {
    it('should have error flag and details', () => {
      const error: ErrorResponse = {
        error: true,
        errorType: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        retryAfter: 60,
      };
      expect(error.error).toBe(true);
      expect(error.errorType).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('ApiResponse type', () => {
    it('should accept either success or error response', () => {
      const success: ApiResponse<RecommendResponse> = {
        recommendations: [],
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
          inputParameters: {},
          totalResults: 0,
        },
      };
      const error: ApiResponse<RecommendResponse> = {
        error: true,
        errorType: 'API_ERROR',
        message: 'Something went wrong',
      };
      
      expect(success).toBeDefined();
      expect(error).toBeDefined();
    });
  });
});

// =============================================================================
// STREAMING TYPE TESTS
// =============================================================================

describe('Streaming Types', () => {
  describe('StreamEventType type', () => {
    it('should accept valid event types', () => {
      const types: StreamEventType[] = ['text', 'movie', 'done', 'error'];
      expect(types).toHaveLength(4);
    });
  });

  describe('StreamEvent interface', () => {
    it('should have type and data', () => {
      const textEvent: StreamEvent = { type: 'text', data: 'Hello' };
      const doneEvent: StreamEvent = { type: 'done', data: null };
      
      expect(textEvent.type).toBe('text');
      expect(doneEvent.data).toBeNull();
    });
  });
});

// =============================================================================
// APP STATE TYPE TESTS
// =============================================================================

describe('App State Types', () => {
  describe('ViewMode type', () => {
    it('should accept valid view modes', () => {
      const modes: ViewMode[] = ['cards', 'streaming'];
      expect(modes).toContain('cards');
      expect(modes).toContain('streaming');
    });
  });

  describe('AppState interface', () => {
    it('should have all required properties', () => {
      const state: AppState = {
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
      expect(state.selectedMood).toBeNull();
      expect(state.viewMode).toBe('cards');
    });
  });

  describe('initialAppState', () => {
    it('should have correct default values', () => {
      expect(initialAppState.selectedMood).toBeNull();
      expect(initialAppState.selectedGenres).toEqual([]);
      expect(initialAppState.selectedPlatforms).toEqual([]);
      expect(initialAppState.runtime).toEqual({});
      expect(initialAppState.releaseYear).toEqual({});
      expect(initialAppState.recommendations).toBeNull();
      expect(initialAppState.streamingContent).toBe('');
      expect(initialAppState.isLoading).toBe(false);
      expect(initialAppState.isStreaming).toBe(false);
      expect(initialAppState.error).toBeNull();
      expect(initialAppState.viewMode).toBe('cards');
    });
  });
});

// =============================================================================
// ANALYTICS TYPE TESTS
// =============================================================================

describe('Analytics Types', () => {
  describe('AnalyticsEventName type', () => {
    it('should accept valid event names', () => {
      const events: AnalyticsEventName[] = [
        'page_view',
        'mood_selected',
        'filters_expanded',
        'genre_selected',
        'platform_selected',
        'search_submitted',
        'results_loaded',
        'movie_card_clicked',
        'platform_link_clicked',
        'error_occurred',
      ];
      expect(events).toHaveLength(10);
    });
  });
});

// =============================================================================
// UTILITY TYPE TESTS
// =============================================================================

describe('Utility Types', () => {
  describe('PartialBy type', () => {
    it('should make specified properties optional', () => {
      type Original = { a: string; b: number; c: boolean };
      type Modified = PartialBy<Original, 'a' | 'b'>;
      
      const obj: Modified = { c: true };
      expect(obj.c).toBe(true);
      expect(obj.a).toBeUndefined();
    });
  });

  describe('RequiredBy type', () => {
    it('should make specified properties required', () => {
      type Original = { a?: string; b?: number; c?: boolean };
      type Modified = RequiredBy<Original, 'a'>;
      
      const obj: Modified = { a: 'required' };
      expect(obj.a).toBe('required');
    });
  });

  describe('DeepPartial type', () => {
    it('should make all nested properties optional', () => {
      type Original = { a: { b: { c: string } } };
      type Modified = DeepPartial<Original>;
      
      const empty: Modified = {};
      const partial: Modified = { a: {} };
      const deep: Modified = { a: { b: {} } };
      
      expect(empty).toEqual({});
      expect(partial).toEqual({ a: {} });
      expect(deep).toEqual({ a: { b: {} } });
    });
  });

  describe('NonEmptyArray type', () => {
    it('should require at least one element', () => {
      const arr: NonEmptyArray<number> = [1];
      const arr2: NonEmptyArray<number> = [1, 2, 3];
      
      expect(arr.length).toBeGreaterThanOrEqual(1);
      expect(arr2.length).toBe(3);
    });
  });

  describe('Brand type', () => {
    it('should create branded types', () => {
      // MovieId is branded as a specific number type
      const movieId = 123 as MovieId;
      expect(typeof movieId).toBe('number');
    });
  });

  describe('ArrayElement type', () => {
    it('should extract element type from array', () => {
      type StringArray = string[];
      type Element = ArrayElement<StringArray>;
      
      const element: Element = 'test';
      expect(element).toBe('test');
    });
  });

  describe('ValueOf type', () => {
    it('should extract value types from object', () => {
      const obj = { a: 1, b: 2, c: 3 } as const;
      type Values = ValueOf<typeof obj>;
      
      const value: Values = 1;
      expect([1, 2, 3]).toContain(value);
    });
  });
});
