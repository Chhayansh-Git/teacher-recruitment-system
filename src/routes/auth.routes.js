/**
 * ============================================================
 * FILE: src/routes/auth.routes.js — Authentication Route Definitions
 * ============================================================
 *
 * WHAT: Defines which URL + HTTP method maps to which controller function,
 *       and which middleware runs in between.
 *
 * WHAT IS A ROUTE?
 *       A route is a mapping: "When someone sends a POST request to /login,
 *       run this function." It's like a phone directory:
 *       - POST /register/school → authController.registerSchool
 *       - POST /login           → authController.login
 *
 * MIDDLEWARE CHAIN:
 *       Routes can have multiple middleware that run in order:
 *       router.post('/login', rateLimiter, validate(schema), controller)
 *                              ↓             ↓                ↓
 *                         Check rate    Validate data    Handle request
 *                         limit         from body
 *
 * WHAT IS Express.Router()?
 *       Express.Router() creates a mini-app that handles a group of related
 *       routes. In app.js, we mount it: app.use('/api/v1/auth', authRoutes)
 *       So if authRoutes defines POST /login, the full URL becomes
 *       POST /api/v1/auth/login.
 * ============================================================
 */

const express = require('express');
const router = express.Router();

// Middleware
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { loginLimiter, registerLimiter, otpLimiter } = require('../middleware/rateLimiter');

// Validators (Zod schemas)
const {
  schoolRegisterSchema,
  candidateRegisterSchema,
  loginSchema,
  verifyOtpSchema,
  changePasswordSchema,
} = require('../validators/auth.validator');

// Controller
const authController = require('../controllers/auth.controller');

// ============================================================
// PUBLIC ROUTES — No login required
// ============================================================

/**
 * POST /api/v1/auth/register/school
 *
 * Register a new school.
 * Middleware chain: rate limit (3/hour) → validate body → handle
 */
router.post(
  '/register/school',
  registerLimiter,                      // Max 3 per hour per IP
  validate(schoolRegisterSchema),       // Validate request body
  authController.registerSchool         // Handle the request
);

/**
 * POST /api/v1/auth/register/candidate
 *
 * Register a new candidate.
 */
router.post(
  '/register/candidate',
  registerLimiter,
  validate(candidateRegisterSchema),
  authController.registerCandidate
);

/**
 * POST /api/v1/auth/verify-otp
 *
 * Verify phone and email OTPs after registration.
 */
router.post(
  '/verify-otp',
  otpLimiter,                           // Max 3 OTP attempts
  validate(verifyOtpSchema),
  authController.verifyOtp
);

/**
 * POST /api/v1/auth/login
 *
 * Log in with email/phone + password.
 */
router.post(
  '/login',
  loginLimiter,                         // Max 5 per 15 min per IP
  validate(loginSchema),
  authController.login
);

/**
 * POST /api/v1/auth/verify-admin-login
 *
 * Verify the 2FA OTP sent during Admin login.
 */
router.post(
  '/verify-admin-login',
  otpLimiter,                           // Max 3 OTP attempts
  authController.verifyAdminLogin
);

/**
 * POST /api/v1/auth/refresh
 *
 * Get a new access token using the refresh token cookie.
 * No login required (that's the whole point — the access token expired).
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/v1/auth/logout
 *
 * Log out. Clears cookies and invalidates refresh token.
 */
router.post('/logout', authController.logout);

// ============================================================
// PROTECTED ROUTES — Login required
// ============================================================

/**
 * PUT /api/v1/auth/change-password
 *
 * Change the logged-in user's password.
 * Requires: authenticate middleware (must be logged in)
 */
router.put(
  '/change-password',
  authenticate,                        // Must be logged in
  validate(changePasswordSchema),      // Validate old + new password
  authController.changePassword
);

/**
 * GET /api/v1/auth/csrf-token
 *
 * Get a new CSRF token. Sets the cookie and returns the token.
 */
router.get('/csrf-token', authController.getCsrfToken);

/**
 * GET /api/v1/auth/sessions
 *
 * View active sessions for the authenticated user.
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * DELETE /api/v1/auth/sessions/:id
 *
 * Revoke a specific session.
 */
router.delete('/sessions/:id', authenticate, authController.revokeSession);

module.exports = router;
