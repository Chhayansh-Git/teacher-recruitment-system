/**
 * ============================================================
 * FILE: src/services/message.service.js — Template-Based Communication
 * ============================================================
 *
 * WHY TEMPLATE-ONLY (NO FREE TEXT)?
 *   Free-text chat is the #1 risk for personal data leaks.
 *   Schools and candidates could share phone numbers, emails,
 *   WhatsApp IDs — bypassing the platform entirely.
 *
 *   Instead, we use PREDEFINED ACTIONS — like how food delivery
 *   apps let you pick "I'm outside" or "Running late" instead
 *   of typing freely. This:
 *   1. Eliminates data leak risk completely
 *   2. Creates a clean audit trail of recruitment actions
 *   3. Keeps all communication professional and structured
 *
 * HOW IT WORKS:
 *   - Each message has a templateCode (e.g., "INTERVIEW_SCHEDULED")
 *   - The template code maps to a human-readable message
 *   - Some templates accept metadata (e.g., interview date)
 *   - The content shown to users is auto-generated from the template
 *   - No user can type arbitrary text
 *
 * AVAILABLE ACTIONS (by role):
 *   SCHOOL:
 *     - INTERVIEW_SCHEDULED    → "Interview scheduled for {date}"
 *     - INTERVIEW_RESCHEDULED  → "Interview rescheduled to {date}"
 *     - INTERVIEW_CANCELLED    → "Interview has been cancelled"
 *     - DOCUMENT_REQUESTED     → "Please submit required documents"
 *     - OFFER_EXTENDED         → "We would like to extend an offer"
 *     - GENERAL_UPDATE         → "There is an update regarding your application"
 *
 *   CANDIDATE:
 *     - INTERVIEW_ACCEPTED     → "I accept the interview invitation"
 *     - INTERVIEW_DECLINED     → "I am unable to attend the interview"
 *     - DOCUMENTS_SUBMITTED    → "I have submitted the requested documents"
 *     - OFFER_ACCEPTED         → "I accept the offer"
 *     - OFFER_DECLINED         → "I have decided to decline the offer"
 *     - GENERAL_QUERY          → "I have a query regarding my application"
 *
 *   SYSTEM (auto-generated):
 *     - PIPELINE_CREATED       → "Candidate has been assigned to this school"
 *     - PIPELINE_RELEASED      → "Candidate has been released from pipeline"
 *     - CANDIDATE_SELECTED     → "Candidate has been selected for the position"
 * ============================================================
 */

const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

const TEMPLATES = {
  // --- School Actions ---
  INTERVIEW_SCHEDULED: {
    role: 'SCHOOL',
    label: '📅 Schedule Interview',
    message: (meta) => `Interview scheduled for ${meta?.date || 'a date to be confirmed'}.${meta?.mode ? ` Mode: ${meta.mode}.` : ''}`,
  },
  INTERVIEW_RESCHEDULED: {
    role: 'SCHOOL',
    label: '🔄 Reschedule Interview',
    message: (meta) => `Interview rescheduled to ${meta?.date || 'a new date to be confirmed'}.`,
  },
  INTERVIEW_CANCELLED: {
    role: 'SCHOOL',
    label: '❌ Cancel Interview',
    message: () => 'The interview has been cancelled.',
  },
  DOCUMENT_REQUESTED: {
    role: 'SCHOOL',
    label: '📄 Request Documents',
    message: () => 'Please submit the required documents for your application.',
  },
  OFFER_EXTENDED: {
    role: 'SCHOOL',
    label: '🎉 Extend Offer',
    message: () => 'We are pleased to extend an offer for this position. Please respond at your earliest convenience.',
  },
  GENERAL_UPDATE: {
    role: 'SCHOOL',
    label: 'ℹ️ Send Update',
    message: () => 'There is an update regarding your application. Please check your dashboard for details.',
  },

  // --- Candidate Actions ---
  INTERVIEW_ACCEPTED: {
    role: 'CANDIDATE',
    label: '✅ Accept Interview',
    message: () => 'I accept the interview invitation and will attend as scheduled.',
  },
  INTERVIEW_DECLINED: {
    role: 'CANDIDATE',
    label: '❌ Decline Interview',
    message: () => 'I am unable to attend the scheduled interview.',
  },
  DOCUMENTS_SUBMITTED: {
    role: 'CANDIDATE',
    label: '📄 Documents Submitted',
    message: () => 'I have submitted the requested documents.',
  },
  OFFER_ACCEPTED: {
    role: 'CANDIDATE',
    label: '🎉 Accept Offer',
    message: () => 'I am happy to accept the offer. Thank you!',
  },
  OFFER_DECLINED: {
    role: 'CANDIDATE',
    label: '🚫 Decline Offer',
    message: () => 'I have decided to decline the offer. Thank you for the opportunity.',
  },
  GENERAL_QUERY: {
    role: 'CANDIDATE',
    label: 'ℹ️ Send Query',
    message: () => 'I have a query regarding my application. Please check the dashboard.',
  },

  // --- System Actions (auto-generated, not user-selectable) ---
  PIPELINE_CREATED: {
    role: 'SYSTEM',
    label: 'Pipeline Created',
    message: () => 'Candidate has been assigned to this school. You may now communicate via predefined actions.',
  },
  PIPELINE_RELEASED: {
    role: 'SYSTEM',
    label: 'Pipeline Released',
    message: (meta) => `Candidate has been released from the pipeline.${meta?.reason ? ` Reason: ${meta.reason}` : ''}`,
  },
  CANDIDATE_SELECTED: {
    role: 'SYSTEM',
    label: 'Candidate Selected',
    message: () => 'Candidate has been selected for the position. Congratulations!',
  },
};

