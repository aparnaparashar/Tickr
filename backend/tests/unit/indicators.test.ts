import { describe, it, expect } from 'vitest';
import { IndicatorsService } from '../../src/modules/indicators/indicators.service.js';

describe('IndicatorsService', () => {
  it('should correctly calculate SMA', () => {
    const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const sma5 = IndicatorsService.calculateSMA(prices, 5);
    expect(sma5).toBe(17); // (15+16+17+18+19)/5 = 85/5 = 17
  });

  it('should correctly calculate RSI within 0..100 boundary', () => {
    // Steadily ascending prices -> RSI should be high (> 70)
    const uptrend = [100, 102, 104, 105, 108, 110, 112, 115, 118, 120, 122, 125, 128, 130, 133, 136];
    const rsi = IndicatorsService.calculateRSI(uptrend, 14);
    expect(rsi).not.toBeNull();
    expect(rsi).toBeGreaterThan(70);
    expect(rsi).toBeLessThanOrEqual(100);
  });

  it('should calculate Bollinger Bands correctly', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
    const bb = IndicatorsService.calculateBollingerBands(prices, 20, 2);
    expect(bb).not.toBeNull();
    expect(bb!.upper).toBeGreaterThan(bb!.middle);
    expect(bb!.middle).toBeGreaterThan(bb!.lower);
  });
});
