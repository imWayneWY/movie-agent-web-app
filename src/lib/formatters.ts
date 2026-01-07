/**
 * Formatting Utilities
 *
 * This file contains formatting functions for dates, numbers,
 * durations, and other display values.
 */

// =============================================================================
// DATE FORMATTERS
// =============================================================================

/**
 * Format a date string to a localized display format
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(
  dateString: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  if (!dateString) {
    return '';
  }

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return '';
  }
}

/**
 * Format a date to show only the year
 * @param dateString - ISO date string or Date object
 * @returns Year string or empty string if invalid
 */
export function formatYear(dateString: string | Date | null | undefined): string {
  if (!dateString) {
    return '';
  }

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.getFullYear().toString();
  } catch {
    return '';
  }
}

/**
 * Format a date as a relative time string (e.g., "2 days ago")
 * @param dateString - ISO date string or Date object
 * @returns Relative time string or empty string if invalid
 */
export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) {
    return '';
  }

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Future dates
    if (diffMs < 0) {
      const absDiffDays = Math.abs(diffDays);
      if (absDiffDays === 0) return 'today';
      if (absDiffDays === 1) return 'tomorrow';
      if (absDiffDays < 7) return `in ${absDiffDays} days`;
      if (absDiffDays < 30) return `in ${Math.abs(diffWeeks)} weeks`;
      return `in ${Math.abs(diffMonths)} months`;
    }

    // Past dates
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
    if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  } catch {
    return '';
  }
}

// =============================================================================
// NUMBER FORMATTERS
// =============================================================================

/**
 * Format a number with locale-specific thousand separators
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as a compact representation (e.g., 1.2K, 3.4M)
 * @param value - Number to format
 * @returns Compact number string
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value - Number to format (0-100 or 0-1)
 * @param isDecimal - Whether the value is already a decimal (0-1)
 * @param decimals - Number of decimal places
 * @returns Percentage string
 */
export function formatPercentage(
  value: number | null | undefined,
  isDecimal: boolean = false,
  decimals: number = 0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }

  const percentage = isDecimal ? value * 100 : value;
  return `${formatNumber(percentage, decimals)}%`;
}

/**
 * Format a movie rating (0-10 scale)
 * @param rating - Rating value (0-10)
 * @returns Formatted rating string with one decimal
 */
export function formatRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined || isNaN(rating)) {
    return 'N/A';
  }

  // Clamp to valid range
  const clampedRating = Math.max(0, Math.min(10, rating));
  return clampedRating.toFixed(1);
}

/**
 * Format a vote count with a suffix for large numbers
 * @param count - Vote count
 * @returns Formatted vote count string
 */
export function formatVoteCount(count: number | null | undefined): string {
  if (count === null || count === undefined || isNaN(count) || count < 0) {
    return '0 votes';
  }

  if (count === 1) {
    return '1 vote';
  }

  if (count < 1000) {
    return `${count} votes`;
  }

  return `${formatCompactNumber(count)} votes`;
}

// =============================================================================
// DURATION FORMATTERS
// =============================================================================

/**
 * Format minutes to a human-readable duration string
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "2h 15m")
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return '';
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Format minutes to a full duration description
 * @param minutes - Duration in minutes
 * @returns Full duration string (e.g., "2 hours 15 minutes")
 */
export function formatDurationFull(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return '';
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  const hourStr = hours === 1 ? 'hour' : 'hours';
  const minStr = mins === 1 ? 'minute' : 'minutes';

  if (hours === 0) {
    return `${mins} ${minStr}`;
  }

  if (mins === 0) {
    return `${hours} ${hourStr}`;
  }

  return `${hours} ${hourStr} ${mins} ${minStr}`;
}

/**
 * Format milliseconds to a human-readable duration
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatMilliseconds(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms) || ms < 0) {
    return '';
  }

  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }

  return formatDuration(Math.round(seconds / 60));
}

// =============================================================================
// TEXT FORMATTERS
// =============================================================================

/**
 * Truncate a string to a maximum length with ellipsis
 * @param text - String to truncate
 * @param maxLength - Maximum length (including ellipsis)
 * @param suffix - Suffix to append when truncated
 * @returns Truncated string
 */
export function truncate(
  text: string | null | undefined,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  const truncatedLength = maxLength - suffix.length;
  if (truncatedLength <= 0) {
    return suffix.slice(0, maxLength);
  }

  return text.slice(0, truncatedLength).trimEnd() + suffix;
}

/**
 * Capitalize the first letter of a string
 * @param text - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) {
    return '';
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert a string to title case
 * @param text - String to convert
 * @returns Title case string
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) {
    return '';
  }

  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Pluralize a word based on count
 * @param count - Number to determine singular/plural
 * @param singular - Singular form of the word
 * @param plural - Plural form of the word (defaults to singular + 's')
 * @returns Pluralized string with count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${formatNumber(count)} ${word}`;
}

// =============================================================================
// FILE SIZE FORMATTERS
// =============================================================================

/**
 * Format bytes to a human-readable file size
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size string
 */
export function formatFileSize(
  bytes: number | null | undefined,
  decimals: number = 2
): string {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
    return '';
  }

  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// =============================================================================
// ARRAY/LIST FORMATTERS
// =============================================================================

/**
 * Format an array of strings as a comma-separated list with "and"
 * @param items - Array of strings
 * @param limit - Maximum items to show (optional)
 * @returns Formatted list string
 */
export function formatList(
  items: string[] | null | undefined,
  limit?: number
): string {
  if (!items || items.length === 0) {
    return '';
  }

  const displayItems = limit ? items.slice(0, limit) : items;
  const remaining = limit ? Math.max(0, items.length - limit) : 0;

  if (displayItems.length === 1) {
    const firstItem = displayItems[0] ?? '';
    return remaining > 0 ? `${firstItem} and ${remaining} more` : firstItem;
  }

  const lastItem = displayItems[displayItems.length - 1];
  const otherItems = displayItems.slice(0, -1);

  if (remaining > 0) {
    return `${displayItems.join(', ')} and ${remaining} more`;
  }

  return `${otherItems.join(', ')} and ${lastItem}`;
}

/**
 * Format genres for display
 * @param genres - Array of genre strings
 * @param separator - Separator between genres
 * @returns Formatted genres string
 */
export function formatGenres(
  genres: string[] | null | undefined,
  separator: string = ' • '
): string {
  if (!genres || genres.length === 0) {
    return '';
  }

  return genres.join(separator);
}

// =============================================================================
// URL FORMATTERS
// =============================================================================

/**
 * Format a TMDb poster path to a full URL
 * @param posterPath - TMDb poster path
 * @param size - Image size (w92, w154, w185, w342, w500, w780, original)
 * @returns Full poster URL or placeholder
 */
export function formatPosterUrl(
  posterPath: string | null | undefined,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string {
  if (!posterPath) {
    return '/placeholder-poster.svg';
  }

  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

/**
 * Format a TMDb backdrop path to a full URL
 * @param backdropPath - TMDb backdrop path
 * @param size - Image size (w300, w780, w1280, original)
 * @returns Full backdrop URL or empty string
 */
export function formatBackdropUrl(
  backdropPath: string | null | undefined,
  size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
): string {
  if (!backdropPath) {
    return '';
  }

  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
}
