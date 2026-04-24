/**
 * ============================================================
 * FILE: src/utils/ApiResponse.js — Standardized API Response
 * ============================================================
 *
 * WHAT: Helper functions to create consistent JSON responses.
 *       Every API endpoint returns the same structure.
 *
 * WHY:  Without this, different developers might return data in
 *       different formats:
 *       - One returns: { user: {...} }
 *       - Another returns: { data: { user: {...} }, status: 'ok' }
 *       - A third returns: { result: {...}, code: 200 }
 *
 *       The frontend has no idea what to expect! With standardized
 *       responses, the frontend always knows the shape:
 *
 *       SUCCESS: { success: true, data: {...}, meta: {...} }
 *       ERROR:   { success: false, error: { code, message, httpStatus } }
 *
 * HOW:  In controllers, use:
 *       res.status(200).json(ApiResponse.success(data, 'User found'));
 *       res.status(200).json(ApiResponse.paginated(data, page, limit, total));
 * ============================================================
 */

class ApiResponse {
  /**
   * Success response — used when the operation worked.
   *
   * @param {any}    data    — The actual data (user object, list of schools, etc.)
   * @param {string} message — Optional success message
   * @returns {object} — Formatted response object
   *
   * EXAMPLE OUTPUT:
   * {
   *   "success": true,
   *   "data": { "id": "abc", "name": "Delhi Public School" },
   *   "message": "School created successfully"
   * }
   */
  static success(data, message = 'Success') {
    return {
      success: true,
      data,
      message,
    };
  }

  /**
   * Paginated response — used for list endpoints that return many items.
   *
   * Pagination means "split a large list into pages".
   * If you have 500 candidates, you don't send all 500 at once.
   * You send 20 per page, and the frontend requests page 1, 2, 3, etc.
   *
   * @param {Array}  data  — Array of items for this page
   * @param {number} page  — Current page number (1-indexed)
   * @param {number} limit — Items per page
   * @param {number} total — Total items across ALL pages
   * @returns {object} — Formatted response with pagination metadata
   *
   * EXAMPLE OUTPUT:
   * {
   *   "success": true,
   *   "data": [ {...}, {...}, {...} ],
   *   "meta": {
   *     "page": 2,
   *     "limit": 20,
   *     "total": 347,
   *     "totalPages": 18,
   *     "hasNext": true,
   *     "hasPrev": true
   *   }
   * }
   */
  static paginated(data, page, limit, total) {
    // Math.ceil rounds UP: ceil(347/20) = ceil(17.35) = 18 pages
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      meta: {
        page, // Current page number
        limit, // How many items per page
        total, // Total items in the database
        totalPages, // How many pages exist
        hasNext: page < totalPages, // Is there a next page?
        hasPrev: page > 1, // Is there a previous page?
      },
    };
  }

  /**
   * Error response — used when something goes wrong.
   *
   * This is called by the global error handler (errorHandler.js).
   * You usually DON'T call this directly — throw an ApiError instead,
   * and the error handler will format it using this method.
   *
   * @param {string} message   — Human-readable error message
   * @param {string} errorCode — Machine-readable code
   * @param {number} httpStatus — HTTP status code
   * @returns {object} — Formatted error response
   *
   * EXAMPLE OUTPUT:
   * {
   *   "success": false,
   *   "error": {
   *     "code": "CANDIDATE_IN_PIPELINE",
   *     "message": "Candidate is currently in an active pipeline",
   *     "httpStatus": 409
   *   }
   * }
   */
  static error(message, errorCode = 'INTERNAL_ERROR', httpStatus = 500) {
    return {
      success: false,
      error: {
        code: errorCode,
        message,
        httpStatus,
      },
    };
  }
}

module.exports = ApiResponse;
