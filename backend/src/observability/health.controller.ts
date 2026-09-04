import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db/prisma.js';
import { isRedisReady, redis, memoryFallback } from '../cache/redis.js';
import { metrics } from './metrics.js';

export const healthRoutes = async (app: FastifyInstance) => {
  // Liveness Probe
  app.get('/health/live', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Readiness Probe
  app.get('/health/ready', async (_req: FastifyRequest, reply: FastifyReply) => {
    let dbStatus = 'DOWN';
    let redisStatus = 'DOWN';

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'UP';
    } catch {
      dbStatus = 'DOWN';
    }

    try {
      if (isRedisReady()) {
        const ping = await redis.ping();
        redisStatus = ping === 'PONG' ? 'UP' : 'DEGRADED';
      } else {
        const ping = await memoryFallback.ping();
        redisStatus = ping === 'PONG' ? 'UP (in-memory fallback)' : 'DEGRADED';
      }
    } catch {
      redisStatus = 'DEGRADED';
    }

    const isReady = dbStatus === 'UP';
    return reply.code(isReady ? 200 : 503).send({
      status: isReady ? 'READY' : 'NOT_READY',
      dependencies: {
        database: dbStatus,
        cache: redisStatus,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Metrics Endpoint
  app.get('/metrics', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      metrics: metrics.getSnapshot(),
      timestamp: new Date().toISOString(),
    });
  });
};
