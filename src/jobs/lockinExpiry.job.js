/**
 * ============================================================
 * FILE: src/jobs/lockinExpiry.job.js — Lock-In Expiry Checker
 * ============================================================
 *
 * WHAT: Checks for lock-ins that have passed their 1-year expiry date
 *       and reactivates the candidate.
 *
 * After a candidate is selected by a school, they're "locked in"
 * for 1 year. During this time, they cannot be matched, shortlisted,
 * or pushed to any other school. When the year is up, this job
 * automatically frees them.
 * ============================================================
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

async function processLockInExpiry(job) {
  const now = new Date();

  // Find lock-ins that have expired
  const expiredLockIns = await prisma.lockIn.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: now }, // expiresAt is in the past
    },
    include: {
      candidate: { select: { id: true, name: true } },
      school: { select: { schoolName: true } },
    },
  });

  if (expiredLockIns.length === 0) {
    return { expired: 0 };
  }

  for (const lockIn of expiredLockIns) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Mark lock-in as expired
        await tx.lockIn.update({
          where: { id: lockIn.id },
          data: { status: 'EXPIRED' },
        });

        // 2. Reactivate the candidate
        await tx.candidate.update({
          where: { id: lockIn.candidateId },
          data: { status: 'ACTIVE' },
        });

        // 3. Audit log
        await tx.auditLog.create({
          data: {
            action: 'UNLOCK',
            resourceType: 'lock_in',
            resourceId: lockIn.id,
            description: `Lock-in expired for ${lockIn.candidate.name} at ${lockIn.school.schoolName}`,
            newValues: { status: 'EXPIRED' },
          },
        });
      });

      logger.info(`Lock-in expired: ${lockIn.candidate.name} (was at ${lockIn.school.schoolName})`);
    } catch (error) {
      logger.error(`Failed to process lock-in expiry ${lockIn.id}:`, error.message);
    }
  }

  return { expired: expiredLockIns.length };
}

module.exports = processLockInExpiry;
