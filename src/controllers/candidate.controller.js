/**
 * ============================================================
 * FILE: src/controllers/candidate.controller.js — Candidate Route Handlers
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const candidateService = require('../services/candidate.service');

/** GET /api/v1/candidates/profile */
const getProfile = asyncHandler(async (req, res) => {
  const candidate = await candidateService.getProfile(req.user.candidateId);
  res.json(ApiResponse.success(candidate));
});

/** PUT /api/v1/candidates/profile */
const updateProfile = asyncHandler(async (req, res) => {
  const candidate = await candidateService.updateProfile(req.user.candidateId, req.body);
  res.json(ApiResponse.success(candidate, 'Profile updated successfully'));
});

/** GET /api/v1/candidates/dashboard */
const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await candidateService.getDashboard(req.user.candidateId);
  res.json(ApiResponse.success(dashboard));
});

/** GET /api/v1/candidates/push-history */
const getPushHistory = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await candidateService.getPushHistory(req.user.candidateId, page, limit);
  res.json(ApiResponse.paginated(result.pipelines, result.page, result.limit, result.total));
});

/** GET /api/v1/candidates/match-scores */
const getMatchScores = asyncHandler(async (req, res) => {
  const scores = await candidateService.getMatchScores(req.user.candidateId);
  res.json(ApiResponse.success(scores));
});

/** GET /api/v1/candidates/profile-views */
const getProfileViews = asyncHandler(async (req, res) => {
  const views = await candidateService.getProfileViews(req.user.candidateId);
  res.json(ApiResponse.success(views));
});

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getPushHistory,
  getMatchScores,
  getProfileViews,
};
