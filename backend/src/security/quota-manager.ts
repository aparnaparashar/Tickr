import { redis, memoryFallback, isRedisReady } from '../cache/redis.js';
import { CACHE_KEYS } from '../config/constants.js';
import { config } from '../config/env.js';
import { logger } from '../observability/logger.js';
import { metrics } from '../observability/metrics.js';

export class QuotaManager {
  private static getClient() {
    return isRedisReady() ? redis : memoryFallback;
  }

  /**
   * Check if provider credit budget is available and consume credits atomically
   */
  static async checkAndConsume(provider: string, creditsNeeded = 1): Promise<boolean> {
    try {
      const client = this.getClient();
      const minuteKey = CACHE_KEYS.providerQuotaMinute(provider);
      const dailyKey = CACHE_KEYS.providerQuotaDaily(provider);

      // 1. Check minute quota
      const minuteUsedStr = await client.get(minuteKey);
      const minuteUsed = minuteUsedStr ? parseInt(minuteUsedStr, 10) : 0;
      if (minuteUsed + creditsNeeded > config.TWELVE_DATA_MINUTE_CREDIT_BUDGET) {
        logger.warn({ provider, minuteUsed, creditsNeeded }, 'Provider minute quota budget exceeded');
        metrics.recordProvider(provider, 'rate_limit');
        return false;
      }

      // 2. Check daily quota
      const dailyUsedStr = await client.get(dailyKey);
      const dailyUsed = dailyUsedStr ? parseInt(dailyUsedStr, 10) : 0;
      if (dailyUsed + creditsNeeded > config.TWELVE_DATA_DAILY_CREDIT_BUDGET) {
        logger.warn({ provider, dailyUsed, creditsNeeded }, 'Provider daily quota budget exceeded');
        metrics.recordProvider(provider, 'rate_limit');
        return false;
      }

      // 3. Atomically increment minute counter
      await (client as any).incrby(minuteKey, creditsNeeded);
      const minuteTtl = await (client as any).ttl(minuteKey);
      if (minuteTtl < 0) {
        await client.expire(minuteKey, 60); // 1 minute window
      }

      // 4. Atomically increment daily counter
      await (client as any).incrby(dailyKey, creditsNeeded);
      const dailyTtl = await (client as any).ttl(dailyKey);
      if (dailyTtl < 0) {
        await client.expire(dailyKey, 86400); // 24 hour window
      }

      return true;
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Failed to check provider quota');
      return true; // fail-open with logging so we don't halt app if Redis is slow
    }
  }

  static async getUsage(provider: string): Promise<{ minuteUsed: number; dailyUsed: number }> {
    const client = this.getClient();
    const minuteKey = CACHE_KEYS.providerQuotaMinute(provider);
    const dailyKey = CACHE_KEYS.providerQuotaDaily(provider);

    const [minute, daily] = await Promise.all([client.get(minuteKey), client.get(dailyKey)]);

    return {
      minuteUsed: minute ? parseInt(minute, 10) : 0,
      dailyUsed: daily ? parseInt(daily, 10) : 0,
    };
  }
}
