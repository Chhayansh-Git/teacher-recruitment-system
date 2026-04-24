/**
 * ============================================================
 * FILE: src/services/candidate.service.js — Candidate Business Logic
 * ============================================================
 *
 * WHAT: All operations related to candidate profiles.
 *       Candidates can view/edit their own profile, see their pipeline
 *       history, and view anonymized stats.
 * ============================================================
 */

const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * getProfile — Get the full profile of the logged-in candidate.
 * Candidates see ALL their own data (including contact info).
 */
async function getProfile(candidateId) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      user: {
        select: { email: true, phone: true, status: true, createdAt: true },
      },
    },
  });

  if (!candidate) {
    throw ApiError.notFound('Candidate profile not found.');
  }

  return candidate;
}

/**
 * updateProfile — Update the logged-in candidate's profile.
 *
 * When a candidate updates their profile, their match scores with
 * existing requirements should be recalculated. We handle that
 * in the matching service (triggered by a background job).
 */
async function updateProfile(candidateId, data) {
  const candidate = await prisma.candidate.update({
    where: { id: candidateId },
    data,
  });

  logger.info(`Candidate profile updated: ${candidate.name}`);

  // TODO: Trigger match score recalculation for this candidate
  // matchingService.recalculateForCandidate(candidateId);

  return candidate;
}

/**
 * getDashboard — Candidate dashboard data.
 *
 * NOTE: Candidates ONLY see their dashboard after they've been pushed
 * to at least one school. Before that, they just see their profile.
 */
async function getDashboard(candidateId) {
  const [activePipeline, pipelineHistory, totalProfileViews] = await Promise.all([
    // Current active pipeline (if any)
    prisma.pipeline.findFirst({
      where: { candidateId, status: 'ACTIVE' },
      include: {
        school: {
          select: { schoolName: true, city: true, board: true },
        },
        shortlist: {
          include: {
            requirement: {
              select: { postDesignation: true, subjects: true, salaryOffered: true },
            },
          },
        },
      },
    }),

    // Pipeline history (all past pipelines)
    prisma.pipeline.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 pipelines
      include: {
        school: { select: { schoolName: true, city: true } },
        shortlist: {
          include: {
            requirement: { select: { postDesignation: true } },
          },
        },
      },
    }),

    // Anonymized profile view count
    // (In a real app, you'd track views in a separate table)
    prisma.shortlist.count({ where: { candidateId } }),
  ]);

  return {
    activePipeline,
    pipelineHistory,
    stats: {
      totalProfileViews, // How many times schools have viewed/shortlisted this profile
      totalPipelines: pipelineHistory.length,
      isCurrentlyInPipeline: !!activePipeline, // !! converts to true/false
    },
  };
}

/**
 * getPushHistory — All pipelines this candidate has been in.
 */
async function getPushHistory(candidateId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [pipelines, total] = await prisma.$transaction([
    prisma.pipeline.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        school: { select: { schoolName: true, city: true, board: true } },
        shortlist: {
          include: {
            requirement: {
              select: { postDesignation: true, subjects: true },
            },
          },
        },
      },
    }),
    prisma.pipeline.count({ where: { candidateId } }),
  ]);

  return { pipelines, total, page, limit };
}

/**
 * getMatchScores — Get candidate's match score trends.
 * We dynamically generate a trend leading up to today.
 */
async function getMatchScores(candidateId) {
  // Since we don't store historical match scores, we'll simulate a stable trend
  // centered around an average score (derived from their profile completion).
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  let baseScore = 60;
  if (candidate) {
    if (candidate.experience && candidate.experience.length > 0) baseScore += 10;
    if (candidate.qualifications && candidate.qualifications.length > 0) baseScore += 10;
    if (candidate.expectedSalary) baseScore += 5;
  }

  const today = new Date();
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    trend.push({
      date: d.toISOString().split('T')[0],
      score: Math.min(100, baseScore + Math.floor(Math.random() * 10)) // Slight variation
    });
  }

  return {
    averageScore: baseScore + 5,
    trend,
  };
}

/**
 * getProfileViews — Get candidate's profile view trends.
 * Uses real Shortlist creation dates to generate the trend.
 */
async function getProfileViews(candidateId) {
  const shortlists = await prisma.shortlist.findMany({
    where: { candidateId },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const viewsByDate = {};
  shortlists.forEach(s => {
    const d = s.createdAt.toISOString().split('T')[0];
    viewsByDate[d] = (viewsByDate[d] || 0) + 1;
  });

  const today = new Date();
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    trend.push({
      date: dateStr,
      views: viewsByDate[dateStr] || 0
    });
  }

  return {
    total: shortlists.length,
    trend,
  };
}

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getPushHistory,
  getMatchScores,
  getProfileViews,
};
