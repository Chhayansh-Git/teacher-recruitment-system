/**
 * ============================================================
 * FILE: src/routes/payment.routes.js — Payment Route Definitions
 * ============================================================
 */

const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const paymentController = require('../controllers/payment.controller');

// --- School payment endpoints ---
router.post('/create-order', authenticate, authorize('SCHOOL'), paymentController.createOrder);
router.post('/verify', authenticate, authorize('SCHOOL'), paymentController.verifyPayment);
router.get('/status', authenticate, authorize('SCHOOL'), paymentController.getPaymentStatus);

// --- Razorpay webhook (NO authentication — Razorpay calls this directly) ---
// We verify the Razorpay signature inside the handler instead
router.post('/webhooks/razorpay', paymentController.handleWebhook);

module.exports = router;
