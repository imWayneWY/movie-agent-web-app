/**
 * Unit Tests for Constants
 *
 * Tests to verify the integrity and correctness of application constants.
 */

import {
  MOODS,
  MOOD_VALUES,
  MOOD_MAP,
  GENRES,
  GENRE_VALUES,
  PLATFORMS,
  PLATFORM_IDS,
  PLATFORM_MAP,
  RUNTIME,
  YEAR,
  RATE_LIMIT,
  API_ENDPOINTS,
  HTTP_STATUS,
  BREAKPOINTS,
  MAX_RECOMMENDATIONS,
  DESCRIPTION_TRUNCATE_LENGTH,
  ANALYTICS_EVENTS,
  ERROR_MESSAGES,
  BOT_MESSAGES,
} from '@/lib/constants';

// =============================================================================
// MOOD CONSTANTS TESTS
// =============================================================================

describe('Mood Constants', () => {
  describe('MOODS', () => {
    it('should contain 5 mood options', () => {
      expect(MOODS).toHaveLength(5);
    });

    it('should have valid structure for each mood', () => {
      MOODS.forEach((mood) => {
        expect(mood).toHaveProperty('value');
        expect(mood).toHaveProperty('label');
        expect(mood).toHaveProperty('emoji');
        expect(typeof mood.value).toBe('string');
        expect(typeof mood.label).toBe('string');
        expect(typeof mood.emoji).toBe('string');
      });
    });

    it('should have unique values', () => {
      const values = MOODS.map((m) => m.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(MOODS.length);
    });

    it('should include expected moods', () => {
      const values = MOODS.map((m) => m.value);
      expect(values).toContain('happy');
      expect(values).toContain('excited');
      expect(values).toContain('relaxed');
      expect(values).toContain('scared');
      expect(values).toContain('thoughtful');
    });
  });

  describe('MOOD_VALUES', () => {
    it('should be a Set', () => {
      expect(MOOD_VALUES).toBeInstanceOf(Set);
    });

    it('should contain all mood values', () => {
      expect(MOOD_VALUES.size).toBe(MOODS.length);
      MOODS.forEach((mood) => {
        expect(MOOD_VALUES.has(mood.value)).toBe(true);
      });
    });
  });

  describe('MOOD_MAP', () => {
    it('should be a Map', () => {
      expect(MOOD_MAP).toBeInstanceOf(Map);
    });

    it('should map values to mood objects', () => {
      expect(MOOD_MAP.get('happy')).toEqual({ value: 'happy', label: 'Happy', emoji: '😊' });
    });

    it('should contain all moods', () => {
      expect(MOOD_MAP.size).toBe(MOODS.length);
    });
  });
});

// =============================================================================
// GENRE CONSTANTS TESTS
// =============================================================================

describe('Genre Constants', () => {
  describe('GENRES', () => {
    it('should contain 18 genres', () => {
      expect(GENRES).toHaveLength(18);
    });

    it('should have unique values', () => {
      const uniqueGenres = new Set(GENRES);
      expect(uniqueGenres.size).toBe(GENRES.length);
    });

    it('should include common genres', () => {
      expect(GENRES).toContain('Action');
      expect(GENRES).toContain('Comedy');
      expect(GENRES).toContain('Drama');
      expect(GENRES).toContain('Horror');
      expect(GENRES).toContain('Science Fiction');
    });

    it('should be sorted alphabetically', () => {
      const sorted = [...GENRES].sort();
      expect(GENRES).toEqual(sorted);
    });
  });

  describe('GENRE_VALUES', () => {
    it('should be a Set', () => {
      expect(GENRE_VALUES).toBeInstanceOf(Set);
    });

    it('should contain all genres', () => {
      expect(GENRE_VALUES.size).toBe(GENRES.length);
      GENRES.forEach((genre) => {
        expect(GENRE_VALUES.has(genre)).toBe(true);
      });
    });
  });
});

// =============================================================================
// PLATFORM CONSTANTS TESTS
// =============================================================================

describe('Platform Constants', () => {
  describe('PLATFORMS', () => {
    it('should contain 6 platforms', () => {
      expect(PLATFORMS).toHaveLength(6);
    });

    it('should have valid structure for each platform', () => {
      PLATFORMS.forEach((platform) => {
        expect(platform).toHaveProperty('id');
        expect(platform).toHaveProperty('name');
        expect(platform).toHaveProperty('logo');
        expect(typeof platform.id).toBe('string');
        expect(typeof platform.name).toBe('string');
        expect(typeof platform.logo).toBe('string');
        expect(platform.logo).toMatch(/^\/platforms\/.+\.svg$/);
      });
    });

    it('should have unique IDs', () => {
      const ids = PLATFORMS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(PLATFORMS.length);
    });

    it('should include major streaming platforms', () => {
      const ids = PLATFORMS.map((p) => p.id);
      expect(ids).toContain('netflix');
      expect(ids).toContain('prime');
      expect(ids).toContain('disney');
    });
  });

  describe('PLATFORM_IDS', () => {
    it('should be a Set', () => {
      expect(PLATFORM_IDS).toBeInstanceOf(Set);
    });

    it('should contain all platform IDs', () => {
      expect(PLATFORM_IDS.size).toBe(PLATFORMS.length);
      PLATFORMS.forEach((platform) => {
        expect(PLATFORM_IDS.has(platform.id)).toBe(true);
      });
    });
  });

  describe('PLATFORM_MAP', () => {
    it('should be a Map', () => {
      expect(PLATFORM_MAP).toBeInstanceOf(Map);
    });

    it('should map IDs to platform objects', () => {
      expect(PLATFORM_MAP.get('netflix')).toEqual({
        id: 'netflix',
        name: 'Netflix',
        logo: '/platforms/netflix.svg',
      });
    });

    it('should contain all platforms', () => {
      expect(PLATFORM_MAP.size).toBe(PLATFORMS.length);
    });
  });
});

// =============================================================================
// RUNTIME CONSTANTS TESTS
// =============================================================================

describe('Runtime Constants', () => {
  describe('RUNTIME', () => {
    it('should have valid MIN value', () => {
      expect(RUNTIME.MIN).toBe(0);
    });

    it('should have valid MAX value', () => {
      expect(RUNTIME.MAX).toBeGreaterThan(RUNTIME.MIN);
      expect(RUNTIME.MAX).toBe(300);
    });

    it('should have valid DEFAULT values', () => {
      expect(RUNTIME.DEFAULT_MIN).toBeGreaterThanOrEqual(RUNTIME.MIN);
      expect(RUNTIME.DEFAULT_MAX).toBeLessThanOrEqual(RUNTIME.MAX);
      expect(RUNTIME.DEFAULT_MIN).toBeLessThan(RUNTIME.DEFAULT_MAX);
    });

    it('should have valid STEP value', () => {
      expect(RUNTIME.STEP).toBeGreaterThan(0);
      expect(RUNTIME.STEP).toBe(15);
    });
  });
});

// =============================================================================
// YEAR CONSTANTS TESTS
// =============================================================================

describe('Year Constants', () => {
  const currentYear = new Date().getFullYear();

  describe('YEAR', () => {
    it('should have valid MIN value', () => {
      expect(YEAR.MIN).toBe(1900);
    });

    it('should have MAX as current year + 1', () => {
      expect(YEAR.MAX).toBe(currentYear + 1);
    });

    it('should have valid DEFAULT values', () => {
      expect(YEAR.DEFAULT_FROM).toBeGreaterThanOrEqual(YEAR.MIN);
      expect(YEAR.DEFAULT_TO).toBeLessThanOrEqual(YEAR.MAX);
      expect(YEAR.DEFAULT_FROM).toBeLessThanOrEqual(YEAR.DEFAULT_TO);
    });
  });
});

// =============================================================================
// RATE LIMIT CONSTANTS TESTS
// =============================================================================

describe('Rate Limit Constants', () => {
  describe('RATE_LIMIT', () => {
    it('should have MAX_REQUESTS of 10', () => {
      expect(RATE_LIMIT.MAX_REQUESTS).toBe(10);
    });

    it('should have WINDOW_MS of 60 seconds', () => {
      expect(RATE_LIMIT.WINDOW_MS).toBe(60000);
    });

    it('should have RETRY_AFTER_SECONDS matching window', () => {
      expect(RATE_LIMIT.RETRY_AFTER_SECONDS).toBe(60);
    });
  });
});

// =============================================================================
// API CONSTANTS TESTS
// =============================================================================

describe('API Constants', () => {
  describe('API_ENDPOINTS', () => {
    it('should have RECOMMEND endpoint', () => {
      expect(API_ENDPOINTS.RECOMMEND).toBe('/api/recommend');
    });

    it('should have STREAM endpoint', () => {
      expect(API_ENDPOINTS.STREAM).toBe('/api/stream');
    });
  });

  describe('HTTP_STATUS', () => {
    it('should have correct status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
    });
  });
});

