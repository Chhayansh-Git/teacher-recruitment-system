/**
 * ============================================================
 * FILE: src/services/auth.service.js — Authentication Business Logic
 * ============================================================
 *
 * WHAT: Contains all the logic for user registration, login, logout,
 *       password management. This is where the auth "magic" happens.
 *
 * WHY A SEPARATE SERVICE?
 *       Controllers handle HTTP (reading request, sending response).
 *       Services handle BUSINESS LOGIC (what actually happens).
 *
 *       This separation means:
 *       - Services can be reused (auth logic in API routes, background jobs, etc.)
 *       - Testing is easier (test business logic without HTTP)
 *       - Controllers stay thin and readable
 *
 * BCRYPT — HOW PASSWORD HASHING WORKS:
 *       We NEVER store passwords as plain text. If the database is
 *       stolen, attackers would have everyone's passwords.
 *
 *       Instead, we use bcrypt to create a ONE-WAY hash:
 *       "MyPassword123!" → "$2b$12$xYz.abc.def..."
 *
 *       "One-way" means you CANNOT reverse it — you can't get the
 *       original password from the hash. To verify a password during
 *       login, we hash the attempt and compare the hashes:
 *       hash("MyPassword123!") === stored_hash → correct!
 *       hash("WrongPassword") !== stored_hash → wrong!
 *
 *       "Cost factor 12" means bcrypt runs 2^12 = 4096 rounds of
 *       hashing. This makes it SLOW on purpose — so even if someone
 *       steals the hashes, trying every possible password (brute force)
 *       would take millions of years.
 * ============================================================
 */

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const redis = require('../config/redis');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const tokenService = require('./token.service');
const otpService = require('./otp.service');

// Bcrypt cost factor — higher = more secure but slower
// 12 is the sweet spot recommended by the TDD
const BCRYPT_ROUNDS = 12;

/**
 * sendRegistrationOTPs — Sends OTPs to email and/or phone.
 */
async function sendRegistrationOTPs(data) {
  const promises = [];
  
  if (data.email) {
    const emailOtp = otpService.generateOTP();
    await otpService.storeOTP(data.email, 'register', emailOtp);
    promises.push(otpService.sendOTPviaEmail(data.email, emailOtp));
  }

  if (data.phone) {
    const phoneOtp = otpService.generateOTP();
    await otpService.storeOTP(data.phone, 'register', phoneOtp);
    promises.push(otpService.sendOTPviaSMS(data.phone, phoneOtp));
  }

  await Promise.all(promises);
  return { message: 'OTPs sent successfully.' };
}

/**
 * verifyRegistrationOTPs — Verifies OTPs and caches the verified status.
 */
async function verifyRegistrationOTPs(data) {
  if (!data.isGoogleAuth) {
    if (!data.emailOtp) throw ApiError.badRequest('Email OTP is required.', 'OTP_REQUIRED');
    const emailResult = await otpService.verifyOTP(data.email, 'register', data.emailOtp);
    if (!emailResult.valid) throw ApiError.badRequest(emailResult.error, 'OTP_INVALID');
  }

  if (!data.phoneOtp) throw ApiError.badRequest('Phone OTP is required.', 'OTP_REQUIRED');
  const phoneResult = await otpService.verifyOTP(data.phone, 'register', data.phoneOtp);
  if (!phoneResult.valid) throw ApiError.badRequest(phoneResult.error, 'OTP_INVALID');

  if (data.isGoogleAuth) {
    // For Google auth, email is already verified. We just verify phone.
    await redis.set(`verified_contact:${data.phone}`, 'true', 'EX', 1800);
  } else {
    // Mark both as verified together
    await redis.set(`verified_contact:${data.email}:${data.phone}`, 'true', 'EX', 1800);
  }

  return { message: 'Contacts verified successfully.' };
}

/**
 * registerSchool — Registers a new school account.
 *
 * FLOW:
 * 1. Validate inputs & Check if email/phone already exists
 * 2. Ensure contacts are verified in Redis
 * 3. Check free school limit
 * 4. Create User (VERIFIED) + School records
 * 5. Generate and email temporary password
 *
 * @param {Object} data — Validated registration data from request body
 * @returns {Object} — { userId, message }
 */
