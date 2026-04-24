/**
 * ============================================================
 * FILE: src/routes/school.routes.js — School Route Definitions
 * ============================================================
 *
 * All school endpoints. Every route requires:
 * 1. authenticate — Must be logged in
 * 2. authorize('SCHOOL') — Must have SCHOOL role
 * 3. privacyFilter — Candidate data is automatically filtered
 * ============================================================
 */

const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const privacyFilter = require('../middleware/privacyFilter');
const validate = require('../middleware/validate');

const {
  updateProfileSchema,
  createRequirementSchema,
  shortlistSchema,
  uuidParamSchema,
  paginationSchema,
} = require('../validators/school.validator');

const schoolController = require('../controllers/school.controller');

// All school routes require authentication + SCHOOL role
router.use(authenticate);          // Must be logged in
router.use(authorize('SCHOOL'));    // Must be a SCHOOL user
router.use(privacyFilter);         // Auto-filter candidate data in responses

// --- Profile ---
router.get('/profile', schoolController.getProfile);
router.put('/profile', validate(updateProfileSchema), schoolController.updateProfile);

// --- Requirements ---
router.post('/requirements', validate(createRequirementSchema), schoolController.createRequirement);
router.get('/requirements', validate(paginationSchema), schoolController.getRequirements);
router.get('/requirements/:id', validate(uuidParamSchema), schoolController.getRequirementById);

// --- Matching & Shortlisting ---
router.get('/matches/:id', validate(uuidParamSchema), schoolController.getMatches);
router.post('/shortlist', validate(shortlistSchema), schoolController.shortlistCandidate);

// --- Dashboard ---
router.get('/dashboard', schoolController.getDashboard);

module.exports = router;