// =============================================================================
// UI CONSTANTS TESTS
// =============================================================================

describe('UI Constants', () => {
  describe('BREAKPOINTS', () => {
    it('should have increasing values', () => {
      expect(BREAKPOINTS.SM).toBeLessThan(BREAKPOINTS.MD);
      expect(BREAKPOINTS.MD).toBeLessThan(BREAKPOINTS.LG);
      expect(BREAKPOINTS.LG).toBeLessThan(BREAKPOINTS.XL);
    });

    it('should have expected values', () => {
      expect(BREAKPOINTS.SM).toBe(640);
      expect(BREAKPOINTS.MD).toBe(768);
      expect(BREAKPOINTS.LG).toBe(1024);
      expect(BREAKPOINTS.XL).toBe(1280);
    });
  });

  describe('MAX_RECOMMENDATIONS', () => {
    it('should be a positive number', () => {
      expect(MAX_RECOMMENDATIONS).toBeGreaterThan(0);
      expect(MAX_RECOMMENDATIONS).toBe(10);
    });
  });

  describe('DESCRIPTION_TRUNCATE_LENGTH', () => {
    it('should be a reasonable length', () => {
      expect(DESCRIPTION_TRUNCATE_LENGTH).toBeGreaterThan(50);
      expect(DESCRIPTION_TRUNCATE_LENGTH).toBe(150);
    });
  });
});

