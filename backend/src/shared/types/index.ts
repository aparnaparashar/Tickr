import { AttentionLevel, EvidenceType, FreshnessStatus, AlertType } from '../../config/constants.js';

export interface FreshnessMeta {
  status: FreshnessStatus;
  providerTimestamp: string;
  receivedAt: string;
  ageSeconds: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    freshness?: FreshnessMeta;
    pagination?: {
      cursor?: string | null;
      hasMore?: boolean;
      total?: number;
    };
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId?: string;
  };
}

export interface NormalizedQuote {
  symbol: string;
  exchange: string;
  price: number;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  change: number | null;
  percentChange: number | null;
  volume: number;
  provider: string;
  providerTimestamp: Date;
  freshnessStatus: FreshnessStatus;
}

export interface NormalizedBar {
  interval: string;
  bucketTime: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  provider: string;
}

export interface InstrumentCandidate {
  symbol: string;
  exchange: string;
  micCode?: string | null;
  country?: string | null;
  name: string;
  currency: string;
  type: string;
  providerSymbol: string;
}

export interface NormalizedNews {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
  symbols: string[];
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface NormalizedFundamentals {
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
  lastUpdated: Date;
}

export interface TechnicalIndicators {
  symbol: string;
  calculatedAt: Date;
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

export interface EvidenceItem {
  id?: string;
  evidenceType: EvidenceType;
  oldValue: number | null;
  newValue: number | null;
  delta: number | null;
  significanceScore: number; // 0..100
  significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  sourceTimestamp: Date;
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
    score: number; // 0..100
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
    type: EvidenceType;
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
  freshness: FreshnessMeta;
}
