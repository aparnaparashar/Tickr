import { Queue } from 'bullmq';
import { isRedisReady, redis } from '../cache/redis.js';
import { logger } from '../observability/logger.js';

let marketRefreshQueue: Queue | null = null;
let alertEvalQueue: Queue | null = null;

export const getMarketRefreshQueue = (): Queue | null => {
  if (!isRedisReady()) return null;
  if (!marketRefreshQueue) {
    try {
      marketRefreshQueue = new Queue('market-refresh', {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });
    } catch (err) {
      logger.warn({ error: (err as Error).message }, 'Failed to initialize BullMQ queue');
    }
  }
  return marketRefreshQueue;
};

export const getAlertEvalQueue = (): Queue | null => {
  if (!isRedisReady()) return null;
  if (!alertEvalQueue) {
    try {
      alertEvalQueue = new Queue('alert-eval', {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });
    } catch (err) {
      logger.warn({ error: (err as Error).message }, 'Failed to initialize Alert Eval queue');
    }
  }
  return alertEvalQueue;
};
