import { Queue, Worker } from 'bullmq';
import { config } from '../config';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { emitToUser, emitToOrg } from '../lib/socket';
import { isRedisReady } from '../lib/redis';

export interface CreateNotificationJobData {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  broadcastToOrg?: boolean;
}

const QUEUE_NAME = 'notification-queue';

let notificationQueue: Queue | null = null;
let notificationWorker: Worker | null = null;

async function processNotification(data: CreateNotificationJobData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    });

    // Real-time socket emission
    emitToUser(data.userId, 'notification.created', notification);

    if (data.broadcastToOrg) {
      emitToOrg(data.organizationId, 'notification.created', notification);
    }

    return notification;
  } catch (error: any) {
    logger.error('Error creating notification in background job:', { error: error.message });
    throw error;
  }
}

if (process.env.NODE_ENV !== 'test') {
  try {
    const connection = {
      host: new URL(config.redisUrl).hostname || 'localhost',
      port: parseInt(new URL(config.redisUrl).port || '6379', 10),
      maxRetriesPerRequest: null,
    };

    notificationQueue = new Queue(QUEUE_NAME, { connection });

    notificationWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        logger.debug(`Processing notification job ${job.id}`);
        await processNotification(job.data);
      },
      { connection, concurrency: 10 }
    );

    notificationWorker.on('failed', (job, err) => {
      logger.error(`Notification job ${job?.id} failed: ${err.message}`);
    });
  } catch (err: any) {
    logger.warn(`BullMQ Notification Queue initialization skipped. Using in-memory fallback.`);
  }
}

export const enqueueNotification = async (data: CreateNotificationJobData) => {
  if (notificationQueue && isRedisReady()) {
    try {
      await notificationQueue.add('create-notification', data, {
        attempts: 2,
        removeOnComplete: true,
      });
      return;
    } catch (err: any) {
      logger.warn(`Failed to push to Redis notification queue: ${err.message}. Using fallback.`);
    }
  }

  // Fallback in-memory
  setImmediate(async () => {
    try {
      await processNotification(data);
    } catch (err: any) {
      logger.error(`Fallback notification failed: ${err.message}`);
    }
  });
};
