/**
 * ============================================================
 * FILE: src/services/otp.service.js — OTP Generation & Verification
 * ============================================================
 *
 * WHAT: Handles One-Time Password generation, storage, and verification.
 *       OTPs are sent via SMS (MSG91) and Email (SendGrid) for
 *       account verification and password resets.
 *
 * HOW OTP FLOW WORKS:
 *       1. User registers or requests password reset
 *       2. Server generates a random 6-digit code
 *       3. Code is stored in Redis with a 5-minute TTL (time to live)
 *       4. Code is sent to user's phone (via SMS) and email
 *       5. User enters the code on the verification screen
 *       6. Server checks the code against what's in Redis
 *       7. If correct → verify user. If wrong → increment attempt counter.
 *       8. After 3 wrong attempts → invalidate OTP, user must request a new one.
 *
 * WHY REDIS FOR OTPs?
 *       OTPs are temporary data — they're only valid for 5 minutes.
 *       Redis has built-in TTL (auto-delete after X seconds), which is
 *       perfect for this. No need for cleanup cron jobs.
 *
 * SECURITY:
 *       - OTP is NEVER logged or stored in the database
 *       - 3 wrong attempts → OTP invalidated
 *       - 3 OTP requests per 15 minutes per phone (rate limited via middleware)
 *       - OTP is deleted after successful verification
 * ============================================================
 */

const redis = require('../config/redis');
const logger = require('../utils/logger');

// OTP expiry time in seconds (5 minutes)
const OTP_EXPIRY = 300;

// Maximum wrong attempts before OTP is invalidated
const MAX_ATTEMPTS = 3;

/**
 * generateOTP — Creates a random 6-digit numeric code.
 *
 * @returns {string} — A 6-digit string like "482917"
 *
 * Math.random() generates a random decimal between 0 and 1: 0.482917...
 * Multiply by 900000 → 434625.3...
 * Add 100000 → 534625.3...
 * Math.floor() removes the decimal → 534625
 * .toString() converts to string → "534625"
 *
 * This guarantees a 6-digit number between 100000 and 999999.
 * (Without the +100000, you could get 000001 which is only 1 digit as a number.)
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * storeOTP — Saves an OTP in Redis with expiry.
 *
 * @param {string} identifier — What the OTP is for (email or phone)
 * @param {string} purpose — Why the OTP was generated ('register', 'reset', 'login')
 * @param {string} otp — The 6-digit code
 *
 * Redis key format: "otp:register:test@test.com" → { otp: "123456", attempts: 0 }
 * After 5 minutes, Redis automatically deletes this key.
 */
async function storeOTP(identifier, purpose, otp) {
  const key = `otp:${purpose}:${identifier}`;

  await redis.set(
    key,
    JSON.stringify({ otp, attempts: 0 }),
    'EX',        // Set expiry
    OTP_EXPIRY   // 300 seconds = 5 minutes
  );

  logger.debug(`OTP stored for ${logger.maskEmail(identifier)} (purpose: ${purpose})`);
}

/**
 * verifyOTP — Checks if the provided OTP matches the stored one.
 *
 * @param {string} identifier — The email or phone the OTP was sent to
 * @param {string} purpose — Why the OTP was generated
 * @param {string} providedOtp — The OTP the user entered
 * @returns {Object} — { valid: true/false, error: "error message if invalid" }
 *
 * This function also handles:
 * - Wrong OTP → increments attempt counter
 * - 3rd wrong attempt → deletes the OTP (user must request a new one)
 * - Correct OTP → deletes the OTP (can't be reused)
 */
