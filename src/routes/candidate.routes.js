/**
 * ============================================================
 * FILE: src/routes/candidate.routes.js — Candidate Route Definitions
 * ============================================================
 */

const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const { updateProfileSchema } = require('../validators/candidate.validator');
const { paginationSchema } = require('../validators/school.validator');
const candidateController = require('../controllers/candidate.controller');

// All candidate routes require authentication + CANDIDATE role
router.use(authenticate);
router.use(authorize('CANDIDATE'));

// --- Profile ---
router.get('/profile', candidateController.getProfile);
router.put('/profile', validate(updateProfileSchema), candidateController.updateProfile);

// --- Dashboard & History ---
router.get('/dashboard', candidateController.getDashboard);
router.get('/push-history', validate(paginationSchema), candidateController.getPushHistory);
router.get('/match-scores', candidateController.getMatchScores);
router.get('/profile-views', candidateController.getProfileViews);

module.exports = router;
