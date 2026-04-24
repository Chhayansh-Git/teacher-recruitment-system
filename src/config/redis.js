/**
 * ============================================================
 * FILE: src/config/redis.js — Redis Connection
 * ============================================================
 *
 * WHAT IS REDIS?
 *       Redis is an in-memory database — it stores data in RAM (memory)
 *       instead of on disk. This makes it EXTREMELY fast (microseconds
 *       vs milliseconds for PostgreSQL).
 *
 * WHY DO WE NEED IT?
 *       We use Redis for 4 different purposes:
 *
 *       1. OTP Storage — When a user registers, we send a 6-digit code
 *          to their phone. That code is stored in Redis with a 5-minute
 *          expiry. After 5 minutes, Redis auto-deletes it.
 *
 *       2. Rate Limiting — "User X can only make 5 login attempts per
 *          15 minutes." We store counters in Redis that auto-expire.
 *
 *       3. Caching — Instead of querying the database every time someone
 *          views a school profile, we store the result in Redis for 15
 *          minutes. Much faster on repeated reads.
 *
 *       4. Job Queues (Bull) — Background tasks like "check for 7-day
 *          auto-release" use Redis-backed queues.
 *
 * WHY NOT JUST USE POSTGRESQL?
 *       PostgreSQL stores data on disk — reliable but slower.
 *       Redis stores data in memory — fast but volatile (data is lost
 *       if Redis restarts). We use each where its strengths matter:
 *       - PostgreSQL: permanent data (users, schools, pipelines)
 *       - Redis: temporary data (OTPs, sessions, rate limits, caches)
 *
 * PACKAGE: ioredis — A popular, robust Redis client for Node.js.
 *          It handles reconnection, clustering, and pipelining.
 * ============================================================
 */

const Redis = require('ioredis');
const config = require('./index');

/**
 * Create the Redis client.
 *
 * ioredis automatically parses the URL and connects.
 * The options configure retry behavior — if Redis goes down,
 * the client will keep trying to reconnect instead of crashing.
 */
const redis = new Redis(config.redisUrl, {
  // maxRetriesPerRequest: null allows Bull (job queue library)
  // to work properly. Bull needs unlimited retries on its connection.
  maxRetriesPerRequest: null,

  // retryStrategy defines how long to wait between reconnection attempts.
  // "times" is the attempt number (1, 2, 3, ...).
  // Math.min ensures we don't wait more than 2 seconds.
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
    // Attempt 1: wait 50ms
    // Attempt 2: wait 100ms
    // Attempt 3: wait 150ms
    // ...
    // Attempt 40+: wait 2000ms (capped)
  },
});

// --- Event Listeners ---
// Redis emits events about its connection status.
// We log them so you can see what's happening.

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  // Don't crash the app if Redis goes down — the app can still
  // serve requests (just without caching/rate-limiting).
  // In production, this would trigger an alert.
  console.error('❌ Redis connection error:', error.message);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

module.exports = redis;
