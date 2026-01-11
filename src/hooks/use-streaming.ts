/**
 * useStreaming Hook
 *
 * Custom React hook for handling Server-Sent Events (SSE) streaming
 * from the movie recommendations streaming API.
 * Handles connection, streaming states, error handling, and cleanup on unmount.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  UserInput,
  StreamRequest,
  MovieRecommendation,
  ErrorType,
  StreamEventType,
} from '@/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * State for the streaming hook
 */
export interface UseStreamingState {
  /** Accumulated text content from streaming */
  content: string;
  /** Movie recommendations received during streaming */
  movies: MovieRecommendation[];
  /** Whether streaming is currently in progress */
  isStreaming: boolean;
  /** Whether connected to the SSE endpoint */
  isConnected: boolean;
  /** Error information if streaming failed */
  error: StreamingError | null;
  /** Whether streaming has completed successfully */
  isComplete: boolean;
}

/**
 * Error object for streaming
 */
export interface StreamingError {
  type: ErrorType;
  message: string;
}

/**
 * Return value of the useStreaming hook
 */
export interface UseStreamingReturn extends UseStreamingState {
  /** Start streaming with the given user input */
  startStreaming: (input: UserInput) => void;
  /** Stop the current streaming connection */
  stopStreaming: () => void;
  /** Reset the hook state */
  reset: () => void;
}

/**
 * Options for the useStreaming hook
 */
export interface UseStreamingOptions {
  /** Base URL for the API (defaults to '') */
  baseUrl?: string;
  /** Callback when text content is received */
  onText?: (text: string) => void;
  /** Callback when a movie is received */
  onMovie?: (movie: MovieRecommendation) => void;
  /** Callback when streaming completes */
  onComplete?: () => void;
  /** Callback when an error occurs */
  onError?: (error: StreamingError) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const API_ENDPOINT = '/api/stream';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert UserInput to StreamRequest format
 */
export function convertToStreamRequest(input: UserInput): StreamRequest {
  const request: StreamRequest = {};

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
 * Parse SSE event data
 */
export function parseSSEEvent(eventType: string, data: string): {
  type: StreamEventType;
  payload: string | MovieRecommendation | StreamingError | null;
} {
  switch (eventType) {
    case 'text':
      return { type: 'text', payload: data };

    case 'movie':
      try {
        const movie = JSON.parse(data) as MovieRecommendation;
        return { type: 'movie', payload: movie };
      } catch {
        return { type: 'error', payload: { type: 'UNKNOWN_ERROR', message: 'Failed to parse movie data' } };
      }

    case 'done':
      return { type: 'done', payload: null };

    case 'error':
      try {
        const errorData = JSON.parse(data);
        return {
          type: 'error',
          payload: {
            type: errorData.errorType || 'STREAM_ERROR',
            message: errorData.message || 'Stream error occurred',
          } as StreamingError,
        };
      } catch {
        return {
          type: 'error',
          payload: { type: 'UNKNOWN_ERROR', message: data || 'Unknown stream error' },
        };
      }

    default:
      return { type: 'text', payload: data };
  }
}

/**
 * Create an EventSource-like connection using fetch for SSE with POST
 * Standard EventSource doesn't support POST requests
 */
export async function createSSEConnection(
  url: string,
  body: StreamRequest,
  callbacks: {
    onOpen?: () => void;
    onMessage?: (eventType: string, data: string) => void;
    onError?: (error: Error) => void;
    onClose?: () => void;
  },
  signal?: AbortSignal
): Promise<void> {
  try {
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    };

    if (signal) {
      fetchOptions.signal = signal;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // Try to parse error response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      throw new Error(`HTTP error ${response.status}`);
    }

    // Notify connection opened
    callbacks.onOpen?.();

    // Read the stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE messages from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let currentEventType = 'message';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
          } else if (line === '' && currentData) {
            // Empty line marks end of event
            callbacks.onMessage?.(currentEventType, currentData);
            currentEventType = 'message';
            currentData = '';
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    callbacks.onClose?.();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        // Intentional abort, not an error
        callbacks.onClose?.();
      } else {
        callbacks.onError?.(error);
      }
    } else {
      callbacks.onError?.(new Error('Unknown streaming error'));
    }
  }
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for streaming movie recommendations via SSE
 *
 * @example
 * ```tsx
 * const { content, movies, isStreaming, startStreaming, stopStreaming } = useStreaming();
 *
 * const handleSubmit = (input: UserInput) => {
 *   startStreaming(input);
 * };
 * ```
 */
export function useStreaming(
  options: UseStreamingOptions = {}
): UseStreamingReturn {
  const { baseUrl = '', onText, onMovie, onComplete, onError } = options;

  // State
  const [content, setContent] = useState('');
  const [movies, setMovies] = useState<MovieRecommendation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<StreamingError | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Track mounted state for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any ongoing connection on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Stop the current streaming connection
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isMountedRef.current) {
      setIsStreaming(false);
      setIsConnected(false);
    }
  }, []);

  /**
   * Start streaming with the given user input
   */
  const startStreaming = useCallback(
    (input: UserInput) => {
      // Stop any existing connection
      stopStreaming();

      // Reset state for new stream
      setContent('');
      setMovies([]);
      setError(null);
      setIsComplete(false);
      setIsStreaming(true);

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const url = `${baseUrl}${API_ENDPOINT}`;
      const request = convertToStreamRequest(input);

      createSSEConnection(
        url,
        request,
        {
          onOpen: () => {
            if (isMountedRef.current) {
              setIsConnected(true);
            }
          },
          onMessage: (eventType, data) => {
            if (!isMountedRef.current) return;

            const parsed = parseSSEEvent(eventType, data);

            switch (parsed.type) {
              case 'text':
                setContent((prev) => prev + (parsed.payload as string));
                onText?.(parsed.payload as string);
                break;

              case 'movie':
                const movie = parsed.payload as MovieRecommendation;
                setMovies((prev) => [...prev, movie]);
                onMovie?.(movie);
                break;

              case 'done':
                setIsComplete(true);
                setIsStreaming(false);
                setIsConnected(false);
                onComplete?.();
                break;

              case 'error':
                const streamError = parsed.payload as StreamingError;
                setError(streamError);
                setIsStreaming(false);
                setIsConnected(false);
                onError?.(streamError);
                break;
            }
          },
          onError: (err) => {
            if (!isMountedRef.current) return;

            const streamError: StreamingError = {
              type: 'NETWORK_ERROR',
              message: err.message || 'Connection failed',
            };
            setError(streamError);
            setIsStreaming(false);
            setIsConnected(false);
            onError?.(streamError);
          },
          onClose: () => {
            if (!isMountedRef.current) return;
            setIsConnected(false);
            // Only set streaming false if not already complete
            setIsStreaming((prev) => {
              if (prev) {
                return false;
              }
              return prev;
            });
          },
        },
        abortController.signal
      );
    },
    [baseUrl, stopStreaming, onText, onMovie, onComplete, onError]
  );

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    stopStreaming();
    setContent('');
    setMovies([]);
    setIsStreaming(false);
    setIsConnected(false);
    setError(null);
    setIsComplete(false);
  }, [stopStreaming]);

  return {
    content,
    movies,
    isStreaming,
    isConnected,
    error,
    isComplete,
    startStreaming,
    stopStreaming,
    reset,
  };
}

// Default export
export default useStreaming;
