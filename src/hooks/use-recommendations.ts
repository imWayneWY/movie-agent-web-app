/**
 * useRecommendations Hook
 *
 * Custom React hook for fetching movie recommendations from the API.
 * Handles loading states, error handling, and success flow.
 */

import { useState, useCallback } from 'react';
import type {
  UserInput,
  RecommendRequest,
  RecommendResponse,
  MovieRecommendation,
  ErrorResponse,
  ErrorType,
} from '@/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * State for the recommendations hook
 */
export interface UseRecommendationsState {
  /** Movie recommendations from the API */
  recommendations: MovieRecommendation[];
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Error information if request failed */
  error: RecommendationsError | null;
  /** Metadata from the last successful response */
  metadata: RecommendResponse['metadata'] | null;
}

/**
 * Error object for recommendations
 */
export interface RecommendationsError {
  type: ErrorType;
  message: string;
  retryAfter?: number | undefined;
}

/**
 * Return value of the useRecommendations hook
 */
export interface UseRecommendationsReturn extends UseRecommendationsState {
  /** Fetch recommendations with the given user input */
  fetchRecommendations: (input: UserInput) => Promise<void>;
  /** Clear current recommendations and error */
  reset: () => void;
}

/**
 * Options for the useRecommendations hook
 */
export interface UseRecommendationsOptions {
  /** Base URL for the API (defaults to '') */
  baseUrl?: string;
  /** AbortController signal for request cancellation */
  signal?: AbortSignal;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const API_ENDPOINT = '/api/recommend';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert UserInput to RecommendRequest format
 */
export function convertToRequest(input: UserInput): RecommendRequest {
  const request: RecommendRequest = {};

  if (input.mood) {
    request.mood = input.mood;
  }

  if (input.genres && input.genres.length > 0) {
    request.genres = input.genres;
  }

  if (input.platforms && input.platforms.length > 0) {
    request.platforms = input.platforms;
  }

  if (input.runtime) {
    request.runtime = input.runtime;
  }

  if (input.releaseYear) {
    request.releaseYear = input.releaseYear;
  }

  return request;
}

/**
 * Check if a response is an error response
 */
export function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    (data as ErrorResponse).error === true
  );
}

/**
 * Parse error from response
 */
function parseError(data: unknown): RecommendationsError {
  if (isErrorResponse(data)) {
    return {
      type: data.errorType,
      message: data.message,
      retryAfter: data.retryAfter,
    };
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
}

/**
 * Create a timeout-able fetch with AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for fetching movie recommendations
 *
 * @example
 * ```tsx
 * const { recommendations, isLoading, error, fetchRecommendations } = useRecommendations();
 *
 * const handleSubmit = async (input: UserInput) => {
 *   await fetchRecommendations(input);
 * };
 * ```
 */
export function useRecommendations(
  options: UseRecommendationsOptions = {}
): UseRecommendationsReturn {
  const { baseUrl = '' } = options;

  // State
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RecommendationsError | null>(null);
  const [metadata, setMetadata] = useState<RecommendResponse['metadata'] | null>(null);

  /**
   * Fetch recommendations from the API
   */
  const fetchRecommendations = useCallback(
    async (input: UserInput): Promise<void> => {
      // Reset error state
      setError(null);
      setIsLoading(true);

      try {
        const request = convertToRequest(input);
        const url = `${baseUrl}${API_ENDPOINT}`;

        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          ...(options.signal && { signal: options.signal }),
        });

        const data = await response.json();

        // Check for error response
        if (!response.ok || isErrorResponse(data)) {
          const parsedError = parseError(data);
          setError(parsedError);
          setRecommendations([]);
          setMetadata(null);
          return;
        }

        // Success response
        const successData = data as RecommendResponse;
        setRecommendations(successData.recommendations);
        setMetadata(successData.metadata);
      } catch (err) {
        // Handle network errors, timeouts, and aborts
        let errorType: ErrorType = 'NETWORK_ERROR';
        let message = 'Failed to fetch recommendations';

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorType = 'TIMEOUT_ERROR';
            message = 'Request was cancelled or timed out';
          } else {
            message = err.message;
          }
        }

        setError({ type: errorType, message });
        setRecommendations([]);
        setMetadata(null);
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl, options.signal]
  );

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setRecommendations([]);
    setIsLoading(false);
    setError(null);
    setMetadata(null);
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    metadata,
    fetchRecommendations,
    reset,
  };
}

// Default export
export default useRecommendations;