async function registerSchool(data) {
  // --- Step 1: Check if email already exists ---
  // We use a GENERIC message to prevent "email enumeration" attacks.
  // If we said "This email is already registered," an attacker could
  // test emails to find out who has accounts on our platform.
  const existingUser = await prisma.user.findFirst({
    where: {
      email: data.email,
      deletedAt: null, // Only check non-deleted users
    },
  });

  if (existingUser) {
    throw ApiError.conflict(
      'Registration could not be completed. If you already have an account, please log in.',
      'REGISTRATION_FAILED'
    );
  }

  // --- Step 2: Check phone uniqueness within SCHOOL role ---
  // TDD says: same phone can be used for school AND candidate (dual role allowed)
  // But NOT two schools with the same phone.
  const existingPhone = await prisma.user.findFirst({
    where: {
      phone: data.phone,
      role: 'SCHOOL',
      deletedAt: null,
    },
  });

  if (existingPhone) {
    throw ApiError.conflict(
      'Registration could not be completed. If you already have an account, please log in.',
      'REGISTRATION_FAILED'
    );
  }

  // --- Ensure contacts were verified ---
  let isEmailVerified = false;
  let isPhoneVerified = false;

  if (data.isGoogleAuth) {
    isEmailVerified = await redis.get(`verified_contact:${data.email}:google`);
    isPhoneVerified = await redis.get(`verified_contact:${data.phone}`);
  } else {
    isEmailVerified = await redis.get(`verified_contact:${data.email}:${data.phone}`);
    isPhoneVerified = isEmailVerified;
  }

  if (!isEmailVerified || !isPhoneVerified) {
    throw ApiError.forbidden('Contacts not verified or session expired. Please verify again.', 'NOT_VERIFIED');
  }

  // --- Step 3: Check free school limit ---
  // Redis INCR is atomic — even if 10 schools register simultaneously,
  // each gets a unique counter value. No race conditions.
  const schoolCount = await redis.incr('school:registration:count');

  // If this is the first time (key didn't exist), sync with DB
  if (schoolCount === 1) {
    const dbCount = await prisma.school.count();
    if (dbCount > 0) {
      await redis.set('school:registration:count', dbCount + 1);
    }
  }

  const isFree = schoolCount <= parseInt(process.env.FREE_SCHOOL_LIMIT || '200', 10);

  // --- Step 4: Generate a temporary password for the school ---
  // TDD says: admin generates username + temp password, emails it.
  // For now, we create a random temp password during registration.
  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  // --- Step 5: Create User + School in a TRANSACTION ---
  // A transaction ensures BOTH records are created or NEITHER is.
  // If creating the School fails, the User is rolled back too.
  // Without a transaction, you could end up with a User without a School.
  const result = await prisma.$transaction(async (tx) => {
    // Create the User record (login credentials)
    const user = await tx.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: 'SCHOOL',
        status: 'VERIFIED', // Set to VERIFIED immediately
        passwordChanged: false, // Must change password on first login
      },
    });

    // Create the School record (profile details)
    const school = await tx.school.create({
      data: {
        userId: user.id,
        schoolName: data.schoolName,
        affiliationNo: data.affiliationNo,
        address: data.address,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        contactNo: data.contactNo,
        email: data.email,
        principalName: data.principalName,
        schoolLevel: data.schoolLevel,
        board: data.board,
        strength: data.strength,
        isFree,
        paymentStatus: isFree ? null : 'CREATED',
      },
    });

    return { user, school };
  });

  // Clean up Redis verification state
  await redis.del(`verified_contact:${data.email}:${data.phone}`);

  // Email the temporary password to the school
  const mailer = require('../utils/mailer');
  await mailer.sendSchoolCredentials(data.email, tempPassword);

  logger.info(`School registered & verified: ${data.schoolName} (${logger.maskEmail(data.email)}), isFree: ${isFree}`);

  return {
    userId: result.user.id,
    message: 'Registration successful. Your credentials have been emailed to you.',
    tempPassword: process.env.NODE_ENV !== 'production' ? tempPassword : undefined,
    // Only include temp password in dev for testing
    isFree,
    requiresPayment: !isFree,
  };
}

/**
 * registerCandidate — Registers a new candidate account.
 *
 * Similar to school registration, but:
 * - Candidate sets their OWN password (no temp password)
 * - No payment required
 * - Additional profile fields (qualifications, experience, etc.)
 */
