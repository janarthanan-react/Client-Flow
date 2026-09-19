import { Queue, Worker } from 'bullmq';
import { config } from '../config';
import { logger } from './../lib/logger';
import { sendEmail, SendEmailOptions } from '../lib/email';
import { isRedisReady } from '../lib/redis';

const QUEUE_NAME = 'email-queue';

let emailQueue: Queue | null = null;
let emailWorker: Worker | null = null;

if (process.env.NODE_ENV !== 'test') {
  try {
    const connection = {
      host: new URL(config.redisUrl).hostname || 'localhost',
      port: parseInt(new URL(config.redisUrl).port || '6379', 10),
      maxRetriesPerRequest: null,
    };

    emailQueue = new Queue(QUEUE_NAME, { connection });

    emailWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        logger.debug(`Processing email job ${job.id} for ${job.data.to}`);
        await sendEmail(job.data);
      },
      { connection, concurrency: 5 }
    );

    emailWorker.on('completed', (job) => {
      logger.debug(`Email job ${job.id} completed`);
    });

    emailWorker.on('failed', (job, err) => {
      logger.error(`Email job ${job?.id} failed: ${err.message}`);
    });
  } catch (err: any) {
    logger.warn(`BullMQ Email Queue initialization skipped (Redis unavailable). Using in-memory async worker.`);
  }
}

export const enqueueEmail = async (emailData: SendEmailOptions) => {
  if (emailQueue && isRedisReady()) {
    try {
      await emailQueue.add('send-email', emailData, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      });
      return;
    } catch (err: any) {
      logger.warn(`Failed to push to Redis email queue: ${err.message}. Sending via async fallback.`);
    }
  }

  // Resilient in-memory async worker fallback
  setImmediate(async () => {
    try {
      await sendEmail(emailData);
    } catch (error: any) {
      logger.error(`Fallback email processing failed: ${error.message}`);
    }
  });
};
