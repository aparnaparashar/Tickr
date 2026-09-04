import {
  MarketDataProvider,
  NewsProvider,
  FundamentalsProvider,
  TimeSeriesParams,
} from './market-data.interface.js';
import {
  NormalizedQuote,
  NormalizedBar,
  InstrumentCandidate,
  NormalizedNews,
  NormalizedFundamentals,
} from '../shared/types/index.js';
import { FRESHNESS_STATUS } from '../config/constants.js';

interface MockStockData {
  symbol: string;
  exchange: string;
  micCode: string;
  country: string;
  name: string;
  currency: string;
  basePrice: number;
  baseVolume: number;
  peRatio: number;
  marketCap: number;
  sector: string;
  industry: string;
  description: string;
}

const STOCK_UNIVERSE: MockStockData[] = [
  {
    symbol: 'NVDA',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'NVIDIA Corporation',
    currency: 'USD',
    basePrice: 128.5,
    baseVolume: 45000000,
    peRatio: 52.4,
    marketCap: 3150000000000,
    sector: 'Technology',
    industry: 'Semiconductors',
    description: 'NVIDIA designs graphics processing units (GPUs) for the gaming and professional markets, as well as system on a chip units for mobile computing and automotive market.',
  },
  {
    symbol: 'AAPL',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'Apple Inc.',
    currency: 'USD',
    basePrice: 224.2,
    baseVolume: 38000000,
    peRatio: 33.1,
    marketCap: 3420000000000,
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services.',
  },
  {
    symbol: 'MSFT',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'Microsoft Corporation',
    currency: 'USD',
    basePrice: 420.8,
    baseVolume: 21000000,
    peRatio: 35.8,
    marketCap: 3120000000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    description: 'Microsoft develops and supports software, services, devices and solutions including Azure, Windows, Office 365, and gaming platforms.',
  },
  {
    symbol: 'TSLA',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'Tesla, Inc.',
    currency: 'USD',
    basePrice: 218.4,
    baseVolume: 58000000,
    peRatio: 62.0,
    marketCap: 690000000000,
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    description: 'Tesla designs, develops, manufactures, sells, and leases electric vehicles, energy storage systems, and solar panels.',
  },
  {
    symbol: 'GOOGL',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'Alphabet Inc.',
    currency: 'USD',
    basePrice: 162.3,
    baseVolume: 24000000,
    peRatio: 23.5,
    marketCap: 2010000000000,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    description: 'Alphabet offers Google Services (Search, Ads, Maps, YouTube), Google Cloud, and Other Bets including Waymo.',
  },
  {
    symbol: 'AMZN',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'Amazon.com, Inc.',
    currency: 'USD',
    basePrice: 178.6,
    baseVolume: 32000000,
    peRatio: 42.1,
    marketCap: 1860000000000,
    sector: 'Consumer Cyclical',
    industry: 'Internet Retail',
    description: 'Amazon focuses on e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.',
  },
  {
    symbol: 'RELIANCE',
    exchange: 'NSE',
    micCode: 'XNSE',
    country: 'India',
    name: 'Reliance Industries Limited',
    currency: 'INR',
    basePrice: 2980.5,
    baseVolume: 6500000,
    peRatio: 28.3,
    marketCap: 20100000000000,
    sector: 'Energy',
    industry: 'Oil & Gas Refining & Marketing',
    description: 'Reliance Industries is an Indian multinational conglomerate company, headquartered in Mumbai, with businesses across energy, petrochemicals, natural gas, retail, telecommunications, and media.',
  },
  {
    symbol: 'SBIN',
    exchange: 'NSE',
    micCode: 'XNSE',
    country: 'India',
    name: 'State Bank of India',
    currency: 'INR',
    basePrice: 815.0,
    baseVolume: 12000000,
    peRatio: 11.2,
    marketCap: 7270000000000,
    sector: 'Financial Services',
    industry: 'Banks - Diversified',
    description: 'State Bank of India is an Indian multinational public sector bank and financial services statutory body headquartered in Mumbai.',
  },
];

export class MockMarketDataProvider implements MarketDataProvider, NewsProvider, FundamentalsProvider {
  readonly name = 'mock_provider';

