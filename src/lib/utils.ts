import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// =============================================================================
// CLASS NAME UTILITIES
// =============================================================================

/**
 * Combines class names using clsx and tailwind-merge
 * This is the standard utility for shadcn/ui components
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// =============================================================================
// ASYNC UTILITIES
// =============================================================================

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a debounced version of a function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Create a throttled version of a function
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/**
 * Deep clone an object
 * @param obj - Object to clone
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Check if an object is empty
 * @param obj - Object to check
 */
export function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Pick specific keys from an object
 * @param obj - Source object
 * @param keys - Keys to pick
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific keys from an object
 * @param obj - Source object
 * @param keys - Keys to omit
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

/**
 * Remove undefined and null values from an object
 * @param obj - Object to clean
 */
export function removeNullish<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Remove duplicates from an array
 * @param arr - Array to deduplicate
 */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Remove duplicates from an array based on a key function
 * @param arr - Array to deduplicate
 * @param keyFn - Function to extract the comparison key
 */
export function uniqueBy<T>(arr: T[], keyFn: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Chunk an array into smaller arrays
 * @param arr - Array to chunk
 * @param size - Size of each chunk
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) {
    return [];
  }

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 * @param arr - Array to shuffle
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j] as T;
    result[j] = temp as T;
  }
  return result;
}

/**
 * Group array items by a key function
 * @param arr - Array to group
 * @param keyFn - Function to extract the grouping key
 */
export function groupBy<T>(
  arr: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Generate a random string ID
 * @param length - Length of the ID
 */
export function generateId(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a slug from a string
 * @param text - Text to slugify
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Escape HTML special characters
 * @param text - Text to escape
 */
export function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };

  return text.replace(/[&<>"']/g, (char) => escapeMap[char] ?? char);
}

// =============================================================================
// URL UTILITIES
// =============================================================================

/**
 * Build a URL with query parameters
 * @param baseUrl - Base URL
 * @param params - Query parameters
 */
export function buildUrl(
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const url = new URL(baseUrl, 'http://placeholder');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  // Return full URL or just path+search if relative
  if (baseUrl.startsWith('http')) {
    return url.toString();
  }
  return `${url.pathname}${url.search}`;
}

/**
 * Parse query parameters from a URL string
 * @param url - URL string
 */
export function parseQueryParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url, 'http://placeholder');
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

/**
 * Clamp a number between min and max values
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round a number to a specified number of decimal places
 * @param value - Value to round
 * @param decimals - Number of decimal places
 */
export function round(value: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate percentage
 * @param value - Current value
 * @param total - Total value
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// =============================================================================
// ENVIRONMENT UTILITIES
// =============================================================================

/**
 * Check if running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if running in development mode
 */
export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
