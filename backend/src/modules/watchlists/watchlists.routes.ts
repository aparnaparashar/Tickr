import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { WatchlistsService } from './watchlists.service.js';
import { authenticate } from '../../security/auth.guard.js';

const createWatchlistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  isDefault: z.boolean().optional(),
});

const updateWatchlistSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  isDefault: z.boolean().optional(),
});

const addItemSchema = z.object({
  instrumentId: z.string().uuid('Invalid instrument ID format'),
});

const reorderSchema = z.object({
  instrumentIds: z.array(z.string().uuid()),
});

export const watchlistsRoutes = async (app: FastifyInstance) => {
  // All watchlist routes require authentication
  app.addHook('preHandler', authenticate);

  // GET /api/v1/watchlists
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const watchlists = await WatchlistsService.listUserWatchlists(req.user!.id);
    return reply.send({
      data: { watchlists },
      meta: { requestId: req.id },
    });
  });

  // POST /api/v1/watchlists
  app.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = createWatchlistSchema.parse(req.body);
    const watchlist = await WatchlistsService.createWatchlist(req.user!.id, body.name, body.isDefault);
    return reply.code(201).send({
      data: { watchlist },
      meta: { requestId: req.id },
    });
  });

  // GET /api/v1/watchlists/:watchlistId
  app.get('/:watchlistId', async (req: FastifyRequest<{ Params: { watchlistId: string } }>, reply: FastifyReply) => {
    const watchlist = await WatchlistsService.getWatchlistById(req.user!.id, req.params.watchlistId);
    return reply.send({
      data: { watchlist },
      meta: { requestId: req.id },
    });
  });

  // PATCH /api/v1/watchlists/:watchlistId
  app.patch('/:watchlistId', async (req: FastifyRequest<{ Params: { watchlistId: string } }>, reply: FastifyReply) => {
    const body = updateWatchlistSchema.parse(req.body);
    const updated = await WatchlistsService.updateWatchlist(
      req.user!.id,
      req.params.watchlistId,
      body.name,
      body.isDefault
    );
    return reply.send({
      data: { watchlist: updated },
      meta: { requestId: req.id },
    });
  });

  // DELETE /api/v1/watchlists/:watchlistId
  app.delete('/:watchlistId', async (req: FastifyRequest<{ Params: { watchlistId: string } }>, reply: FastifyReply) => {
    await WatchlistsService.deleteWatchlist(req.user!.id, req.params.watchlistId);
    return reply.send({
      data: { message: 'Watchlist deleted successfully' },
      meta: { requestId: req.id },
    });
  });

  // POST /api/v1/watchlists/:watchlistId/items
  app.post('/:watchlistId/items', async (req: FastifyRequest<{ Params: { watchlistId: string } }>, reply: FastifyReply) => {
    const body = addItemSchema.parse(req.body);
    const item = await WatchlistsService.addItem(req.user!.id, req.params.watchlistId, body.instrumentId);
    return reply.code(201).send({
      data: { item },
      meta: { requestId: req.id },
    });
  });

  // DELETE /api/v1/watchlists/:watchlistId/items/:instrumentId
  app.delete(
    '/:watchlistId/items/:instrumentId',
    async (
      req: FastifyRequest<{ Params: { watchlistId: string; instrumentId: string } }>,
      reply: FastifyReply
    ) => {
      await WatchlistsService.removeItem(req.user!.id, req.params.watchlistId, req.params.instrumentId);
      return reply.send({
        data: { message: 'Item removed from watchlist' },
        meta: { requestId: req.id },
      });
    }
  );

  // PATCH /api/v1/watchlists/:watchlistId/items/reorder
  app.patch(
    '/:watchlistId/items/reorder',
    async (req: FastifyRequest<{ Params: { watchlistId: string } }>, reply: FastifyReply) => {
      const body = reorderSchema.parse(req.body);
      const updatedWatchlist = await WatchlistsService.reorderItems(
        req.user!.id,
        req.params.watchlistId,
        body.instrumentIds
      );
      return reply.send({
        data: { watchlist: updatedWatchlist },
        meta: { requestId: req.id },
      });
    }
  );
};
