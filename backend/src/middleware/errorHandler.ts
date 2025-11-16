import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from 'http-errors';

/**
 * Standardized error response format
 */
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
  };
}

/**
 * Format Zod error into human-readable message
 * Returns the first error with path and issue
 */
function formatZodError(error: ZodError): string {
  const issues = error.issues;
  const firstError = issues[0];
  if (!firstError) {
    return 'Validation failed';
  }

  const path = firstError.path.length > 0 ? firstError.path.join('.') : 'root';
  const message = firstError.message;
  
  return `Validation failed at '${path}': ${message}`;
}

/**
 * Central error handling middleware
 * Returns standardized JSON error responses
 * 
 * Error handling strategy:
 * - ZodError: 400 with formatted validation message
 * - HttpError (from http-errors): uses its status code and message
 * - Generic Error: 500 with safe message (hides details in production)
 * 
 * @example
 * ```ts
 * // In index.ts
 * app.use(errorHandler);
 * ```
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = formatZodError(err);
    code = 'VALIDATION_ERROR';
  }
  // Handle http-errors (from http-errors package or our validate middleware)
  else if ('status' in err && typeof (err as any).status === 'number') {
    const httpError = err as HttpError;
    statusCode = httpError.status;
    message = httpError.message;
    code = httpError.name !== 'Error' ? httpError.name : undefined;
  }
  // Handle generic errors
  else {
    // In production, hide internal error details
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal server error';
    } else {
      // In development, show the actual error message
      message = err.message || 'Internal server error';
    }
    code = 'INTERNAL_ERROR';
  }

  // Log error for debugging (in production, this would go to a logging service)
  if (statusCode >= 500) {
    console.error('Error:', err);
  }

  // Send standardized error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      ...(code && { code }),
    },
  };

  res.status(statusCode).json(errorResponse);
}
