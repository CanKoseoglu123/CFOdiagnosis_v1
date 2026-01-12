/**
 * VS-Security: Error Handling Utility
 *
 * Prevents information leakage by logging errors internally while
 * returning generic messages to clients.
 */

import { Response } from 'express';

/**
 * Generic error messages for different error categories
 */
const GENERIC_ERRORS = {
  database: 'Database operation failed',
  validation: 'Invalid request data',
  auth: 'Authentication failed',
  forbidden: 'Access denied',
  notFound: 'Resource not found',
  internal: 'An unexpected error occurred',
} as const;

type ErrorCategory = keyof typeof GENERIC_ERRORS;

/**
 * Logs error details internally and returns a generic message to the client.
 * Use this for Supabase and other database errors to prevent schema leakage.
 *
 * @param res Express response object
 * @param error The actual error object
 * @param category Error category for generic message selection
 * @param context Additional context for logging
 * @param statusCode HTTP status code (default 500)
 */
export function handleError(
  res: Response,
  error: unknown,
  category: ErrorCategory = 'internal',
  context?: string,
  statusCode: number = 500
): Response {
  // Log full error details for debugging
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[ERROR] ${context || 'Unknown context'}:`, {
    message: errorMessage,
    stack: errorStack,
    category,
    timestamp: new Date().toISOString(),
  });

  // Return generic message to client
  return res.status(statusCode).json({
    error: GENERIC_ERRORS[category],
    // Include a correlation ID in production for support tickets
    // requestId: res.locals.requestId,
  });
}

/**
 * Handle database/Supabase errors
 */
export function handleDatabaseError(
  res: Response,
  error: unknown,
  context?: string
): Response {
  return handleError(res, error, 'database', context, 500);
}

/**
 * Handle validation errors - these can include more detail since they're user-facing
 */
export function handleValidationError(
  res: Response,
  message: string
): Response {
  return res.status(400).json({ error: message });
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(
  res: Response,
  resource: string = 'Resource'
): Response {
  return res.status(404).json({ error: `${resource} not found` });
}
