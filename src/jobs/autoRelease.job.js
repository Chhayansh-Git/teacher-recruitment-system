/**
 * ============================================================
 * FILE: src/jobs/autoRelease.job.js — 7-Day Auto-Release Job
 * ============================================================
 *
 * WHAT: Checks for active pipelines where the school has been
 *       silent for 7 consecutive days, and auto-releases them.
 *
 * BUSINESS RULE (from PRD/TDD):
 *       If a school doesn't interact (send a message, schedule an
 *       interview, etc.) with a pushed candidate for 7 consecutive
 *       days, the candidate is automatically released and becomes
 *       available for other schools.
 *
 *       - Day 3: Warning email/SMS to school
 *       - Day 5: Second warning
 *       - Day 7: Auto-release
 *
 * IMPORTANT: Any school message RESETS the 7-day timer.
 *            So if the school sends a message on Day 6, the timer
 *            resets to Day 0.
 * ============================================================
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Process function — called by Bull when the job runs.
 *
 * @param {Object} job — Bull job object (we don't use job.data here)
 */
async function processAutoRelease(job) {
  const now = new Date();

  // --- Find pipelines where school has been silent for 7+ days ---
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  // Date math: current time minus 7 days in milliseconds

  const stalePipelines = await prisma.pipeline.findMany({
    where: {
      status: 'ACTIVE',
      lastSchoolActivityAt: {
        lt: sevenDaysAgo, // lt = "less than" (activity was BEFORE 7 days ago)
      },
    },
    include: {
      school: { select: { id: true, schoolName: true } },
      candidate: { select: { id: true, name: true } },
    },
  });

  if (stalePipelines.length === 0) {
    return { released: 0 }; // Nothing to do
  }

  logger.info(`Auto-release: Found ${stalePipelines.length} stale pipeline(s)`);

  // --- Release each stale pipeline ---
  for (const pipeline of stalePipelines) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Release the pipeline
        await tx.pipeline.update({
          where: { id: pipeline.id },
          data: {
            status: 'TIMEOUT',
            releasedAt: now,
            releaseReason: '7-day auto-release: school inactivity',
          },
        });

        // 2. Close the chat thread
        await tx.thread.updateMany({
          where: { pipelineId: pipeline.id },
          data: { status: 'CLOSED' },
        });

        // 3. Reactivate the candidate
        await tx.candidate.update({
          where: { id: pipeline.candidateId },
          data: { status: 'ACTIVE' },
        });

        // 4. Create audit log
        await tx.auditLog.create({
          data: {
            action: 'RELEASE',
            resourceType: 'pipeline',
            resourceId: pipeline.id,
            description: `Auto-released: school "${pipeline.school.schoolName}" was inactive for 7+ days`,
            newValues: { status: 'TIMEOUT', reason: '7-day school inactivity' },
          },
        });
      });

      logger.info(
        `Auto-released pipeline: ${pipeline.id} (school: ${pipeline.school.schoolName}, candidate: ${pipeline.candidate.name})`
      );

      // TODO: Send notifications to both school and candidate
      // "Your pipeline has been auto-released due to 7 days of inactivity."
    } catch (error) {
      // Don't let one failed release stop others
      logger.error(`Failed to auto-release pipeline ${pipeline.id}:`, error.message);
    }
  }

  // --- Also send warnings for Day 3 and Day 5 ---
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  // Day 5 warnings
  const day5Pipelines = await prisma.pipeline.findMany({
    where: {
      status: 'ACTIVE',
      lastSchoolActivityAt: {
        lt: fiveDaysAgo,
        gte: sevenDaysAgo, // Between 5 and 7 days
      },
    },
  });

  // Day 3 warnings
  const day3Pipelines = await prisma.pipeline.findMany({
    where: {
      status: 'ACTIVE',
      lastSchoolActivityAt: {
        lt: threeDaysAgo,
        gte: fiveDaysAgo, // Between 3 and 5 days
      },
    },
  });

  if (day3Pipelines.length > 0) {
    logger.warn(`Day 3 warning: ${day3Pipelines.length} pipeline(s) approaching inactivity deadline`);
    // TODO: Send Day 3 warning notifications
  }

  if (day5Pipelines.length > 0) {
    logger.warn(`Day 5 warning: ${day5Pipelines.length} pipeline(s) will be auto-released in 2 days`);
    // TODO: Send Day 5 warning notifications
  }

  return {
    released: stalePipelines.length,
    day3Warnings: day3Pipelines.length,
    day5Warnings: day5Pipelines.length,
  };
}

module.exports = processAutoRelease;
