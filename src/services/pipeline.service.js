/**
 * ============================================================
 * FILE: src/services/pipeline.service.js — Pipeline & Shortlist Logic
 * ============================================================
 *
 * WHAT: Manages the core recruitment workflow:
 *       School shortlists → Admin approves → Admin pushes → Pipeline created
 *       → Chat opens → Interview → School selects → Lock-in
 *
 * THIS IS THE HEART OF THE BUSINESS LOGIC.
 *
 * KEY RULES:
 *       1. Only ONE active pipeline per candidate (enforced here and by DB index)
 *       2. Only ADMIN can push candidates (create pipelines)
 *       3. When a pipeline is created, a chat thread auto-opens
 *       4. 7-day school inactivity → auto-release (handled by background job)
 *       5. Selection → 1-year lock-in
 * ============================================================
 */

const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * createShortlist — School formally requests to consider a candidate.
 *
 * This doesn't give the school access to the candidate yet.
 * It creates a PENDING shortlist that the admin must approve.
 */
async function createShortlist(schoolId, requirementId, candidateId) {
  // --- Verify the requirement belongs to this school ---
  const requirement = await prisma.requirement.findFirst({
    where: { id: requirementId, schoolId },
  });

  if (!requirement) {
    throw ApiError.notFound('Requirement not found or does not belong to your school.');
  }

  // --- Check if candidate is available ---
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    throw ApiError.notFound('Candidate not found.');
  }

  if (candidate.status !== 'ACTIVE') {
    throw ApiError.conflict(
      'This candidate is currently unavailable (in an active pipeline or locked in).',
      'CANDIDATE_UNAVAILABLE'
    );
  }

  // --- Check for duplicate shortlist ---
  const existing = await prisma.shortlist.findUnique({
    where: {
      requirementId_candidateId: {
        requirementId,
        candidateId,
      },
    },
  });

  if (existing) {
    throw ApiError.conflict(
      'This candidate is already shortlisted for this requirement.',
      'SHORTLIST_ALREADY_EXISTS'
    );
  }

  // --- Create the shortlist ---
  const shortlist = await prisma.shortlist.create({
    data: {
      requirementId,
      candidateId,
      status: 'PENDING', // Awaiting admin approval
    },
  });

  logger.info(`Shortlist created: school=${schoolId}, candidate=${candidateId}, requirement=${requirementId}`);

  return shortlist;
}

/**
 * getPendingShortlists — Admin view: all shortlists awaiting approval.
 */
async function getPendingShortlists(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [shortlists, total] = await prisma.$transaction([
    prisma.shortlist.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' }, // Oldest first (FIFO queue)
      skip,
      take: limit,
      include: {
        requirement: {
          include: {
            school: { select: { id: true, schoolName: true, city: true } },
          },
        },
        candidate: {
          select: {
            id: true,
            name: true,
            primaryRole: true,
            qualifications: true,
            experience: true,
            expectedSalary: true,
            gender: true,
            status: true,
          },
        },
      },
    }),
    prisma.shortlist.count({ where: { status: 'PENDING' } }),
  ]);

  return { shortlists, total, page, limit };
}

/**
 * approveShortlist — Admin approves a shortlist request.
 */
async function approveShortlist(shortlistId, adminNotes) {
  const shortlist = await prisma.shortlist.findUnique({
    where: { id: shortlistId },
  });

  if (!shortlist) {
    throw ApiError.notFound('Shortlist not found.');
  }

  if (shortlist.status !== 'PENDING') {
    throw ApiError.conflict(`Shortlist is already ${shortlist.status.toLowerCase()}.`);
  }

  const updated = await prisma.shortlist.update({
    where: { id: shortlistId },
    data: { status: 'APPROVED', adminNotes },
  });

  logger.info(`Shortlist approved: ${shortlistId}`);
  return updated;
}

/**
 * rejectShortlist — Admin rejects a shortlist request (with reason).
 */
async function rejectShortlist(shortlistId, adminNotes) {
  const shortlist = await prisma.shortlist.findUnique({
    where: { id: shortlistId },
  });

  if (!shortlist) {
    throw ApiError.notFound('Shortlist not found.');
  }

  if (shortlist.status !== 'PENDING') {
    throw ApiError.conflict(`Shortlist is already ${shortlist.status.toLowerCase()}.`);
  }

  const updated = await prisma.shortlist.update({
    where: { id: shortlistId },
    data: { status: 'REJECTED', adminNotes },
  });

  logger.info(`Shortlist rejected: ${shortlistId}, reason: ${adminNotes}`);
  return updated;
}

/**
 * pushCandidate — Admin pushes a candidate to a school.
 *
 * THIS IS THE MOST IMPORTANT FUNCTION IN THE SYSTEM.
 *
 * It creates a Pipeline (the active connection between school and candidate)
 * and a Thread (chat channel for them to communicate).
 *
 * CRITICAL CHECK: Only one active pipeline per candidate.
 * If the candidate is already in a pipeline, this fails.
 */
