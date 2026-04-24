/**
 * ============================================================
 * FILE: src/jobs/notificationDigest.job.js — Daily Notification Digest
 * ============================================================
 *
 * Runs daily at 8 AM IST.
 * Sends email digest of unread notifications to users
 * who haven't logged in recently.
 * ============================================================
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

async function processNotificationDigest(job) {
  logger.info('Running notification digest job...');

  // Find users with unread notifications who haven't been active in 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const usersWithUnread = await prisma.notification.groupBy({
    by: ['userId'],
    where: { isRead: false },
    _count: { id: true },
  });

  let emailsSent = 0;

  for (const group of usersWithUnread) {
    const user = await prisma.user.findUnique({
      where: { id: group.userId },
      select: { email: true, updatedAt: true },
    });

    // Only send digest if user hasn't been active recently
    if (user && user.updatedAt < oneDayAgo) {
      // In production: send email via SendGrid
      logger.info(`[DIGEST] Would email ${user.email}: ${group._count.id} unread notifications`);
      emailsSent++;
    }
  }

  logger.info(`Notification digest complete. ${emailsSent} digests queued.`);
  return { emailsSent };
}

module.exports = processNotificationDigest;
