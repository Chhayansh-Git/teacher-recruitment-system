/**
 * ============================================================
 * FILE: src/controllers/admin.controller.js — Admin Route Handlers
 * ============================================================
 *
 * WHAT: Handles all admin operations:
 *       - View all schools, candidates, requirements
 *       - Approve/reject shortlists
 *       - Push candidates to schools
 *       - Release pipelines
 *       - Dismiss users
 *       - View moderation queue (flagged messages)
 *
 * IMPORTANT: Every admin action is logged in the audit trail.
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { prisma } = require('../config/database');
const pipelineService = require('../services/pipeline.service');
const logger = require('../utils/logger');

/** GET /api/v1/admin/schools — List all schools (paginated) */
const getSchools = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [schools, total] = await prisma.$transaction([
    prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit, 10),
      include: {
        user: { select: { email: true, phone: true, status: true, createdAt: true } },
        _count: { select: { requirements: true, pipelines: true } },
      },
    }),
    prisma.school.count(),
  ]);

  res.json(ApiResponse.paginated(schools, parseInt(page, 10), parseInt(limit, 10), total));
});

/** GET /api/v1/admin/candidates — List all candidates (paginated) */
const getCandidates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status; // Filter by status if provided

  const [candidates, total] = await prisma.$transaction([
    prisma.candidate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit, 10),
      include: {
        user: { select: { email: true, phone: true, status: true } },
      },
    }),
    prisma.candidate.count({ where }),
  ]);

  res.json(ApiResponse.paginated(candidates, parseInt(page, 10), parseInt(limit, 10), total));
});

/** GET /api/v1/admin/shortlists/pending — View pending shortlists */
const getPendingShortlists = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await pipelineService.getPendingShortlists(
    parseInt(page || 1, 10),
    parseInt(limit || 20, 10)
  );
  res.json(ApiResponse.paginated(result.shortlists, result.page, result.limit, result.total));
});

/** POST /api/v1/admin/shortlists/:id/approve */
const approveShortlist = asyncHandler(async (req, res) => {
  const result = await pipelineService.approveShortlist(req.params.id, req.body.notes);

  // Log the admin action
  await createAuditLog(req, 'APPROVE', 'shortlist', req.params.id, null, { status: 'APPROVED' });

  res.json(ApiResponse.success(result, 'Shortlist approved'));
});

/** POST /api/v1/admin/shortlists/:id/reject */
const rejectShortlist = asyncHandler(async (req, res) => {
  const result = await pipelineService.rejectShortlist(req.params.id, req.body.notes);

  await createAuditLog(req, 'REJECT', 'shortlist', req.params.id, null, {
    status: 'REJECTED',
    reason: req.body.notes,
  });

  res.json(ApiResponse.success(result, 'Shortlist rejected'));
});

/** POST /api/v1/admin/pipelines/push — Push a candidate to a school */
const pushCandidate = asyncHandler(async (req, res) => {
  const result = await pipelineService.pushCandidate(req.body.shortlistId);

  await createAuditLog(req, 'PUSH', 'pipeline', result.id, null, {
    shortlistId: req.body.shortlistId,
    candidateId: result.candidateId,
    schoolId: result.schoolId,
  });

  res.status(201).json(ApiResponse.success(result, 'Candidate pushed successfully'));
});

/** POST /api/v1/admin/pipelines/:id/release — Release a candidate */
const releasePipeline = asyncHandler(async (req, res) => {
  await pipelineService.releasePipeline(req.params.id, req.body.reason);

  await createAuditLog(req, 'RELEASE', 'pipeline', req.params.id, { status: 'ACTIVE' }, {
    status: 'RELEASED',
    reason: req.body.reason,
  });

  res.json(ApiResponse.success(null, 'Pipeline released'));
});

/** POST /api/v1/admin/pipelines/:id/select — Confirm candidate selection */
const selectCandidate = asyncHandler(async (req, res) => {
  await pipelineService.selectCandidate(req.params.id);

  await createAuditLog(req, 'SELECT', 'pipeline', req.params.id, { status: 'ACTIVE' }, {
    status: 'SELECTED',
  });

  res.json(ApiResponse.success(null, 'Candidate selected and locked in'));
});

