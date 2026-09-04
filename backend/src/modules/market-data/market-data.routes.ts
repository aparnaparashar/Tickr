import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { MarketDataService } from './market-data.service.js';

const historyQuerySchema = z.object({
  range: z.enum(['1D', '1W', '1M', '3M', '1Y', '5Y']).default('1M'),
  interval: z.enum(['1min', '5min', '15min', '1h', '1day', '1week']).default('1day'),
});

const indicatorsQuerySchema = z.object({
  range: z.enum(['1M', '3M', '1Y']).default('3M'),
});

export const marketDataRoutes = async (app: FastifyInstance) => {
  // GET /api/v1/stocks/:instrumentId/quote
  app.get(
    '/:instrumentId/quote',
    {
      schema: {
        description: 'Get latest quote with price, volume, and freshness status',
        tags: ['Market Data'],
      },
    },
    async (req: FastifyRequest<{ Params: { instrumentId: string } }>, reply: FastifyReply) => {
      const { quote, freshness } = await MarketDataService.getQuote(req.params.instrumentId);
      return reply.send({
        data: quote,
        meta: {
          requestId: req.id,
          freshness,
        },
      });
    }
  );

  // GET /api/v1/stocks/:instrumentId/history?range=1M&interval=1day
  app.get(
    '/:instrumentId/history',
    {
      schema: {
        description: 'Get historical OHLCV bars for charts',
        tags: ['Market Data'],
      },
    },
    async (req: FastifyRequest<{ Params: { instrumentId: string } }>, reply: FastifyReply) => {
      const query = historyQuerySchema.parse(req.query);
      const bars = await MarketDataService.getTimeSeries(
        req.params.instrumentId,
        query.range as '1D' | '1W' | '1M' | '3M' | '1Y',
        query.interval as '1min' | '5min' | '15min' | '1h' | '1day'
      );
      return reply.send({
        data: { bars },
        meta: { requestId: req.id },
      });
    }
  );

  // GET /api/v1/stocks/:instrumentId/indicators?range=3M
  app.get(
    '/:instrumentId/indicators',
    {
      schema: {
        description: 'Get calculated technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, ATR)',
        tags: ['Market Data'],
      },
    },
    async (req: FastifyRequest<{ Params: { instrumentId: string } }>, reply: FastifyReply) => {
      const query = indicatorsQuerySchema.parse(req.query);
      const indicators = await MarketDataService.getIndicators(
        req.params.instrumentId,
        query.range as '1M' | '3M' | '1Y'
      );
      return reply.send({
        data: { indicators },
        meta: { requestId: req.id },
      });
    }
  );

  // GET /api/v1/stocks/:instrumentId/fundamentals
  app.get(
    '/:instrumentId/fundamentals',
    {
      schema: {
        description: 'Get company overview and fundamentals',
        tags: ['Market Data'],
      },
    },
    async (req: FastifyRequest<{ Params: { instrumentId: string } }>, reply: FastifyReply) => {
      const fundamentals = await MarketDataService.getFundamentals(req.params.instrumentId);
      return reply.send({
        data: { fundamentals },
        meta: { requestId: req.id },
      });
    }
  );

  // GET /api/v1/stocks/:instrumentId/news
  app.get(
    '/:instrumentId/news',
    {
      schema: {
        description: 'Get company news feed',
        tags: ['Market Data'],
      },
    },
    async (req: FastifyRequest<{ Params: { instrumentId: string } }>, reply: FastifyReply) => {
      const news = await MarketDataService.getNews(req.params.instrumentId);
      return reply.send({
        data: { news },
        meta: { requestId: req.id },
      });
    }
  );
};
