import { describe, it, expect } from 'vitest';
import { ChangeEngineService } from '../../src/modules/changes/change-engine.service.js';
import { ATTENTION_LEVELS, FRESHNESS_STATUS } from '../../src/config/constants.js';
import { NormalizedQuote } from '../../src/shared/types/index.js';

describe('ChangeEngineService', () => {
  const baseQuote: NormalizedQuote = {
    symbol: 'NVDA',
    exchange: 'NASDAQ',
    price: 130.0,
    open: 120.0,
    high: 132.0,
    low: 119.0,
    previousClose: 120.0,
    change: 10.0,
    percentChange: 8.33,
    volume: 50000000,
    provider: 'test_provider',
    providerTimestamp: new Date(),
    freshnessStatus: FRESHNESS_STATUS.FRESH,
  };

  it('should detect a VERY_HIGH attention score for significant price jump and volume surge', () => {
    const analysis = ChangeEngineService.analyze({
      checkpointPrice: 120.0, // moved +8.33% ($120 -> $130)
      checkpointVolume: 20000000, // volume surged 2.5x
      checkpointTimestamp: new Date(Date.now() - 24 * 3600 * 1000),
      currentQuote: baseQuote,
      indicators: {
        symbol: 'NVDA',
        calculatedAt: new Date(),
        volumeRatio: 2.5,
        rsi14: 78, // Overbought
        rollingVolatility30: 3.5,
      },
      newsSinceCheckpoint: [
        {
          id: 'n1',
          headline: 'NVIDIA Beats Earnings Estimates with Strong Guidance',
          summary: 'Datacenter revenue surged.',
          url: 'https://example.com/1',
          source: 'Market Wire',
          publishedAt: new Date(),
          symbols: ['NVDA'],
          sentiment: 'BULLISH',
        },
      ],
    });

    expect(analysis.attentionScore).toBeGreaterThanOrEqual(70);
    expect(analysis.attentionLevel).toBe(ATTENTION_LEVELS.VERY_HIGH);
    expect(analysis.breakdown.priceScore).toBe(40);
    expect(analysis.breakdown.volumeScore).toBe(25);
    expect(analysis.breakdown.technicalScore).toBe(8);
    expect(analysis.breakdown.newsScore).toBeGreaterThan(0);
    expect(analysis.changes.length).toBeGreaterThanOrEqual(3);
  });

  it('should return NORMAL attention level for subtle, quiet market movement', () => {
    const quietQuote: NormalizedQuote = {
      ...baseQuote,
      price: 120.2, // +0.16%
      percentChange: 0.16,
      volume: 20000000,
    };

    const analysis = ChangeEngineService.analyze({
      checkpointPrice: 120.0,
      checkpointVolume: 20000000,
      checkpointTimestamp: new Date(Date.now() - 3600 * 1000),
      currentQuote: quietQuote,
      indicators: null,
      newsSinceCheckpoint: [],
    });

    expect(analysis.attentionScore).toBeLessThan(20);
    expect(analysis.attentionLevel).toBe(ATTENTION_LEVELS.NORMAL);
  });
});
