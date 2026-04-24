/**
 * ============================================================
 * FILE: src/validators/feedback.validator.js
 * ============================================================
 */

const { z } = require('zod');

const submitFeedbackSchema = z.object({
  body: z.object({
    pipelineId: z.string().uuid('Pipeline ID must be a valid UUID'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  }),
});

module.exports = { submitFeedbackSchema };
