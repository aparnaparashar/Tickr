import { Redis } from 'ioredis';
import { logger } from '../observability/logger.js';
import { config } from '../config/env.js';

let redisInstance: Redis | null = null;
let isRedisAvailable = false;

// In-memory cache fallback if Redis is unreachable in local dev
class MemoryCacheFallback {
  private store = new Map<string, { value: string; expiry: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry !== null && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiry: number | null = null;
    if (mode === 'EX' && duration) {
      expiry = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiry = Date.now() + duration;
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    const curr = await this.get(key);
    const val = (curr ? parseInt(curr, 10) : 0) + 1;
    this.store.set(key, { value: val.toString(), expiry: null });
    return val;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiry = Date.now() + seconds * 1000;
    return 1;
  }

  async setnx(key: string, value: string): Promise<number> {
    if (this.store.has(key)) return 0;
    this.store.set(key, { value, expiry: null });
    return 1;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

export const memoryFallback = new MemoryCacheFallback();

export const getRedisClient = (): Redis => {
  if (!redisInstance) {
    redisInstance = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 800,
      retryStrategy: (times) => {
        if (times > 2 || config.NODE_ENV === 'test') {
          return null;
        }
        return Math.min(times * 100, 1000);
      },
    });

    if (config.NODE_ENV !== 'test') {
      redisInstance.connect().catch((err) => {
        isRedisAvailable = false;
        logger.warn({ error: err.message }, 'Redis initial connect failed, using memory fallback');
      });
    }

    redisInstance.on('connect', () => {
      isRedisAvailable = true;
      logger.info('Connected to Redis server');
    });

    redisInstance.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn({ error: err.message }, 'Redis connection warning, using memory fallback');
    });
  }
  return redisInstance;
};

export const isRedisReady = (): boolean => isRedisAvailable;
export const redis = getRedisClient();
