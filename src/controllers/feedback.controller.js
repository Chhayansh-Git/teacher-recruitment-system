/**
 * ============================================================
 * FILE: src/controllers/feedback.controller.js
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const feedbackService = require('../services/feedback.service');

const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.submit(req.body.pipelineId, req.user.role, req.body);
  res.status(201).json(ApiResponse.success(feedback, 'Feedback submitted'));
});

const getFeedbackForPipeline = asyncHandler(async (req, res) => {
  const feedbacks = await feedbackService.getForPipeline(req.params.pipelineId);
  res.json(ApiResponse.success(feedbacks));
});

const getAverageRating = asyncHandler(async (req, res) => {
  const stats = await feedbackService.getAverageRating();
  res.json(ApiResponse.success(stats));
});

module.exports = { submitFeedback, getFeedbackForPipeline, getAverageRating };
