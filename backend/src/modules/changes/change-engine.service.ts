import {
  ATTENTION_LEVELS,
  AttentionLevel,
  EVIDENCE_TYPES,
} from '../../config/constants.js';
import { config } from '../../config/env.js';
import {
  NormalizedQuote,
  NormalizedNews,
  TechnicalIndicators,
  EvidenceItem,
} from '../../shared/types/index.js';

export interface ScoreInput {
  checkpointPrice: number;
  checkpointVolume?: number | null;
  checkpointTimestamp: Date;
  currentQuote: NormalizedQuote;
  indicators?: TechnicalIndicators | null;
  newsSinceCheckpoint: NormalizedNews[];
}

export interface ChangeAnalysis {
  attentionScore: number;
  attentionLevel: AttentionLevel;
  breakdown: {
    priceScore: number;
    volumeScore: number;
    volatilityScore: number;
    newsScore: number;
    technicalScore: number;
  };
  changes: Array<{
    type: keyof typeof EVIDENCE_TYPES;
    value: number | null;
    unit: string;
    significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    direction?: 'UP' | 'DOWN' | 'NEUTRAL';
    label: string;
  }>;
  evidence: EvidenceItem[];
}

export class ChangeEngineService {
  /**
   * Deterministically analyze changes since the user's last checkpoint
   */
  static analyze(input: ScoreInput): ChangeAnalysis {
    const {
      checkpointPrice,
      checkpointVolume,
      checkpointTimestamp,
      currentQuote,
      indicators,
      newsSinceCheckpoint,
    } = input;

    const evidence: EvidenceItem[] = [];
    const changes: ChangeAnalysis['changes'] = [];

    // -------------------------------------------------------------
    // 1. Price Movement Calculation
    // -------------------------------------------------------------
    const priceDelta = currentQuote.price - checkpointPrice;
    const pricePercentChange = Number(((priceDelta / checkpointPrice) * 100).toFixed(2));
    const absPriceChange = Math.abs(pricePercentChange);

    let priceScore = 0;
    let priceSignificance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    if (absPriceChange >= config.CHANGE_PRICE_VERY_HIGH_PCT) {
      priceScore = 40;
      priceSignificance = 'CRITICAL';
    } else if (absPriceChange >= config.CHANGE_PRICE_HIGH_PCT) {
      priceScore = 30;
      priceSignificance = 'HIGH';
    } else if (absPriceChange >= config.CHANGE_PRICE_MODERATE_PCT) {
      priceScore = 18;
      priceSignificance = 'MEDIUM';
    } else if (absPriceChange >= 0.75) {
      priceScore = 8;
      priceSignificance = 'LOW';
    }

    evidence.push({
      evidenceType: EVIDENCE_TYPES.PRICE_CHANGE,
      oldValue: checkpointPrice,
      newValue: currentQuote.price,
      delta: pricePercentChange,
      significanceScore: Math.min(100, Math.round((absPriceChange / 8) * 100)),
      significance: priceSignificance,
      source: 'Market Provider Snapshot',
      sourceTimestamp: currentQuote.providerTimestamp,
      summary: `Price moved ${pricePercentChange >= 0 ? '+' : ''}${pricePercentChange}% from $${checkpointPrice} to $${currentQuote.price}`,
    });

    changes.push({
      type: 'PRICE_CHANGE',
      value: pricePercentChange,
      unit: '%',
      significance: priceSignificance,
      direction: pricePercentChange > 0 ? 'UP' : pricePercentChange < 0 ? 'DOWN' : 'NEUTRAL',
      label: `${pricePercentChange >= 0 ? '+' : ''}${pricePercentChange}% Price Change`,
    });

    // -------------------------------------------------------------
    // 2. Volume Anomaly Calculation
    // -------------------------------------------------------------
    let volumeScore = 0;
    let volumeRatio = 1.0;
    if (indicators?.volumeRatio) {
      volumeRatio = indicators.volumeRatio;
    } else if (checkpointVolume && checkpointVolume > 0) {
      volumeRatio = Number((currentQuote.volume / checkpointVolume).toFixed(2));
    }

    if (volumeRatio >= 2.5) {
      volumeScore = 25;
      evidence.push({
        evidenceType: EVIDENCE_TYPES.VOLUME_ANOMALY,
        oldValue: indicators?.rollingAvgVolume20 || checkpointVolume || null,
        newValue: currentQuote.volume,
        delta: volumeRatio,
        significanceScore: 90,
        significance: 'CRITICAL',
        source: 'Volume Anomaly Detector',
        sourceTimestamp: currentQuote.providerTimestamp,
        summary: `Trading volume surged to ${volumeRatio}x 20-day rolling average volume`,
      });
      changes.push({
        type: 'VOLUME_ANOMALY',
        value: volumeRatio,
        unit: 'x avg',
        significance: 'HIGH',
        direction: 'UP',
        label: `${volumeRatio}x Volume Surge`,
      });
    } else if (volumeRatio >= config.CHANGE_VOLUME_ANOMALY_RATIO) {
      volumeScore = 15;
      evidence.push({
        evidenceType: EVIDENCE_TYPES.VOLUME_ANOMALY,
        oldValue: indicators?.rollingAvgVolume20 || checkpointVolume || null,
        newValue: currentQuote.volume,
        delta: volumeRatio,
        significanceScore: 65,
        significance: 'MEDIUM',
        source: 'Volume Anomaly Detector',
        sourceTimestamp: currentQuote.providerTimestamp,
        summary: `Elevated trading activity: volume is ${volumeRatio}x the baseline`,
      });
      changes.push({
        type: 'VOLUME_ANOMALY',
        value: volumeRatio,
        unit: 'x avg',
        significance: 'MEDIUM',
        direction: 'UP',
        label: `${volumeRatio}x Volume Surge`,
      });
    }

    // -------------------------------------------------------------
    // 3. Volatility & ATR Shift
    // -------------------------------------------------------------
    let volatilityScore = 0;
    if (indicators?.rollingVolatility30 && indicators.rollingVolatility30 > 3.0) {
      volatilityScore = 12;
      evidence.push({
        evidenceType: EVIDENCE_TYPES.VOLATILITY_CHANGE,
        oldValue: null,
        newValue: indicators.rollingVolatility30,
        delta: indicators.rollingVolatility30,
        significanceScore: 55,
        significance: 'MEDIUM',
        source: 'Rolling Volatility Engine',
        sourceTimestamp: currentQuote.providerTimestamp,
        summary: `30-day rolling return volatility is elevated at ${indicators.rollingVolatility30}%`,
      });
    }

    // -------------------------------------------------------------
    // 4. News & Catalyst Recency Score
    // -------------------------------------------------------------
    let newsScore = 0;
    const relevantNews = newsSinceCheckpoint.filter(
      (n) => n.publishedAt.getTime() >= checkpointTimestamp.getTime()
    );

    if (relevantNews.length > 0) {
      const topNews = relevantNews.slice(0, 3);
      newsScore = Math.min(20, relevantNews.length * 7);

      for (const item of topNews) {
        evidence.push({
          evidenceType: EVIDENCE_TYPES.NEWS,
          oldValue: null,
          newValue: null,
          delta: null,
          significanceScore: 70,
          significance: 'HIGH',
          source: item.source,
          sourceTimestamp: item.publishedAt,
          headline: item.headline,
          summary: item.summary,
          metadata: { url: item.url, sentiment: item.sentiment },
        });
      }

      changes.push({
        type: 'NEWS',
        value: relevantNews.length,
        unit: 'articles',
        significance: relevantNews.length >= 2 ? 'HIGH' : 'MEDIUM',
        label: `${relevantNews.length} New Article${relevantNews.length > 1 ? 's' : ''} since checkpoint`,
      });
    }

    // -------------------------------------------------------------
    // 5. Technical Indicators Shift (RSI Overbought/Oversold, MACD Cross)
    // -------------------------------------------------------------
    let technicalScore = 0;
    if (indicators?.rsi14) {
      if (indicators.rsi14 >= 75) {
        technicalScore += 8;
        evidence.push({
          evidenceType: EVIDENCE_TYPES.TECHNICAL_SIGNAL,
          oldValue: null,
          newValue: indicators.rsi14,
          delta: null,
          significanceScore: 60,
          significance: 'MEDIUM',
          source: 'RSI Indicator (14)',
          sourceTimestamp: new Date(),
          summary: `RSI reached overbought territory at ${indicators.rsi14}`,
        });
      } else if (indicators.rsi14 <= 25) {
        technicalScore += 8;
        evidence.push({
          evidenceType: EVIDENCE_TYPES.TECHNICAL_SIGNAL,
          oldValue: null,
          newValue: indicators.rsi14,
          delta: null,
          significanceScore: 60,
          significance: 'MEDIUM',
          source: 'RSI Indicator (14)',
          sourceTimestamp: new Date(),
          summary: `RSI reached oversold territory at ${indicators.rsi14}`,
        });
      }
    }

    // -------------------------------------------------------------
    // Total Attention Score Calculation (Normalized 0..100)
    // -------------------------------------------------------------
    const rawTotal = priceScore + volumeScore + volatilityScore + newsScore + technicalScore;
    const attentionScore = Math.min(100, Math.max(0, rawTotal));

    let attentionLevel: AttentionLevel = ATTENTION_LEVELS.NORMAL;
    if (attentionScore >= 80) {
      attentionLevel = ATTENTION_LEVELS.VERY_HIGH;
    } else if (attentionScore >= 60) {
      attentionLevel = ATTENTION_LEVELS.HIGH;
    } else if (attentionScore >= 40) {
      attentionLevel = ATTENTION_LEVELS.MODERATE;
    } else if (attentionScore >= 20) {
      attentionLevel = ATTENTION_LEVELS.LOW;
    }

    return {
      attentionScore,
      attentionLevel,
      breakdown: {
        priceScore,
        volumeScore,
        volatilityScore,
        newsScore,
        technicalScore,
      },
      changes,
      evidence,
    };
  }
}
