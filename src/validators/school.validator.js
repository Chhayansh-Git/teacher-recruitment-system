/**
 * ============================================================
 * FILE: src/validators/school.validator.js — School Validation Schemas
 * ============================================================
 *
 * Zod schemas for all school-related endpoints:
 * - Profile update
 * - Creating requirements (job postings)
 * - Shortlisting candidates
 * ============================================================
 */

const { z } = require('zod');

/** Update School Profile */
const updateProfileSchema = {
  body: z.object({
    schoolName: z.string().min(2).max(200).trim().optional(),
    affiliationNo: z.string().max(50).trim().optional(),
    address: z.string().min(5).max(500).trim().optional(),
    city: z.string().min(2).max(100).trim().optional(),
    state: z.string().min(2).max(100).trim().optional(),
    pinCode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits').optional(),
    principalName: z.string().min(2).max(200).trim().optional(),
    schoolLevel: z.enum(['Primary', 'Secondary', 'Senior Secondary']).optional(),
    board: z.enum(['CBSE', 'ICSE', 'State Board', 'IB', 'Other']).optional(),
    strength: z.number().int().positive().optional(),
  }),
};

/** Create a Job Requirement */
const createRequirementSchema = {
  body: z.object({
    subjects: z
      .array(z.string().trim())
      .min(1, 'At least one subject is required'),
    postDesignation: z.string().min(2, 'Post designation is required').trim(),
    genderPref: z.enum(['MALE', 'FEMALE', 'ANY']).default('ANY'),
    staffType: z.enum(['TEACHING', 'NON_TEACHING', 'BOTH']).default('TEACHING'),
    qualification: z.string().min(2, 'Qualification is required').trim(),
    experienceMin: z.number().int().min(0).default(0),
    salaryOffered: z.number().int().positive().optional(),
    countNeeded: z.number().int().positive().default(1),
    description: z.string().max(2000).trim().optional(),
  }),
};

/** Shortlist a candidate */
const shortlistSchema = {
  body: z.object({
    requirementId: z.string().uuid('Invalid requirement ID'),
    candidateId: z.string().uuid('Invalid candidate ID'),
  }),
};

/** Common UUID param validation — for routes like /requirements/:id */
const uuidParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
};

/** Pagination query params — reusable across list endpoints */
const paginationSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    // z.coerce.number() converts the string "2" to the number 2
    // (query params always come as strings from the URL)
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};

module.exports = {
  updateProfileSchema,
  createRequirementSchema,
  shortlistSchema,
  uuidParamSchema,
  paginationSchema,
};
