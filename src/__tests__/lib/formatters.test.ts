/**
 * Unit Tests for Formatters
 *
 * Comprehensive tests for all formatting functions in formatters.ts
 */

import {
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
} from '@/lib/formatters';

// =============================================================================
// DATE FORMATTERS TESTS
// =============================================================================

describe('Date Formatters', () => {
  describe('formatDate', () => {
    it('should format a valid ISO date string', () => {
      const result = formatDate('2024-03-15');
      expect(result).toContain('March');
      // Day may vary by timezone, just check it's a number
      expect(result).toMatch(/\d/);
      expect(result).toContain('2024');
    });

    it('should format a Date object', () => {
      const date = new Date('2024-06-20');
      const result = formatDate(date);
      expect(result).toContain('June');
      expect(result).toContain('20');
    });

    it('should accept custom format options', () => {
      const result = formatDate('2024-03-15', { month: 'short', day: 'numeric' });
      expect(result).toContain('Mar');
      // Day may vary by timezone, just check format is applied
      expect(result).toMatch(/Mar\s+\d/);
    });

    it('should return empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(formatDate('')).toBe('');
    });
  });

  describe('formatYear', () => {
    it('should extract year from date string', () => {
      expect(formatYear('2024-03-15')).toBe('2024');
    });

    it('should extract year from Date object', () => {
      expect(formatYear(new Date('2020-06-20'))).toBe('2020');
    });

    it('should return empty string for null', () => {
      expect(formatYear(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatYear(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatYear('not-a-date')).toBe('');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "just now" for very recent dates', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should return minutes ago for recent dates', () => {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      expect(formatRelativeTime(thirtyMinsAgo)).toBe('30 minutes ago');
    });

    it('should return "1 minute ago" for singular', () => {
      const oneMinAgo = new Date(Date.now() - 60 * 1000);
      expect(formatRelativeTime(oneMinAgo)).toBe('1 minute ago');
    });

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
    });

    it('should return "yesterday" for one day ago', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(yesterday)).toBe('yesterday');
    });

    it('should return days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });

    it('should return weeks ago', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
    });

    it('should return months ago', () => {
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeMonthsAgo)).toBe('3 months ago');
    });

    it('should return years ago', () => {
      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoYearsAgo)).toBe('2 years ago');
    });

    it('should handle future dates', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(tomorrow)).toBe('tomorrow');
    });

    it('should return empty string for null', () => {
      expect(formatRelativeTime(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatRelativeTime(undefined)).toBe('');
    });
  });
});

// =============================================================================
// NUMBER FORMATTERS TESTS
// =============================================================================

describe('Number Formatters', () => {
  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should format numbers with specified decimals', () => {
      expect(formatNumber(1234.5678, 2)).toBe('1,234.57');
    });

    it('should format zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should format negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1,234');
    });

    it('should return empty string for null', () => {
      expect(formatNumber(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatNumber(undefined)).toBe('');
    });

    it('should return empty string for NaN', () => {
      expect(formatNumber(NaN)).toBe('');
    });
  });

  describe('formatCompactNumber', () => {
    it('should format thousands as K', () => {
      expect(formatCompactNumber(1500)).toBe('1.5K');
    });

    it('should format millions as M', () => {
      expect(formatCompactNumber(2500000)).toBe('2.5M');
    });

    it('should format small numbers without suffix', () => {
      expect(formatCompactNumber(500)).toBe('500');
    });

    it('should return empty string for null', () => {
      expect(formatCompactNumber(null)).toBe('');
    });

    it('should return empty string for NaN', () => {
      expect(formatCompactNumber(NaN)).toBe('');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage from 0-100', () => {
      expect(formatPercentage(75)).toBe('75%');
    });

    it('should format decimal percentage', () => {
      expect(formatPercentage(0.75, true)).toBe('75%');
    });

    it('should format with decimals', () => {
      expect(formatPercentage(75.5, false, 1)).toBe('75.5%');
    });

    it('should return empty string for null', () => {
      expect(formatPercentage(null)).toBe('');
    });

    it('should return empty string for NaN', () => {
      expect(formatPercentage(NaN)).toBe('');
    });
  });

  describe('formatRating', () => {
    it('should format rating with one decimal', () => {
      expect(formatRating(7.5)).toBe('7.5');
    });

    it('should clamp rating to 0-10 range', () => {
      expect(formatRating(15)).toBe('10.0');
      expect(formatRating(-5)).toBe('0.0');
    });

    it('should format whole numbers with decimal', () => {
      expect(formatRating(8)).toBe('8.0');
    });

    it('should return "N/A" for null', () => {
      expect(formatRating(null)).toBe('N/A');
    });

    it('should return "N/A" for undefined', () => {
      expect(formatRating(undefined)).toBe('N/A');
    });

    it('should return "N/A" for NaN', () => {
      expect(formatRating(NaN)).toBe('N/A');
    });
  });

  describe('formatVoteCount', () => {
    it('should format small counts with "votes" suffix', () => {
      expect(formatVoteCount(500)).toBe('500 votes');
    });

    it('should format singular vote', () => {
      expect(formatVoteCount(1)).toBe('1 vote');
    });

    it('should format large counts with compact notation', () => {
      expect(formatVoteCount(1500)).toBe('1.5K votes');
    });

    it('should format zero votes', () => {
      expect(formatVoteCount(0)).toBe('0 votes');
    });

    it('should return "0 votes" for negative numbers', () => {
      expect(formatVoteCount(-10)).toBe('0 votes');
    });

    it('should return "0 votes" for null', () => {
      expect(formatVoteCount(null)).toBe('0 votes');
    });
  });
});

