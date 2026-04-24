/**
 * ============================================================
 * FILE: src/middleware/errorHandler.js — Global Error Handler
 * ============================================================
 *
 * WHAT: The LAST middleware in the chain. Every error thrown anywhere
 *       in the app eventually lands here. It sends a clean, consistent
 *       JSON error response to the client.
 *
 * WHY CENTRALIZED?
 *       Without this, each route would need its own try/catch with
 *       its own error formatting. A central handler means:
 *       1. Consistent error format (the frontend always knows what to expect)
 *       2. No error leaks (we never accidentally send stack traces to users)
 *       3. Logging in one place (every error gets logged)
 *
 * HOW EXPRESS ERROR HANDLING WORKS:
 *       Normal middleware: (req, res, next) → 3 parameters
 *       Error middleware:  (err, req, res, next) → 4 parameters
 *
 *       Express sees 4 parameters and knows "this is an error handler."
 *       When any middleware calls next(error) or throws an error,
 *       Express skips all normal middleware and jumps to this one.
 *
 * SECURITY RULE FROM TDD:
 *       "Never expose stack traces, SQL errors, or internal paths
 *        in error responses."
 *       In development, we include the stack trace for debugging.
 *       In production, we hide it completely.
 * ============================================================
 */

const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * The error handler middleware.
 *
 * @param {Error} err  — The error that was thrown/passed
 * @param {Request} req  — The Express request object
 * @param {Response} res  — The Express response object
 * @param {Function} next — The next middleware (required even if unused — Express
 *                          identifies error handlers by their 4 parameters)
 */
const errorHandler = (err, req, res, next) => {
  // --- Step 1: Log the error ---
  // We always log the full error (including stack trace) on the SERVER.
  // The server logs are private — only developers see them.
  logger.error(`${err.message}`, {
    errorCode: err.errorCode || 'UNKNOWN',
    statusCode: err.statusCode || 500,
    path: req.originalUrl,
    method: req.method,
    // Only log stack trace in development (it's very verbose)
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });

  // --- Step 2: Determine if this is an operational error ---
  if (err instanceof ApiError) {
    // It's one of OUR custom errors (thrown intentionally).
    // Send the exact status code and message we intended.
    return res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.errorCode, err.statusCode)
    );
  }

  // --- Step 3: Handle known library errors ---

  // Prisma errors (database query failures)
  if (err.code === 'P2002') {
    // P2002 = Unique constraint violation
    // Example: trying to register with an email that already exists
    return res.status(409).json(
      ApiResponse.error(
        'A record with this information already exists.',
        'DUPLICATE_ENTRY',
        409
      )
    );
  }

  if (err.code === 'P2025') {
    // P2025 = Record not found
    return res.status(404).json(
      ApiResponse.error('The requested resource was not found.', 'NOT_FOUND', 404)
    );
  }

  // JSON parsing errors (malformed request body)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(
      ApiResponse.error(
        'Invalid JSON in request body. Please check your request format.',
        'INVALID_JSON',
        400
      )
    );
  }

  // Payload too large (file/body exceeds 10MB limit)
  if (err.type === 'entity.too.large') {
    return res.status(413).json(
      ApiResponse.error(
        'Request body is too large. Maximum size is 10MB.',
        'PAYLOAD_TOO_LARGE',
        413
      )
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      ApiResponse.error('Invalid token. Please log in again.', 'INVALID_TOKEN', 401)
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      ApiResponse.error('Token has expired. Please refresh your session.', 'TOKEN_EXPIRED', 401)
    );
  }

  // --- Step 4: Unknown error (bug in our code) ---
  // This is the "catch-all." If we reach here, something unexpected happened.
  // In PRODUCTION: send a generic message (never expose internal details).
  // In DEVELOPMENT: include the actual error message for debugging.

  const message =
    config.nodeEnv === 'development'
      ? err.message // Show real error in development
      : 'Something went wrong. Please try again later.'; // Hide in production

  return res.status(500).json(
    ApiResponse.error(message, 'INTERNAL_ERROR', 500)
  );
};

module.exports = errorHandler;
