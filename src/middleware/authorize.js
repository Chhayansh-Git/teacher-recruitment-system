/**
 * ============================================================
 * FILE: src/middleware/authorize.js — Role-Based Access Control
 * ============================================================
 *
 * WHAT: Checks if the authenticated user has the RIGHT ROLE
 *       to access a specific endpoint.
 *
 * WHY:  authenticate.js checks "ARE you logged in?"
 *       authorize.js checks "Do you have PERMISSION?"
 *
 *       Example:
 *       - POST /admin/pipelines/push → Only ADMIN can push candidates
 *       - GET /schools/profile → Only SCHOOL can view their profile
 *       - GET /admin/candidates → Only ADMIN can list all candidates
 *
 * HOW:  authorize() is a "factory function" — it creates middleware.
 *       You call it with the allowed roles, and it returns a middleware
 *       function that checks if req.user.role is in that list.
 *
 * USAGE IN ROUTES:
 *       // Only admins:
 *       router.post('/push', authenticate, authorize('ADMIN'), pushController);
 *
 *       // Admins and schools:
 *       router.get('/data', authenticate, authorize('ADMIN', 'SCHOOL'), dataController);
 *
 * WHAT IS A FACTORY FUNCTION?
 *       A function that CREATES and RETURNS another function.
 *
 *       authorize('ADMIN') doesn't check roles — it CREATES a middleware
 *       function that checks roles. It's like a cookie cutter factory:
 *       - authorize('ADMIN') creates a cutter shaped for admins only
 *       - authorize('SCHOOL', 'CANDIDATE') creates one for both roles
 *
 *       This is possible because of "closures" — the inner function
 *       remembers the variables from the outer function (the roles array).
 * ============================================================
 */

const ApiError = require('../utils/ApiError');

/**
 * authorize — Creates a middleware that restricts access to specific roles.
 *
 * @param  {...string} allowedRoles — The roles that are allowed (e.g., 'ADMIN', 'SCHOOL')
 * @returns {Function} — A middleware function
 *
 * The ...allowedRoles syntax is called "rest parameters."
 * It collects all arguments into an array:
 * authorize('ADMIN', 'SCHOOL') → allowedRoles = ['ADMIN', 'SCHOOL']
 */
const authorize = (...allowedRoles) => {
  // This is the actual middleware function that Express calls.
  // It "closes over" the allowedRoles variable from above.
  return (req, res, next) => {
    // --- Safety check: authenticate must run before authorize ---
    // If req.user doesn't exist, authenticate middleware wasn't used
    // or the user wasn't logged in.
    if (!req.user) {
      return next(
        ApiError.unauthorized('Please log in to access this resource.')
      );
    }

    // --- Check if user's role is in the allowed list ---
    // .includes() checks if an array contains a specific value:
    // ['ADMIN', 'SCHOOL'].includes('SCHOOL') → true
    // ['ADMIN', 'SCHOOL'].includes('CANDIDATE') → false
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. This resource requires one of these roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    // User has the right role → proceed to the next middleware/controller
    next();
  };
};

module.exports = authorize;
