import {
  MarketDataProvider,
  TimeSeriesParams,
} from './market-data.interface.js';
import {
  NormalizedQuote,
  NormalizedBar,
  InstrumentCandidate,
} from '../shared/types/index.js';
import { logger } from '../observability/logger.js';
import { AppError } from '../shared/errors/app-error.js';

export class FallbackMarketDataProvider implements MarketDataProvider {
  readonly name = 'composite_fallback_provider';

  constructor(
    private primary: MarketDataProvider,
    private fallback: MarketDataProvider
  ) {}

  private isQuotaOrRateLimitError(err: unknown): boolean {
    if (!err) return false;
    const msg = (err as Error).message || '';
    const axiosErr = err as any;
    return (
      (err instanceof AppError && (err.code === 'PROVIDER_RATE_LIMITED' || msg.includes('quota'))) ||
      msg.includes('Twelve Data API quota exhausted') ||
      msg.includes('API call limit') ||
      msg.includes('quota') ||
      axiosErr.response?.status === 429 ||
      axiosErr.status === 429
    );
  }

  async searchStocks(query: string): Promise<InstrumentCandidate[]> {
    try {
      return await this.primary.searchStocks(query);
    } catch (err) {
      if (this.isQuotaOrRateLimitError(err)) {
        logger.warn({ query }, 'Primary provider quota exhausted for search, falling back to Finnhub');
        return await this.fallback.searchStocks(query);
      }
      logger.warn({ query, error: (err as Error).message }, 'Primary search failed, attempting Finnhub fallback');
      try {
        return await this.fallback.searchStocks(query);
      } catch (fallbackErr) {
        throw err;
      }
    }
  }

  async getQuote(symbol: string, exchange: string): Promise<NormalizedQuote> {
    try {
      return await this.primary.getQuote(symbol, exchange);
    } catch (err) {
      if (this.isQuotaOrRateLimitError(err)) {
        logger.warn({ symbol, exchange }, 'Primary provider quota exhausted for quote, falling back to Finnhub');
        return await this.fallback.getQuote(symbol, exchange);
      }
      logger.warn({ symbol, exchange, error: (err as Error).message }, 'Primary quote failed, attempting Finnhub fallback');
      try {
        return await this.fallback.getQuote(symbol, exchange);
      } catch (fallbackErr) {
        throw err;
      }
    }
  }

  async getQuotes(instruments: Array<{ symbol: string; exchange: string }>): Promise<NormalizedQuote[]> {
    if (instruments.length === 0) return [];

    try {
      const results = await this.primary.getQuotes(instruments);
      if (results.length > 0) {
        return results;
      }
      logger.info('Primary provider returned empty quotes batch, attempting Finnhub fallback');
      return await this.fallback.getQuotes(instruments);
    } catch (err) {
      if (this.isQuotaOrRateLimitError(err)) {
        logger.warn(
          { count: instruments.length },
          'Twelve Data quota exhausted during batch quote fetch. Seamlessly falling back to Finnhub'
        );
        return await this.fallback.getQuotes(instruments);
      }
      logger.warn(
        { count: instruments.length, error: (err as Error).message },
        'Primary batch quotes failed, attempting Finnhub fallback'
      );
      try {
        return await this.fallback.getQuotes(instruments);
      } catch (fallbackErr) {
        throw err;
      }
    }
  }

  async getTimeSeries(params: TimeSeriesParams): Promise<NormalizedBar[]> {
    try {
      const bars = await this.primary.getTimeSeries(params);
      if (bars && bars.length > 0) return bars;
      return await this.fallback.getTimeSeries(params);
    } catch (err) {
      if (this.isQuotaOrRateLimitError(err)) {
        logger.warn({ symbol: params.symbol }, 'Primary provider quota exhausted for time series, falling back to Finnhub');
        return await this.fallback.getTimeSeries(params);
      }
      logger.warn({ symbol: params.symbol, error: (err as Error).message }, 'Primary time series failed, attempting Finnhub fallback');
      try {
        return await this.fallback.getTimeSeries(params);
      } catch {
        throw err;
      }
    }
  }
}
