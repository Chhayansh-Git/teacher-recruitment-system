const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

/**
 * CSRF Protection Middleware
 * Uses the Double Submit Cookie pattern.
 */
function csrfProtection(req, res, next) {
  // Safe methods don't need CSRF protection
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Webhooks are verified by signature, not CSRF
  if (req.originalUrl.includes('/webhooks/')) {
    return next();
  }

  // Login/Register don't need CSRF as they don't use cookies for auth yet
  const csrfExemptRoutes = [
    '/api/v1/auth/login',
    '/api/v1/auth/register/school',
    '/api/v1/auth/register/candidate',
    '/api/v1/auth/refresh',
    '/api/v1/auth/verify-otp',
    '/api/v1/auth/verify-admin-login'
  ];
  if (csrfExemptRoutes.includes(req.originalUrl)) {
    return next();
  }

  const cookieToken = req.cookies.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new ApiError(403, 'Invalid or missing CSRF token', 'CSRF_ERROR'));
  }

  next();
}

/**
 * Generate and set CSRF token cookie
 */
function setCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrfToken', token, {
    httpOnly: false, // Must be readable by frontend JS to set the header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
  return token;
}

module.exports = { csrfProtection, setCsrfCookie };
