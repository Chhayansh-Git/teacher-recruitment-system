/**
 * ============================================================
 * FILE: src/controllers/auth.controller.js — Auth Route Handlers
 * ============================================================
 *
 * WHAT: Handles HTTP requests for authentication endpoints.
 *       Each function corresponds to one API endpoint.
 *
 * CONTROLLER PATTERN:
 *       The controller is the "traffic cop" between HTTP and business logic:
 *       1. Receive the HTTP request (req)
 *       2. Extract data from req.body, req.params, req.query, req.cookies
 *       3. Call the appropriate service function
 *       4. Send the HTTP response (res)
 *
 *       Controllers should be THIN — they contain NO business logic.
 *       All the "real work" happens in services.
 *       If you find yourself writing if/else logic about business rules
 *       in a controller, move it to a service.
 *
 * WHY THIS PATTERN?
 *       - Controllers are specific to HTTP (Express). Services are not.
 *       - If we ever add GraphQL or gRPC, services can be reused.
 *       - Testing services is easier (no req/res mocking needed).
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

/**
 * POST /api/v1/auth/register/school
 *
 * Register a new school account.
 * Request body is validated by the validate middleware BEFORE this runs.
 */
const registerSchool = asyncHandler(async (req, res) => {
  // req.body has been validated and cleaned by validate(schoolRegisterSchema)
  const result = await authService.registerSchool(req.body);

  // 201 = "Created" — standard status for successful resource creation
  res.status(201).json(ApiResponse.success(result, 'School registered successfully'));
});

/**
 * POST /api/v1/auth/register/candidate
 *
 * Register a new candidate account.
 */
const registerCandidate = asyncHandler(async (req, res) => {
  const result = await authService.registerCandidate(req.body);
  res.status(201).json(ApiResponse.success(result, 'Candidate registered successfully'));
});

/**
 * POST /api/v1/auth/verify-otp
 *
 * Verify phone + email OTPs after registration.
 * Both OTPs must match for the account to be activated.
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyRegistrationOTP(req.body);
  res.status(200).json(ApiResponse.success(result, 'Account verified successfully'));
});

/**
 * POST /api/v1/auth/login
 *
 * Authenticate with email/phone + password.
 * On success, sets httpOnly cookies with access + refresh tokens.
 */
const crypto = require('crypto');

const { setCsrfCookie } = require('../middleware/csrf');

const login = asyncHandler(async (req, res) => {
  const loginData = {
    ...req.body,
    ipAddress: req.ip,
    deviceName: req.headers['user-agent'] || 'Unknown Device',
  };

  if (!loginData.deviceFingerprint) {
    loginData.deviceFingerprint = crypto.createHash('sha256').update(`${loginData.deviceName}-${loginData.ipAddress}`).digest('hex');
  }

  const result = await authService.login(loginData);

  if (result.requires2FA) {
    return res.status(200).json(
      ApiResponse.success(
        { requires2FA: true, userId: result.userId, email: result.email },
        '2FA required. Please enter the OTP sent to your email.'
      )
    );
  }

  // Set tokens as secure httpOnly cookies
  tokenService.setTokenCookies(res, result.accessToken, result.refreshToken);
  
  // Set CSRF token cookie for subsequent state-changing requests
  setCsrfCookie(res);

  // Don't send tokens in the response body — they're in the cookies
  res.status(200).json(
    ApiResponse.success(
      {
        user: result.user,
        requirePasswordChange: !result.user.passwordChanged,
      },
      'Login successful'
    )
  );
});

/**
 * POST /api/v1/auth/verify-admin-login
 *
 * Verify the 2FA OTP sent during Admin login.
 */
const verifyAdminLogin = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  
  if (!userId || !otp) {
    return res.status(400).json(ApiResponse.error('userId and otp are required.', 400));
  }

  const result = await authService.verifyAdmin2FA(userId, otp);

  tokenService.setTokenCookies(res, result.accessToken, result.refreshToken);

  res.status(200).json(
    ApiResponse.success(
      {
        user: result.user,
        requirePasswordChange: !result.user.passwordChanged,
      },
      'Login successful'
    )
  );
});

