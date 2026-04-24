/**
 * ============================================================
 * FILE: src/services/notification.service.js — In-App Notifications
 * ============================================================
 *
 * Creates, retrieves, and manages in-app notifications.
 * Every significant event (shortlist approved, pushed, message,
 * pipeline released, etc.) generates a notification.
 * ============================================================
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

/**
 * create — Create a new notification for a user.
 *
 * @param {string} userId — Who receives the notification
 * @param {Object} data — { title, message, type, link }
 */
async function create(userId, { title, message, type, link }) {
  const notification = await prisma.notification.create({
    data: { userId, title, message, type, link },
  });
  logger.debug(`Notification created for user ${userId}: ${type}`);
  return notification;
}

/**
 * createBulk — Send the same notification to multiple users.
 */
async function createBulk(userIds, { title, message, type, link }) {
  const data = userIds.map((userId) => ({ userId, title, message, type, link }));
  await prisma.notification.createMany({ data });
  logger.debug(`Bulk notification sent to ${userIds.length} users: ${type}`);
}

/**
 * getForUser — Get paginated notifications for a user.
 */
async function getForUser(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, total, unreadCount, page, limit };
}

/**
 * markAsRead — Mark specific notifications as read.
 */
async function markAsRead(userId, notificationIds) {
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId,
    },
    data: { isRead: true },
  });
}

/**
 * markAllAsRead — Mark ALL notifications as read for a user.
 */
async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * getUnreadCount — Quick count for the notification badge.
 */
async function getUnreadCount(userId) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

/**
 * getPreferences — Get user's notification preferences.
 */
async function getPreferences(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });
  return user?.notificationPreferences || { email: true, sms: true, inApp: true };
}

/**
 * updatePreferences — Update user's notification preferences.
 */
async function updatePreferences(userId, preferences) {
  // Merge existing preferences with updates
  const existing = await getPreferences(userId);
  const updated = { ...existing, ...preferences };
  
  await prisma.user.update({
    where: { id: userId },
    data: { notificationPreferences: updated },
  });
  
  return updated;
}

/**
 * HELPER: Emit notification events for key business actions.
 * Called by other services when significant events happen.
 */
const NotificationEvents = {
  async shortlistApproved(shortlist) {
    const school = await prisma.school.findUnique({ where: { id: shortlist.requirement?.school?.id || shortlist.requirement?.schoolId }, include: { user: true } });
    if (school) {
      await create(school.userId, {
        title: 'Shortlist Approved',
        message: `Your shortlist for "${shortlist.requirement?.postDesignation}" has been approved by admin.`,
        type: 'SHORTLIST_APPROVED',
        link: `/school/requirements/${shortlist.requirementId}`,
      });
    }
  },

  async shortlistRejected(shortlist, reason) {
    const school = await prisma.school.findUnique({ where: { id: shortlist.requirement?.schoolId }, include: { user: true } });
    if (school) {
      await create(school.userId, {
        title: 'Shortlist Rejected',
        message: `Your shortlist was rejected. Reason: ${reason || 'Not specified'}`,
        type: 'SHORTLIST_REJECTED',
        link: `/school/requirements/${shortlist.requirementId}`,
      });
    }
  },

  async candidatePushed(pipeline) {
    // Notify candidate
    const candidate = await prisma.candidate.findUnique({ where: { id: pipeline.candidateId } });
    if (candidate) {
      await create(candidate.userId, {
        title: 'New School Match',
        message: `You've been connected with a school! Check your messages to start the conversation.`,
        type: 'CANDIDATE_PUSHED',
        link: '/candidate/chat',
      });
    }
    // Notify school
    const school = await prisma.school.findUnique({ where: { id: pipeline.schoolId } });
    if (school) {
      await create(school.userId, {
        title: 'Candidate Connected',
        message: `A candidate has been pushed to you. Open messages to begin your conversation.`,
        type: 'CANDIDATE_PUSHED',
        link: '/school/chat',
      });
    }
  },

  async pipelineReleased(pipeline, reason) {
    const candidate = await prisma.candidate.findUnique({ where: { id: pipeline.candidateId } });
    if (candidate) {
      await create(candidate.userId, {
        title: 'Pipeline Released',
        message: `Your pipeline has been released. You are now available for other schools. Reason: ${reason || 'N/A'}`,
        type: 'PIPELINE_RELEASED',
        link: '/candidate',
      });
    }
  },

  async candidateSelected(pipeline) {
    const candidate = await prisma.candidate.findUnique({ where: { id: pipeline.candidateId } });
    const school = await prisma.school.findUnique({ where: { id: pipeline.schoolId } });
    if (candidate) {
      await create(candidate.userId, {
        title: '🎉 You\'ve Been Selected!',
        message: `Congratulations! ${school?.schoolName || 'A school'} has confirmed your placement. A 1-year lock-in is now active.`,
        type: 'CANDIDATE_SELECTED',
        link: '/candidate',
      });
    }
  },

  async newMessage(threadId, senderId) {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { school: true, candidate: true },
    });
    if (!thread) return;

    // Notify the OTHER party
    if (thread.school.userId === senderId) {
      await create(thread.candidate.userId, {
        title: 'New Message',
        message: `${thread.school?.schoolName || 'School'} sent you a message.`,
        type: 'NEW_MESSAGE',
        link: '/candidate/chat',
      });
    } else {
      await create(thread.school.userId, {
        title: 'New Message',
        message: `${thread.candidate?.name || 'Candidate'} sent you a message.`,
        type: 'NEW_MESSAGE',
        link: '/school/chat',
      });
    }
  },
};

module.exports = {
  create,
  createBulk,
  getForUser,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  NotificationEvents,
};