/** POST /api/v1/admin/users/:id/dismiss — Ban a user */
const dismissUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    return res.status(400).json(
      ApiResponse.error('Dismissal reason must be at least 10 characters.', 'VALIDATION_ERROR', 400)
    );
  }

  // Update user status to DISMISSED
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'DISMISSED' },
  });

  // If the user is a candidate, dismiss them and release any active pipelines
  if (user.role === 'CANDIDATE') {
    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.id },
    });

    if (candidate) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { status: 'DISMISSED' },
      });

      // Release any active pipeline
      const activePipeline = await prisma.pipeline.findFirst({
        where: { candidateId: candidate.id, status: 'ACTIVE' },
      });

      if (activePipeline) {
        await pipelineService.releasePipeline(activePipeline.id, `User dismissed: ${reason}`);
      }
    }
  }

  await createAuditLog(req, 'DISMISS', 'user', req.params.id, { status: user.status }, {
    status: 'DISMISSED',
    reason,
  });

  logger.warn(`User dismissed: ${req.params.id}, reason: ${reason}`);
  res.json(ApiResponse.success(null, 'User dismissed'));
});

/** GET /api/v1/admin/dashboard — Admin dashboard stats */
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalSchools,
    totalCandidates,
    activePipelines,
    pendingShortlists,
    selectedPlacements,
    activeLockIns,
    flaggedMessages,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.candidate.count(),
    prisma.pipeline.count({ where: { status: 'ACTIVE' } }),
    prisma.shortlist.count({ where: { status: 'PENDING' } }),
    prisma.pipeline.count({ where: { status: 'SELECTED' } }),
    prisma.lockIn.count({ where: { status: 'ACTIVE' } }),
    prisma.message.count({ where: { isFlagged: true } }),
  ]);

  res.json(
    ApiResponse.success({
      totalSchools,
      totalCandidates,
      activePipelines,
      pendingShortlists,
      selectedPlacements,
      activeLockIns,
      flaggedMessages,
    })
  );
});

// --- Helper: Create an audit log entry ---
async function createAuditLog(req, action, resourceType, resourceId, oldValues, newValues) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action,
        resourceType,
        resourceId,
        oldValues: oldValues || undefined,
        newValues: newValues || undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  } catch (error) {
    // Audit log failure should NEVER break the actual operation
    logger.error('Failed to create audit log:', error.message);
  }
}

/** PUT /api/v1/admin/config/fee */
const updateFeeConfig = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 0) {
    return res.status(400).json(ApiResponse.error('Invalid fee amount', 'VALIDATION_ERROR', 400));
  }
  
  const redis = require('../config/redis');
  await redis.set('config:registration_fee', amount);
  await createAuditLog(req, 'UPDATE', 'config', 'fee', null, { amount });
  res.json(ApiResponse.success({ amount }, 'Fee configuration updated'));
});

/** GET /api/v1/admin/reports/:type */
const getReports = asyncHandler(async (req, res) => {
  const { type } = req.params;
  let data;
  
  if (type === 'registrations') {
    const schools = await prisma.school.count();
    const candidates = await prisma.candidate.count();
    data = { schools, candidates };
  } else if (type === 'placements') {
    const selected = await prisma.pipeline.count({ where: { status: 'SELECTED' } });
    const released = await prisma.pipeline.count({ where: { status: 'RELEASED' } });
    data = { selected, released };
  } else {
    return res.status(400).json(ApiResponse.error('Invalid report type', 'VALIDATION_ERROR', 400));
  }
  
  res.json(ApiResponse.success(data));
});

module.exports = {
  getSchools,
  getCandidates,
  getPendingShortlists,
  approveShortlist,
  rejectShortlist,
  pushCandidate,
  releasePipeline,
  selectCandidate,
  dismissUser,
  getDashboard,
  updateFeeConfig,
  getReports,
};
