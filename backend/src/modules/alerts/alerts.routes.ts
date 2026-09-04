import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AlertsService } from './alerts.service.js';
import { authenticate } from '../../security/auth.guard.js';

const createAlertSchema = z.object({
  instrumentId: z.string().uuid(),
  type: z.enum(['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_MOVE', 'VOLUME_ANOMALY', 'MEANINGFUL_CHANGE']),
  targetValue: z.number(),
});

const updateAlertSchema = z.object({
  enabled: z.boolean().optional(),
  targetValue: z.number().optional(),
});

export const alertsRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', authenticate);

  // GET /api/v1/alerts
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const alerts = await AlertsService.listUserAlerts(req.user!.id);
    return reply.send({
      data: { alerts },
      meta: { requestId: req.id },
    });
  });

  // POST /api/v1/alerts
  app.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = createAlertSchema.parse(req.body);
    const alert = await AlertsService.createAlert(
      req.user!.id,
      body.instrumentId,
      body.type,
      body.targetValue
    );
    return reply.code(201).send({
      data: { alert },
      meta: { requestId: req.id },
    });
  });

  // PATCH /api/v1/alerts/:alertId
  app.patch(
    '/:alertId',
    async (req: FastifyRequest<{ Params: { alertId: string } }>, reply: FastifyReply) => {
      const body = updateAlertSchema.parse(req.body);
      const updated = await AlertsService.updateAlert(req.user!.id, req.params.alertId, body);
      return reply.send({
        data: { alert: updated },
        meta: { requestId: req.id },
      });
    }
  );

  // DELETE /api/v1/alerts/:alertId
  app.delete(
    '/:alertId',
    async (req: FastifyRequest<{ Params: { alertId: string } }>, reply: FastifyReply) => {
      await AlertsService.deleteAlert(req.user!.id, req.params.alertId);
      return reply.send({
        data: { message: 'Alert deleted successfully' },
        meta: { requestId: req.id },
      });
    }
  );
};
