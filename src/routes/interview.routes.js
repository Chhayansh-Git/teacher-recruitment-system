/**
 * ============================================================
 * FILE: src/routes/interview.routes.js
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const interviewController = require('../controllers/interview.controller');

router.use(authenticate);

// School-only actions
router.post('/schedule', authorize('SCHOOL'), interviewController.scheduleInterview);
router.post('/:id/invite', authorize('SCHOOL'), interviewController.sendInvite);
router.put('/:id/reschedule', authorize('SCHOOL'), interviewController.rescheduleInterview);
router.put('/:id/cancel', authorize('SCHOOL'), interviewController.cancelInterview);
router.put('/:id/complete', authorize('SCHOOL'), interviewController.completeInterview);
router.get('/upcoming', authorize('SCHOOL'), interviewController.getUpcoming);

// Both school and candidate can view interviews for a pipeline
router.get('/pipeline/:pipelineId', interviewController.getForPipeline);

// Both school and candidate can join an interview
router.get('/:id/join', interviewController.getJoinCredentials);

module.exports = router;