/**
 * getThreads — Get all chat threads for the current user.
 */
async function getThreads(userId, role) {
  const where = {};

  if (role === 'SCHOOL') {
    const school = await prisma.school.findUnique({ where: { userId } });
    if (school) where.schoolId = school.id;
  } else if (role === 'CANDIDATE') {
    const candidate = await prisma.candidate.findUnique({ where: { userId } });
    if (candidate) where.candidateId = candidate.id;
  }
  // ADMIN: no filter — sees all threads

  const threads = await prisma.thread.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      school: { select: { schoolName: true, city: true } },
      candidate: { select: { name: true, primaryRole: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, type: true, createdAt: true, senderId: true },
      },
      _count: {
        select: { messages: { where: { readAt: null } } },
      },
    },
  });

  return threads;
}

/**
 * getMessages — Get paginated messages from a specific thread.
 */
async function getMessages(threadId, userId, role, page = 1, limit = 50) {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      school: { select: { userId: true } },
      candidate: { select: { userId: true } },
    },
  });

  if (!thread) throw ApiError.notFound('Thread not found.');

  if (role !== 'ADMIN') {
    const isSchool = thread.school.userId === userId;
    const isCandidate = thread.candidate.userId === userId;
    if (!isSchool && !isCandidate) {
      throw ApiError.forbidden('You do not have access to this thread.');
    }
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await prisma.$transaction([
    prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { sender: { select: { id: true, role: true } } },
    }),
    prisma.message.count({ where: { threadId } }),
  ]);

  return { messages: messages.reverse(), total, page, limit };
}

/**
 * sendTemplateMessage — Send a predefined template message.
 *
 * @param {string} threadId — The thread to send in
 * @param {string} senderId — The user sending
 * @param {string} senderRole — SCHOOL, CANDIDATE, or SYSTEM
 * @param {string} templateCode — One of the TEMPLATES keys
 * @param {Object} metadata — Optional data (e.g., { date: "2026-05-01" })
 */
async function sendTemplateMessage(threadId, senderId, senderRole, templateCode, metadata = {}) {
  // --- Step 1: Validate template code ---
  const template = TEMPLATES[templateCode];
  if (!template) {
    throw ApiError.badRequest(`Invalid action code: "${templateCode}". Use one of: ${Object.keys(TEMPLATES).join(', ')}`);
  }

  // --- Step 2: Check role permission ---
  // Schools can only use SCHOOL templates, candidates can only use CANDIDATE templates
  if (template.role !== 'SYSTEM' && template.role !== senderRole) {
    throw ApiError.forbidden(`This action is only available for ${template.role} users.`);
  }

  // --- Step 3: Get the thread ---
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      school: { select: { userId: true } },
      candidate: { select: { userId: true } },
    },
  });

  if (!thread) throw ApiError.notFound('Thread not found.');
  if (thread.status !== 'ACTIVE') {
    throw ApiError.forbidden('This conversation has ended.', 'THREAD_CLOSED');
  }

  // --- Step 4: Admin cannot send messages ---
  if (senderRole === 'ADMIN') {
    throw ApiError.forbidden('Admin can read threads but cannot send messages.');
  }

  // --- Step 5: Verify sender is a party to this thread ---
  if (senderRole !== 'SYSTEM') {
    const isSchool = thread.school.userId === senderId;
    const isCandidate = thread.candidate.userId === senderId;
    if (!isSchool && !isCandidate) {
      throw ApiError.forbidden('You are not a participant in this thread.');
    }
  }

  // --- Step 6: Generate the message content from template ---
  const content = template.message(metadata);

  // --- Step 7: Save the message ---
  const message = await prisma.message.create({
    data: {
      threadId,
      senderId: senderRole === 'SYSTEM' ? thread.school.userId : senderId,
      content,
      type: senderRole === 'SYSTEM' ? 'SYSTEM' : 'TEMPLATE',
      isFlagged: false,     // Templates can never contain leaks
      flagReasons: [],
    },
  });

  // --- Step 8: Update school activity timestamp ---
  if (senderRole === 'SCHOOL' || senderRole === 'SYSTEM') {
    await prisma.pipeline.update({
      where: { id: thread.pipelineId },
      data: { lastSchoolActivityAt: new Date() },
    });
  }

  await prisma.thread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  logger.info(`Template message sent: ${templateCode} in thread ${threadId}`);

  return message;
}

/**
 * markAsRead — Mark messages as read.
 */
async function markAsRead(threadId, userId) {
  await prisma.message.updateMany({
    where: {
      threadId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

/**
 * getAvailableActions — Return the template actions available for a role.
 * Used by the frontend to render action buttons.
 */
function getAvailableActions(role) {
  return Object.entries(TEMPLATES)
    .filter(([, t]) => t.role === role)
    .map(([code, t]) => ({ code, label: t.label }));
}

module.exports = {
  getThreads,
  getMessages,
  sendTemplateMessage,
  markAsRead,
  getAvailableActions,
  TEMPLATES,
};

