/**
 * Production API Error Handler
 * Sanitizes error responses to hide internal details
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Common API errors
export const ApiErrors = {
  unauthorized: () => new ApiError('Authentication required', 401, 'UNAUTHORIZED'),
  forbidden: () => new ApiError('Access denied', 403, 'FORBIDDEN'),
  notFound: (resource?: string) => new ApiError(
    resource ? `${resource} not found` : 'Resource not found',
    404,
    'NOT_FOUND'
  ),
  badRequest: (message: string = 'Invalid request') => new ApiError(message, 400, 'BAD_REQUEST'),
  rateLimit: () => new ApiError('Rate limit exceeded', 429, 'RATE_LIMIT'),
  internal: () => new ApiError('Internal server error', 500, 'INTERNAL_ERROR'),
  serviceUnavailable: () => new ApiError('Service temporarily unavailable', 503, 'SERVICE_UNAVAILABLE'),
};

interface ErrorResponseBody {
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
  // Only in development
  debug?: {
    stack?: string;
    details?: any;
  };
}

/**
 * Handle API errors and return sanitized response
 */
export function handleApiError(
  error: unknown,
  context: string,
  userEmail?: string
): NextResponse {
  const requestLogger = logger.apiRequest(context, userEmail);
  
  // Handle known API errors
  if (error instanceof ApiError) {
    requestLogger.error(error.message, error);
    
    const body: ErrorResponseBody = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      }
    };
    
    // Add debug info in development only
    if (process.env.NODE_ENV !== 'production') {
      body.debug = { stack: error.stack };
    }
    
    return NextResponse.json(body, { status: error.statusCode });
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    requestLogger.error('Unexpected error', error);
    
    const body: ErrorResponseBody = {
      error: {
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred'
          : error.message,
        code: 'INTERNAL_ERROR',
        statusCode: 500
      }
    };
    
    if (process.env.NODE_ENV !== 'production') {
      body.debug = { 
        stack: error.stack,
        details: (error as any).cause || undefined
      };
    }
    
    return NextResponse.json(body, { status: 500 });
  }
  
  // Handle unknown errors
  requestLogger.error('Unknown error type', new Error(String(error)));
  
  return NextResponse.json({
    error: {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500
    }
  }, { status: 500 });
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler(
  handler: (request: Request) => Promise<NextResponse>,
  context: string
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}
