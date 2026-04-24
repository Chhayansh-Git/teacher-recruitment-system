/**
 * ============================================================
 * FILE: src/services/interview.service.js — Interview Scheduling
 * ============================================================
 *
 * Manages the interview lifecycle:
 *   Schedule → Send Invite → Reschedule/Cancel → Complete
 *
 * KEY RULES:
 *   - Only schools can schedule interviews
 *   - Only within ACTIVE pipelines
 *   - Reschedule marks old as RESCHEDULED, creates new
 *   - Maximum 3 pending interviews per pipeline
 * ============================================================
 */

const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

/**
 * schedule — Create a new interview.
 */
async function schedule(pipelineId, schoolId, data) {
  // Verify pipeline is active and belongs to this school
  const pipeline = await prisma.pipeline.findUnique({
    where: { id: pipelineId },
    include: { candidate: true, school: true },
  });

  if (!pipeline) throw ApiError.notFound('Pipeline not found.');
  if (pipeline.schoolId !== schoolId) throw ApiError.forbidden('This pipeline does not belong to your school.');
  if (pipeline.status !== 'ACTIVE') throw ApiError.conflict('Cannot schedule interview for inactive pipeline.');

  // Limit pending interviews
  const pendingCount = await prisma.interview.count({
    where: { pipelineId, status: { in: ['SCHEDULED', 'INVITED'] } },
  });
  if (pendingCount >= 3) throw ApiError.conflict('Maximum 3 pending interviews per pipeline.');

  const interview = await prisma.interview.create({
    data: {
      pipelineId,
      schoolId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration || 60,
      mode: data.mode,
      location: data.location || null,
      meetingLink: data.meetingLink || null,
      notes: data.notes || null,
    },
  });

  // Update school activity (resets 7-day timer)
  await prisma.pipeline.update({
    where: { id: pipelineId },
    data: { lastSchoolActivityAt: new Date() },
  });

  // Notify candidate
  await notificationService.NotificationEvents.create?.(pipeline.candidate.userId, {
    title: 'Interview Scheduled',
    message: `${pipeline.school.schoolName} has scheduled an interview on ${new Date(data.scheduledAt).toLocaleDateString()}.`,
    type: 'INTERVIEW_SCHEDULED',
    link: '/candidate/chat',
  }).catch(() => {});

  logger.info(`Interview scheduled: ${interview.id} for pipeline ${pipelineId}`);
  return interview;
}

/**
 * sendInvite — Mark interview invite as sent (would trigger email in production).
 */
async function sendInvite(interviewId, schoolId) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { pipeline: { include: { candidate: true, school: true } } },
  });

  if (!interview) throw ApiError.notFound('Interview not found.');
  if (interview.schoolId !== schoolId) throw ApiError.forbidden('Not your interview.');
  if (interview.inviteSent) throw ApiError.conflict('Invite already sent.');

  await prisma.interview.update({
    where: { id: interviewId },
    data: { inviteSent: true, status: 'INVITED' },
  });

  // In production, send email via SendGrid here
  logger.info(`Interview invite sent: ${interviewId}`);

  // Notify candidate
  const candidate = interview.pipeline.candidate;
  if (candidate) {
    await notificationService.create(candidate.userId, {
      title: 'Interview Invitation',
      message: `Formal interview invite from ${interview.pipeline.school.schoolName} for ${new Date(interview.scheduledAt).toLocaleDateString()} at ${new Date(interview.scheduledAt).toLocaleTimeString()}.`,
      type: 'INTERVIEW_INVITE',
      link: '/candidate/chat',
    }).catch(() => {});
  }

  return { message: 'Invite sent successfully.' };
}

/**
 * reschedule — Change interview date/time, notifies candidate.
 */
