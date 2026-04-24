/**
 * ============================================================
 * FILE: src/validators/interview.validator.js
 * ============================================================
 */

const { z } = require('zod');

const scheduleSchema = z.object({
  body: z.object({
    pipelineId: z.string().uuid('Pipeline ID must be a valid UUID'),
    scheduledAt: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date format'),
    duration: z.number().int().min(15).max(180).optional().default(60),
    mode: z.enum(['VIDEO', 'IN_PERSON', 'PHONE']),
    location: z.string().max(500).optional(),
    meetingLink: z.string().url().optional(),
    notes: z.string().max(1000).optional(),
  }),
});

const rescheduleSchema = z.object({
  body: z.object({
    scheduledAt: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date format'),
    duration: z.number().int().min(15).max(180).optional(),
    mode: z.enum(['VIDEO', 'IN_PERSON', 'PHONE']).optional(),
    location: z.string().max(500).optional(),
    meetingLink: z.string().url().optional(),
    notes: z.string().max(1000).optional(),
  }),
});

module.exports = { scheduleSchema, rescheduleSchema };
