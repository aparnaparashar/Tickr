import {
  MarketDataProvider,
  NewsProvider,
  FundamentalsProvider,
} from './market-data.interface.js';
import { TwelveDataProvider } from './twelve-data.provider.js';
import { FinnhubProvider } from './finnhub.provider.js';
import { FallbackMarketDataProvider } from './fallback-market.provider.js';
import { AlphaVantageProvider } from './alpha-vantage.provider.js';
import { MockMarketDataProvider } from './mock-market.provider.js';
import { config } from '../config/env.js';
import { logger } from '../observability/logger.js';

export class ProviderFactory {
  private static marketProviderInstance: MarketDataProvider | null = null;
  private static newsProviderInstance: NewsProvider | null = null;
  private static fundamentalsProviderInstance: FundamentalsProvider | null = null;

  static getMarketProvider(): MarketDataProvider {
    if (!this.marketProviderInstance) {
      if (config.MARKET_PROVIDER === 'twelve_data' && config.TWELVE_DATA_API_KEY !== 'demo') {
        const twelveDataProvider = new TwelveDataProvider();
        if (config.FINNHUB_API_KEY) {
          logger.info('Initializing Twelve Data market provider with Finnhub fallback');
          const finnhubProvider = new FinnhubProvider();
          this.marketProviderInstance = new FallbackMarketDataProvider(twelveDataProvider, finnhubProvider);
        } else {
          logger.info('Initializing Twelve Data market provider');
          this.marketProviderInstance = twelveDataProvider;
        }
      } else if (config.FINNHUB_API_KEY) {
        logger.info('Initializing Finnhub standalone market provider');
        this.marketProviderInstance = new FinnhubProvider();
      } else {
        logger.info('Initializing Mock Market Provider (seamless offline & demo mode)');
        this.marketProviderInstance = new MockMarketDataProvider();
      }
    }
    return this.marketProviderInstance;
  }

  static getNewsProvider(): NewsProvider {
    if (!this.newsProviderInstance) {
      if (config.FINNHUB_API_KEY) {
        logger.info('Initializing Finnhub news provider');
        this.newsProviderInstance = new FinnhubProvider();
      } else if (config.NEWS_PROVIDER === 'alpha_vantage' && config.ALPHA_VANTAGE_API_KEY !== 'demo') {
        this.newsProviderInstance = new AlphaVantageProvider();
      } else {
        this.newsProviderInstance = new MockMarketDataProvider();
      }
    }
    return this.newsProviderInstance;
  }

  static getFundamentalsProvider(): FundamentalsProvider {
    if (!this.fundamentalsProviderInstance) {
      if (config.FINNHUB_API_KEY) {
        logger.info('Initializing Finnhub fundamentals provider');
        this.fundamentalsProviderInstance = new FinnhubProvider();
      } else if (config.NEWS_PROVIDER === 'alpha_vantage' && config.ALPHA_VANTAGE_API_KEY !== 'demo') {
        this.fundamentalsProviderInstance = new AlphaVantageProvider();
      } else {
        this.fundamentalsProviderInstance = new MockMarketDataProvider();
      }
    }
    return this.fundamentalsProviderInstance;
  }
}
