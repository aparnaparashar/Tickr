import axios, { AxiosInstance } from 'axios';
import { NewsProvider, FundamentalsProvider } from './market-data.interface.js';
import { NormalizedNews, NormalizedFundamentals } from '../shared/types/index.js';
import { config } from '../config/env.js';
import { logger } from '../observability/logger.js';
import { metrics } from '../observability/metrics.js';

export class AlphaVantageProvider implements NewsProvider, FundamentalsProvider {
  readonly name = 'alpha_vantage';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.alphavantage.co',
      timeout: config.PROVIDER_HTTP_TIMEOUT_MS,
      params: {
        apikey: config.ALPHA_VANTAGE_API_KEY,
      },
    });
  }

  async getCompanyNews(symbol: string, fromDate?: Date): Promise<NormalizedNews[]> {
    try {
      const response = await this.client.get('/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbol,
          limit: 20,
        },
      });

      metrics.recordProvider(this.name, 'success');
      const feed = response.data?.feed;
      if (!Array.isArray(feed)) return [];

      return feed
        .map((item: {
          title: string;
          summary: string;
          url: string;
          source: string;
          time_published: string;
          ticker_sentiment?: Array<{ ticker: string; ticker_sentiment_label: string }>;
        }) => {
          // Format: 20240315T120000
          const raw = item.time_published;
          const year = raw.substring(0, 4);
          const month = raw.substring(4, 6);
          const day = raw.substring(6, 8);
          const hour = raw.substring(9, 11);
          const min = raw.substring(11, 13);
          const sec = raw.substring(13, 15);
          const pubDate = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);

          const tickerItem = item.ticker_sentiment?.find((t) => t.ticker === symbol);
          let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
          if (tickerItem?.ticker_sentiment_label?.includes('Bullish')) sentiment = 'BULLISH';
          if (tickerItem?.ticker_sentiment_label?.includes('Bearish')) sentiment = 'BEARISH';

          return {
            id: `av-${symbol}-${pubDate.getTime()}-${Math.random().toString(36).substring(7)}`,
            headline: item.title,
            summary: item.summary,
            url: item.url,
            source: item.source,
            publishedAt: pubDate,
            symbols: [symbol],
            sentiment,
          };
        })
        .filter((n) => (fromDate ? n.publishedAt >= fromDate : true));
    } catch (err) {
      metrics.recordProvider(this.name, 'failure');
      logger.warn({ error: (err as Error).message }, 'Alpha Vantage news error, falling back');
      return [];
    }
  }

  async getCompanyFundamentals(symbol: string): Promise<NormalizedFundamentals | null> {
    try {
      const response = await this.client.get('/query', {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
        },
      });

      metrics.recordProvider(this.name, 'success');
      const data = response.data;
      if (!data || !data.Symbol) return null;

      return {
        symbol: data.Symbol,
        marketCap: data.MarketCapitalization ? parseFloat(data.MarketCapitalization) : undefined,
        peRatio: data.PERatio ? parseFloat(data.PERatio) : undefined,
        pbRatio: data.PriceToBookRatio ? parseFloat(data.PriceToBookRatio) : undefined,
        dividendYield: data.DividendYield ? parseFloat(data.DividendYield) : undefined,
        week52High: data['52WeekHigh'] ? parseFloat(data['52WeekHigh']) : undefined,
        week52Low: data['52WeekLow'] ? parseFloat(data['52WeekLow']) : undefined,
        eps: data.EPS ? parseFloat(data.EPS) : undefined,
        beta: data.Beta ? parseFloat(data.Beta) : undefined,
        sector: data.Sector,
        industry: data.Industry,
        description: data.Description,
        lastUpdated: new Date(),
      };
    } catch (err) {
      metrics.recordProvider(this.name, 'failure');
      logger.warn({ error: (err as Error).message }, 'Alpha Vantage fundamentals error');
      return null;
    }
  }
}