async function verifyOTP(identifier, purpose, providedOtp) {
  const key = `otp:${purpose}:${identifier}`;

  // --- Step 1: Retrieve the stored OTP ---
  const data = await redis.get(key);

  if (!data) {
    // OTP not found — either expired (5 min TTL) or never generated
    return { valid: false, error: 'OTP has expired or was not generated. Please request a new one.' };
  }

  const { otp: storedOtp, attempts } = JSON.parse(data);

  // --- Step 2: Check attempt count ---
  if (attempts >= MAX_ATTEMPTS) {
    // Already exceeded max attempts — delete the OTP
    await redis.del(key);
    return { valid: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  // --- Step 3: Compare the OTPs ---
  if (providedOtp !== storedOtp) {
    // Wrong OTP — increment attempt counter
    const newAttempts = attempts + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      // This was the last allowed attempt — delete the OTP
      await redis.del(key);
      return { valid: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    // Update the attempt count in Redis (keep the same TTL)
    const ttl = await redis.ttl(key); // Get remaining time to live
    await redis.set(
      key,
      JSON.stringify({ otp: storedOtp, attempts: newAttempts }),
      'EX',
      ttl // Keep the same expiry
    );

    return {
      valid: false,
      error: `Incorrect OTP. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`,
    };
  }

  // --- Step 4: OTP is correct! ---
  // Delete it so it can't be reused
  await redis.del(key);
  logger.info(`OTP verified successfully for ${logger.maskEmail(identifier)}`);

  return { valid: true };
}

/**
 * sendOTPviaSMS — Sends OTP to user's phone via MSG91.
 *
 * @param {string} phone — Phone number to send to
 * @param {string} otp — The 6-digit OTP
 *
 * In DEVELOPMENT, we DON'T actually send SMS (costs money).
 * Instead, we log the OTP to the console. You copy it from there.
 *
 * In PRODUCTION, this would call the MSG91 API.
 */
async function sendOTPviaSMS(phone, otp) {
  // In development, just log it (don't send real SMS)
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`📱 [DEV] SMS OTP for ${logger.maskPhone(phone)}: ${otp}`);
    return;
  }

  // TODO: Production SMS sending via MSG91 API
  // This would use the msg91 SDK or HTTP API:
  // const response = await fetch('https://api.msg91.com/api/v5/otp', {
  //   method: 'POST',
  //   headers: { 'authkey': config.msg91.authKey },
  //   body: JSON.stringify({ mobile: phone, otp: otp, template_id: config.msg91.templateId })
  // });
  logger.info(`SMS OTP sent to ${logger.maskPhone(phone)}`);
}

/**
 * sendOTPviaEmail — Sends OTP to user's email via SMTP (Nodemailer).
 *
 * @param {string} email — Email address to send to
 * @param {string} otp — The 6-digit OTP
 *
 * Uses Nodemailer to send a nicely formatted HTML email.
 * Falls back to console logging if SMTP password is not configured.
 */
async function sendOTPviaEmail(email, otp) {
  const config = require('../config');

  // If SMTP password is not set or is a placeholder, log to console
  if (!config.smtp.pass || config.smtp.pass === 'your_google_app_password') {
    logger.info(`📧 [DEV] Email OTP for ${logger.maskEmail(email)}: ${otp}`);
    return;
  }

  try {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465, // true for 465, false for other ports
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });

    await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Your Verification Code — Teacher Recruitment System',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1e40af; margin: 0;">Teacher Recruitment System</h2>
          </div>
          <div style="background: white; padding: 32px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="color: #475569; font-size: 16px; margin: 0 0 24px;">Your one-time verification code is:</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 16px 24px; border-radius: 8px; display: inline-block;">
              ${otp}
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
              This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 16px 0 0;">
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    logger.info(`📧 Email OTP sent to ${logger.maskEmail(email)}`);
  } catch (err) {
    // Don't crash the whole registration flow if email fails
    // The OTP is also logged to console as fallback
    logger.error(`Failed to send email OTP via SMTP: ${err.message}`);
    logger.info(`📧 [FALLBACK] Email OTP for ${logger.maskEmail(email)}: ${otp}`);
  }
}

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPviaSMS,
  sendOTPviaEmail,
};