async function pushCandidate(shortlistId) {
  // --- Get the shortlist with related data ---
  const shortlist = await prisma.shortlist.findUnique({
    where: { id: shortlistId },
    include: {
      requirement: { select: { schoolId: true } },
      candidate: { select: { id: true, status: true, name: true } },
    },
  });

  if (!shortlist) {
    throw ApiError.notFound('Shortlist not found.');
  }

  if (shortlist.status !== 'APPROVED') {
    throw ApiError.conflict('Only approved shortlists can be pushed.', 'SHORTLIST_NOT_APPROVED');
  }

  // --- Check single-pipeline rule ---
  const existingPipeline = await prisma.pipeline.findFirst({
    where: {
      candidateId: shortlist.candidateId,
      status: 'ACTIVE',
    },
  });

  if (existingPipeline) {
    throw ApiError.conflict(
      'This candidate is currently in an active pipeline. Release required first.',
      'CANDIDATE_IN_PIPELINE'
    );
  }

  // --- Check candidate is still active ---
  if (shortlist.candidate.status !== 'ACTIVE') {
    throw ApiError.conflict(
      'Candidate is no longer available.',
      'CANDIDATE_UNAVAILABLE'
    );
  }

  // --- Create Pipeline + Thread + Update Candidate status in one transaction ---
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the pipeline
    const pipeline = await tx.pipeline.create({
      data: {
        shortlistId: shortlist.id,
        candidateId: shortlist.candidateId,
        schoolId: shortlist.requirement.schoolId,
        status: 'ACTIVE',
        pushedAt: new Date(),
        lastSchoolActivityAt: new Date(),
      },
    });

    // 2. Create a chat thread for this pipeline
    await tx.thread.create({
      data: {
        pipelineId: pipeline.id,
        schoolId: shortlist.requirement.schoolId,
        candidateId: shortlist.candidateId,
        status: 'ACTIVE',
      },
    });

    // 3. Update candidate status to PUSHED
    await tx.candidate.update({
      where: { id: shortlist.candidateId },
      data: { status: 'PUSHED' },
    });

    // 4. Create a system message in the thread
    const thread = await tx.thread.findUnique({
      where: { pipelineId: pipeline.id },
    });

    if (thread) {
      await tx.message.create({
        data: {
          threadId: thread.id,
          senderId: shortlist.candidateId, // System messages use a placeholder
          content: `Pipeline created. You can now communicate about the ${shortlist.candidate.name} position.`,
          type: 'SYSTEM',
        },
      });
    }

    return pipeline;
  });

  logger.info(`Candidate pushed: ${shortlist.candidateId} → school ${shortlist.requirement.schoolId}`);

  return result;
}

/**
 * releasePipeline — End a pipeline (school or admin releases candidate).
 *
 * After release:
 * - Pipeline status → RELEASED
 * - Chat thread → CLOSED
 * - Candidate status → ACTIVE (available for other schools)
 */
async function releasePipeline(pipelineId, reason, releasedBy = 'ADMIN') {
  const pipeline = await prisma.pipeline.findUnique({
    where: { id: pipelineId },
  });

  if (!pipeline) {
    throw ApiError.notFound('Pipeline not found.');
  }

  if (pipeline.status !== 'ACTIVE') {
    throw ApiError.conflict(`Pipeline is already ${pipeline.status.toLowerCase()}.`);
  }

  // --- Transaction: release pipeline + close thread + reactivate candidate ---
  await prisma.$transaction(async (tx) => {
    // 1. Update pipeline status
    await tx.pipeline.update({
      where: { id: pipelineId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        releaseReason: reason || `Released by ${releasedBy}`,
      },
    });

    // 2. Close the chat thread
    await tx.thread.updateMany({
      where: { pipelineId },
      data: { status: 'CLOSED' },
    });

    // 3. Reactivate the candidate
    await tx.candidate.update({
      where: { id: pipeline.candidateId },
      data: { status: 'ACTIVE' },
    });
  });

  logger.info(`Pipeline released: ${pipelineId}, reason: ${reason}`);
}

/**
 * selectCandidate — School confirms they want to hire the candidate.
 *
 * After selection:
 * - Pipeline status → SELECTED
 * - Candidate status → LOCKED
 * - LockIn record created (1-year commitment)
 * - Chat thread → CLOSED
 */
async function selectCandidate(pipelineId) {
  const pipeline = await prisma.pipeline.findUnique({
    where: { id: pipelineId },
  });

  if (!pipeline) {
    throw ApiError.notFound('Pipeline not found.');
  }

  if (pipeline.status !== 'ACTIVE') {
    throw ApiError.conflict(`Pipeline is already ${pipeline.status.toLowerCase()}.`);
  }

  await prisma.$transaction(async (tx) => {
    // 1. Mark pipeline as SELECTED
    await tx.pipeline.update({
      where: { id: pipelineId },
      data: {
        status: 'SELECTED',
        releasedAt: new Date(), // End date = selection date
      },
    });

    // 2. Lock the candidate for 1 year
    const lockExpiryDate = new Date();
    lockExpiryDate.setFullYear(lockExpiryDate.getFullYear() + 1); // +1 year

    await tx.lockIn.create({
      data: {
        pipelineId,
        candidateId: pipeline.candidateId,
        schoolId: pipeline.schoolId,
        status: 'ACTIVE',
        expiresAt: lockExpiryDate,
      },
    });

    // 3. Update candidate status to LOCKED
    await tx.candidate.update({
      where: { id: pipeline.candidateId },
      data: { status: 'LOCKED' },
    });

    // 4. Close the chat thread
    await tx.thread.updateMany({
      where: { pipelineId },
      data: { status: 'CLOSED' },
    });
  });

  logger.info(`Candidate selected: pipeline=${pipelineId}`);
}

module.exports = {
  createShortlist,
  getPendingShortlists,
  approveShortlist,
  rejectShortlist,
  pushCandidate,
  releasePipeline,
  selectCandidate,
};
