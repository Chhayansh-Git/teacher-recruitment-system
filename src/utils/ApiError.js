/**
 * ============================================================
 * FILE: src/utils/ApiError.js — Custom Error Class
 * ============================================================
 *
 * WHAT: A custom error class that adds HTTP status codes and
 *       error codes to JavaScript's built-in Error.
 *
 * WHY:  JavaScript's built-in Error class only has a "message".
 *       But for APIs, we also need:
 *       - An HTTP status code (400, 401, 403, 404, 409, 500)
 *       - A machine-readable error code ('CANDIDATE_IN_PIPELINE')
 *       - Whether the error is "operational" (expected, like "wrong password")
 *         or "programmer error" (unexpected, like a bug in our code)
 *
 * HOW IT WORKS:
 *       When something goes wrong in a controller or service, we throw
 *       an ApiError. The global error handler (errorHandler.js) catches
 *       it and sends the right response to the client.
 *
 * EXAMPLE:
 *       // In a controller:
 *       if (!user) {
 *         throw new ApiError(404, 'User not found', 'NOT_FOUND');
 *       }
 *
 *       // The error handler turns this into:
 *       // HTTP 404
 *       // {
 *       //   "success": false,
 *       //   "error": {
 *       //     "code": "NOT_FOUND",
 *       //     "message": "User not found",
 *       //     "httpStatus": 404
 *       //   }
 *       // }
 * ============================================================
 */

/**
 * ApiError extends Error.
 *
 * In JavaScript, "extends" means "inherits from". ApiError IS an Error,
 * but with extra properties. You can throw it, catch it, and check
 * "instanceof ApiError" to see if it's one of ours.
 *
 * "class" is a blueprint for creating objects. Think of it like a cookie
 * cutter — you define the shape once, and every new ApiError() gets
 * the same shape but with different values.
 */
class ApiError extends Error {
  /**
   * Constructor — runs when you do: new ApiError(404, 'Not found', 'NOT_FOUND')
   *
   * @param {number} statusCode  — HTTP status code (400, 401, 403, 404, 409, 500)
   * @param {string} message     — Human-readable error message
   * @param {string} errorCode   — Machine-readable code (used by frontend to show specific messages)
   * @param {boolean} isOperational — Is this an expected error? (default: true)
   *
   * "Operational" means the error is expected and handled:
   *   - User enters wrong password → operational
   *   - Database query fails due to network → operational
   *   - TypeError because of a bug → NOT operational (programmer error)
   */
  constructor(statusCode, message, errorCode = 'INTERNAL_ERROR', isOperational = true) {
    // super() calls the parent class (Error) constructor.
    // This sets the .message property and creates the stack trace.
    super(message);

    // Custom properties that Error doesn't have:
    this.statusCode = statusCode; // 400, 401, 403, etc.
    this.errorCode = errorCode; // 'CANDIDATE_IN_PIPELINE', etc.
    this.isOperational = isOperational; // Expected error?

    // This line fixes a JavaScript quirk: when you extend a built-in
    // class (like Error), the prototype chain can break in older
    // environments. This line ensures "instanceof ApiError" works correctly.
    Object.setPrototypeOf(this, ApiError.prototype);

    // Capture the stack trace (where the error was thrown).
    // The second argument tells JavaScript to start the trace from
    // this constructor, not from inside the Error class itself.
    // This makes the error's location more useful for debugging.
    Error.captureStackTrace(this, this.constructor);
  }
}

// --- Convenience factory methods ---
// These are shortcuts so you don't have to memorize HTTP codes.
// Instead of: new ApiError(400, 'Bad request')
// You write:  ApiError.badRequest('Bad request')

/**
 * 400 Bad Request — The request data is invalid.
 * Example: Missing required field, wrong format, etc.
 */
ApiError.badRequest = (message, errorCode = 'VALIDATION_ERROR') => {
  return new ApiError(400, message, errorCode);
};

/**
 * 401 Unauthorized — The user is NOT logged in (no token or expired token).
 * Note: "Unauthorized" in HTTP actually means "Unauthenticated".
 */
ApiError.unauthorized = (message = 'Authentication required', errorCode = 'AUTHENTICATION_ERROR') => {
  return new ApiError(401, message, errorCode);
};

/**
 * 403 Forbidden — The user IS logged in, but doesn't have PERMISSION.
 * Example: A school trying to access admin-only endpoints.
 */
ApiError.forbidden = (message = 'Access denied', errorCode = 'AUTHORIZATION_ERROR') => {
  return new ApiError(403, message, errorCode);
};

/**
 * 404 Not Found — The requested resource doesn't exist.
 */
ApiError.notFound = (message = 'Resource not found', errorCode = 'NOT_FOUND') => {
  return new ApiError(404, message, errorCode);
};

/**
 * 409 Conflict — Business logic conflict.
 * Example: Candidate already in a pipeline, duplicate shortlist.
 */
ApiError.conflict = (message, errorCode = 'CONFLICT') => {
  return new ApiError(409, message, errorCode);
};

/**
 * 429 Too Many Requests — Rate limit exceeded.
 */
ApiError.tooManyRequests = (message = 'Too many requests. Please try again later.', errorCode = 'RATE_LIMITED') => {
  return new ApiError(429, message, errorCode);
};

/**
 * 500 Internal Server Error — Something broke on OUR side.
 * isOperational is false because this is unexpected.
 */
ApiError.internal = (message = 'Something went wrong', errorCode = 'INTERNAL_ERROR') => {
  return new ApiError(500, message, errorCode, false);
};

module.exports = ApiError;
