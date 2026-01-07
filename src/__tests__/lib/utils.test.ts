/**
 * Unit Tests for Utils
 *
 * Comprehensive tests for all utility functions in utils.ts
 */

import {
  cn,
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
} from '@/lib/utils';

// =============================================================================
// CN UTILITY TESTS
// =============================================================================

describe('cn utility function', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('merges tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles array of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });
});

// =============================================================================
// ASYNC UTILITIES TESTS
// =============================================================================

describe('Async Utilities', () => {
  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve after specified time', async () => {
      const promise = sleep(100);
      jest.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throttle function calls', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow calls after throttle period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

// =============================================================================
// OBJECT UTILITIES TESTS
// =============================================================================

describe('Object Utilities', () => {
  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(null)).toBe(null);
    });

    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should deep clone arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty object', () => {
      expect(isEmpty({ key: 'value' })).toBe(false);
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      // @ts-expect-error - Testing with non-existent key
      expect(pick(obj, ['a', 'z'])).toEqual({ a: 1 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });

    it('should return same object shape if no keys match', () => {
      const obj = { a: 1, b: 2 };
      // @ts-expect-error - Testing with non-existent key
      expect(omit(obj, ['z'])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('removeNullish', () => {
    it('should remove null and undefined values', () => {
      const obj = { a: 1, b: null, c: undefined, d: 'value' };
      expect(removeNullish(obj)).toEqual({ a: 1, d: 'value' });
    });

    it('should keep falsy but not nullish values', () => {
      const obj = { a: 0, b: '', c: false, d: null };
      expect(removeNullish(obj)).toEqual({ a: 0, b: '', c: false });
    });
  });
});

// =============================================================================
// ARRAY UTILITIES TESTS
// =============================================================================

describe('Array Utilities', () => {
  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    });

    it('should handle strings', () => {
      expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });
  });

  describe('uniqueBy', () => {
    it('should remove duplicates based on key function', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' },
      ];
      expect(uniqueBy(items, (item) => item.id)).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ]);
    });
  });

  describe('chunk', () => {
    it('should chunk array into smaller arrays', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle size larger than array', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });

    it('should handle empty array', () => {
      expect(chunk([], 3)).toEqual([]);
    });

    it('should return empty array for size <= 0', () => {
      expect(chunk([1, 2, 3], 0)).toEqual([]);
      expect(chunk([1, 2, 3], -1)).toEqual([]);
    });
  });

  describe('shuffle', () => {
    it('should return array with same elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);

      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('should not modify original array', () => {
      const arr = [1, 2, 3];
      shuffle(arr);
      expect(arr).toEqual([1, 2, 3]);
    });
  });

  describe('groupBy', () => {
    it('should group items by key function', () => {
      const items = [
        { category: 'a', value: 1 },
        { category: 'b', value: 2 },
        { category: 'a', value: 3 },
      ];

      expect(groupBy(items, (item) => item.category)).toEqual({
        a: [
          { category: 'a', value: 1 },
          { category: 'a', value: 3 },
        ],
        b: [{ category: 'b', value: 2 }],
      });
    });

    it('should handle empty array', () => {
      expect(groupBy([], () => 'key')).toEqual({});
    });
  });
});

// =============================================================================
// STRING UTILITIES TESTS
// =============================================================================

describe('String Utilities', () => {
  describe('generateId', () => {
    it('should generate ID of specified length', () => {
      expect(generateId(10)).toHaveLength(10);
      expect(generateId(20)).toHaveLength(20);
    });

    it('should generate different IDs each time', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should use default length of 12', () => {
      expect(generateId()).toHaveLength(12);
    });
  });

  describe('generateUUID', () => {
    it('should generate valid UUID format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('hello world')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world');
    });

    it('should trim whitespace', () => {
      expect(slugify('  hello world  ')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('hello   world')).toBe('hello-world');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should handle text without special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });
});

// =============================================================================
// URL UTILITIES TESTS
// =============================================================================

describe('URL Utilities', () => {
  describe('buildUrl', () => {
    it('should build URL with query parameters', () => {
      const url = buildUrl('/api/movies', { page: 1, limit: 10 });
      expect(url).toBe('/api/movies?page=1&limit=10');
    });

    it('should skip undefined and null values', () => {
      const url = buildUrl('/api/movies', { page: 1, filter: undefined, sort: null });
      expect(url).toBe('/api/movies?page=1');
    });

    it('should handle boolean values', () => {
      const url = buildUrl('/api/movies', { active: true });
      expect(url).toBe('/api/movies?active=true');
    });

    it('should handle absolute URLs', () => {
      const url = buildUrl('https://example.com/api', { q: 'test' });
      expect(url).toBe('https://example.com/api?q=test');
    });
  });

  describe('parseQueryParams', () => {
    it('should parse query parameters', () => {
      const params = parseQueryParams('https://example.com/api?page=1&limit=10');
      expect(params).toEqual({ page: '1', limit: '10' });
    });

    it('should return empty object for URL without params', () => {
      expect(parseQueryParams('https://example.com/api')).toEqual({});
    });

    it('should return empty object for invalid URL', () => {
      expect(parseQueryParams('not a url')).toEqual({});
    });
  });
});

// =============================================================================
// NUMBER UTILITIES TESTS
// =============================================================================

describe('Number Utilities', () => {
  describe('clamp', () => {
    it('should return value if within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should return min if value is below', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max if value is above', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('round', () => {
    it('should round to specified decimal places', () => {
      expect(round(3.14159, 2)).toBe(3.14);
      expect(round(3.145, 2)).toBe(3.15);
    });

    it('should round to whole number by default', () => {
      expect(round(3.7)).toBe(4);
      expect(round(3.2)).toBe(3);
    });
  });

  describe('percentage', () => {
    it('should calculate percentage', () => {
      expect(percentage(50, 100)).toBe(50);
      expect(percentage(25, 200)).toBe(12.5);
    });

    it('should return 0 for zero total', () => {
      expect(percentage(10, 0)).toBe(0);
    });
  });
});

// =============================================================================
// ENVIRONMENT UTILITIES TESTS
// =============================================================================

describe('Environment Utilities', () => {
  describe('isBrowser', () => {
    it('should be a function that returns a boolean', () => {
      // In jsdom environment, window is defined so isBrowser returns true
      // Just verify the function works and returns a boolean
      expect(typeof isBrowser()).toBe('boolean');
    });
  });

  describe('isDev', () => {
    it('should check NODE_ENV for development', () => {
      const result = isDev();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isProd', () => {
    it('should check NODE_ENV for production', () => {
      const result = isProd();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isTest', () => {
    it('should return true in test environment', () => {
      expect(isTest()).toBe(true);
    });
  });
});
