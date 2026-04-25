/**
 * ============================================================
 * FILE: src/middleware/validate.js — Request Validation Middleware
 * ============================================================
 *
 * WHAT: Validates incoming request data (body, query params, URL params)
 *       against a Zod schema before it reaches the controller.
 *
 * WHY:  NEVER TRUST CLIENT DATA. Users (or attackers) can send anything:
 *       - An email field with "DROP TABLE users;"
 *       - A phone number with letters in it
 *       - A missing required field
 *       - An extra field that shouldn't exist
 *
 *       Validation catches all of this BEFORE the data touches our
 *       business logic or database.
 *
 * WHAT IS ZOD?
 *       Zod is a schema validation library. You define a "schema" (blueprint)
 *       that describes what valid data looks like:
 *
 *       const schema = z.object({
 *         email: z.string().email(),          // Must be a valid email
 *         password: z.string().min(8),        // Must be at least 8 characters
 *         age: z.number().positive().optional() // Optional positive number
 *       });
 *
 *       Then you validate data against it:
 *       schema.parse({ email: "test@test.com", password: "12345678" }) → ✅
 *       schema.parse({ email: "not-email", password: "123" }) → ❌ throws error
 *
 * HOW THIS MIDDLEWARE WORKS:
 *       1. You define a Zod schema in validators/ folder
 *       2. You pass the schema to validate() in your route definition
 *       3. validate() creates middleware that checks req.body/query/params
 *       4. If valid → continues to controller
 *       5. If invalid → sends 400 error with details about what's wrong
 *
 * USAGE IN ROUTES:
 *       const { registerSchema } = require('../validators/auth.validator');
 *       router.post('/register', validate(registerSchema), authController.register);
 * ============================================================
 */

const ApiError = require('../utils/ApiError');

/**
 * validate — Factory function that creates validation middleware.
 *
 * @param {Object} schema — An object with optional body, query, params Zod schemas
 * @returns {Function} — Express middleware function
 *
 * The schema parameter looks like:
 * {
 *   body: z.object({ email: z.string().email(), ... }),  // Validate request body
 *   query: z.object({ page: z.number().optional(), ... }), // Validate URL query params
 *   params: z.object({ id: z.string().uuid(), ... }),     // Validate URL path params
 * }
 */
const validate = (schema) => {
  return (req, res, next) => {
    // Collect all validation errors across body, query, and params
    const errors = [];

    // --- Validate request body ---
    // req.body contains data sent by the client (POST/PUT requests)
    // Example: { "email": "test@test.com", "password": "abc" }
    if (schema.body) {
      const result = schema.body.safeParse(req.body);

      if (!result.success) {
        errors.push(
          ...result.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        );
      } else {
        req.body = result.data;
      }
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((err) => ({
            field: `query.${err.path.join('.')}`,
            message: err.message,
          }))
        );
      } else {
        req.query = result.data;
      }
    }

    // --- Validate URL parameters ---
    // req.params contains URL path parameters
    // Example: GET /candidates/:id → { id: "abc-123" }
    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((err) => ({
            field: `params.${err.path.join('.')}`,
            message: err.message,
          }))
        );
      } else {
        req.params = result.data;
      }
    }

    // --- If there are any errors, send them all at once ---
    if (errors.length > 0) {
      // We send ALL errors together so the user can fix everything
      // at once, instead of fixing one field, submitting, getting
      // the next error, fixing that, submitting again, etc.
      return next(
        new ApiError(
          400,
          `Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join('; ')}`,
          'VALIDATION_ERROR'
        )
      );
    }

    // All valid → proceed to the controller
    next();
  };
};

module.exports = validate;
