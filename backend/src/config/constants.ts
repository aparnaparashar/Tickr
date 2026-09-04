export const ATTENTION_LEVELS = {
  NORMAL: 'NORMAL',
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  VERY_HIGH: 'VERY_HIGH',
} as const;

export type AttentionLevel = (typeof ATTENTION_LEVELS)[keyof typeof ATTENTION_LEVELS];

export const EVIDENCE_TYPES = {
  PRICE_CHANGE: 'PRICE_CHANGE',
  VOLUME_ANOMALY: 'VOLUME_ANOMALY',
  VOLATILITY_CHANGE: 'VOLATILITY_CHANGE',
  NEWS: 'NEWS',
  EARNINGS: 'EARNINGS',
  CORPORATE_ACTION: 'CORPORATE_ACTION',
  MARKET_CONTEXT: 'MARKET_CONTEXT',
  TECHNICAL_SIGNAL: 'TECHNICAL_SIGNAL',
} as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[keyof typeof EVIDENCE_TYPES];

export const FRESHNESS_STATUS = {
  FRESH: 'FRESH',
  DELAYED: 'DELAYED',
  STALE: 'STALE',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type FreshnessStatus = (typeof FRESHNESS_STATUS)[keyof typeof FRESHNESS_STATUS];

export const ALERT_TYPES = {
  PRICE_ABOVE: 'PRICE_ABOVE',
  PRICE_BELOW: 'PRICE_BELOW',
  PERCENT_MOVE: 'PERCENT_MOVE',
  VOLUME_ANOMALY: 'VOLUME_ANOMALY',
  MEANINGFUL_CHANGE: 'MEANINGFUL_CHANGE',
} as const;

export type AlertType = (typeof ALERT_TYPES)[keyof typeof ALERT_TYPES];

export const CACHE_KEYS = {
  quote: (instrumentId: string) => `quote:v1:${instrumentId}`,
  history: (instrumentId: string, range: string, interval: string) =>
    `history:v1:${instrumentId}:${range}:${interval}`,
  fundamentals: (instrumentId: string) => `fundamentals:v1:${instrumentId}`,
  news: (instrumentId: string) => `news:v1:${instrumentId}`,
  indicators: (instrumentId: string, range: string) => `indicators:v1:${instrumentId}:${range}`,
  changes: (userId: string, instrumentId: string, version: number) =>
    `changes:v1:${userId}:${instrumentId}:${version}`,
  dashboardChanges: (userId: string) => `dashboard:v1:${userId}`,
  providerQuotaMinute: (provider: string) => `quota:minute:v1:${provider}`,
  providerQuotaDaily: (provider: string) => `quota:daily:v1:${provider}`,
  rateLimit: (key: string) => `ratelimit:v1:${key}`,
  idempotency: (key: string) => `idempotency:v1:${key}`,
  lock: (resource: string) => `lock:v1:${resource}`,
};
