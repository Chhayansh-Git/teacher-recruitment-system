/**
 * ============================================================
 * FILE: src/validators/auth.validator.js — Auth Input Validation Schemas
 * ============================================================
 *
 * WHAT: Zod schemas that define exactly what valid registration and
 *       login data looks like. These are used by the validate middleware.
 *
 * WHY SEPARATE FILE?
 *       Keeps validation logic separate from route definitions.
 *       Routes say "what URL goes where." Validators say "what data is valid."
 *       This separation makes both easier to read and maintain.
 *
 * ZOD CHEAT SHEET (used throughout this file):
 *       z.string()          — Must be a string
 *       z.string().email()  — Must be a valid email format
 *       z.string().min(8)   — Must be at least 8 characters
 *       z.string().max(50)  — Must be at most 50 characters
 *       z.string().regex()  — Must match a regular expression pattern
 *       z.string().trim()   — Remove whitespace from both ends
 *       z.number()          — Must be a number
 *       z.number().int()    — Must be a whole number (integer)
 *       z.enum(['A', 'B'])  — Must be one of these exact values
 *       z.optional()        — Field is not required
 *       z.array()           — Must be an array
 *       z.object({})        — Must be an object with specific fields
 *       .refine(fn, msg)    — Custom validation function
 *
 * REGEX PATTERNS EXPLAINED:
 *       /^[6-9]\d{9}$/  — Indian phone number:
 *         ^    = start of string
 *         [6-9] = first digit must be 6, 7, 8, or 9
 *         \d{9} = followed by exactly 9 digits
 *         $    = end of string
 *         Total: 10 digits starting with 6-9
 *
 *       /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/  — Password complexity:
 *         (?=.*[a-z])   = must contain at least one lowercase letter
 *         (?=.*[A-Z])   = must contain at least one uppercase letter
 *         (?=.*\d)      = must contain at least one digit
 *         (?=.*[@$!...]) = must contain at least one special character
 * ============================================================
 */

const { z } = require('zod');

// --- Reusable field validators ---
// These are used across multiple schemas to avoid repetition.

/**
 * Indian phone number validation.
 * Must be 10 digits starting with 6, 7, 8, or 9.
 */
const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Phone number must be 10 digits starting with 6-9');

/**
 * Strong password validation.
 * At least 8 characters with uppercase, lowercase, digit, and special character.
 * This matches the TDD password policy.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters')
  .regex(
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
    'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&#)'
  );

/**
 * Indian PIN code validation.
 * Must be exactly 6 digits.
 */
const pinCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'PIN code must be exactly 6 digits');

// ============================================================
// REGISTRATION SCHEMAS
// ============================================================

/**
 * School Registration Schema
 *
 * Schools provide their school details + login credentials.
 * After registration, admin sends them a username + temp password.
 * But for the initial registration, they provide their own email/phone.
 */
const schoolRegisterSchema = {
  body: z.object({
    // Personal/login fields
    email: z.string().email('Please provide a valid email address').trim().toLowerCase(),
    phone: phoneSchema,

    // School details
    schoolName: z.string().min(2, 'School name must be at least 2 characters').max(200).trim(),
    affiliationNo: z.string().max(50).trim().optional(),
    address: z.string().min(5, 'Address must be at least 5 characters').max(500).trim(),
    city: z.string().min(2).max(100).trim(),
    state: z.string().min(2).max(100).trim(),
    pinCode: pinCodeSchema,
    contactNo: phoneSchema,
    principalName: z.string().min(2).max(200).trim(),
    schoolLevel: z.enum(['Primary', 'Secondary', 'Senior Secondary'], {
      errorMap: () => ({ message: 'School level must be Primary, Secondary, or Senior Secondary' }),
    }),
    board: z.enum(['CBSE', 'ICSE', 'State Board', 'IB', 'Other'], {
      errorMap: () => ({ message: 'Board must be CBSE, ICSE, State Board, IB, or Other' }),
    }),
    strength: z.number().int().positive().optional(),
    // .int() = must be a whole number (no 150.5 students)
    // .positive() = must be greater than 0
  }),
};

/**
 * Candidate Registration Schema
 *
 * Candidates provide their profile data + credentials.
 * They set their own password during registration (unlike schools).
 */
const candidateRegisterSchema = {
  body: z.object({
    // Personal/login fields
    email: z.string().email('Please provide a valid email address').trim().toLowerCase(),
    phone: phoneSchema,
    password: passwordSchema,

    // Profile details
    name: z.string().min(2, 'Name must be at least 2 characters').max(200).trim(),
    gender: z.enum(['Male', 'Female', 'Other']),
    dob: z.string().refine(
      // Custom validation: check if it's a valid date and the person is at least 18
      (val) => {
        const date = new Date(val);
        const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return !isNaN(date.getTime()) && age >= 18;
      },
      { message: 'Must be a valid date and candidate must be at least 18 years old' }
    ),
    address: z.string().min(5).max(500).trim(),
    contactNo: phoneSchema,
    whatsappNo: phoneSchema.optional(),

    // Professional details
    primaryRole: z.string().min(2).max(100).trim(),
    qualifications: z.array(
      z.object({
        degree: z.string().min(1).trim(),
        university: z.string().min(1).trim(),
        year: z.number().int().min(1950).max(new Date().getFullYear()),
      })
    ).min(1, 'At least one qualification is required'),

    experience: z.array(
      z.object({
        school: z.string().trim(),
        role: z.string().trim(),
        years: z.number().min(0),
      })
    ).optional().default([]),

    expectedSalary: z.number().int().positive().optional(),
    locationInterested: z.array(z.string().trim()).min(1, 'At least one location is required'),
  }),
};

// ============================================================
// LOGIN & AUTH SCHEMAS
// ============================================================

/** Login: email/phone + password */
const loginSchema = {
  body: z.object({
    // The user can log in with either email or phone
    email: z.string().email().trim().toLowerCase().optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(1, 'Password is required'),
  }).refine(
    // At least one of email or phone must be provided
    (data) => data.email || data.phone,
    { message: 'Please provide either email or phone number' }
  ),
};

/** OTP Verification */
const verifyOtpSchema = {
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    phone: phoneSchema,
    emailOtp: z.string().length(6, 'OTP must be exactly 6 digits'),
    phoneOtp: z.string().length(6, 'OTP must be exactly 6 digits'),
  }),
};

/** Password Change */
const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }).refine(
    // New password must be different from current password
    (data) => data.currentPassword !== data.newPassword,
    { message: 'New password must be different from current password' }
  ),
};

/** Forgot Password — Request OTP */
const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
  }),
};

/** Reset Password — OTP + New Password */
const resetPasswordSchema = {
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    newPassword: passwordSchema,
  }),
};

module.exports = {
  schoolRegisterSchema,
  candidateRegisterSchema,
  loginSchema,
  verifyOtpSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
