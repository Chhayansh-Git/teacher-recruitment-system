/**
 * ============================================================
 * FILE: src/routes/admin.routes.js — Admin Route Definitions
 * ============================================================
 *
 * All admin endpoints. Only users with ADMIN role can access these.
 * Every action is logged in the audit trail.
 * ============================================================
 */

const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { uuidParamSchema, paginationSchema } = require('../validators/school.validator');
const validate = require('../middleware/validate');
const adminController = require('../controllers/admin.controller');

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// --- Dashboard ---
router.get('/dashboard', adminController.getDashboard);

// --- View Data ---
router.get('/schools', validate(paginationSchema), adminController.getSchools);
router.get('/candidates', validate(paginationSchema), adminController.getCandidates);

// --- Shortlist Management ---
router.get('/shortlists/pending', validate(paginationSchema), adminController.getPendingShortlists);
router.post('/shortlists/:id/approve', validate(uuidParamSchema), adminController.approveShortlist);
router.post('/shortlists/:id/reject', validate(uuidParamSchema), adminController.rejectShortlist);

// --- Pipeline Management ---
router.post('/pipelines/push', adminController.pushCandidate);
router.post('/pipelines/:id/release', validate(uuidParamSchema), adminController.releasePipeline);
router.post('/pipelines/:id/select', validate(uuidParamSchema), adminController.selectCandidate);

// --- User Management ---
router.post('/users/:id/dismiss', validate(uuidParamSchema), adminController.dismissUser);

// --- Configuration ---
router.put('/config/fee', adminController.updateFeeConfig);

// --- Reports ---
router.get('/reports/:type', adminController.getReports);

module.exports = router;
