/**
 * ============================================================
 * FILE: src/validators/candidate.validator.js — Candidate Validation
 * ============================================================
 */

const { z } = require('zod');

/** Update Candidate Profile */
const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).max(200).trim().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    address: z.string().min(5).max(500).trim().optional(),
    primaryRole: z.string().min(2).max(100).trim().optional(),
    qualifications: z
      .array(
        z.object({
          degree: z.string().min(1).trim(),
          university: z.string().min(1).trim(),
          year: z.number().int().min(1950).max(new Date().getFullYear()),
        })
      )
      .min(1)
      .optional(),
    experience: z
      .array(
        z.object({
          school: z.string().trim(),
          role: z.string().trim(),
          years: z.number().min(0),
        })
      )
      .optional(),
    expectedSalary: z.number().int().positive().optional(),
    locationInterested: z.array(z.string().trim()).min(1).optional(),
    whatsappNo: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid WhatsApp number')
      .optional(),
  }),
};

module.exports = {
  updateProfileSchema,
};
