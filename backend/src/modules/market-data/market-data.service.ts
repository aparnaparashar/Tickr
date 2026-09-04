import { prisma } from '../../db/prisma.js';
import { CacheService } from '../../cache/cache.service.js';
import { ProviderFactory } from '../../providers/provider.factory.js';
import { FreshnessPolicy } from './freshness.policy.js';
import { IndicatorsService } from '../indicators/indicators.service.js';
import { CACHE_KEYS } from '../../config/constants.js';
import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  NormalizedQuote,
  NormalizedBar,
  NormalizedNews,
  NormalizedFundamentals,
  TechnicalIndicators,
  FreshnessMeta,
} from '../../shared/types/index.js';
import { logger } from '../../observability/logger.js';

export class MarketDataService {
  /**
   * Get Normalized Quote with Cache-Aside, Postgres persistence & Freshness tagging
   */
  static async getQuote(
    instrumentId: string
  ): Promise<{ quote: NormalizedQuote; freshness: FreshnessMeta }> {
    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId },
      include: { snapshot: true },
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument ${instrumentId} not found`);
    }

    const cacheKey = CACHE_KEYS.quote(instrumentId);

    return CacheService.getOrFetch(
      cacheKey,
      async () => {
        try {
          const provider = ProviderFactory.getMarketProvider();
          const liveQuote = await provider.getQuote(instrument.symbol, instrument.exchange);
          const freshness = FreshnessPolicy.classify(liveQuote.providerTimestamp, instrument.exchange);

          // Persist snapshot to Postgres if strictly newer
          if (FreshnessPolicy.isNewer(liveQuote.providerTimestamp, instrument.snapshot?.providerTimestamp)) {
            await prisma.latestMarketSnapshot.upsert({
              where: { instrumentId },
              create: {
                instrumentId,
                price: liveQuote.price,
                open: liveQuote.open,
                high: liveQuote.high,
                low: liveQuote.low,
                previousClose: liveQuote.previousClose,
                volume: liveQuote.volume,
                provider: liveQuote.provider,
                providerTimestamp: liveQuote.providerTimestamp,
                receivedAt: new Date(),
                freshnessStatus: freshness.status,
              },
              update: {
                price: liveQuote.price,
                open: liveQuote.open,
                high: liveQuote.high,
                low: liveQuote.low,
                previousClose: liveQuote.previousClose,
                volume: liveQuote.volume,
                provider: liveQuote.provider,
                providerTimestamp: liveQuote.providerTimestamp,
                receivedAt: new Date(),
                freshnessStatus: freshness.status,
              },
            });
          }

          return { quote: liveQuote, freshness };
        } catch (err) {
          logger.warn({ instrumentId, error: (err as Error).message }, 'Provider quote error, falling back to DB snapshot');

          // Graceful fallback to persisted snapshot if available
          if (instrument.snapshot) {
            const snap = instrument.snapshot;
            const freshness = FreshnessPolicy.classify(snap.providerTimestamp, instrument.exchange);
            const fallbackQuote: NormalizedQuote = {
              symbol: instrument.symbol,
              exchange: instrument.exchange,
              price: snap.price,
              open: snap.open,
              high: snap.high,
              low: snap.low,
              previousClose: snap.previousClose,
              change: snap.previousClose ? Number((snap.price - snap.previousClose).toFixed(2)) : null,
              percentChange: snap.previousClose
                ? Number((((snap.price - snap.previousClose) / snap.previousClose) * 100).toFixed(2))
                : null,
              volume: snap.volume,
              provider: snap.provider,
              providerTimestamp: snap.providerTimestamp,
              freshnessStatus: 'STALE',
            };
            return { quote: fallbackQuote, freshness: { ...freshness, status: 'STALE' } };
          }

          throw err;
        }
      },
      FreshnessPolicy.isMarketOpen(instrument.exchange) ? config.TTL_QUOTE_LIVE : config.TTL_QUOTE_CLOSED
    );
  }

  /**
   * Get Historical OHLCV Time-Series Bars
   */
  static async getTimeSeries(
    instrumentId: string,
    range: '1D' | '1W' | '1M' | '3M' | '1Y' = '1M',
    interval: '1min' | '5min' | '15min' | '1h' | '1day' = '1day'
  ): Promise<NormalizedBar[]> {
    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument ${instrumentId} not found`);
    }

    const cacheKey = CACHE_KEYS.history(instrumentId, range, interval);

    return CacheService.getOrFetch(
      cacheKey,
      async () => {
        const provider = ProviderFactory.getMarketProvider();
        return provider.getTimeSeries({
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          interval,
          range,
        });
      },
      config.TTL_HISTORY
    );
  }

  /**
   * Calculate Technical Indicators from Historical Bars
   */
  static async getIndicators(
    instrumentId: string,
    range: '1M' | '3M' | '1Y' = '3M'
  ): Promise<TechnicalIndicators> {
    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument ${instrumentId} not found`);
    }

    const cacheKey = CACHE_KEYS.indicators(instrumentId, range);

    return CacheService.getOrFetch(
      cacheKey,
      async () => {
        const bars = await this.getTimeSeries(instrumentId, range, '1day');
        return IndicatorsService.computeAll(instrument.symbol, bars);
      },
      config.TTL_INDICATORS
    );
  }

  /**
   * Get Company Fundamentals Overview
   */
  static async getFundamentals(instrumentId: string): Promise<NormalizedFundamentals | null> {
    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument ${instrumentId} not found`);
    }

    const cacheKey = CACHE_KEYS.fundamentals(instrumentId);

    return CacheService.getOrFetch(
      cacheKey,
      async () => {
        const provider = ProviderFactory.getFundamentalsProvider();
        return provider.getCompanyFundamentals(instrument.symbol);
      },
      config.TTL_FUNDAMENTALS
    );
  }

  /**
   * Get Company News Feed with deduplication
   */
  static async getNews(instrumentId: string, fromDate?: Date): Promise<NormalizedNews[]> {
    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument ${instrumentId} not found`);
    }

    const cacheKey = CACHE_KEYS.news(instrumentId);

    return CacheService.getOrFetch(
      cacheKey,
      async () => {
        const provider = ProviderFactory.getNewsProvider();
        const news = await provider.getCompanyNews(instrument.symbol, fromDate);

        // Deduplicate headlines
        const seenHeadlines = new Set<string>();
        return news.filter((item) => {
          const norm = item.headline.trim().toLowerCase();
          if (seenHeadlines.has(norm)) return false;
          seenHeadlines.add(norm);
          return true;
        });
      },
      config.TTL_NEWS
    );
  }
}
