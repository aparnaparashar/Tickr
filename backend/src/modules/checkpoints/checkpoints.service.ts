import { prisma } from '../../db/prisma.js';
import { MarketDataService } from '../market-data/market-data.service.js';
import { ChangeEngineService } from '../changes/change-engine.service.js';
import { ExplanationService } from '../changes/explanation.service.js';
import { CacheService } from '../../cache/cache.service.js';
import { CACHE_KEYS, ATTENTION_LEVELS, EVIDENCE_TYPES } from '../../config/constants.js';
import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { MeaningfulChangesResult } from '../../shared/types/index.js';
import { logger } from '../../observability/logger.js';
import { metrics } from '../../observability/metrics.js';

export class CheckpointsService {
  /**
   * Core Smart Endpoint: Evaluate what has changed since this specific user last checked this stock
   */
  static async getChangesSinceLastCheck(
    userId: string,
    instrumentId: string
  ): Promise<MeaningfulChangesResult> {
    // 1. Fetch instrument and current quote
    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument ${instrumentId} not found`);
    }

    const { quote: currentQuote, freshness } = await MarketDataService.getQuote(instrumentId);

    // 2. Load user's checkpoint for this stock
    const checkpoint = await prisma.userStockCheckpoint.findUnique({
      where: {
        userId_instrumentId: {
          userId,
          instrumentId,
        },
      },
    });

    // 3. First Visit Baseline Scenario
    if (!checkpoint) {
      return {
        instrumentId: instrument.id,
        symbol: instrument.symbol,
        exchange: instrument.exchange,
        name: instrument.name,
        isFirstVisit: true,
        checkpoint: null,
        current: {
          at: new Date().toISOString(),
          price: currentQuote.price,
          volume: currentQuote.volume,
          providerTimestamp: currentQuote.providerTimestamp.toISOString(),
        },
        attention: {
          score: 0,
          level: ATTENTION_LEVELS.NORMAL,
          breakdown: {
            priceScore: 0,
            volumeScore: 0,
            volatilityScore: 0,
            newsScore: 0,
            technicalScore: 0,
          },
        },
        changes: [],
        evidence: [],
        explanation: {
          summary: `This is your first time checking ${instrument.symbol}. A baseline checkpoint will be set once you acknowledge.`,
          confidence: 'HIGH',
          catalystIdentified: false,
          evidenceIds: [],
        },
        freshness,
      };
    }

    // 4. Existing Checkpoint Scenario: Compute changes since checkpoint
    const checkpointTime = checkpoint.comparisonCheckpointAt;

    // Fetch news and indicators in parallel
    const [newsSinceCheckpoint, indicators] = await Promise.all([
      MarketDataService.getNews(instrumentId, checkpointTime),
      MarketDataService.getIndicators(instrumentId, '3M').catch(() => null),
    ]);

    // Run deterministic Meaningful Change Engine
    const analysis = ChangeEngineService.analyze({
      checkpointPrice: checkpoint.checkpointPrice,
      checkpointVolume: checkpoint.checkpointVolume,
      checkpointTimestamp: checkpointTime,
      currentQuote,
      indicators,
      newsSinceCheckpoint,
    });

    // Synthesize auditable, cautious natural language explanation
    const priceDelta = currentQuote.price - checkpoint.checkpointPrice;
    const percentChange = Number(((priceDelta / checkpoint.checkpointPrice) * 100).toFixed(2));
    const explanation = ExplanationService.synthesize(
      instrument.symbol,
      analysis.evidence,
      percentChange
    );

    metrics.increment('change_events_generated_total');

    return {
      instrumentId: instrument.id,
      symbol: instrument.symbol,
      exchange: instrument.exchange,
      name: instrument.name,
      isFirstVisit: false,
      checkpoint: {
        at: checkpoint.comparisonCheckpointAt.toISOString(),
        price: checkpoint.checkpointPrice,
        volume: checkpoint.checkpointVolume,
        version: checkpoint.version,
        lastAcknowledgedAt: checkpoint.lastAcknowledgedAt.toISOString(),
      },
      current: {
        at: new Date().toISOString(),
        price: currentQuote.price,
        volume: currentQuote.volume,
        providerTimestamp: currentQuote.providerTimestamp.toISOString(),
      },
      attention: {
        score: analysis.attentionScore,
        level: analysis.attentionLevel,
        breakdown: analysis.breakdown,
      },
      changes: analysis.changes,
      evidence: analysis.evidence,
      explanation,
      freshness,
    };
  }

  /**
   * Monotonic Checkpoint Acknowledgement
   * Advances the checkpoint to the current quote state, records change event history, and updates version
   */
  static async acknowledgeCheckpoint(userId: string, instrumentId: string) {
    const { quote: currentQuote } = await MarketDataService.getQuote(instrumentId);
    const now = new Date();

    // 1. Fetch current checkpoint or baseline
    const existing = await prisma.userStockCheckpoint.findUnique({
      where: {
        userId_instrumentId: {
          userId,
          instrumentId,
        },
      },
    });

    const checkpointFrom = existing ? existing.comparisonCheckpointAt : now;
    const oldPrice = existing ? existing.checkpointPrice : currentQuote.price;
    const percentChange = Number((((currentQuote.price - oldPrice) / oldPrice) * 100).toFixed(2));

    // 2. Perform atomic transaction: advance checkpoint & persist ChangeEvent
    const result = await prisma.$transaction(async (tx) => {
      // Upsert UserStockCheckpoint with monotonic version bump
      const updatedCheckpoint = await tx.userStockCheckpoint.upsert({
        where: {
          userId_instrumentId: {
            userId,
            instrumentId,
          },
        },
        create: {
          userId,
          instrumentId,
          lastOpenedAt: now,
          lastAcknowledgedAt: now,
          comparisonCheckpointAt: now,
          checkpointPrice: currentQuote.price,
          checkpointVolume: currentQuote.volume,
          version: 1,
        },
        update: {
          lastOpenedAt: now,
          lastAcknowledgedAt: now,
          comparisonCheckpointAt: now,
          checkpointPrice: currentQuote.price,
          checkpointVolume: currentQuote.volume,
          version: { increment: 1 },
        },
      });

      // If this was an existing checkpoint with changes, record ChangeEvent & Evidence in history
      if (existing) {
        const changeEvent = await tx.changeEvent.create({
          data: {
            userId,
            instrumentId,
            checkpointFrom,
            detectedAt: now,
            attentionScore: Math.min(100, Math.round(Math.abs(percentChange) * 10)),
            attentionLevel: Math.abs(percentChange) >= 5 ? 'HIGH' : Math.abs(percentChange) >= 2 ? 'MODERATE' : 'LOW',
            summary: `Acknowledged state at $${currentQuote.price} (${percentChange >= 0 ? '+' : ''}${percentChange}% move).`,
            algorithmVersion: config.ALGORITHM_VERSION,
            acknowledgedAt: now,
            evidence: {
              create: [
                {
                  evidenceType: EVIDENCE_TYPES.PRICE_CHANGE,
                  oldValue: oldPrice,
                  newValue: currentQuote.price,
                  delta: percentChange,
                  significanceScore: Math.min(100, Math.round(Math.abs(percentChange) * 10)),
                  source: 'User Checkpoint Acknowledgment',
                  sourceTimestamp: now,
                },
              ],
            },
          },
        });

        logger.info({ userId, instrumentId, changeEventId: changeEvent.id }, 'Recorded change event on acknowledge');
      }

      return updatedCheckpoint;
    });

    // Invalidate user dashboard cache
    await CacheService.del(CACHE_KEYS.dashboardChanges(userId));

    return result;
  }

  /**
   * Get historical change events for a stock
   */
  static async getChangeHistory(userId: string, instrumentId: string, cursor?: string, limit = 10) {
    const take = Math.min(limit, 50);

    const events = await prisma.changeEvent.findMany({
      where: {
        userId,
        instrumentId,
      },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { detectedAt: 'desc' },
      include: {
        evidence: true,
      },
    });

    let nextCursor: string | null = null;
    if (events.length > take) {
      const nextItem = events.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return {
      events,
      nextCursor,
      hasMore: nextCursor !== null,
    };
  }
}
