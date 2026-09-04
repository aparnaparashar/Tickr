import { FRESHNESS_STATUS, FreshnessStatus } from '../../config/constants.js';
import { FreshnessMeta } from '../../shared/types/index.js';
import { config } from '../../config/env.js';

export class FreshnessPolicy {
  /**
   * Determine if the market for the given exchange is currently open
   * (Standard US: 9:30 AM - 4:00 PM EST, Mon-Fri; Indian: 9:15 AM - 3:30 PM IST, Mon-Fri)
   */
  static isMarketOpen(exchange: string, date = new Date()): boolean {
    const day = date.getUTCDay();
    if (day === 0 || day === 6) return false; // Weekend

    const ex = exchange.toUpperCase();
    if (ex === 'NSE' || ex === 'BSE') {
      // IST is UTC+5:30 -> 9:15 IST = 03:45 UTC, 15:30 IST = 10:00 UTC
      const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
      return utcMinutes >= 3 * 60 + 45 && utcMinutes <= 10 * 60;
    }

    // Default to US Equities (NYSE/NASDAQ): 13:30 UTC to 20:00 UTC (EDT: 9:30 - 16:00)
    const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
    return utcMinutes >= 13 * 60 + 30 && utcMinutes <= 20 * 60;
  }

  /**
   * Classify data freshness status based on provider timestamp and market state
   */
  static classify(
    providerTimestamp: Date,
    exchange: string,
    receivedAt = new Date()
  ): FreshnessMeta {
    const ageSeconds = Math.max(0, Math.floor((receivedAt.getTime() - providerTimestamp.getTime()) / 1000));
    const marketOpen = this.isMarketOpen(exchange, receivedAt);

    let status: FreshnessStatus = FRESHNESS_STATUS.FRESH;

    if (marketOpen) {
      if (ageSeconds > config.TTL_QUOTE_LIVE * 4) {
        status = FRESHNESS_STATUS.STALE;
      } else if (ageSeconds > config.TTL_QUOTE_LIVE) {
        status = FRESHNESS_STATUS.DELAYED;
      }
    } else {
      // Outside market hours, data is valid longer
      if (ageSeconds > config.TTL_QUOTE_CLOSED * 10) {
        status = FRESHNESS_STATUS.STALE;
      } else {
        status = FRESHNESS_STATUS.DELAYED;
      }
    }

    return {
      status,
      providerTimestamp: providerTimestamp.toISOString(),
      receivedAt: receivedAt.toISOString(),
      ageSeconds,
    };
  }

  /**
   * Reject out-of-order data: returns true only if incoming is strictly newer
   */
  static isNewer(incomingTimestamp: Date, existingTimestamp: Date | null | undefined): boolean {
    if (!existingTimestamp) return true;
    return incomingTimestamp.getTime() > existingTimestamp.getTime();
  }
}
