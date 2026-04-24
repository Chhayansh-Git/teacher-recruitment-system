/**
 * ============================================================
 * FILE: src/services/contactLeakDetector.js — Contact Info Leak Detection
 * ============================================================
 *
 * WHAT: Scans chat messages for phone numbers, email addresses,
 *       WhatsApp links, and other contact info that users might
 *       try to exchange to bypass the platform.
 *
 * WHY THIS IS BUSINESS-CRITICAL:
 *       The platform's ENTIRE REVENUE depends on being the middleman.
 *       If schools get candidates' phone numbers, they can hire directly
 *       next time, without paying the platform. This detector catches
 *       attempts to share contact info.
 *
 * WHY FLAG AND NOT BLOCK?
 *       Blocking creates false positives:
 *       - "I have 10 years of experience" → "10" could be a phone prefix
 *       - "Call the office at building 98" → not a phone number
 *       Flagging + admin review is more accurate and less disruptive.
 *       The message is STILL SENT, but flagged for admin to review.
 * ============================================================
 */

const logger = require('../utils/logger');

/**
 * LEAK_PATTERNS — Regular expressions to detect contact info.
 *
 * Each pattern has:
 * - pattern: The regex to match
 * - label: Human-readable description of what was detected
 *
 * WHAT ARE REGULAR EXPRESSIONS (REGEX)?
 * They're patterns that describe text:
 *   /\d{3}/  = exactly 3 digits
 *   /[a-z]+/ = one or more lowercase letters
 *   /^hello/ = starts with "hello"
 *   /\b/     = word boundary (start/end of a word)
 */
const LEAK_PATTERNS = [
  // --- Phone numbers ---
  {
    pattern: /\b[6-9]\d{9}\b/,
    // \b = word boundary (prevents matching 10 digits inside a larger number)
    // [6-9] = starts with 6, 7, 8, or 9 (Indian mobile numbers)
    // \d{9} = followed by 9 more digits
    label: 'Indian phone number',
  },
  {
    pattern: /\+91[\s-]?\d{10}/,
    // +91 = India country code, optional space/dash, then 10 digits
    label: 'Indian phone with country code',
  },
  {
    pattern: /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/,
    // Formatted like: 987-654-3210 or 987.654.3210
    label: 'Formatted phone number',
  },

  // --- Email addresses ---
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    // The standard email regex:
    // local-part @ domain . extension
    // test.user@gmail.com
    label: 'Email address',
  },

  // --- Social / Messaging platforms ---
  {
    pattern: /(?:whatsapp|whats\s*app|wa)\s*(?:no|number|#)?[\s:.-]*\d*/i,
    // Catches: "WhatsApp number 9876543210", "whats app no: 123", "WA: 987"
    // /i = case-insensitive
    label: 'WhatsApp reference',
  },
  {
    pattern: /wa\.me\/\d+/i,
    // WhatsApp direct link: wa.me/919876543210
    label: 'WhatsApp link',
  },
  {
    pattern: /t\.me\/[a-zA-Z0-9_]+/i,
    // Telegram link: t.me/username
    label: 'Telegram link',
  },
  {
    pattern: /(?:telegram|signal|skype|zoom|meet)[\s:]/i,
    // Mentions of external platforms
    label: 'External platform mention',
  },

  // --- Video call links ---
  {
    pattern: /meet\.google\.com\/[a-z-]+/i,
    label: 'Google Meet link',
  },
  {
    pattern: /zoom\.us\/j\/\d+/i,
    label: 'Zoom link',
  },

  // --- Obfuscation attempts ---
  // People try to hide phone numbers by spacing them out:
  // "nine eight seven six five four three two one zero"
  // "9 8 7 6 5 4 3 2 1 0"
  {
    pattern: /\b\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d\b/,
    // 10 digits with optional separators between each
    // Catches: "9.8.7.6.5.4.3.2.1.0" or "9 8 7-6 5 4-3 2 1 0"
    label: 'Obfuscated 10-digit number',
  },
  {
    pattern: /\bat\s+(?:the\s+rate|gmail|yahoo|hotmail|outlook)/i,
    // "at gmail dot com" or "at the rate gmail"
    label: 'Spelled-out email',
  },
];

/**
 * scanMessage — Scan a message for potential contact info leaks.
 *
 * @param {string} content — The message text to scan
 * @returns {Object} — { isFlagged: boolean, reasons: string[] }
 *
 * EXAMPLE:
 * scanMessage("Call me at 9876543210")
 * → { isFlagged: true, reasons: ["Indian phone number"] }
 *
 * scanMessage("I have 10 years of experience")
 * → { isFlagged: false, reasons: [] }
 */
function scanMessage(content) {
  if (!content || typeof content !== 'string') {
    return { isFlagged: false, reasons: [] };
  }

  const detectedReasons = [];

  for (const { pattern, label } of LEAK_PATTERNS) {
    if (pattern.test(content)) {
      detectedReasons.push(label);
    }
  }

  if (detectedReasons.length > 0) {
    logger.warn(`Contact leak detected: ${detectedReasons.join(', ')}`);
  }

  return {
    isFlagged: detectedReasons.length > 0,
    reasons: detectedReasons,
  };
}

module.exports = { scanMessage, LEAK_PATTERNS };
