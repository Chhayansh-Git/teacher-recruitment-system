/**
 * ============================================================
 * FILE: src/controllers/interview.controller.js
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const interviewService = require('../services/interview.service');

const scheduleInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.schedule(req.body.pipelineId, req.user.schoolId, req.body);
  res.status(201).json(ApiResponse.success(interview, 'Interview scheduled'));
});

const sendInvite = asyncHandler(async (req, res) => {
  const result = await interviewService.sendInvite(req.params.id, req.user.schoolId);
  res.json(ApiResponse.success(result));
});

const rescheduleInterview = asyncHandler(async (req, res) => {
  const result = await interviewService.reschedule(req.params.id, req.user.schoolId, req.body);
  res.json(ApiResponse.success(result));
});

const cancelInterview = asyncHandler(async (req, res) => {
  const result = await interviewService.cancel(req.params.id, req.user.schoolId);
  res.json(ApiResponse.success(result));
});

const completeInterview = asyncHandler(async (req, res) => {
  const result = await interviewService.complete(req.params.id, req.user.schoolId, req.body.notes);
  res.json(ApiResponse.success(result));
});

const getUpcoming = asyncHandler(async (req, res) => {
  const interviews = await interviewService.getUpcomingForSchool(req.user.schoolId);
  res.json(ApiResponse.success(interviews));
});

const getForPipeline = asyncHandler(async (req, res) => {
  const interviews = await interviewService.getForPipeline(req.params.pipelineId);
  res.json(ApiResponse.success(interviews));
});

const getJoinCredentials = asyncHandler(async (req, res) => {
  const credentials = await interviewService.getJoinCredentials(req.params.id, req.user);
  res.json(ApiResponse.success(credentials));
});

module.exports = { scheduleInterview, sendInvite, rescheduleInterview, cancelInterview, completeInterview, getUpcoming, getForPipeline, getJoinCredentials };
