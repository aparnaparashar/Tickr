import axios, { AxiosInstance } from 'axios';
import {
  MarketDataProvider,
  TimeSeriesParams,
} from './market-data.interface.js';
import {
  NormalizedQuote,
  NormalizedBar,
  InstrumentCandidate,
} from '../shared/types/index.js';
import { FRESHNESS_STATUS } from '../config/constants.js';
import { config } from '../config/env.js';
import { QuotaManager } from '../security/quota-manager.js';
import { AppError } from '../shared/errors/app-error.js';
import { logger } from '../observability/logger.js';
import { metrics } from '../observability/metrics.js';

interface TwelveDataQuoteResponse {
  symbol: string;
  name?: string;
  exchange: string;
  mic_code?: string;
  currency: string;
  datetime?: string;
  timestamp?: number;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  is_market_open?: boolean;
  code?: number;
  message?: string;
  status?: string;
}

interface TwelveDataTimeSeriesResponse {
  meta?: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    type: string;
  };
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  status?: string;
  code?: number;
  message?: string;
}

export class TwelveDataProvider implements MarketDataProvider {
  readonly name = 'twelve_data';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.TWELVE_DATA_BASE_URL,
      timeout: config.PROVIDER_HTTP_TIMEOUT_MS,
      params: {
        apikey: config.TWELVE_DATA_API_KEY,
      },
    });
  }

  private formatSymbol(symbol: string, exchange: string): string {
    if (exchange.toUpperCase() === 'NSE' || exchange.toUpperCase() === 'BSE') {
      return `${symbol}:${exchange}`;
    }
    return symbol;
  }

  async searchStocks(query: string): Promise<InstrumentCandidate[]> {
    const hasQuota = await QuotaManager.checkAndConsume(this.name, 1);
    if (!hasQuota) {
      throw AppError.providerRateLimited('Twelve Data API quota exhausted');
    }

    try {
      const response = await this.client.get('/stocks', {
        params: { symbol: query },
      });

      metrics.recordProvider(this.name, 'success');
      const data = response.data?.data;
      if (!Array.isArray(data)) return [];

      return data.slice(0, 20).map((item: {
        symbol: string;
        name: string;
        currency: string;
        exchange: string;
        mic_code?: string;
        country?: string;
        type?: string;
      }) => ({
        symbol: item.symbol,
        exchange: item.exchange,
        micCode: item.mic_code,
        country: item.country,
        name: item.name,
        currency: item.currency,
        type: item.type || 'Common Stock',
        providerSymbol: this.formatSymbol(item.symbol, item.exchange),
      }));
    } catch (err) {
      metrics.recordProvider(this.name, 'failure');
      const axiosErr = err as any;
      if (
        (err instanceof AppError && err.message.includes('Twelve Data API quota exhausted')) ||
        axiosErr.response?.status === 429 ||
        axiosErr.response?.data?.message?.includes('API call limit') ||
        axiosErr.response?.data?.message?.includes('quota')
      ) {
        logger.warn('Twelve Data API quota exhausted during search');
        throw AppError.providerRateLimited('Twelve Data API quota exhausted');
      }
      logger.error({ error: (err as Error).message }, 'Twelve Data search error');
      throw AppError.providerUnavailable('Failed to search stocks on Twelve Data');
    }
  }

  async getQuote(symbol: string, exchange: string): Promise<NormalizedQuote> {
    const quotes = await this.getQuotes([{ symbol, exchange }]);
    if (!quotes[0]) {
      throw AppError.notFound(`Quote not found for ${symbol}:${exchange}`);
    }
    return quotes[0];
  }

  async getQuotes(instruments: Array<{ symbol: string; exchange: string }>): Promise<NormalizedQuote[]> {
    if (instruments.length === 0) return [];

    const hasQuota = await QuotaManager.checkAndConsume(this.name, instruments.length);
    if (!hasQuota) {
      throw AppError.providerRateLimited('Twelve Data API quota exhausted');
    }

    const formattedSymbols = instruments.map((i) => this.formatSymbol(i.symbol, i.exchange)).join(',');

    try {
      const response = await this.client.get('/quote', {
        params: { symbol: formattedSymbols },
      });

      metrics.recordProvider(this.name, 'success');
      const resData = response.data;
      if (
        resData &&
        (resData.code === 429 ||
          (typeof resData.message === 'string' &&
            (resData.message.includes('API call limit') || resData.message.includes('quota'))))
      ) {
        throw AppError.providerRateLimited('Twelve Data API quota exhausted');
      }

      const results: NormalizedQuote[] = [];

      // Twelve data returns a single object if 1 symbol, or a dictionary if multiple
      const quoteMap: Record<string, TwelveDataQuoteResponse> = {};
      if (instruments.length === 1) {
        quoteMap[instruments[0].symbol] = resData;
      } else {
        Object.assign(quoteMap, resData);
      }

      for (const inst of instruments) {
        const item = quoteMap[inst.symbol] || quoteMap[this.formatSymbol(inst.symbol, inst.exchange)];
        if (!item || item.status === 'error' || !item.close) {
          continue;
        }

        const price = parseFloat(item.close);
        const open = item.open ? parseFloat(item.open) : null;
        const high = item.high ? parseFloat(item.high) : null;
        const low = item.low ? parseFloat(item.low) : null;
        const previousClose = item.previous_close ? parseFloat(item.previous_close) : null;
        const change = item.change ? parseFloat(item.change) : null;
        const percentChange = item.percent_change ? parseFloat(item.percent_change) : null;
        const volume = item.volume ? parseInt(item.volume, 10) : 0;
        const providerTimestamp = item.datetime ? new Date(item.datetime) : new Date();

        results.push({
          symbol: inst.symbol,
          exchange: inst.exchange,
          price,
          open,
          high,
          low,
          previousClose,
          change,
          percentChange,
          volume,
          provider: this.name,
          providerTimestamp,
          freshnessStatus: item.is_market_open ? FRESHNESS_STATUS.FRESH : FRESHNESS_STATUS.DELAYED,
        });
      }

      return results;
    } catch (err) {
      metrics.recordProvider(this.name, 'failure');
      const axiosErr = err as any;
      if (
        (err instanceof AppError && err.message.includes('Twelve Data API quota exhausted')) ||
        axiosErr.response?.status === 429 ||
        axiosErr.response?.data?.message?.includes('API call limit') ||
        axiosErr.response?.data?.message?.includes('quota')
      ) {
        logger.warn('Twelve Data API quota exhausted during quotes fetch');
        throw AppError.providerRateLimited('Twelve Data API quota exhausted');
      }
      logger.error({ error: (err as Error).message }, 'Twelve Data quote error');
      throw AppError.providerUnavailable('Failed to fetch quotes from Twelve Data');
    }
  }

  async getTimeSeries(params: TimeSeriesParams): Promise<NormalizedBar[]> {
    const hasQuota = await QuotaManager.checkAndConsume(this.name, 1);
    if (!hasQuota) {
      throw AppError.providerRateLimited('Twelve Data API quota exhausted');
    }

    const formattedSymbol = this.formatSymbol(params.symbol, params.exchange);

    try {
      const response = await this.client.get('/time_series', {
        params: {
          symbol: formattedSymbol,
          interval: params.interval,
          outputsize: params.outputsize || 50,
        },
      });

      metrics.recordProvider(this.name, 'success');
      const data: TwelveDataTimeSeriesResponse = response.data;
      if (
        data &&
        (data.code === 429 ||
          (typeof data.message === 'string' &&
            (data.message.includes('API call limit') || data.message.includes('quota'))))
      ) {
        throw AppError.providerRateLimited('Twelve Data API quota exhausted');
      }

      if (!data.values || !Array.isArray(data.values)) {
        return [];
      }

      return data.values.map((v) => ({
        interval: params.interval,
        bucketTime: new Date(v.datetime),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseFloat(v.volume || '0'),
        provider: this.name,
      }));
    } catch (err) {
      metrics.recordProvider(this.name, 'failure');
      const axiosErr = err as any;
      if (
        (err instanceof AppError && err.message.includes('Twelve Data API quota exhausted')) ||
        axiosErr.response?.status === 429 ||
        axiosErr.response?.data?.message?.includes('API call limit') ||
        axiosErr.response?.data?.message?.includes('quota')
      ) {
        logger.warn('Twelve Data API quota exhausted during time series');
        throw AppError.providerRateLimited('Twelve Data API quota exhausted');
      }
      logger.error({ error: (err as Error).message }, 'Twelve Data time_series error');
      throw AppError.providerUnavailable('Failed to fetch time series from Twelve Data');
    }
  }
}
