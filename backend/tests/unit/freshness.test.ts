import { describe, it, expect } from 'vitest';
import { FreshnessPolicy } from '../../src/modules/market-data/freshness.policy.js';
import { FRESHNESS_STATUS } from '../../src/config/constants.js';

describe('FreshnessPolicy', () => {
  it('should classify fresh timestamps within live threshold', () => {
    const now = new Date();
    const providerTime = new Date(now.getTime() - 5000); // 5 seconds ago
    const classification = FreshnessPolicy.classify(providerTime, 'NASDAQ', now);

    expect(classification.ageSeconds).toBe(5);
  });

  it('should correctly evaluate out-of-order timestamps', () => {
    const existing = new Date('2026-09-04T12:00:00Z');
    const newer = new Date('2026-09-04T12:01:00Z');
    const older = new Date('2026-09-04T11:59:00Z');

    expect(FreshnessPolicy.isNewer(newer, existing)).toBe(true);
    expect(FreshnessPolicy.isNewer(older, existing)).toBe(false);
    expect(FreshnessPolicy.isNewer(existing, existing)).toBe(false);
  });
});