  async searchStocks(query: string): Promise<InstrumentCandidate[]> {
    const q = query.trim().toUpperCase();
    return STOCK_UNIVERSE.filter(
      (s) => s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q)
    ).map((s) => ({
      symbol: s.symbol,
      exchange: s.exchange,
      micCode: s.micCode,
      country: s.country,
      name: s.name,
      currency: s.currency,
      type: 'Common Stock',
      providerSymbol: s.exchange === 'NSE' ? `${s.symbol}:NSE` : s.symbol,
    }));
  }

  async getQuote(symbol: string, exchange: string): Promise<NormalizedQuote> {
    const stock = STOCK_UNIVERSE.find(
      (s) => s.symbol.toUpperCase() === symbol.toUpperCase() && s.exchange.toUpperCase() === exchange.toUpperCase()
    ) || {
      symbol,
      exchange,
      micCode: 'XNAS',
      country: 'United States',
      name: `${symbol} Stock`,
      currency: 'USD',
      basePrice: 150.0,
      baseVolume: 10000000,
      peRatio: 25.0,
      marketCap: 100000000000,
      sector: 'General',
      industry: 'General',
      description: 'Stock details',
    };

    // Add tiny deterministic or time-based oscillation
    const now = new Date();
    const minuteFactor = Math.sin(now.getTime() / 60000) * 0.02; // +/- 2%
    const currentPrice = Number((stock.basePrice * (1 + minuteFactor)).toFixed(2));
    const openPrice = Number((stock.basePrice * 0.995).toFixed(2));
    const highPrice = Number((Math.max(currentPrice, openPrice) * 1.01).toFixed(2));
    const lowPrice = Number((Math.min(currentPrice, openPrice) * 0.99).toFixed(2));
    const prevClose = stock.basePrice;
    const change = Number((currentPrice - prevClose).toFixed(2));
    const percentChange = Number(((change / prevClose) * 100).toFixed(2));

    return {
      symbol: stock.symbol,
      exchange: stock.exchange,
      price: currentPrice,
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      previousClose: prevClose,
      change,
      percentChange,
      volume: Math.round(stock.baseVolume * (1 + Math.abs(minuteFactor) * 2)),
      provider: this.name,
      providerTimestamp: now,
      freshnessStatus: FRESHNESS_STATUS.FRESH,
    };
  }

  async getQuotes(instruments: Array<{ symbol: string; exchange: string }>): Promise<NormalizedQuote[]> {
    return Promise.all(instruments.map((inst) => this.getQuote(inst.symbol, inst.exchange)));
  }

  async getTimeSeries(params: TimeSeriesParams): Promise<NormalizedBar[]> {
    const stock = STOCK_UNIVERSE.find(
      (s) => s.symbol.toUpperCase() === params.symbol.toUpperCase()
    ) || { basePrice: 150.0, baseVolume: 10000000 };

    const count = params.outputsize || (params.range === '1D' ? 24 : params.range === '1M' ? 30 : 60);
    const bars: NormalizedBar[] = [];
    const now = Date.now();
    const stepMs = params.interval.includes('min')
      ? 5 * 60 * 1000
      : params.interval.includes('1h')
      ? 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    let runningPrice = stock.basePrice * 0.92;
    for (let i = count; i >= 0; i--) {
      const bucketTime = new Date(now - i * stepMs);
      const delta = (Math.sin(i * 0.4) + (Math.random() - 0.48)) * (stock.basePrice * 0.015);
      const open = Number(runningPrice.toFixed(2));
      runningPrice = Math.max(1, runningPrice + delta);
      const close = Number(runningPrice.toFixed(2));
      const high = Number((Math.max(open, close) + Math.random() * (stock.basePrice * 0.01)).toFixed(2));
      const low = Number((Math.min(open, close) - Math.random() * (stock.basePrice * 0.01)).toFixed(2));
      const volume = Math.round(stock.baseVolume * (0.8 + Math.random() * 0.6));

      bars.push({
        interval: params.interval,
        bucketTime,
        open,
        high,
        low,
        close,
        volume,
        provider: this.name,
      });
    }

    return bars;
  }

  async getCompanyNews(symbol: string, fromDate?: Date): Promise<NormalizedNews[]> {
    const sym = symbol.toUpperCase();
    const now = new Date();
    const mockNewsDatabase: Record<string, Array<{ headline: string; summary: string; hoursAgo: number; sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }>> = {
      NVDA: [
        {
          headline: 'NVIDIA Unveils Next-Generation AI Blackwell Architecture and Enterprise Solutions',
          summary: 'NVIDIA announced robust demand for its high-performance datacenter chips with broad hyperscaler adoption.',
          hoursAgo: 2,
          sentiment: 'BULLISH',
        },
        {
          headline: 'Semiconductor Sector Rallies on Strong Cloud Infrastructure Spending Guidance',
          summary: 'Tech giants ramp up capital expenditure on AI accelerators and next-generation silicon.',
          hoursAgo: 14,
          sentiment: 'BULLISH',
        },
        {
          headline: 'Analysts Reiterate Overweight Rating Ahead of Quarterly Product Showcase',
          summary: 'Wall Street price targets increase following positive channel checks in Asia.',
          hoursAgo: 36,
          sentiment: 'BULLISH',
        },
      ],
      AAPL: [
        {
          headline: 'Apple Introduces Enhanced On-Device AI Features Across Flagship Lineup',
          summary: 'The new neural engine delivers privacy-preserving generative workflows.',
          hoursAgo: 5,
          sentiment: 'BULLISH',
        },
        {
          headline: 'Services Revenue Surges to All-Time Record in Latest Operating Review',
          summary: 'App Store and cloud subscriptions drove double-digit expansion in recurring revenue.',
          hoursAgo: 26,
          sentiment: 'BULLISH',
        },
      ],
      TSLA: [
        {
          headline: 'Tesla Expands Autonomous Driving Pilot Fleet and Energy Storage Shipments',
          summary: 'Megapack utility installations grew 125% year-over-year in the latest quarter.',
          hoursAgo: 4,
          sentiment: 'BULLISH',
        },
        {
          headline: 'Global EV Market Volume Rebounds as Production Cost Efficiencies Take Effect',
          summary: 'New manufacturing techniques reduced powertrain production cycle times.',
          hoursAgo: 20,
          sentiment: 'NEUTRAL',
        },
      ],
    };

    const articles = mockNewsDatabase[sym] || [
      {
        headline: `${sym} Reports Strong Operational Momentum in Quarterly Financial Disclosures`,
        summary: `Management highlighted expanding gross margins and key enterprise customer acquisitions.`,
        hoursAgo: 8,
        sentiment: 'BULLISH',
      },
      {
        headline: `Market Watch: Institutional Position Adjustments in ${sym}`,
        summary: `Fund managers rebalance allocations following macroeconomic interest rate policy updates.`,
        hoursAgo: 28,
        sentiment: 'NEUTRAL',
      },
    ];

    return articles
      .map((item, index) => {
        const publishedAt = new Date(now.getTime() - item.hoursAgo * 60 * 60 * 1000);
        return {
          id: `news-${sym}-${index}-${publishedAt.getTime()}`,
          headline: item.headline,
          summary: item.summary,
          url: `https://finance.example.com/news/${sym.toLowerCase()}/${index}`,
          source: 'MarketWire Intelligence',
          publishedAt,
          symbols: [sym],
          sentiment: item.sentiment,
        };
      })
      .filter((item) => (fromDate ? item.publishedAt >= fromDate : true));
  }

  async getCompanyFundamentals(symbol: string): Promise<NormalizedFundamentals | null> {
    const stock = STOCK_UNIVERSE.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!stock) return null;

    return {
      symbol: stock.symbol,
      marketCap: stock.marketCap,
      peRatio: stock.peRatio,
      pbRatio: Number((stock.peRatio * 0.25).toFixed(2)),
      dividendYield: 0.85,
      week52High: Number((stock.basePrice * 1.25).toFixed(2)),
      week52Low: Number((stock.basePrice * 0.75).toFixed(2)),
      eps: Number((stock.basePrice / stock.peRatio).toFixed(2)),
      beta: 1.15,
      sector: stock.sector,
      industry: stock.industry,
      description: stock.description,
      lastUpdated: new Date(),
    };
  }
}
