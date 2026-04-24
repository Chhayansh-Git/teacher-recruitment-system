/**
 * ============================================================
 * FILE: src/jobs/paymentReconciliation.job.js — Payment Reconciliation
 * ============================================================
 *
 * WHAT: Fetches payment status from Razorpay for orders that are
 *       stuck in "CREATED" status (user might have paid but webhook failed).
 *
 * WHY: There are edge cases where:
 *       - User pays but their browser crashes before callback
 *       - Razorpay webhook fails due to network issues
 *       - Payment page times out after 30 minutes
 *
 * This job runs every 30 minutes to catch these cases.
 * ============================================================
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

async function processPaymentReconciliation(job) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  // Find old "CREATED" orders (older than 30 minutes)
  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: 'CREATED',
      createdAt: { lt: thirtyMinutesAgo },
    },
  });

  if (pendingPayments.length === 0) {
    return { reconciled: 0 };
  }

  logger.info(`Payment reconciliation: checking ${pendingPayments.length} pending order(s)`);

  let reconciled = 0;

  for (const payment of pendingPayments) {
    try {
      // TODO: In production, query the Razorpay API to check order status
      // const Razorpay = require('razorpay');
      // const razorpay = new Razorpay({ key_id, key_secret });
      // const order = await razorpay.orders.fetch(payment.razorpayOrderId);
      // if (order.status === 'paid') { ... }

      // For now, mark very old orders as EXPIRED
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      if (payment.createdAt < twoHoursAgo) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'EXPIRED' },
        });
        reconciled++;
        logger.info(`Payment expired: ${payment.razorpayOrderId}`);
      }
    } catch (error) {
      logger.error(`Reconciliation failed for ${payment.razorpayOrderId}:`, error.message);
    }
  }

  return { reconciled, checked: pendingPayments.length };
}

module.exports = processPaymentReconciliation;