async function registerCandidate(data) {
  // Check email uniqueness
  const existingUser = await prisma.user.findFirst({
    where: { email: data.email, deletedAt: null },
  });

  if (existingUser) {
    throw ApiError.conflict(
      'Registration could not be completed. If you already have an account, please log in.',
      'REGISTRATION_FAILED'
    );
  }

  // Check phone uniqueness within CANDIDATE role
  const existingPhone = await prisma.user.findFirst({
    where: { phone: data.phone, role: 'CANDIDATE', deletedAt: null },
  });

  if (existingPhone) {
    throw ApiError.conflict(
      'Registration could not be completed. If you already have an account, please log in.',
      'REGISTRATION_FAILED'
    );
  }

  // Ensure contacts were verified
  let isEmailVerified = false;
  let isPhoneVerified = false;

  if (data.isGoogleAuth) {
    isEmailVerified = await redis.get(`verified_contact:${data.email}:google`);
    isPhoneVerified = await redis.get(`verified_contact:${data.phone}`);
  } else {
    isEmailVerified = await redis.get(`verified_contact:${data.email}:${data.phone}`);
    isPhoneVerified = isEmailVerified;
  }

  if (!isEmailVerified || !isPhoneVerified) {
    throw ApiError.forbidden('Contacts not verified or session expired. Please verify again.', 'NOT_VERIFIED');
  }

  // Hash the password (candidate sets their own)
  const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  // Create User + Candidate in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: 'CANDIDATE',
        status: 'VERIFIED',
        passwordChanged: true, // Candidate set their own password — no need to force change
      },
    });

    const candidate = await tx.candidate.create({
      data: {
        userId: user.id,
        name: data.name,
        contactNo: data.contactNo,
        email: data.email,
        whatsappNo: data.whatsappNo,
        gender: data.gender,
        dob: new Date(data.dob),
        address: data.address,
        primaryRole: data.primaryRole,
        qualifications: data.qualifications,
        experience: data.experience || [],
        expectedSalary: data.expectedSalary,
        locationInterested: data.locationInterested,
      },
    });

    return { user, candidate };
  });

  // Clean up Redis verification state
  await redis.del(`verified_contact:${data.email}:${data.phone}`);

  logger.info(`Candidate registered & verified: ${data.name} (${logger.maskEmail(data.email)})`);

  return {
    userId: result.user.id,
    message: 'Registration successful. You can now log in.',
  };
}

/**
 * resolveGoogleToken — Shared helper to extract user info from any Google token.
 *
 * Handles TWO token types:
 *   1. JWT ID Tokens (3 dot-separated segments) — verified via google-auth-library's verifyIdToken().
 *      Returned by the GoogleLogin component / One Tap.
 *   2. OAuth Access Tokens (ya29.xxx) — resolved via Google's UserInfo API.
 *      Returned by useGoogleLogin() with the implicit grant flow.
 *
 * Returns: { email, name }
 */