/**
 * POST /api/v1/auth/refresh
 *
 * Get a new access token using the refresh token.
 * Called automatically by the frontend when the access token expires.
 */
const refresh = asyncHandler(async (req, res) => {
  // Get the refresh token from cookies
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json(
      ApiResponse.error('No refresh token provided. Please log in again.', 'NO_REFRESH_TOKEN', 401)
    );
  }

  const result = await authService.refreshAccessToken(refreshToken);

  // Set new cookies (old refresh token was consumed/deleted)
  tokenService.setTokenCookies(res, result.accessToken, result.refreshToken);

  res.status(200).json(ApiResponse.success(null, 'Token refreshed successfully'));
});

/**
 * POST /api/v1/auth/logout
 *
 * Log out the current user.
 * Clears cookies and invalidates the refresh token.
 */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logout(refreshToken);

  // Clear the auth cookies from the browser
  tokenService.clearTokenCookies(res);

  res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
});

/**
 * PUT /api/v1/auth/change-password
 *
 * Change password for the logged-in user.
 * Requires current password + new password.
 * Used for: schools changing temp password, any user changing password.
 */
const changePassword = asyncHandler(async (req, res) => {
  // req.user is set by the authenticate middleware
  const result = await authService.changePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword
  );

  // Clear cookies — user needs to log in again with new password
  tokenService.clearTokenCookies(res);

  res.status(200).json(ApiResponse.success(result));
});

const getCsrfToken = asyncHandler(async (req, res) => {
  const token = setCsrfCookie(res);
  res.json(ApiResponse.success({ csrfToken: token }));
});

const getSessions = asyncHandler(async (req, res) => {
  const sessions = await tokenService.getActiveSessions(req.user.id);
  res.json(ApiResponse.success(sessions));
});

const revokeSession = asyncHandler(async (req, res) => {
  await tokenService.revokeSession(req.user.id, req.params.id);
  res.json(ApiResponse.success(null, 'Session revoked'));
});

/**
 * POST /api/v1/auth/send-otp
 *
 * Send OTPs for registration.
 */
const sendRegistrationOTPs = asyncHandler(async (req, res) => {
  const result = await authService.sendRegistrationOTPs(req.body);
  res.status(200).json(ApiResponse.success(result));
});

/**
 * POST /api/v1/auth/verify-otp
 *
 * Verify OTPs and cache verification status.
 */
const verifyRegistrationOTPs = asyncHandler(async (req, res) => {
  const result = await authService.verifyRegistrationOTPs(req.body);
  res.status(200).json(ApiResponse.success(result));
});

/**
 * POST /api/v1/auth/google-init
 *
 * Step 1 of Google Registration. Verifies Google token and caches email.
 */
const googleInit = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json(ApiResponse.error('Google token is required.'));

  const result = await authService.googleInit(token);
  res.status(200).json(ApiResponse.success(result));
});

/**
 * POST /api/v1/auth/google-login
 *
 * Log in with Google Token.
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json(ApiResponse.error('Google token is required.'));
  }

  const result = await authService.googleLogin(token);

  if (result.isNewUser) {
    return res.status(200).json(
      ApiResponse.success(
        { isNewUser: true, email: result.email, name: result.name },
        'Account not found. Please register to continue.'
      )
    );
  }

  tokenService.setTokenCookies(res, result.accessToken, result.refreshToken);
  setCsrfCookie(res);

  res.status(200).json(
    ApiResponse.success(
      {
        user: result.user,
        requirePasswordChange: false,
      },
      'Login successful'
    )
  );
});

module.exports = {
  sendRegistrationOTPs,
  verifyRegistrationOTPs,
  googleInit,
  googleLogin,
  registerSchool,
  registerCandidate,
  verifyOtp,
  login,
  verifyAdminLogin,
  refresh,
  logout,
  changePassword,
  getCsrfToken,
  getSessions,
  revokeSession,
};
