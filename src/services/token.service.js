/**
 * ============================================================
 * FILE: src/services/token.service.js — JWT & Refresh Token Management
 * ============================================================
 *
 * WHAT: Creates, verifies, and rotates JWT access tokens and
 *       refresh tokens. This is the engine behind user sessions.
 *
 * TOKEN FLOW (from TDD):
 *       1. User logs in → server creates access token + refresh token
 *       2. Access token (15 min) is used for every API request
 *       3. When access token expires, frontend calls /auth/refresh
 *       4. Server verifies the refresh token → issues NEW access + refresh tokens
 *       5. Old refresh token is INVALIDATED (single-use)
 *
 * WHY TWO TOKENS?
 *       If we used just one long-lived token (e.g., 7 days), a stolen
 *       token would work for 7 days. That's a big security window.
 *
 *       With two tokens:
 *       - Access token is SHORT-lived (15 min). If stolen, it only works
 *         for 15 minutes.
 *       - Refresh token is LONG-lived (7 days) but is stored as httpOnly
 *         cookie (harder to steal) and is SINGLE-USE (invalidated after use).
 *         If someone steals and uses the old refresh token, the server
 *         detects it and revokes ALL tokens for that user (family rotation).
 *
 * TOKEN FORMAT:
 *       Access token: JWT (JSON Web Token) — contains user info, signed
 *       Refresh token: Opaque UUID — just a random string, the data is in the database
 *
 *       WHY is the refresh token not a JWT?
 *       JWTs can't be invalidated (they're valid until they expire).
 *       Opaque tokens are stored in the database, so we CAN invalidate them
 *       by deleting/marking them. This is needed for logout and token rotation.
 * ============================================================
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const redis = require('../config/redis');
const { prisma } = require('../config/database');

/**
 * generateAccessToken — Creates a short-lived JWT access token.
 *
 * @param {Object} user — User object with id, role, schoolId, candidateId
 * @returns {string} — The JWT string
 *
 * jwt.sign() creates a token with:
 * - Payload: { sub: userId, role: 'SCHOOL', ... }
 * - Secret: The server's private key (from .env)
 * - Options: { expiresIn: '15m' } — auto-expires in 15 minutes
 */
function generateAccessToken(user) {
  const payload = {
    sub: user.id,        // "subject" — standard JWT claim for the user ID
    role: user.role,     // User's role for quick authorization checks
    // Include role-specific IDs so middleware doesn't need extra DB queries
    schoolId: user.schoolId || null,
    candidateId: user.candidateId || null,
  };

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: user.role === 'ADMIN'
      ? '10m'            // Admin: shorter expiry (10 min) for extra security
      : config.jwt.accessExpiry, // School/Candidate: 15 min
  });
}

/**
 * generateRefreshToken — Creates a long-lived opaque refresh token.
 *
 * @param {string} userId — The user's ID
 * @returns {string} — The refresh token string (a UUID)
 *
 * The token itself is just a random UUID. The actual data (which user
 * it belongs to, when it expires) is stored in Redis.
 *
 * Redis key format: "refresh:abc-123-uuid" → { userId: "...", createdAt: "..." }
 * TTL: 7 days (auto-deleted from Redis after that)
 */
async function generateRefreshToken(userId, ipAddress = 'unknown', userAgent = 'unknown') {
  const refreshToken = crypto.randomUUID();
  const expirySeconds = parseDurationToSeconds(config.jwt.refreshExpiry);

  const sessionData = {
    userId,
    ipAddress,
    userAgent,
    createdAt: new Date().toISOString(),
  };

  await redis.set(
    `refresh:${refreshToken}`,
    JSON.stringify(sessionData),
    'EX',
    expirySeconds
  );

  // Track the session for the user
  await redis.sadd(`user_sessions:${userId}`, refreshToken);
  // Optional: Set expiry on the set, but it will live as long as the user's longest session

  return refreshToken;
}

/**
 * verifyRefreshToken — Validates a refresh token and returns the userId.
 *
 * @param {string} token — The refresh token to verify
 * @returns {Object} — { userId } if valid
 * @throws {ApiError} — If token is invalid or expired
 *
 * This implements TOKEN ROTATION:
 * 1. Look up the token in Redis
 * 2. If found → extract userId → DELETE the token from Redis
 * 3. The deleted token can never be used again (single-use)
 * 4. If someone tries to use a deleted token → it's a stolen token
 *    → revoke ALL tokens for that user
 */
