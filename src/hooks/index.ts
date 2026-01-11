/**
 * Custom Hooks
 *
 * This file exports all custom hooks for the application.
 */

// Recommendations hook
export {
  useRecommendations,
  convertToRequest,
  isErrorResponse,
  type UseRecommendationsState,
  type UseRecommendationsReturn,
  type UseRecommendationsOptions,
  type RecommendationsError,
} from './use-recommendations';

// Streaming hook
export {
  useStreaming,
  convertToStreamRequest,
  parseSSEEvent,
  createSSEConnection,
  type UseStreamingState,
  type UseStreamingReturn,
  type UseStreamingOptions,
  type StreamingError,
} from './use-streaming';
