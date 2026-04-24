/**
 * ============================================================
 * FILE: src/routes/feedback.routes.js
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const feedbackController = require('../controllers/feedback.controller');

router.use(authenticate);

// School or candidate can submit feedback
router.post('/', feedbackController.submitFeedback);

// Admin-only routes
router.get('/pipeline/:pipelineId', authorize('ADMIN'), feedbackController.getFeedbackForPipeline);
router.get('/stats', authorize('ADMIN'), feedbackController.getAverageRating);

module.exports = router;
