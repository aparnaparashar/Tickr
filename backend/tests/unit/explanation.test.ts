import { describe, it, expect } from 'vitest';
import { ExplanationService } from '../../src/modules/changes/explanation.service.js';
import { EVIDENCE_TYPES } from '../../src/config/constants.js';

describe('ExplanationService', () => {
  it('should include headline context when correlated news is present', () => {
    const result = ExplanationService.synthesize(
      'NVDA',
      [
        {
          evidenceType: EVIDENCE_TYPES.PRICE_CHANGE,
          oldValue: 120,
          newValue: 130,
          delta: 8.33,
          significanceScore: 85,
          significance: 'HIGH',
          source: 'Market Snapshot',
          sourceTimestamp: new Date(),
        },
        {
          evidenceType: EVIDENCE_TYPES.NEWS,
          oldValue: null,
          newValue: null,
          delta: null,
          significanceScore: 70,
          significance: 'HIGH',
          source: 'MarketWire',
          sourceTimestamp: new Date(),
          headline: 'NVIDIA Unveils New Datacenter Silicon',
        },
      ],
      8.33
    );

    expect(result.summary).toContain('NVDA has gained 8.33%');
    expect(result.summary).toContain('NVIDIA Unveils New Datacenter Silicon');
    expect(result.catalystIdentified).toBe(true);
  });

  it('should not hallucinate causality when no news exists for a significant move', () => {
    const result = ExplanationService.synthesize(
      'AAPL',
      [
        {
          evidenceType: EVIDENCE_TYPES.PRICE_CHANGE,
          oldValue: 200,
          newValue: 210,
          delta: 5.0,
          significanceScore: 70,
          significance: 'HIGH',
          source: 'Market Snapshot',
          sourceTimestamp: new Date(),
        },
      ],
      5.0
    );

    expect(result.summary).toContain('No specific company news catalyst was identified');
    expect(result.catalystIdentified).toBe(false);
  });
});
