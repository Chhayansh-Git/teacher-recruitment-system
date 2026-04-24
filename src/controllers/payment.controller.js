/**
 * ============================================================
 * FILE: src/controllers/payment.controller.js — Payment Route Handlers
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const paymentService = require('../services/payment.service');

/** POST /api/v1/payments/create-order */
const createOrder = asyncHandler(async (req, res) => {
  const order = await paymentService.createOrder(req.user.schoolId);
  res.status(201).json(ApiResponse.success(order, 'Payment order created'));
});

/** POST /api/v1/payments/verify */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const result = await paymentService.verifyPayment(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );
  res.json(ApiResponse.success(result));
});

/** POST /api/v1/webhooks/razorpay */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  await paymentService.handleWebhook(req.body, signature);
  // Razorpay expects a 200 response to confirm receipt
  res.status(200).json({ status: 'ok' });
});

/** GET /api/v1/payments/status */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const status = await paymentService.getPaymentStatus(req.user.schoolId);
  res.json(ApiResponse.success(status));
});

module.exports = { createOrder, verifyPayment, handleWebhook, getPaymentStatus };
