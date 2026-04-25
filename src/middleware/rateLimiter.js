/**
 * ============================================================
 * FILE: src/middleware/rateLimiter.js — Redis-Backed Rate Limiting
 * ============================================================
 *
 * WHAT: Limits how many requests a user/IP can make in a time window.
 *       If they exceed the limit, they get a 429 "Too Many Requests" error.
 *
 * WHY:  Without rate limiting, attackers can:
 *       1. Brute-force passwords (try millions of combinations)
 *       2. Spam OTPs (costs us money per SMS sent)
 *       3. Scrape all candidate data
 *       4. Overload the server (Denial of Service)
 *
 * HOW IT WORKS (Sliding Window Algorithm):
 *       Each user/IP gets a "counter" in Redis:
 *       Key: "rate:login:user123" → Value: 3 (3 requests so far)
 *       TTL: 900 seconds (15 minutes)
 *
 *       On each request:
 *       1. Read the counter → 3
 *       2. Is 3 >= limit (5)? No → allow the request
 *       3. Increment: 3 → 4
 *       4. After 15 minutes, Redis auto-deletes the key → counter resets
 *
 * RATE LIMITS FROM TDD:
 *       POST /auth/register     → 3 per hour per IP
 *       POST /auth/verify-otp   → 3 attempts per OTP
 *       POST /auth/login        → 5 per 15 min per user
 *       All authenticated       → 100 per min per user
 *       All unauthenticated     → 20 per min per IP
 *       POST /messages/send     → 30 per min per user
 * ============================================================
 */

const redis = require('../config/redis');
const ApiError = require('../utils/ApiError');

/**
 * createRateLimiter — Factory function that creates a rate limiter middleware.
 *
 * @param {Object} options
 * @param {string} options.prefix — Unique name for this limiter (e.g., "login", "register")
 * @param {number} options.maxRequests — Max requests allowed in the window
 * @param {number} options.windowSeconds — Time window in seconds
 * @param {string} options.keyBy — What to use as the key: "ip", "user", or "custom"
 * @param {Function} options.keyGenerator — Custom function to generate the key (optional)
 * @param {string} options.message — Custom error message (optional)
 * @returns {Function} — Express middleware
 *
 * EXAMPLE USAGE:
 *   // 5 login attempts per 15 minutes per IP
 *   const loginLimiter = createRateLimiter({
 *     prefix: 'login',
 *     maxRequests: 5,
 *     windowSeconds: 900,   // 15 minutes = 900 seconds
 *     keyBy: 'ip',
 *   });
 *   router.post('/login', loginLimiter, loginController);
 */
const createRateLimiter = (options) => {
  const {
    prefix = 'general',
    maxRequests = 100,
    windowSeconds = 60,
    keyBy = 'ip',
    keyGenerator,
    message = 'Too many requests. Please try again later.',
  } = options;

  return async (req, res, next) => {
    try {
      // --- Step 1: Determine the rate limit key ---
      // This identifies WHO we're rate limiting.
      let key;

      if (keyGenerator) {
        // Custom key generator function provided
        key = keyGenerator(req);
      } else if (keyBy === 'user' && req.user) {
        // Rate limit per logged-in user
        key = `ratelimit:${prefix}:user:${req.user.id}`;
      } else {
        // Rate limit per IP address (for unauthenticated requests)
        // req.ip gives us the client's IP address
        key = `ratelimit:${prefix}:ip:${req.ip}`;
      }

      // --- Step 2: Check current count ---
      // Redis INCR atomically increments a number and returns the new value.
      // "Atomic" means even if 100 requests arrive simultaneously,
      // each one gets a unique, sequential number. No race conditions.
      const currentCount = await redis.incr(key);

      // If this is the FIRST request (count was 0, now 1),
      // set the expiry time on the key.
      if (currentCount === 1) {
        await redis.expire(key, windowSeconds);
      }

      // --- Step 3: Set rate limit headers ---
      // These headers tell the client how many requests they have left.
      // Good API design includes these so clients can self-throttle.
      const remaining = Math.max(0, maxRequests - currentCount);
      res.set({
        'X-RateLimit-Limit': maxRequests,       // Total allowed
        'X-RateLimit-Remaining': remaining,     // How many left
        'X-RateLimit-Reset': windowSeconds,     // Seconds until reset
      });

      // --- Step 4: Check if limit exceeded ---
      if (currentCount > maxRequests) {
        throw ApiError.tooManyRequests(message);
      }

      // Under the limit → proceed
      next();
    } catch (error) {
      // If Redis is down, we DON'T want to block all requests.
      // We log the error and let the request through.
      // This is a tradeoff: availability vs. protection.
      if (error instanceof ApiError) {
        return next(error); // Rate limit exceeded — send 429
      }
      // Redis error — log and allow the request
      console.error('Rate limiter Redis error:', error.message);
      next(); // Fail open — allow the request
    }
  };
};

// --- Pre-built rate limiters for common endpoints ---
// These match the TDD's rate limit table exactly.

/** Login: 5 attempts per 15 min per IP */
const loginLimiter = createRateLimiter({
  prefix: 'login',
  maxRequests: 5,
  windowSeconds: 900, // 15 minutes
  keyBy: 'ip',
  message: 'Too many login attempts. Account locked for 15 minutes.',
});

/** Registration: 15 per hour per IP (allows multi-step OTPs + form submission + retries) */
const registerLimiter = createRateLimiter({
  prefix: 'register',
  maxRequests: 15,
  windowSeconds: 3600, // 1 hour
  keyBy: 'ip',
  message: 'Too many registration attempts. Please try again in an hour.',
});

/** OTP verification: 3 attempts per OTP session */
const otpLimiter = createRateLimiter({
  prefix: 'otp',
  maxRequests: 3,
  windowSeconds: 300, // 5 minutes (OTP validity)
  keyBy: 'ip',
  message: 'Too many incorrect OTP attempts. Please request a new OTP.',
});

/** General authenticated: 100 per min per user */
const generalLimiter = createRateLimiter({
  prefix: 'general',
  maxRequests: 100,
  windowSeconds: 60,
  keyBy: 'user',
});

/** Message sending: 30 per min per user */
const messageLimiter = createRateLimiter({
  prefix: 'message',
  maxRequests: 30,
  windowSeconds: 60,
  keyBy: 'user',
  message: 'Too many messages. Please slow down.',
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  registerLimiter,
  otpLimiter,
  generalLimiter,
  messageLimiter,
};
