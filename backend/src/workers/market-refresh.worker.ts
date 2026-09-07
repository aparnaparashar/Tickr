import { prisma } from '../db/prisma.js';
import { MarketDataService } from '../modules/market-data/market-data.service.js';
import { ProviderFactory } from '../providers/provider.factory.js';
import { FreshnessPolicy } from '../modules/market-data/freshness.policy.js';
import { CacheService } from '../cache/cache.service.js';
import { CACHE_KEYS } from '../config/constants.js';
import { logger } from '../observability/logger.js';
import { metrics } from '../observability/metrics.js';

export class MarketRefreshWorker {
  /**
   * Refresh all actively watched stocks in batches
   * Only symbols actively present in watchlist_items are queried
   */
  static async refreshWatchedInstruments(): Promise<number> {
    try {
      // 1. Get distinct watched instruments
      const distinctItems = await prisma.watchlistItem.findMany({
        select: {
          instrumentId: true,
          instrument: {
            select: {
              id: true,
              symbol: true,
              exchange: true,
            },
          },
        },
        distinct: ['instrumentId'],
      });

      if (distinctItems.length === 0) {
        return 0;
      }

      logger.info({ count: distinctItems.length }, 'Running batch market refresh for watched instruments');

      const provider = ProviderFactory.getMarketProvider();
      const instrumentsToFetch = distinctItems.map((item) => ({
        id: item.instrument.id,
        symbol: item.instrument.symbol,
        exchange: item.instrument.exchange,
      }));

      // 2. Batch fetch quotes from market provider
      const quotes = await provider.getQuotes(instrumentsToFetch);

      // 3. Process and persist updates
      for (const quote of quotes) {
        const targetInst = instrumentsToFetch.find(
          (i) => i.symbol.toUpperCase() === quote.symbol.toUpperCase()
        );
        if (!targetInst) continue;

        const freshness = FreshnessPolicy.classify(quote.providerTimestamp, quote.exchange);

        // Update database snapshot
        await prisma.latestMarketSnapshot.upsert({
          where: { instrumentId: targetInst.id },
          create: {
            instrumentId: targetInst.id,
            price: quote.price,
            open: quote.open,
            high: quote.high,
            low: quote.low,
            previousClose: quote.previousClose,
            volume: quote.volume,
            provider: quote.provider,
            providerTimestamp: quote.providerTimestamp,
            receivedAt: new Date(),
            freshnessStatus: freshness.status,
          },
          update: {
            price: quote.price,
            open: quote.open,
            high: quote.high,
            low: quote.low,
            previousClose: quote.previousClose,
            volume: quote.volume,
            provider: quote.provider,
            providerTimestamp: quote.providerTimestamp,
            receivedAt: new Date(),
            freshnessStatus: freshness.status,
          },
        });

        // Update hot Redis cache
        await CacheService.set(CACHE_KEYS.quote(targetInst.id), { quote, freshness }, 30);
      }

      metrics.increment('jobs_completed_total', 'market-refresh');
      return quotes.length;
    } catch (err) {
      metrics.increment('jobs_failed_total', 'market-refresh');
      logger.error({ error: (err as Error).message }, 'Market refresh worker error');
      return 0;
    }
  }
}
