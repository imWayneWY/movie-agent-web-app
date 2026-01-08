/**
 * POST /api/recommend
 *
 * Structured movie recommendations endpoint
 * Returns JSON array of movie recommendations based on user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import type { RecommendRequest, RecommendResponse, AgentRequest } from '@/types';
import { MovieAgentService } from '@/services';
import { rateLimiters } from '@/middleware';
import {
  parseJsonBody,
  successResponse,
  errorResponseFromError,
  validationErrorResponse,
} from '@/lib/api-helpers';
import { validateRecommendRequest } from '@/lib/validators';
import { logger } from '@/lib/logger';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Use standard rate limiter (100 requests per minute)
const rateLimiter = rateLimiters.standard;

// Create movie agent service instance
const movieAgentService = new MovieAgentService();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert RecommendRequest to AgentRequest
 */
function convertToAgentRequest(request: RecommendRequest): AgentRequest {
  const agentRequest: AgentRequest = {};

  // Mood - pass as-is
  if (request.mood) {
    // Note: validator ensures this is a valid mood string
    agentRequest.mood = request.mood as any;
  }

  // Genres - handle string or array
  if (request.genres) {
    if (typeof request.genres === 'string') {
      // Split comma-separated string
      agentRequest.genres = request.genres
        .split(',')
        .map((g) => g.trim())
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
      // Convert single year to range
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

/**
 * Build response metadata
 */
function buildMetadata(
  inputRequest: RecommendRequest,
  totalResults: number,
  processingTimeMs: number
): RecommendResponse['metadata'] {
  return {
    timestamp: new Date().toISOString(),
    inputParameters: inputRequest,
    totalResults,
    processingTimeMs,
  };
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

/**
 * POST /api/recommend
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
 * Response:
 * {
 *   recommendations: MovieRecommendation[];
 *   metadata: {
 *     timestamp: string;
 *     inputParameters: RecommendRequest;
 *     totalResults: number;
 *     processingTimeMs?: number;
 *   }
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Apply rate limiting
    const limitResult = rateLimiter(request);
    if (limitResult) {
      logger.warn('Rate limit exceeded', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return limitResult;
    }

    // Parse request body
    const [body, parseError] = await parseJsonBody<unknown>(request);
    if (parseError) {
      logger.error('Failed to parse request body', parseError);
      return errorResponseFromError(parseError);
    }

    // Validate and sanitize request
    const validatedRequest = validateRecommendRequest(body);

    // Check if at least one parameter is provided
    const hasParams =
      validatedRequest.mood ||
      validatedRequest.genres ||
      validatedRequest.platforms ||
      validatedRequest.runtime ||
      validatedRequest.releaseYear !== undefined;

    if (!hasParams) {
      logger.warn('No valid parameters provided in request');
      return validationErrorResponse(
        'At least one parameter (mood, genres, platforms, runtime, or releaseYear) must be provided'
      );
    }

    // Convert to agent request format
    const agentRequest = convertToAgentRequest(validatedRequest);

    logger.info('Processing recommendation request', {
      mood: agentRequest.mood,
      genresCount: agentRequest.genres?.length || 0,
      platformsCount: agentRequest.platforms?.length || 0,
      hasRuntime: !!agentRequest.runtime,
      hasReleaseYear: !!agentRequest.releaseYear,
    });

    // Call movie agent service
    const agentResponse = await movieAgentService.getRecommendations(
      agentRequest
    );

    // Calculate processing time
    const processingTimeMs = Date.now() - startTime;

    // Build response
    const response: RecommendResponse = {
      recommendations: agentResponse.recommendations,
      metadata: buildMetadata(
        validatedRequest,
        agentResponse.recommendations.length,
        processingTimeMs
      ),
    };

    logger.info('Successfully generated recommendations', {
      count: response.recommendations.length,
      processingTimeMs,
    });

    return successResponse(response);
  } catch (error) {
    logger.error('Error processing recommendation request', error instanceof Error ? error : new Error(String(error)));

    return errorResponseFromError(error);
  }
}
