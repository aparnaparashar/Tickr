import {
  NormalizedQuote,
  NormalizedBar,
  InstrumentCandidate,
  NormalizedNews,
  NormalizedFundamentals,
} from '../shared/types/index.js';

export interface TimeSeriesParams {
  symbol: string;
  exchange: string;
  interval: '1min' | '5min' | '15min' | '1h' | '1day' | '1week';
  range: '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y';
  outputsize?: number;
}

export interface MarketDataProvider {
  readonly name: string;
  searchStocks(query: string): Promise<InstrumentCandidate[]>;
  getQuote(symbol: string, exchange: string): Promise<NormalizedQuote>;
  getQuotes(instruments: Array<{ symbol: string; exchange: string }>): Promise<NormalizedQuote[]>;
  getTimeSeries(params: TimeSeriesParams): Promise<NormalizedBar[]>;
}

export interface NewsProvider {
  readonly name: string;
  getCompanyNews(symbol: string, fromDate?: Date): Promise<NormalizedNews[]>;
}

export interface FundamentalsProvider {
  readonly name: string;
  getCompanyFundamentals(symbol: string): Promise<NormalizedFundamentals | null>;
}
