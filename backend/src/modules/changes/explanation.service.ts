import { EvidenceItem } from '../../shared/types/index.js';
import { EVIDENCE_TYPES } from '../../config/constants.js';

export interface ExplanationResult {
  summary: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  catalystIdentified: boolean;
  evidenceIds: string[];
}

export class ExplanationService {
  /**
   * Synthesize a factual, auditable, cautious natural language summary from evidence items
   */
  static synthesize(
    symbol: string,
    evidenceItems: EvidenceItem[],
    percentChange: number
  ): ExplanationResult {
    const priceEv = evidenceItems.find((e) => e.evidenceType === EVIDENCE_TYPES.PRICE_CHANGE);
    const volumeEv = evidenceItems.find((e) => e.evidenceType === EVIDENCE_TYPES.VOLUME_ANOMALY);
    const newsEvs = evidenceItems.filter((e) => e.evidenceType === EVIDENCE_TYPES.NEWS);
    const technicalEv = evidenceItems.find((e) => e.evidenceType === EVIDENCE_TYPES.TECHNICAL_SIGNAL);

    const parts: string[] = [];
    const absChange = Math.abs(percentChange);
    const direction = percentChange >= 0 ? 'gained' : 'declined';

    // 1. Core Price Statement
    if (absChange >= 0.5) {
      parts.push(`${symbol} has ${direction} ${absChange}% since your previous checkpoint.`);
    } else {
      parts.push(`${symbol} has traded largely flat (${percentChange >= 0 ? '+' : ''}${percentChange}%) since your last check.`);
    }

    // 2. Volume correlation
    if (volumeEv && volumeEv.delta && volumeEv.delta >= 1.5) {
      parts.push(`This move was accompanied by elevated trading volume (${volumeEv.delta}x average).`);
    }

    // 3. News & Catalysts
    let catalystIdentified = false;
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (newsEvs.length > 0) {
      const topHeadline = newsEvs[0].headline;
      catalystIdentified = true;
      confidence = newsEvs.length > 1 ? 'HIGH' : 'MEDIUM';
      parts.push(`Recent company headlines may provide context: "${topHeadline}".`);
    } else if (absChange >= 3.0) {
      parts.push('No specific company news catalyst was identified during this timeframe.');
      confidence = 'LOW';
    }

    // 4. Technical context
    if (technicalEv && technicalEv.summary) {
      parts.push(technicalEv.summary + '.');
    }

    const summary = parts.join(' ');
    const evidenceIds = evidenceItems.map((e, idx) => e.id || `ev-${idx}`);

    return {
      summary,
      confidence,
      catalystIdentified,
      evidenceIds,
    };
  }
}