// =============================================================================
// DURATION FORMATTERS TESTS
// =============================================================================

describe('Duration Formatters', () => {
  describe('formatDuration', () => {
    it('should format hours and minutes', () => {
      expect(formatDuration(135)).toBe('2h 15m');
    });

    it('should format minutes only', () => {
      expect(formatDuration(45)).toBe('45m');
    });

    it('should format hours only', () => {
      expect(formatDuration(120)).toBe('2h');
    });

    it('should format zero minutes', () => {
      expect(formatDuration(0)).toBe('0m');
    });

    it('should return empty string for negative values', () => {
      expect(formatDuration(-10)).toBe('');
    });

    it('should return empty string for null', () => {
      expect(formatDuration(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDuration(undefined)).toBe('');
    });

    it('should return empty string for NaN', () => {
      expect(formatDuration(NaN)).toBe('');
    });
  });

  describe('formatDurationFull', () => {
    it('should format full duration string', () => {
      expect(formatDurationFull(135)).toBe('2 hours 15 minutes');
    });

    it('should handle singular hour', () => {
      expect(formatDurationFull(75)).toBe('1 hour 15 minutes');
    });

    it('should handle singular minute', () => {
      expect(formatDurationFull(61)).toBe('1 hour 1 minute');
    });

    it('should format hours only', () => {
      expect(formatDurationFull(120)).toBe('2 hours');
    });

    it('should format minutes only', () => {
      expect(formatDurationFull(45)).toBe('45 minutes');
    });

    it('should return empty string for null', () => {
      expect(formatDurationFull(null)).toBe('');
    });
  });

  describe('formatMilliseconds', () => {
    it('should format milliseconds', () => {
      expect(formatMilliseconds(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatMilliseconds(2500)).toBe('2.50s');
    });

    it('should format minutes', () => {
      expect(formatMilliseconds(120000)).toBe('2m');
    });

    it('should return empty string for null', () => {
      expect(formatMilliseconds(null)).toBe('');
    });

    it('should return empty string for negative values', () => {
      expect(formatMilliseconds(-100)).toBe('');
    });
  });
});

// =============================================================================
// TEXT FORMATTERS TESTS
// =============================================================================

describe('Text Formatters', () => {
  describe('truncate', () => {
    it('should truncate long strings with ellipsis', () => {
      expect(truncate('This is a very long string', 15)).toBe('This is a ve...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should handle exact length', () => {
      expect(truncate('Exact', 5)).toBe('Exact');
    });

    it('should support custom suffix', () => {
      expect(truncate('Long text here', 10, '…')).toBe('Long text…');
    });

    it('should return empty string for null', () => {
      expect(truncate(null, 10)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(truncate(undefined, 10)).toBe('');
    });

    it('should handle very short max length', () => {
      expect(truncate('Hello', 2, '...')).toBe('..');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should lowercase rest of string', () => {
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(capitalize('h')).toBe('H');
    });

    it('should return empty string for null', () => {
      expect(capitalize(null)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('toTitleCase', () => {
    it('should convert to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should handle all caps', () => {
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
    });

    it('should handle mixed case', () => {
      expect(toTitleCase('hElLo WoRlD')).toBe('Hello World');
    });

    it('should return empty string for null', () => {
      expect(toTitleCase(null)).toBe('');
    });
  });

  describe('pluralize', () => {
    it('should return singular for count of 1', () => {
      expect(pluralize(1, 'movie')).toBe('1 movie');
    });

    it('should return plural for count of 0', () => {
      expect(pluralize(0, 'movie')).toBe('0 movies');
    });

    it('should return plural for count > 1', () => {
      expect(pluralize(5, 'movie')).toBe('5 movies');
    });

    it('should use custom plural form', () => {
      expect(pluralize(2, 'person', 'people')).toBe('2 people');
    });

    it('should format large numbers', () => {
      expect(pluralize(1000, 'result')).toBe('1,000 results');
    });
  });
});

// =============================================================================
// FILE SIZE FORMATTERS TESTS
// =============================================================================

describe('File Size Formatters', () => {
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1610612736)).toBe('1.5 GB');
    });

    it('should format zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should respect decimal places', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB');
    });

    it('should return empty string for null', () => {
      expect(formatFileSize(null)).toBe('');
    });

    it('should return empty string for negative values', () => {
      expect(formatFileSize(-100)).toBe('');
    });
  });
});

// =============================================================================
// ARRAY/LIST FORMATTERS TESTS
// =============================================================================

describe('Array/List Formatters', () => {
  describe('formatList', () => {
    it('should format single item', () => {
      expect(formatList(['Apple'])).toBe('Apple');
    });

    it('should format two items with "and"', () => {
      expect(formatList(['Apple', 'Banana'])).toBe('Apple and Banana');
    });

    it('should format multiple items with comma and "and"', () => {
      expect(formatList(['Apple', 'Banana', 'Cherry'])).toBe('Apple, Banana and Cherry');
    });

    it('should respect limit', () => {
      expect(formatList(['Apple', 'Banana', 'Cherry', 'Date'], 2)).toBe('Apple, Banana and 2 more');
    });

    it('should handle single item with limit showing remaining', () => {
      expect(formatList(['Apple', 'Banana', 'Cherry'], 1)).toBe('Apple and 2 more');
    });

    it('should return empty string for null', () => {
      expect(formatList(null)).toBe('');
    });

    it('should return empty string for empty array', () => {
      expect(formatList([])).toBe('');
    });
  });

  describe('formatGenres', () => {
    it('should format genres with separator', () => {
      expect(formatGenres(['Action', 'Comedy', 'Drama'])).toBe('Action • Comedy • Drama');
    });

    it('should use custom separator', () => {
      expect(formatGenres(['Action', 'Comedy'], ', ')).toBe('Action, Comedy');
    });

    it('should handle single genre', () => {
      expect(formatGenres(['Action'])).toBe('Action');
    });

    it('should return empty string for null', () => {
      expect(formatGenres(null)).toBe('');
    });

    it('should return empty string for empty array', () => {
      expect(formatGenres([])).toBe('');
    });
  });
});

// =============================================================================
// URL FORMATTERS TESTS
// =============================================================================

describe('URL Formatters', () => {
  describe('formatPosterUrl', () => {
    it('should format poster path with default size', () => {
      expect(formatPosterUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg');
    });

    it('should format poster path with custom size', () => {
      expect(formatPosterUrl('/abc123.jpg', 'w185')).toBe('https://image.tmdb.org/t/p/w185/abc123.jpg');
    });

    it('should return placeholder for null', () => {
      expect(formatPosterUrl(null)).toBe('/placeholder-poster.svg');
    });

    it('should return placeholder for undefined', () => {
      expect(formatPosterUrl(undefined)).toBe('/placeholder-poster.svg');
    });

    it('should return placeholder for empty string', () => {
      expect(formatPosterUrl('')).toBe('/placeholder-poster.svg');
    });
  });

  describe('formatBackdropUrl', () => {
    it('should format backdrop path with default size', () => {
      expect(formatBackdropUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/w1280/abc123.jpg');
    });

    it('should format backdrop path with custom size', () => {
      expect(formatBackdropUrl('/abc123.jpg', 'w780')).toBe('https://image.tmdb.org/t/p/w780/abc123.jpg');
    });

    it('should return empty string for null', () => {
      expect(formatBackdropUrl(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatBackdropUrl(undefined)).toBe('');
    });
  });
});
