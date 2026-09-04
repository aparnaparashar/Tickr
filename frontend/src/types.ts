export type AttentionLevel = 'NORMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface LatestMarketSnapshot {
  price: number;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  volume: number;
  provider: string;
  providerTimestamp: string;
  freshnessStatus: 'FRESH' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
}

export interface Instrument {
  id: string;
  symbol: string;
  exchange: string;
  micCode?: string | null;
  country?: string | null;
  name: string;
  currency: string;
  type: string;
  providerSymbol: string;
  snapshot?: LatestMarketSnapshot | null;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  instrumentId: string;
  position: number;
  instrument: Instrument;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  items: WatchlistItem[];
}

export interface EvidenceItem {
  id?: string;
  evidenceType: string;
  oldValue: number | null;
  newValue: number | null;
  delta: number | null;
  significanceScore: number;
  significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  sourceTimestamp: string;
  headline?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}

export interface MeaningfulChangesResult {
  instrumentId: string;
  symbol: string;
  exchange: string;
  name: string;
  isFirstVisit: boolean;
  checkpoint: {
    at: string;
    price: number;
    volume: number | null;
    version: number;
    lastAcknowledgedAt: string;
  } | null;
  current: {
    at: string;
    price: number;
    volume: number;
    providerTimestamp: string;
  };
  attention: {
    score: number;
    level: AttentionLevel;
    breakdown: {
      priceScore: number;
      volumeScore: number;
      volatilityScore: number;
      newsScore: number;
      technicalScore: number;
    };
  };
  changes: Array<{
    type: string;
    value: number | null;
    unit: string;
    significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    direction?: 'UP' | 'DOWN' | 'NEUTRAL';
    label: string;
  }>;
  evidence: EvidenceItem[];
  explanation: {
    summary: string;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    catalystIdentified: boolean;
    evidenceIds: string[];
  };
  freshness: {
    status: 'FRESH' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
    providerTimestamp: string;
    receivedAt: string;
    ageSeconds: number;
  };
}

export interface HistoricalBar {
  interval: string;
  bucketTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  symbol: string;
  calculatedAt: string;
  sma20?: number | null;
  sma50?: number | null;
  sma200?: number | null;
  ema12?: number | null;
  ema26?: number | null;
  rsi14?: number | null;
  macd?: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  } | null;
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  } | null;
  atr14?: number | null;
  rollingAvgVolume20?: number | null;
  volumeRatio?: number | null;
  rollingVolatility30?: number | null;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  symbols: string[];
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface Fundamentals {
  symbol: string;
  marketCap?: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  week52High?: number;
  week52Low?: number;
  eps?: number;
  beta?: number;
  sector?: string;
  industry?: string;
  description?: string;
  lastUpdated: string;
}

export interface Alert {
  id: string;
  userId: string;
  instrumentId: string;
  type: string;
  targetValue: number;
  isTriggered: boolean;
  enabled: boolean;
  lastTriggeredAt?: string | null;
  createdAt: string;
  instrument: Instrument;
}
