import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { InstrumentsService } from './instruments.service.js';

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty'),
});

export const instrumentsRoutes = async (app: FastifyInstance) => {
  // GET /api/v1/stocks/search?q=nvda
  app.get(
    '/search',
    {
      schema: {
        description: 'Search stocks by symbol or company name',
        tags: ['Stocks'],
        querystring: {
          type: 'object',
          required: ['q'],
          properties: {
            q: { type: 'string' },
          },
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { q } = searchQuerySchema.parse(req.query);
      const instruments = await InstrumentsService.search(q);
      return reply.send({
        data: { instruments },
        meta: { requestId: req.id },
      });
    }
  );

  // GET /api/v1/stocks/:instrumentId
  app.get(
    '/:instrumentId',
    {
      schema: {
        description: 'Get stock metadata and latest snapshot by instrument ID',
        tags: ['Stocks'],
        params: {
          type: 'object',
          required: ['instrumentId'],
          properties: {
            instrumentId: { type: 'string' },
          },
        },
      },
    },
    async (req: FastifyRequest<{ Params: { instrumentId: string } }>, reply: FastifyReply) => {
      const instrument = await InstrumentsService.getById(req.params.instrumentId);
      return reply.send({
        data: { instrument },
        meta: { requestId: req.id },
      });
    }
  );
};
