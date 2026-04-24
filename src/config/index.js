/**
 * ============================================================
 * FILE: src/config/index.js — Centralized Configuration
 * ============================================================
 *
 * WHAT: This file reads all environment variables and exports them
 *       as a single JavaScript object. Every other file in the project
 *       imports config from HERE instead of reading process.env directly.
 *
 * WHY:  1. Single source of truth — if a variable name changes, you
 *          change it in ONE place, not in 50 files.
 *       2. Validation — we check that required variables exist at startup.
 *          If something's missing, the app crashes immediately with a
 *          clear error message, instead of failing randomly later.
 *       3. Default values — development-friendly defaults so the app
 *          works out of the box for local development.
 *
 * HOW:  dotenv reads the .env file and puts all key=value pairs into
 *       process.env. Then we destructure them here.
 *
 * USAGE: const config = require('./config');
 *        console.log(config.port); // 5000
 * ============================================================
 */

// dotenv loads variables from .env file into process.env
// This MUST be called before accessing any env variables
const dotenv = require('dotenv');

// .env file is in the project root (one level up from src/)
// path.resolve builds an absolute path regardless of where you run the script from
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * The config object — every configuration value the app needs.
 *
 * Pattern: config.sectionName.propertyName
 * Example: config.jwt.accessSecret
 *
 * The || operator provides default values:
 *   process.env.PORT || 5000
 *   means "use PORT from .env, but if it's not set, use 5000"
 */
const config = {
  // --- Server ---
  port: parseInt(process.env.PORT, 10) || 5000,
  // parseInt converts the string "5000" to the number 5000
  // The 10 means "base 10" (decimal number system)

  nodeEnv: process.env.NODE_ENV || 'development',
  // Controls error detail level, logging verbosity, etc.

  // --- Database ---
  databaseUrl: process.env.DATABASE_URL,
  // The full connection string for PostgreSQL

  // --- Redis ---
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // --- JWT (Authentication Tokens) ---
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // --- OTP (One-Time Password via SMS) ---
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY,
    templateId: process.env.MSG91_TEMPLATE_ID,
    senderId: process.env.MSG91_SENDER_ID || 'TCHREC',
  },

  // --- Email (SendGrid) ---
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourplatform.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Teacher Recruitment System',
  },

  // --- Payments (Razorpay) ---
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  // --- AWS S3 (File Storage) ---
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // --- Frontend ---
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // --- Admin ---
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@yourplatform.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    phone: process.env.ADMIN_PHONE || '+919999999999',
  },

  // --- Business Rules ---
  freeSchoolLimit: parseInt(process.env.FREE_SCHOOL_LIMIT, 10) || 200,
  registrationFee: parseInt(process.env.REGISTRATION_FEE, 10) || 500000, // in paisa
};

/**
 * VALIDATION: Check that critical environment variables are set.
 *
 * WHY: If the database URL is missing, the app will crash when it
 *      tries to connect. Better to crash immediately with a clear
 *      message than to crash 5 minutes later with a confusing error.
 *
 * We only enforce these in production. In development, we're more lenient
 * so you can start the server even without all services configured.
 */
const requiredInProduction = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'MSG91_AUTH_KEY',
  'SENDGRID_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

if (config.nodeEnv === 'production') {
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Throw an error — this crashes the app on purpose.
    // It's better to NOT START than to start in a broken state.
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n` +
        `   Please set them in your .env file or environment.`
    );
  }
}

// Export the config object so other files can use it:
// const config = require('./config');
module.exports = config;