// =============================================================================
// ANALYTICS CONSTANTS TESTS
// =============================================================================

describe('Analytics Constants', () => {
  describe('ANALYTICS_EVENTS', () => {
    it('should have all required event names', () => {
      expect(ANALYTICS_EVENTS.PAGE_VIEW).toBe('page_view');
      expect(ANALYTICS_EVENTS.MOOD_SELECTED).toBe('mood_selected');
      expect(ANALYTICS_EVENTS.FILTERS_EXPANDED).toBe('filters_expanded');
      expect(ANALYTICS_EVENTS.GENRE_SELECTED).toBe('genre_selected');
      expect(ANALYTICS_EVENTS.PLATFORM_SELECTED).toBe('platform_selected');
      expect(ANALYTICS_EVENTS.SEARCH_SUBMITTED).toBe('search_submitted');
      expect(ANALYTICS_EVENTS.RESULTS_LOADED).toBe('results_loaded');
      expect(ANALYTICS_EVENTS.MOVIE_CARD_CLICKED).toBe('movie_card_clicked');
      expect(ANALYTICS_EVENTS.PLATFORM_LINK_CLICKED).toBe('platform_link_clicked');
      expect(ANALYTICS_EVENTS.ERROR_OCCURRED).toBe('error_occurred');
    });
  });
});

// =============================================================================
// MESSAGE CONSTANTS TESTS
// =============================================================================

describe('Message Constants', () => {
  describe('ERROR_MESSAGES', () => {
    it('should have all error types', () => {
      expect(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED).toBeDefined();
      expect(ERROR_MESSAGES.NO_RESULTS).toBeDefined();
      expect(ERROR_MESSAGES.API_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.VALIDATION_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.UNKNOWN_ERROR).toBeDefined();
    });

    it('should have non-empty messages', () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('BOT_MESSAGES', () => {
    it('should have all message types', () => {
      expect(BOT_MESSAGES.GREETING).toBeDefined();
      expect(BOT_MESSAGES.LOADING).toBeDefined();
      expect(BOT_MESSAGES.SUCCESS).toBeDefined();
      expect(BOT_MESSAGES.NO_MOOD).toBeDefined();
    });

    it('should have non-empty messages', () => {
      Object.values(BOT_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});
