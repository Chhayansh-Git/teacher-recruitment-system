/**
 * ============================================================
 * FILE: src/middleware/authenticate.js — JWT Verification
 * ============================================================
 *
 * WHAT: Checks if the incoming request has a valid JWT token.
 *       If yes → attaches the user info to req.user and proceeds.
 *       If no → sends a 401 "Unauthorized" response.
 *
 * WHY:  Most API endpoints require the user to be logged in.
 *       This middleware verifies their identity on EVERY request.
 *
 * HOW JWT WORKS (simplified):
 *       1. User logs in with email + password
 *       2. Server creates a JWT containing their userId and role
 *       3. JWT is sent to the browser as an httpOnly cookie
 *       4. On every subsequent request, the browser automatically
 *          sends the cookie back to the server
 *       5. This middleware reads the cookie, verifies the JWT,
 *          and extracts the user info
 *
 * WHAT IS A JWT?
 *       JWT = JSON Web Token. It's a string with 3 parts separated by dots:
 *       eyJhbGci.eyJzdWIi.SflKxwRJ
 *       ─────────  ─────────  ─────────
 *       Header     Payload    Signature
 *
 *       Header:    Algorithm used to sign (HS256)
 *       Payload:   The actual data (userId, role, expiry time)
 *       Signature: Proof that the server created this token
 *                  (cannot be faked without the secret key)
 *
 *       The server signs the token with a SECRET KEY. When it receives
 *       a token back, it verifies the signature matches. If someone
 *       tampers with the payload (e.g., changes role to ADMIN),
 *       the signature won't match → token rejected.
 *
 * SECURITY: WHY HTTPONLY COOKIES instead of localStorage?
 *       localStorage is accessible via JavaScript: localStorage.getItem('token')
 *       If there's an XSS attack (malicious script injected into the page),
 *       the attacker can steal the token from localStorage.
 *
 *       httpOnly cookies are NOT accessible via JavaScript. The browser
 *       sends them automatically, but no script can read them.
 *       This makes XSS attacks much less dangerous.
 * ============================================================
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const { prisma } = require('../config/database');

/**
 * authenticate — Middleware that verifies the JWT access token.
 *
 * It checks two possible locations for the token:
 * 1. Cookies (preferred — httpOnly cookie named "accessToken")
 * 2. Authorization header (fallback — "Bearer eyJhbGci...")
 *    The header approach is useful for API testing tools like Postman.
 */
const authenticate = async (req, res, next) => {
  try {
    // --- Step 1: Extract the token ---
    let token;

    // Check cookies first (this is where the frontend stores it)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback: check the Authorization header
    // Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Split "Bearer eyJhbGci..." → ["Bearer", "eyJhbGci..."] → take index 1
      token = req.headers.authorization.split(' ')[1];
    }

    // No token found anywhere → user is not logged in
    if (!token) {
      throw ApiError.unauthorized('Please log in to access this resource.');
    }

    // --- Step 2: Verify the token ---
    // jwt.verify does two things:
    // 1. Checks if the signature is valid (proves we created this token)
    // 2. Checks if the token has expired (exp field in payload)
    // If either fails, it throws an error (caught by asyncHandler → errorHandler)
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    // decoded now contains: { sub: "user_uuid", role: "SCHOOL", iat: ..., exp: ... }

    // --- Step 3: Check if the user still exists ---
    // WHY: The token might be valid, but the user might have been deleted
    // or suspended since the token was issued.
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        passwordChanged: true,
        // Include related IDs so we can use them later
        school: { select: { id: true } },
        candidate: { select: { id: true } },
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User no longer exists. Please log in again.');
    }

    // --- Step 4: Check user status ---
    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Your account has been suspended. Contact support.', 'ACCOUNT_SUSPENDED');
    }

    if (user.status === 'DISMISSED') {
      throw ApiError.forbidden('Your account has been suspended. Contact support.', 'ACCOUNT_DISMISSED');
    }

    // --- Step 5: Attach user info to the request ---
    // Now req.user is available in ALL subsequent middleware and route handlers.
    // This is how the rest of the app knows WHO is making the request.
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      passwordChanged: user.passwordChanged,
      schoolId: user.school?.id || null,     // ?.  = optional chaining
      candidateId: user.candidate?.id || null, // If school/candidate is null, use null
    };

    // --- Step 6: Pass to the next middleware ---
    // Everything is fine → continue to the route handler
    next();
  } catch (error) {
    // If jwt.verify fails, it throws a specific error type.
    // We convert it to our ApiError format for consistency.
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token. Please log in again.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Session expired. Please log in again.'));
    }
    // For any other error (including our ApiErrors), pass it along
    next(error);
  }
};

module.exports = authenticate;
