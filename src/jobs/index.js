/**
 * ============================================================
 * FILE: src/jobs/index.js — Background Job Queue Setup
 * ============================================================
 *
 * WHAT IS A BACKGROUND JOB?
 *       Some tasks shouldn't run during a user's request because
 *       they take too long or need to run on a schedule:
 *
 *       - "Check every 5 minutes if any school has been silent for 7 days"
 *       - "Reconcile payments with Razorpay every 30 minutes"
 *       - "Check if any lock-ins have expired"
 *
 *       These run IN THE BACKGROUND, separately from HTTP requests.
 *
 * WHAT IS BULL?
 *       Bull is a job queue library backed by Redis. It lets you:
 *       1. Create jobs (add them to the queue)
 *       2. Schedule jobs (repeat every X minutes)
 *       3. Process jobs (run the actual code)
 *       4. Retry failed jobs automatically
 *
 *       Redis stores the job queue, so even if the server restarts,
 *       pending jobs are NOT lost.
 *
 * WHY NOT JUST USE setInterval()?
 *       setInterval runs WITHIN the same process. If the server restarts:
 *       - setInterval jobs are lost
 *       - Multiple server instances would run duplicate jobs
 *       Bull + Redis ensures jobs run exactly once, even with multiple servers.
 * ============================================================
 */

const Queue = require('bull');
const config = require('../config');
const logger = require('../utils/logger');

// Create job queues — each queue handles a different type of job
const autoReleaseQueue = new Queue('auto-release', config.redisUrl);
const lockInExpiryQueue = new Queue('lockin-expiry', config.redisUrl);
const paymentReconciliationQueue = new Queue('payment-reconciliation', config.redisUrl);

/**
 * setupJobs — Register all background job processors and schedules.
 *
 * Called once when the server starts. Sets up:
 * 1. How to PROCESS each job type
 * 2. WHEN/HOW OFTEN to run each job
 */
async function setupJobs() {
  // --- Import processors ---
  const processAutoRelease = require('./autoRelease.job');
  const processLockInExpiry = require('./lockinExpiry.job');
  const processPaymentReconciliation = require('./paymentReconciliation.job');

  // --- Register processors ---
  // When a job is picked from the queue, this function runs
  autoReleaseQueue.process(processAutoRelease);
  lockInExpiryQueue.process(processLockInExpiry);
  paymentReconciliationQueue.process(processPaymentReconciliation);

  // --- Schedule repeating jobs ---
  // These add a job to the queue at regular intervals

  // Check for 7-day school silence every 5 minutes
  await autoReleaseQueue.add(
    {}, // No data needed — the processor queries the DB
    {
      repeat: { every: 5 * 60 * 1000 }, // Every 5 minutes (in milliseconds)
      removeOnComplete: true,  // Delete completed jobs (keep the queue clean)
      removeOnFail: false,     // Keep failed jobs for debugging
    }
  );

  // Check for expired lock-ins every 5 minutes
  await lockInExpiryQueue.add(
    {},
    {
      repeat: { every: 5 * 60 * 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  // Reconcile payments every 30 minutes
  await paymentReconciliationQueue.add(
    {},
    {
      repeat: { every: 30 * 60 * 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  // --- Error handlers ---
  [autoReleaseQueue, lockInExpiryQueue, paymentReconciliationQueue].forEach((queue) => {
    queue.on('failed', (job, err) => {
      logger.error(`Job failed in queue ${queue.name}:`, {
        jobId: job.id,
        error: err.message,
      });
    });

    queue.on('completed', (job) => {
      logger.debug(`Job completed in queue ${queue.name}: ${job.id}`);
    });
  });

  logger.info('🔄 Background jobs scheduled successfully');
}

module.exports = { setupJobs };
