import { redis, memoryFallback, isRedisReady } from './redis.js';
import { logger } from '../observability/logger.js';
import { metrics } from '../observability/metrics.js';

export class CacheService {
  private static inFlightPromises = new Map<string, Promise<unknown>>();

  private static getClient() {
    return isRedisReady() ? redis : memoryFallback;
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const raw = await client.get(key);
      if (raw) {
        metrics.recordCache(true);
        return JSON.parse(raw) as T;
      }
      metrics.recordCache(false);
      return null;
    } catch (err) {
      logger.warn({ key, error: (err as Error).message }, 'Cache get failure');
      metrics.recordCache(false);
      return null;
    }
  }

  static async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const client = this.getClient();
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await client.set(key, serialized);
      }
    } catch (err) {
      logger.warn({ key, error: (err as Error).message }, 'Cache set failure');
    }
  }

  static async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      const client = this.getClient();
      await client.del(...keys);
    } catch (err) {
      logger.warn({ keys, error: (err as Error).message }, 'Cache del failure');
    }
  }

  /**
   * Cache-Aside with Stampede Protection (Request Coalescing)
   * If multiple concurrent requests ask for the same expired key, only 1 fetcher runs.
   */
  static async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // 1. Check cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 2. Check if a fetch is already in flight for this key (Request Coalescing)
    if (this.inFlightPromises.has(key)) {
      try {
        return (await this.inFlightPromises.get(key)) as T;
      } catch {
        // if flight failed, proceed to try again
      }
    }

    // 3. Launch fetcher and store in-flight promise
    const fetchPromise = (async () => {
      try {
        const fresh = await fetcher();
        if (fresh !== undefined && fresh !== null) {
          await this.set(key, fresh, ttlSeconds);
        }
        return fresh;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Acquire a distributed lock using Redis SETNX with TTL
   */
  static async acquireLock(resource: string, ttlSeconds = 10): Promise<boolean> {
    const lockKey = `lock:v1:${resource}`;
    try {
      const client = this.getClient();
      const acquired = await client.set(lockKey, 'locked', 'EX', ttlSeconds, 'NX');
      return acquired === 'OK';
    } catch {
      return false;
    }
  }

  static async releaseLock(resource: string): Promise<void> {
    const lockKey = `lock:v1:${resource}`;
    try {
      const client = this.getClient();
      await client.del(lockKey);
    } catch {
      // ignore
    }
  }
}
