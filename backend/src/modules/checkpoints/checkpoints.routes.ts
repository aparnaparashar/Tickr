import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CheckpointsService } from './checkpoints.service.js';
import { authenticate } from '../../security/auth.guard.js';

const historyQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export const checkpointsRoutes = async (app: FastifyInstance) => {
  // Authentication required for user-specific checkpoints and change intelligence
  app.addHook('preHandler', authenticate);

  // GET /api/v1/stocks/:instrumentId/changes-since-last-check
  app.get(
    '/:instrumentId/changes-since-last-check',
    {
      schema: {
        description: 'Get meaningful changes and attention intelligence since user last checked',
        tags: ['Since You Last Checked'],
      },
    },
    async (req: FastifyRequest<{ Params: { instrumentId: string } }>, reply: FastifyReply) => {
      const result = await CheckpointsService.getChangesSinceLastCheck(
        req.user!.id,
        req.params.instrumentId
      );

      return reply.send({
        data: result,
        meta: {
          requestId: req.id,
          freshness: result.freshness,
        },
      });
    }
  );

  // POST /api/v1/stocks/:instrumentId/checkpoint/acknowledge
  app.post(
    '/:instrumentId/checkpoint/acknowledge',
    {
      schema: {
        description: 'Acknowledge current state and advance checkpoint monotonically',
        tags: ['Since You Last Checked'],
      },
    },
    async (req: FastifyRequest<{ Params: { instrumentId: string } }>, reply: FastifyReply) => {
      const updated = await CheckpointsService.acknowledgeCheckpoint(
        req.user!.id,
        req.params.instrumentId
      );

      return reply.send({
        data: {
          checkpoint: updated,
          message: 'Checkpoint advanced successfully',
        },
        meta: { requestId: req.id },
      });
    }
  );

  // GET /api/v1/stocks/:instrumentId/change-history
  app.get(
    '/:instrumentId/change-history',
    {
      schema: {
        description: 'Get historical change events with cursor pagination',
        tags: ['Since You Last Checked'],
      },
    },
    async (req: FastifyRequest<{ Params: { instrumentId: string } }>, reply: FastifyReply) => {
      const query = historyQuerySchema.parse(req.query);
      const history = await CheckpointsService.getChangeHistory(
        req.user!.id,
        req.params.instrumentId,
        query.cursor,
        query.limit
      );

      return reply.send({
        data: { events: history.events },
        meta: {
          requestId: req.id,
          pagination: {
            cursor: history.nextCursor,
            hasMore: history.hasMore,
          },
        },
      });
    }
  );
};