async function resolveGoogleToken(token) {
  // Dev mock: skip real verification when no client ID is configured
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('your_')) {
    logger.warn('Google Client ID not configured. MOCKING Google Auth success.');
    return { email: 'mockuser@gmail.com', name: 'Mock User' };
  }

  const isJwt = token.split('.').length === 3;

  if (isJwt) {
    // Path A: JWT ID Token — verify signature and audience locally
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return { email: payload.email, name: payload.name };
  }

  // Path B: OAuth Access Token — call Google's UserInfo endpoint
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google UserInfo API returned ${response.status}: ${body}`);
  }

  const data = await response.json();
  if (!data.email) {
    throw new Error('Google UserInfo response missing email.');
  }

  return { email: data.email, name: data.name || '' };
}

/**
 * googleInit — Step 1 of Onboarding via Google
 * Verifies Google Token and caches email as VERIFIED.
 */
async function googleInit(token) {
  try {
    const { email, name } = await resolveGoogleToken(token);

    // Cache the email as verified for 30 minutes
    await redis.set(`verified_contact:${email}:google`, 'true', 'EX', 1800);

    return { email, name, message: 'Google authentication successful. Please verify your phone number to continue.' };
  } catch (error) {
    logger.error('Google Auth verification failed: ' + error.message);
    throw ApiError.unauthorized('Invalid Google token.');
  }
}

/**
 * googleLogin — Unified Login via Google
 */
async function googleLogin(token) {
  try {
    const { email, name } = await resolveGoogleToken(token);

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        school: { select: { id: true } },
        candidate: { select: { id: true } },
      },
    });

    if (!user) {
      return { isNewUser: true, email, name };
    }

    if (user.status === 'PENDING') throw ApiError.forbidden('Please verify your account first.', 'ACCOUNT_NOT_VERIFIED');
    if (user.status === 'DISMISSED') throw ApiError.forbidden('Your account has been suspended. Contact support.', 'ACCOUNT_DISMISSED');

    const userForToken = {
      id: user.id,
      role: user.role,
      schoolId: user.school?.id || null,
      candidateId: user.candidate?.id || null,
    };

    const accessToken = tokenService.generateAccessToken(userForToken);
    const refreshToken = await tokenService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        passwordChanged: user.passwordChanged,
        schoolId: user.school?.id,
        candidateId: user.candidate?.id,
      },
    };
  } catch (error) {
    logger.error('Google Login failed: ' + error.message);
    throw ApiError.unauthorized('Invalid Google token.');
  }
}

/**
 * legacy verifyRegistrationOTP (deprecated)
 */
async function verifyRegistrationOTP(data) {
  throw ApiError.badRequest('This endpoint is deprecated. Use inline stepper verification.');
}

/**
 * login — Authenticates a user with email/phone + password.
 *
 * FLOW:
 * 1. Find user by email or phone
 * 2. Check if account is locked (too many failed attempts)
 * 3. Compare password with stored hash
 * 4. If wrong → increment failed attempts → maybe lock account
 * 5. If correct → reset failed attempts → generate tokens → return
 */
async function login(data) {
  // --- Step 1: Find the user ---
  const user = await prisma.user.findFirst({
    where: {
      ...(data.email ? { email: data.email } : { phone: data.phone }),
      deletedAt: null,
    },
    include: {
      school: { select: { id: true } },
      candidate: { select: { id: true } },
    },
  });

  // Use the same error message whether the user doesn't exist
  // or the password is wrong — prevents user enumeration
  if (!user) {
    throw ApiError.unauthorized('Invalid credentials. Please check your email/phone and password.');
  }

  // --- Step 2: Check account status ---
  if (user.status === 'PENDING') {
    throw ApiError.forbidden('Please verify your account first.', 'ACCOUNT_NOT_VERIFIED');
  }

  if (user.status === 'DISMISSED') {
    throw ApiError.forbidden('Your account has been suspended. Contact support.', 'ACCOUNT_DISMISSED');
  }

  // --- Step 3: Check if account is locked ---
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw ApiError.forbidden(
      `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
      'ACCOUNT_LOCKED'
    );
  }

  // --- Step 4: Verify password ---
  // bcrypt.compare hashes the provided password with the SAME salt
  // and algorithm as the stored hash, then compares
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    // Wrong password — increment failed attempts
    const newAttempts = user.failedLoginAttempts + 1;

    const updateData = {
      failedLoginAttempts: newAttempts,
    };

    // Lock account after 5 failed attempts
    if (newAttempts >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      logger.warn(`Account locked: ${logger.maskEmail(user.email)} (5 failed attempts)`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    throw ApiError.unauthorized('Invalid credentials. Please check your email/phone and password.');
  }

  // --- Step 5: Password correct! Reset failed attempts ---
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // --- Step 6: Handle Admin 2FA ---
  if (user.role === 'ADMIN') {
    const adminOtp = otpService.generateOTP();
    await otpService.storeOTP(user.id, 'admin-login', adminOtp);
    await otpService.sendOTPviaEmail(user.email, adminOtp);
    
    logger.info(`Admin login 2FA OTP sent: ${logger.maskEmail(user.email)}`);
    
    return {
      requires2FA: true,
      userId: user.id,
      email: user.email,
    };
  }
  if (data.deviceFingerprint && data.deviceName) {
    const isTrusted = await prisma.trustedDevice.findUnique({
      where: {
        userId_deviceFingerprint: {
          userId: user.id,
          deviceFingerprint: data.deviceFingerprint,
        },
      },
    });

    if (!isTrusted) {
      // It's an unrecognized device — send "New Login" alert
      logger.info(`New device login detected for ${user.email}: ${data.deviceName}`);
      
      // In a full implementation, we'd generate a token here and include it in the email
      // so the user can click "Yes, it was me" to add it to trusted devices.
      // For MVP, we'll just log it and simulate sending the email via otpService.
      // await otpService.sendNewDeviceLoginEmail(user.email, data.deviceName, data.locationCity);
    } else {
      // Update last used timestamp
      await prisma.trustedDevice.update({
        where: { id: isTrusted.id },
        data: { lastUsedAt: new Date(), ipAddress: data.ipAddress || isTrusted.ipAddress, locationCity: data.locationCity || isTrusted.locationCity },
      });
    }
  }

  // --- Step 8: Generate tokens (Non-Admin) ---
  const userForToken = {
    id: user.id,
    role: user.role,
    schoolId: user.school?.id || null,
    candidateId: user.candidate?.id || null,
  };

  const accessToken = tokenService.generateAccessToken(userForToken);
  const refreshToken = await tokenService.generateRefreshToken(user.id);

  logger.info(`User logged in: ${logger.maskEmail(user.email)} (${user.role})`);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      passwordChanged: user.passwordChanged,
      schoolId: user.school?.id,
      candidateId: user.candidate?.id,
    },
  };
}

