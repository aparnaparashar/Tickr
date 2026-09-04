import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DashboardService } from './dashboard.service.js';
import { authenticate } from '../../security/auth.guard.js';

export const dashboardRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', authenticate);

  // GET /api/v1/dashboard/changes
  app.get(
    '/changes',
    {
      schema: {
        description: 'Get smart changes summary for all watched stocks, ranked by attention score',
        tags: ['Dashboard'],
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const changes = await DashboardService.getDashboardChanges(req.user!.id);
      return reply.send({
        data: { items: changes },
        meta: { requestId: req.id },
      });
    }
  );
};