async function reschedule(interviewId, schoolId, newData) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { pipeline: { include: { candidate: true } } },
  });

  if (!interview) throw ApiError.notFound('Interview not found.');
  if (interview.schoolId !== schoolId) throw ApiError.forbidden('Not your interview.');
  if (['COMPLETED', 'CANCELLED'].includes(interview.status)) {
    throw ApiError.conflict('Cannot reschedule a completed or cancelled interview.');
  }

  await prisma.$transaction(async (tx) => {
    // Mark old as rescheduled
    await tx.interview.update({
      where: { id: interviewId },
      data: { status: 'RESCHEDULED' },
    });

    // Create new interview
    await tx.interview.create({
      data: {
        pipelineId: interview.pipelineId,
        schoolId: interview.schoolId,
        scheduledAt: new Date(newData.scheduledAt),
        duration: newData.duration || interview.duration,
        mode: newData.mode || interview.mode,
        location: newData.location || interview.location,
        meetingLink: newData.meetingLink || interview.meetingLink,
        notes: newData.notes || `Rescheduled from ${new Date(interview.scheduledAt).toLocaleDateString()}`,
      },
    });
  });

  // Notify candidate
  const candidate = interview.pipeline.candidate;
  if (candidate) {
    await notificationService.create(candidate.userId, {
      title: 'Interview Rescheduled',
      message: `Interview rescheduled to ${new Date(newData.scheduledAt).toLocaleDateString()}.`,
      type: 'INTERVIEW_RESCHEDULED',
      link: '/candidate/chat',
    }).catch(() => {});
  }

  logger.info(`Interview rescheduled: ${interviewId}`);
  return { message: 'Interview rescheduled.' };
}

/**
 * cancel — Cancel an interview.
 */
async function cancel(interviewId, schoolId) {
  const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
  if (!interview) throw ApiError.notFound('Interview not found.');
  if (interview.schoolId !== schoolId) throw ApiError.forbidden('Not your interview.');

  await prisma.interview.update({
    where: { id: interviewId },
    data: { status: 'CANCELLED' },
  });

  return { message: 'Interview cancelled.' };
}

/**
 * complete — Mark interview as completed.
 */
async function complete(interviewId, schoolId, notes) {
  const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
  if (!interview) throw ApiError.notFound('Interview not found.');
  if (interview.schoolId !== schoolId) throw ApiError.forbidden('Not your interview.');

  await prisma.interview.update({
    where: { id: interviewId },
    data: { status: 'COMPLETED', notes: notes || interview.notes },
  });

  return { message: 'Interview marked as completed.' };
}

/**
 * getForPipeline — Get all interviews for a pipeline.
 */
async function getForPipeline(pipelineId) {
  return prisma.interview.findMany({
    where: { pipelineId },
    orderBy: { scheduledAt: 'desc' },
  });
}

/**
 * getUpcoming — Get upcoming interviews for a school.
 */
async function getUpcomingForSchool(schoolId) {
  return prisma.interview.findMany({
    where: {
      schoolId,
      status: { in: ['SCHEDULED', 'INVITED'] },
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: 'asc' },
    include: {
      pipeline: {
        include: { candidate: { select: { name: true, primaryRole: true } } },
      },
    },
  });
}

/**
 * getJoinCredentials — Generate TURN server credentials for WebRTC.
 * Valid for 24 hours.
 */
const crypto = require('crypto');

async function getJoinCredentials(interviewId, user) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { pipeline: true },
  });

  if (!interview) throw ApiError.notFound('Interview not found.');

  // Verify access (must be the school or candidate associated with the pipeline)
  const isSchool = interview.pipeline.schoolId === user.schoolId;
  const isCandidate = interview.pipeline.candidateId === user.candidateId;
  
  if (!isSchool && !isCandidate) {
    throw ApiError.forbidden('You do not have access to this interview room.');
  }

  // Generate TURN credentials
  const turnSecret = process.env.TURN_SECRET || 'dev-turn-secret';
  const turnUrl = process.env.TURN_URL || 'turn:turn.teacher-recruitment.com:3478';
  
  // Credentials valid for 24 hours (Unix timestamp in seconds)
  const ttl = 24 * 60 * 60;
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  
  const username = `${timestamp}:${user.id}`;
  const credential = crypto
    .createHmac('sha1', turnSecret)
    .update(username)
    .digest('base64');

  return {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302', // Free Google STUN for fallback
      },
      {
        urls: turnUrl,
        username,
        credential,
      },
    ],
    roomId: `interview_${interview.id}`,
    role: isSchool ? 'HOST' : 'GUEST',
  };
}

module.exports = {
  schedule,
  sendInvite,
  reschedule,
  cancel,
  complete,
  getForPipeline,
  getUpcomingForSchool,
  getJoinCredentials,
};