/**
 * verifyAdmin2FA — Verifies the OTP sent during Admin login.
 */
async function verifyAdmin2FA(userId, otp) {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: 'ADMIN', deletedAt: null },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid user or role.');
  }

  // Verify OTP
  const otpResult = await otpService.verifyOTP(userId, 'admin-login', otp);
  if (!otpResult.valid) {
    throw ApiError.badRequest(otpResult.error, 'OTP_INVALID');
  }

  // Generate tokens
  const userForToken = {
    id: user.id,
    role: user.role,
  };

  const accessToken = tokenService.generateAccessToken(userForToken);
  const refreshToken = await tokenService.generateRefreshToken(user.id);

  logger.info(`Admin logged in (2FA passed): ${logger.maskEmail(user.email)}`);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      passwordChanged: user.passwordChanged,
    },
  };
}

/**
 * refreshAccessToken — Uses a refresh token to get a new access token.
 *
 * This is called when the access token expires (every 15 minutes).
 * The refresh token is CONSUMED (deleted) and a new pair is created.
 * This is called "Token Rotation."
 */
async function refreshAccessToken(refreshToken) {
  // Verify and consume the refresh token
  const result = await tokenService.verifyRefreshToken(refreshToken);

  if (!result) {
    throw ApiError.unauthorized('Invalid or expired refresh token. Please log in again.');
  }

  // Fetch fresh user data (the user might have been suspended since the token was issued)
  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    include: {
      school: { select: { id: true } },
      candidate: { select: { id: true } },
    },
  });

  if (!user || user.deletedAt || user.status === 'DISMISSED') {
    throw ApiError.unauthorized('Account is no longer active. Please contact support.');
  }

  // Generate new token pair
  const userForToken = {
    id: user.id,
    role: user.role,
    schoolId: user.school?.id || null,
    candidateId: user.candidate?.id || null,
  };

  const newAccessToken = tokenService.generateAccessToken(userForToken);
  const newRefreshToken = await tokenService.generateRefreshToken(user.id);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * changePassword — Changes a user's password.
 *
 * Used for:
 * - Schools changing their temporary password (first login)
 * - Any user changing their password voluntarily
 *
 * TDD Rule: Cannot reuse last 3 passwords.
 */
async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  // Check password history — cannot reuse last 3 passwords
  for (const oldHash of user.passwordHistory) {
    const isReused = await bcrypt.compare(newPassword, oldHash);
    if (isReused) {
      throw ApiError.badRequest(
        'Cannot reuse any of your last 3 passwords. Please choose a different password.'
      );
    }
  }

  // Hash the new password
  const hashedNewPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password history (keep last 3)
  // .slice(-2) keeps the last 2 items, then we add the current password hash → 3 total
  const newHistory = [...user.passwordHistory.slice(-2), user.password];

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedNewPassword,
      passwordChanged: true, // Important for schools — removes the "change password" redirect
      passwordHistory: newHistory,
    },
  });

  // Revoke all existing tokens (force re-login with new password)
  await tokenService.revokeAllUserTokens(userId);

  logger.info(`Password changed for user: ${user.id}`);

  return { message: 'Password changed successfully. Please log in again.' };
}

/**
 * logout — Invalidates the user's tokens.
 */
async function logout(refreshToken) {
  if (refreshToken) {
    // If we have the refresh token, delete it from Redis
    await tokenService.verifyRefreshToken(refreshToken); // This deletes it
  }
  return { message: 'Logged out successfully.' };
}

// --- Helper: Generate a random temporary password ---
// Creates something like "Tmp@8x7K2m" — meets the password policy
function generateTempPassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '@$!%*?&';
  const all = upper + lower + digits + special;

  // Ensure at least one of each required character type
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining characters randomly (total length: 12)
  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password so the pattern isn't predictable
  return password
    .split('')
    .sort(() => Math.random() - 0.5) // Random sort
    .join('');
}

module.exports = {
  sendRegistrationOTPs,
  verifyRegistrationOTPs,
  googleInit,
  googleLogin,
  registerSchool,
  registerCandidate,
  verifyRegistrationOTP,
  login,
  verifyAdmin2FA,
  refreshAccessToken,
  changePassword,
  logout,
};
