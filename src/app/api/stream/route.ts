/**
 * POST /api/stream
 *
 * Streaming movie recommendations endpoint using Server-Sent Events (SSE)
 * Returns streaming text and movie recommendations in real-time
 */

import { NextRequest } from 'next/server';
import type { StreamRequest, AgentRequest, StreamEventType } from '@/types';
import { MovieAgentService } from '@/services';
import { rateLimiters } from '@/middleware';
import { parseJsonBody, errorResponseFromError, validationErrorResponse } from '@/lib/api-helpers';
import { validateStreamRequest } from '@/lib/validators';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Use standard rate limiter (100 requests per minute)
const rateLimiter = rateLimiters.standard;

// Create movie agent service instance
const movieAgentService = new MovieAgentService();

// SSE Headers for streaming responses
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no', // Disable nginx buffering
};

// =============================================================================
// STREAM EVENT HELPERS
// =============================================================================

/**
 * Format data for SSE (Server-Sent Events)
 */
function formatSSEMessage(eventType: StreamEventType, data: unknown): string {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return `event: ${eventType}\ndata: ${dataString}\n\n`;
}

/**
 * Create an SSE error message
 */
function formatSSEError(message: string, errorType: string = 'STREAM_ERROR'): string {
  return formatSSEMessage('error', { error: true, errorType, message });
}

/**
 * Create an SSE done message
 */
function formatSSEDone(): string {
  return formatSSEMessage('done', null);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert StreamRequest to AgentRequest
 */
function convertToAgentRequest(request: StreamRequest): AgentRequest {
  const agentRequest: AgentRequest = {};

  // Mood - pass as-is
  if (request.mood) {
    agentRequest.mood = request.mood as any;
  }

  // Genres - handle string or array
  if (request.genres) {
    if (typeof request.genres === 'string') {
      agentRequest.genres = request.genres
        .split(',')
        .map((g: string) => g.trim())
        .filter(Boolean) as any[];
    } else {
      agentRequest.genres = request.genres as any[];
    }
  }

  // Platforms - pass array as-is
  if (request.platforms) {
    agentRequest.platforms = request.platforms as any[];
  }

  // Runtime - pass object as-is
  if (request.runtime) {
    agentRequest.runtime = request.runtime;
  }

  // Release year - handle number or object
  if (request.releaseYear !== undefined) {
    if (typeof request.releaseYear === 'number') {
      agentRequest.releaseYear = {
        from: request.releaseYear,
        to: request.releaseYear,
      };
    } else {
      agentRequest.releaseYear = request.releaseYear;
    }
  }

  return agentRequest;
}

// =============================================================================
// STREAM CONTROLLER
// =============================================================================

/**
 * Create a streaming response with proper cleanup
 */
async function createStreamingResponse(
  agentRequest: AgentRequest,
  abortSignal: AbortSignal
): Promise<Response> {
  let isAborted = false;
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;

  // Track abort state
  const onAbort = () => {
    isAborted = true;
    logger.info('Stream connection aborted by client');
    if (streamController) {
      try {
        streamController.close();
      } catch {
        // Stream may already be closed
      }
    }
  };

  abortSignal.addEventListener('abort', onAbort);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      streamController = controller;
      const encoder = new TextEncoder();

      try {
        // Check if already aborted
        if (isAborted) {
          controller.close();
          return;
        }

        // Get streaming recommendations
        const streamGenerator = movieAgentService.getRecommendationsStream(agentRequest);

        for await (const event of streamGenerator) {
          // Check abort state before each write
          if (isAborted) {
            break;
          }

          const message = formatSSEMessage(event.type, event.data);
          controller.enqueue(encoder.encode(message));
        }

        // Send done event if not aborted
        if (!isAborted) {
          controller.enqueue(encoder.encode(formatSSEDone()));
        }
      } catch (error) {
        if (!isAborted) {
          logger.error('Error during streaming', error instanceof Error ? error : new Error(String(error)));
          
          const appError = error instanceof AppError 
            ? error 
            : new AppError(
                error instanceof Error ? error.message : 'Streaming error',
                'AGENT_ERROR'
              );
          
          const errorMessage = formatSSEError(appError.message, appError.errorType);
          controller.enqueue(encoder.encode(errorMessage));
        }
      } finally {
        // Cleanup
        abortSignal.removeEventListener('abort', onAbort);
        
        if (!isAborted) {
          try {
            controller.close();
          } catch {
            // Stream may already be closed
          }
        }
      }
    },

    cancel() {
      // Called when the stream is cancelled by the client
      isAborted = true;
      logger.info('Stream cancelled by client');
    },
  });

  return new Response(stream, {
    status: 200,
    headers: SSE_HEADERS,
  });
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

/**
 * POST /api/stream
 *
 * Request body:
 * {
 *   mood?: string;
 *   genres?: string | string[];
 *   platforms?: string[];
 *   runtime?: { min?: number; max?: number };
 *   releaseYear?: number | { from?: number; to?: number };
 * }
 *
 * Response: Server-Sent Events stream
 * Events:
 * - text: { type: 'text', data: string } - Streaming text content
 * - movie: { type: 'movie', data: MovieRecommendation } - Individual movie
 * - done: { type: 'done', data: null } - Stream complete
 * - error: { type: 'error', data: ErrorResponse } - Error occurred
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Apply rate limiting
    const limitResult = rateLimiter(request);
    if (limitResult) {
      logger.warn('Rate limit exceeded for stream request', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return limitResult;
    }

    // Parse request body
    const [body, parseError] = await parseJsonBody<unknown>(request);
    if (parseError) {
      logger.error('Failed to parse stream request body', parseError);
      return errorResponseFromError(parseError);
    }

    // Validate and sanitize request
    const validatedRequest = validateStreamRequest(body);

    // Check if at least one parameter is provided
    const hasParams =
      validatedRequest.mood ||
      validatedRequest.genres ||
      validatedRequest.platforms ||
      validatedRequest.runtime ||
      validatedRequest.releaseYear !== undefined;

    if (!hasParams) {
      logger.warn('No valid parameters provided in stream request');
      return validationErrorResponse(
        'At least one parameter (mood, genres, platforms, runtime, or releaseYear) must be provided'
      );
    }

    // Convert to agent request format
    const agentRequest = convertToAgentRequest(validatedRequest);

    logger.info('Processing stream request', {
      mood: agentRequest.mood,
      genresCount: agentRequest.genres?.length || 0,
      platformsCount: agentRequest.platforms?.length || 0,
      hasRuntime: !!agentRequest.runtime,
      hasReleaseYear: !!agentRequest.releaseYear,
    });

    // Create abort signal for connection cleanup
    const abortController = new AbortController();
    
    // Listen for client disconnect (Next.js doesn't have direct disconnect detection,
    // but the stream cancel() method will be called when the client disconnects)
    if (request.signal) {
      request.signal.addEventListener('abort', () => {
        abortController.abort();
      });
    }

    // Create and return streaming response
    return createStreamingResponse(agentRequest, abortController.signal);
  } catch (error) {
    logger.error('Error processing stream request', error instanceof Error ? error : new Error(String(error)));
    return errorResponseFromError(error);
  }
}
