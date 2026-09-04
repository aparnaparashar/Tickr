import {
  MarketDataProvider,
  NewsProvider,
  FundamentalsProvider,
} from './market-data.interface.js';
import { TwelveDataProvider } from './twelve-data.provider.js';
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
        logger.info('Initializing Twelve Data market provider');
        this.marketProviderInstance = new TwelveDataProvider();
      } else {
        logger.info('Initializing Mock Market Provider (seamless offline & demo mode)');
        this.marketProviderInstance = new MockMarketDataProvider();
      }
    }
    return this.marketProviderInstance;
  }

  static getNewsProvider(): NewsProvider {
    if (!this.newsProviderInstance) {
      if (config.NEWS_PROVIDER === 'alpha_vantage' && config.ALPHA_VANTAGE_API_KEY !== 'demo') {
        this.newsProviderInstance = new AlphaVantageProvider();
      } else {
        this.newsProviderInstance = new MockMarketDataProvider();
      }
    }
    return this.newsProviderInstance;
  }

  static getFundamentalsProvider(): FundamentalsProvider {
    if (!this.fundamentalsProviderInstance) {
      if (config.NEWS_PROVIDER === 'alpha_vantage' && config.ALPHA_VANTAGE_API_KEY !== 'demo') {
        this.fundamentalsProviderInstance = new AlphaVantageProvider();
      } else {
        this.fundamentalsProviderInstance = new MockMarketDataProvider();
      }
    }
    return this.fundamentalsProviderInstance;
  }
}
