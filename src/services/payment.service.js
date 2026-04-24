/**
 * ============================================================
 * FILE: src/services/payment.service.js — Razorpay Payment Logic
 * ============================================================
 *
 * WHAT: Handles the payment flow for school registration fees.
 *
 * FLOW:
 *       1. School registers (if they're school #201+, payment required)
 *       2. Frontend calls POST /payments/create-order
 *       3. We create a Razorpay order and return the order ID
 *       4. Frontend opens Razorpay checkout with that order ID
 *       5. User pays (Razorpay handles card/UPI/etc.)
 *       6. Razorpay sends us a webhook confirming payment
 *       7. We verify the webhook signature and mark payment as PAID
 *
 * WHY WE NEVER TOUCH CARD DATA:
 *       PCI DSS compliance requires extensive security measures
 *       to handle card numbers. Razorpay's checkout.js handles
 *       all card input in their own iframe — the data never touches
 *       our servers. We only store Razorpay's order and payment IDs.
 *
 * IDEMPOTENCY:
 *       If a user clicks "Pay" twice, we return the SAME Razorpay order
 *       (using the existing order ID). No duplicate charges.
 * ============================================================
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { prisma } = require('../config/database');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Initialize Razorpay client
// In development, use test keys (no real money charged)
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

/**
 * createOrder — Create a Razorpay payment order.
 *
 * @param {string} schoolId — The school that needs to pay
 * @returns {Object} — { orderId, amount, currency, key }
 */
async function createOrder(schoolId) {
  // --- Check if school needs to pay ---
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw ApiError.notFound('School not found.');
  }

  if (school.isFree) {
    throw ApiError.conflict('Your school is registered under the free tier. No payment needed.');
  }

  // --- Check for existing order (idempotency) ---
  const existingPayment = await prisma.payment.findFirst({
    where: {
      schoolId,
      status: { in: ['CREATED', 'PAID'] },
    },
  });

  if (existingPayment?.status === 'PAID') {
    throw ApiError.conflict('Registration fee has already been paid.', 'FEE_ALREADY_PAID');
  }

  // If there's a pending order, return it instead of creating a new one
  if (existingPayment?.status === 'CREATED') {
    return {
      orderId: existingPayment.razorpayOrderId,
      amount: existingPayment.amount,
      currency: existingPayment.currency,
      key: config.razorpay.keyId,
    };
  }

  // --- Create a new Razorpay order ---
  const redis = require('../config/redis');
  const redisFee = await redis.get('config:registration_fee');
  const amount = redisFee ? parseInt(redisFee, 10) : config.registrationFee; // in paisa (500000 = ₹5000)

  const razorpayOrder = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `school_${schoolId}_${Date.now()}`,
    // receipt is our internal reference — helps us match Razorpay's records with ours
  });

  // --- Save the order in our database ---
  const payment = await prisma.payment.create({
    data: {
      schoolId,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: 'INR',
      status: 'CREATED',
    },
  });

  logger.info(`Payment order created: ${razorpayOrder.id} for school ${schoolId}`);

  return {
    orderId: razorpayOrder.id,
    amount,
    currency: 'INR',
    key: config.razorpay.keyId, // Frontend needs this to open Razorpay checkout
  };
}

/**
 * verifyPayment — Verify a payment after Razorpay checkout completes.
 *
 * After the user pays, Razorpay sends us:
 * - razorpay_order_id
 * - razorpay_payment_id
 * - razorpay_signature
 *
 * We verify the signature to confirm the payment is genuine
 * (not a forged request from an attacker).
 */
async function verifyPayment(orderId, paymentId, signature) {
  // --- Step 1: Verify the signature ---
  // Razorpay creates the signature using: order_id + "|" + payment_id + HMAC-SHA256 with our secret
  // We recreate it and compare. If they match, the payment is genuine.
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    // HMAC = Hash-based Message Authentication Code
    // It's like a hash, but with a secret key — only someone who knows
    // the secret can create a valid signature.
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw ApiError.badRequest('Payment verification failed. Invalid signature.');
  }

  // --- Step 2: Update our database ---
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
  });

  if (!payment) {
    throw ApiError.notFound('Payment order not found.');
  }

  await prisma.$transaction(async (tx) => {
    // Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        status: 'PAID',
      },
    });

    // Update school payment status
    await tx.school.update({
      where: { id: payment.schoolId },
      data: { paymentStatus: 'PAID' },
    });
  });

  logger.info(`Payment verified: ${orderId} → ${paymentId}`);

  return { message: 'Payment verified successfully.' };
}

/**
 * handleWebhook — Process Razorpay webhook events.
 *
 * Razorpay sends webhooks for payment events (captured, failed, refunded).
 * We verify the webhook signature before processing.
 *
 * WHY WEBHOOKS?
 * The verifyPayment endpoint above relies on the CLIENT telling us
 * the payment succeeded. But what if the user's browser crashes after
 * paying? The webhook is Razorpay telling us DIRECTLY, server-to-server.
 */
async function handleWebhook(body, signature) {
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(JSON.stringify(body))
    .digest('hex');

  if (expectedSignature !== signature) {
    logger.warn('Invalid Razorpay webhook signature');
    throw ApiError.unauthorized('Invalid webhook signature.');
  }

  const event = body.event;
  const paymentEntity = body.payload?.payment?.entity;

  if (!paymentEntity) return;

  if (event === 'payment.captured') {
    // Payment was successful
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: paymentEntity.order_id },
    });

    if (payment && payment.status !== 'PAID') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentId: paymentEntity.id,
            status: 'PAID',
          },
        });

        await tx.school.update({
          where: { id: payment.schoolId },
          data: { paymentStatus: 'PAID' },
        });
      });

      logger.info(`Payment captured via webhook: ${paymentEntity.id}`);
    }
  } else if (event === 'payment.failed') {
    // Payment failed
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: paymentEntity.order_id },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      logger.warn(`Payment failed via webhook: ${paymentEntity.id}`);
    }
  }
}

/**
 * getPaymentStatus — Check the payment status for a school.
 */
async function getPaymentStatus(schoolId) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { paymentStatus: true, isFree: true },
  });

  if (!school) {
    throw ApiError.notFound('School not found.');
  }

  return {
    isFree: school.isFree,
    status: school.paymentStatus,
    paid: school.paymentStatus === 'PAID' || school.isFree,
  };
}

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
};
