/**
 * ============================================================
 * FILE: src/controllers/school.controller.js — School Route Handlers
 * ============================================================
 *
 * Handles HTTP requests for school endpoints.
 * Each function extracts data from the request, calls the service,
 * and sends the response.
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const schoolService = require('../services/school.service');
const matchingService = require('../services/matching.service');
const pipelineService = require('../services/pipeline.service');

/** GET /api/v1/schools/profile */
const getProfile = asyncHandler(async (req, res) => {
  const school = await schoolService.getProfile(req.user.schoolId);
  res.json(ApiResponse.success(school));
});

/** PUT /api/v1/schools/profile */
const updateProfile = asyncHandler(async (req, res) => {
  const school = await schoolService.updateProfile(req.user.schoolId, req.body);
  res.json(ApiResponse.success(school, 'Profile updated successfully'));
});

/** POST /api/v1/schools/requirements */
const createRequirement = asyncHandler(async (req, res) => {
  const requirement = await schoolService.createRequirement(req.user.schoolId, req.body);
  res.status(201).json(ApiResponse.success(requirement, 'Requirement created successfully'));
});

/** GET /api/v1/schools/requirements */
const getRequirements = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await schoolService.getRequirements(req.user.schoolId, page, limit);
  res.json(ApiResponse.paginated(result.requirements, result.page, result.limit, result.total));
});

/** GET /api/v1/schools/requirements/:id */
const getRequirementById = asyncHandler(async (req, res) => {
  const requirement = await schoolService.getRequirementById(req.user.schoolId, req.params.id);
  res.json(ApiResponse.success(requirement));
});

/** GET /api/v1/schools/matches/:reqId — Get matched candidates for a requirement */
const getMatches = asyncHandler(async (req, res) => {
  const matches = await matchingService.findMatches(req.params.id, req.user.schoolId);
  res.json(ApiResponse.success(matches));
});

/** POST /api/v1/schools/shortlist — Shortlist a candidate */
const shortlistCandidate = asyncHandler(async (req, res) => {
  const shortlist = await pipelineService.createShortlist(
    req.user.schoolId,
    req.body.requirementId,
    req.body.candidateId
  );
  res.status(201).json(ApiResponse.success(shortlist, 'Candidate shortlisted successfully'));
});

/** GET /api/v1/schools/dashboard */
const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await schoolService.getDashboard(req.user.schoolId);
  res.json(ApiResponse.success(dashboard));
});

module.exports = {
  getProfile,
  updateProfile,
  createRequirement,
  getRequirements,
  getRequirementById,
  getMatches,
  shortlistCandidate,
  getDashboard,
};
