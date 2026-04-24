/**
 * ============================================================
 * FILE: src/services/feedback.service.js — Post-Placement Feedback
 * ============================================================
 *
 * After a candidate is selected, both school and candidate can
 * submit feedback. Feedback is ADMIN-ONLY visible.
 * ============================================================
 */

const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * submit — Submit placement feedback.
 * @param {string} pipelineId — The pipeline (must be SELECTED status)
 * @param {string} reviewerRole — 'SCHOOL' or 'CANDIDATE'
 * @param {Object} data — { rating: 1-5, comment }
 */
async function submit(pipelineId, reviewerRole, data) {
  const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } });
  if (!pipeline) throw ApiError.notFound('Pipeline not found.');
  if (pipeline.status !== 'SELECTED') throw ApiError.conflict('Feedback can only be submitted for completed placements.');

  // Check for duplicate
  const existing = await prisma.feedback.findUnique({
    where: { pipelineId_reviewerRole: { pipelineId, reviewerRole } },
  });
  if (existing) throw ApiError.conflict('You have already submitted feedback for this placement.');

  const feedback = await prisma.feedback.create({
    data: {
      pipelineId,
      candidateId: pipeline.candidateId,
      reviewerRole,
      rating: Math.min(5, Math.max(1, data.rating)),
      comment: data.comment || null,
    },
  });

  return feedback;
}

/**
 * getForPipeline — Get feedback for a pipeline (admin only).
 */
async function getForPipeline(pipelineId) {
  return prisma.feedback.findMany({
    where: { pipelineId },
    include: { candidate: { select: { name: true } } },
  });
}

/**
 * getAverageRating — Get overall platform rating stats (admin dashboard).
 */
async function getAverageRating() {
  const result = await prisma.feedback.aggregate({
    _avg: { rating: true },
    _count: { rating: true },
  });
  return { averageRating: result._avg.rating || 0, totalFeedbacks: result._count.rating };
}

module.exports = { submit, getForPipeline, getAverageRating };
