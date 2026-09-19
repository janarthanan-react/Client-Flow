import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

if (process.env.NODE_ENV !== 'test') {
  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis connection failed. Background jobs will operate in in-memory fallback mode.');
          return null;
        }
        return Math.min(times * 1000, 3000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info('Connected to Redis successfully');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn(`Redis connection error: ${err.message}. Operating in fallback mode.`);
    });
  } catch (error: any) {
    logger.warn(`Could not initialize Redis: ${error.message}`);
  }
}

export const getRedisClient = () => redisClient;
export const isRedisReady = () => isRedisAvailable;

export async function connectRedis() {
  if (!redisClient) return false;
  try {
    await redisClient.connect();
    return true;
  } catch (err: any) {
    logger.warn(`Failed initial Redis connection: ${err.message}. Fallback mode active.`);
    return false;
  }
}
