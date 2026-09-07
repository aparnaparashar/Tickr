import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../config/env.js';
import { logger } from '../../observability/logger.js';
import { prisma } from '../../db/prisma.js';
import { CacheService } from '../../cache/cache.service.js';
import { CACHE_KEYS, FRESHNESS_STATUS } from '../../config/constants.js';
import { FreshnessPolicy } from '../market-data/freshness.policy.js';

interface FinnhubTradeEvent {
  p: number; // price
  s: string; // symbol
  t: number; // timestamp in milliseconds
  v: number; // volume
}

interface FinnhubWebhookPayload {
  data?: FinnhubTradeEvent[] | any[];
  type?: string;
  [key: string]: any;
}

export class FinnhubWebhookController {
  /**
   * Finnhub Webhook Receiver
   * Strict Requirement:
   * "To acknowledge receipt of an event, your endpoint must return a 2xx HTTP status code.
   * Acknowledge events prior to any logic that needs to take place to prevent timeouts."
   */
  static async handleWebhook(req: FastifyRequest<{ Body: FinnhubWebhookPayload }>, reply: FastifyReply) {
    const incomingSecret = req.headers['x-finnhub-secret'];

    // 1. Verify X-Finnhub-Secret header
    if (config.FINNHUB_SECRET && incomingSecret !== config.FINNHUB_SECRET) {
      logger.warn({ incomingSecret: incomingSecret ? '***' : 'missing' }, 'Unauthorized Finnhub webhook request');
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing X-Finnhub-Secret header',
        },
      });
    }

    const payload = req.body || {};
    const eventType = payload.type || 'unknown';

    // 2. Acknowledge receipt with 2xx HTTP status immediately prior to processing logic
    reply.code(200).send({
      acknowledged: true,
      receivedAt: new Date().toISOString(),
      type: eventType,
    });

    // 3. Process the event asynchronously in the background so request never times out
    setImmediate(async () => {
      try {
        await FinnhubWebhookController.processWebhookEvent(payload);
      } catch (err) {
        logger.error({ err: (err as Error).message, eventType }, 'Background processing error for Finnhub webhook');
      }
    });
  }

  private static async processWebhookEvent(payload: FinnhubWebhookPayload) {
    const eventType = payload.type;
    logger.info({ eventType }, 'Processing Finnhub webhook event asynchronously');

    if (eventType === 'trade' && Array.isArray(payload.data)) {
      for (const trade of payload.data as FinnhubTradeEvent[]) {
        if (!trade.s || typeof trade.p !== 'number') continue;
        const cleanSymbol = trade.s.includes(':') ? trade.s.split(':')[0] : trade.s.toUpperCase();

        const instrument = await prisma.instrument.findFirst({
          where: { symbol: cleanSymbol, isActive: true },
        });

        if (!instrument) continue;

        const tradeTime = trade.t ? new Date(trade.t) : new Date();
        const freshness = FreshnessPolicy.classify(tradeTime, instrument.exchange);

        // Update database snapshot
        await prisma.latestMarketSnapshot.upsert({
          where: { instrumentId: instrument.id },
          create: {
            instrumentId: instrument.id,
            price: trade.p,
            volume: trade.v || 0,
            provider: 'finnhub_webhook',
            providerTimestamp: tradeTime,
            receivedAt: new Date(),
            freshnessStatus: freshness.status,
          },
          update: {
            price: trade.p,
            volume: trade.v ? trade.v : undefined,
            provider: 'finnhub_webhook',
            providerTimestamp: tradeTime,
            receivedAt: new Date(),
            freshnessStatus: freshness.status,
          },
        });

        // Invalidate and refresh Redis quote cache
        const cacheKey = CACHE_KEYS.quote(instrument.id);
        const quoteObj = {
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          price: trade.p,
          open: null,
          high: null,
          low: null,
          previousClose: null,
          change: null,
          percentChange: null,
          volume: trade.v || 0,
          provider: 'finnhub_webhook',
          providerTimestamp: tradeTime,
          freshnessStatus: FRESHNESS_STATUS.FRESH,
        };

        await CacheService.set(cacheKey, { quote: quoteObj, freshness }, 30);
      }
    } else if (eventType === 'news' && Array.isArray(payload.data)) {
      logger.info({ count: payload.data.length }, 'Received news items via Finnhub webhook');
    }
  }
}