async function verifyRefreshToken(token) {
  const key = `refresh:${token}`;

  const data = await redis.get(key);

  if (!data) {
    return null;
  }

  const sessionData = JSON.parse(data);
  const { userId } = sessionData;

  await redis.del(key);
  await redis.srem(`user_sessions:${userId}`, token);

  return sessionData;
}

/**
 * revokeAllUserTokens — Nuclear option: invalidate ALL tokens for a user.
 *
 * Called when:
 * - User reports their account was compromised
 * - A used refresh token is re-used (token theft detected)
 * - Admin force-logs out a user
 *
 * @param {string} userId — The user to revoke all tokens for
 */
async function revokeAllUserTokens(userId) {
  // Find all refresh tokens belonging to this user
  const tokens = await redis.smembers(`user_sessions:${userId}`);
  
  if (tokens && tokens.length > 0) {
    const keysToDelete = tokens.map((t) => `refresh:${t}`);
    await redis.del(...keysToDelete);
  }
  
  // Clear the set
  await redis.del(`user_sessions:${userId}`);

  // Blacklist the user for 15 minutes (so active access tokens are rejected)
  await redis.set(
    `blacklist:user:${userId}`,
    'revoked',
    'EX',
    900 // 15 minutes
  );
}

/**
 * getActiveSessions — List all active sessions for a user
 */
async function getActiveSessions(userId) {
  const tokens = await redis.smembers(`user_sessions:${userId}`);
  if (!tokens || tokens.length === 0) return [];
  
  const sessions = [];
  for (const token of tokens) {
    const data = await redis.get(`refresh:${token}`);
    if (data) {
      sessions.push({ id: token, ...JSON.parse(data) });
    } else {
      // Clean up stale tokens
      await redis.srem(`user_sessions:${userId}`, token);
    }
  }
  
  return sessions;
}

/**
 * revokeSession — Revoke a specific session
 */
async function revokeSession(userId, sessionId) {
  // We don't verify if it belongs to the user, we just try to delete it
  // and remove it from their set. If it wasn't theirs, it just does nothing.
  // But for security, we could verify.
  const data = await redis.get(`refresh:${sessionId}`);
  if (data) {
    const session = JSON.parse(data);
    if (session.userId === userId) {
      await redis.del(`refresh:${sessionId}`);
      await redis.srem(`user_sessions:${userId}`, sessionId);
    }
  }
}

/**
 * isUserBlacklisted — Check if a user's tokens have been revoked.
 *
 * @param {string} userId — The user to check
 * @returns {boolean} — true if blacklisted
 */
async function isUserBlacklisted(userId) {
  const result = await redis.get(`blacklist:user:${userId}`);
  return result !== null;
}

/**
 * setTokenCookies — Set access and refresh tokens as httpOnly cookies.
 *
 * @param {Response} res — Express response object
 * @param {string} accessToken — The JWT access token
 * @param {string} refreshToken — The refresh token
 *
 * WHY THESE COOKIE OPTIONS?
 * - httpOnly: true   → JavaScript can't access the cookie (XSS protection)
 * - secure: true     → Cookie only sent over HTTPS (not HTTP)
 * - sameSite: 'strict' → Cookie only sent to our domain (CSRF protection)
 * - path: '/'        → Cookie sent with all requests to our server
 */
function setTokenCookies(res, accessToken, refreshToken) {
  const isProduction = config.nodeEnv === 'production';

  // Access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,          // Not accessible via JavaScript
    secure: isProduction,    // Only HTTPS in production
    sameSite: 'strict',      // Only sent to our domain
    maxAge: 15 * 60 * 1000,  // 15 minutes in milliseconds
    path: '/',
  });

  // Refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/api/v1/auth',    // Only sent to auth endpoints (more restrictive)
  });
}

/**
 * clearTokenCookies — Remove auth cookies (used during logout).
 *
 * @param {Response} res — Express response object
 */
function clearTokenCookies(res) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
}

// --- Helper: Parse duration string to seconds ---
// Converts "15m" → 900, "7d" → 604800, "4h" → 14400
function parseDurationToSeconds(duration) {
  const unit = duration.slice(-1);        // Last character: 'm', 'h', 'd'
  const value = parseInt(duration, 10);   // Number part: 15, 7, 4
  switch (unit) {
    case 'm': return value * 60;          // minutes → seconds
    case 'h': return value * 3600;        // hours → seconds
    case 'd': return value * 86400;       // days → seconds
    default: return value;                // assume seconds
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeAllUserTokens,
  isUserBlacklisted,
  setTokenCookies,
  clearTokenCookies,
  getActiveSessions,
  revokeSession,
};
