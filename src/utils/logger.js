/**
 * ============================================================
 * FILE: src/utils/logger.js — Structured Logging with Winston
 * ============================================================
 *
 * WHAT: Creates a configured logger that writes structured log messages.
 *
 * WHY NOT JUST USE console.log?
 *       console.log works, but in production you need:
 *       1. Log levels — "info" for normal events, "error" for failures,
 *          "warn" for concerning situations, "debug" for detailed traces.
 *          In production, you'd show only "warn" and "error", hiding
 *          the noisy "debug" messages.
 *       2. Timestamps — When did this happen? console.log doesn't add them.
 *       3. Structured format — Instead of plain text, logs can be JSON.
 *          Log aggregation tools (like Datadog, ELK) can parse JSON logs
 *          and let you search/filter them.
 *       4. Multiple outputs — Write to console AND a file simultaneously.
 *
 * PACKAGE: Winston — The most popular logging library for Node.js.
 *
 * PII MASKING:
 *       As stated in the TDD, we NEVER log full personal information:
 *       - Phone: 98****1234
 *       - Email: ch****@gmail.com
 *       - Passwords: NEVER, not even masked
 *       This file provides helper functions for masking.
 * ============================================================
 */

const winston = require('winston');
const config = require('../config');

/**
 * Define log format for different environments.
 *
 * Development: Human-readable, colorized, with timestamps
 *   Example: 2026-04-20 23:55:00 [info]: Server started on port 5000
 *
 * Production: JSON format for machine parsing
 *   Example: {"timestamp":"2026-04-20T18:25:00.000Z","level":"info","message":"Server started","port":5000}
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(), // Makes "info" green, "error" red in console
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    // ... (spread operator) collects all extra fields into "metadata"
    // So if you log: logger.info('User login', { userId: '123' })
    // then metadata = { userId: '123' }
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(), // ISO 8601 format
  winston.format.json() // Everything as JSON
);

/**
 * Create the Winston logger.
 *
 * "transports" = where the logs go.
 * We always log to the console. In production, you'd add file
 * transports or send logs to a service like Datadog.
 */
const logger = winston.createLogger({
  // Log level controls what gets logged:
  // error (0) < warn (1) < info (2) < http (3) < debug (4)
  // Setting level to 'debug' logs EVERYTHING.
  // Setting level to 'warn' logs only warn and error.
  level: config.nodeEnv === 'development' ? 'debug' : 'info',

  format: config.nodeEnv === 'development' ? developmentFormat : productionFormat,

  // "defaultMeta" adds these fields to EVERY log message automatically
  defaultMeta: { service: 'teacher-recruitment-api' },

  transports: [
    // Console transport — always active
    new winston.transports.Console(),

    // In production, you might add:
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// --- PII Masking Helpers ---
// These functions hide sensitive parts of personal data.
// ALWAYS use these before logging any user information.

/**
 * Mask a phone number: 9876543210 → 98****3210
 * Shows first 2 and last 4 digits.
 */
logger.maskPhone = (phone) => {
  if (!phone) return '***';
  const str = String(phone).replace(/[^0-9]/g, ''); // Remove non-digits
  if (str.length < 6) return '***';
  return str.slice(0, 2) + '****' + str.slice(-4);
};

/**
 * Mask an email: chhayansh@gmail.com → ch****@gmail.com
 * Shows first 2 characters of the local part.
 */
logger.maskEmail = (email) => {
  if (!email) return '***';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return local.slice(0, 2) + '****@' + domain;
};

module.exports = logger;
