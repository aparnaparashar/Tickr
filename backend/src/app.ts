import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { ZodError } from 'zod';

import { config } from './config/env.js';
import { logger } from './observability/logger.js';
import { metrics } from './observability/metrics.js';
import { AppError } from './shared/errors/app-error.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { watchlistsRoutes } from './modules/watchlists/watchlists.routes.js';
import { instrumentsRoutes } from './modules/instruments/instruments.routes.js';
import { marketDataRoutes } from './modules/market-data/market-data.routes.js';
import { checkpointsRoutes } from './modules/checkpoints/checkpoints.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { alertsRoutes } from './modules/alerts/alerts.routes.js';
import { finnhubWebhookRoutes } from './modules/webhooks/finnhub-webhook.routes.js';
import { healthRoutes } from './observability/health.controller.js';

export const buildApp = async () => {
  const app = fastify({
    logger: false, // Pino handled via custom logger module
    requestIdHeader: 'x-request-id',
  });

  // 1. Security Headers
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === 'production',
  });

  // 2. CORS Allowlist
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (origin === config.FRONTEND_ORIGIN || origin.startsWith('http://localhost:')) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  // 3. Cookie Management
  await app.register(cookie, {
    secret: config.COOKIE_SECRET,
    hook: 'onRequest',
  });

  // 4. JWT Authentication
  await app.register(jwt, {
    secret: config.JWT_SECRET,
  });

  // 5. Distributed Rate Limiting
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', 'localhost'],
    errorResponseBuilder: (req) => ({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again in a few seconds.',
      },
      meta: { requestId: req.id },
    }),
  });

  // 6. OpenAPI / Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Smart Market Watchlist API',
        description: 'Production-grade backend with "Since You Last Checked" intelligence layer',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${config.PORT}` }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // 7. Request / Response Hooks & Metrics
  app.addHook('onResponse', async (req, reply) => {
    metrics.recordHttp(req.routeOptions?.url || req.url, reply.statusCode);
  });

  // 8. Register Modules under /api/v1
  await app.register(healthRoutes); // /health/live, /health/ready, /metrics
  await app.register(
    async (v1) => {
      await v1.register(authRoutes, { prefix: '/auth' });
      await v1.register(watchlistsRoutes, { prefix: '/watchlists' });
      await v1.register(instrumentsRoutes, { prefix: '/stocks' });
      await v1.register(marketDataRoutes, { prefix: '/stocks' });
      await v1.register(checkpointsRoutes, { prefix: '/stocks' });
      await v1.register(dashboardRoutes, { prefix: '/dashboard' });
      await v1.register(alertsRoutes, { prefix: '/alerts' });
      await v1.register(finnhubWebhookRoutes, { prefix: '/webhooks' });
    },
    { prefix: '/api/v1' }
  );
  await app.register(finnhubWebhookRoutes, { prefix: '/webhooks' });
  await app.register(finnhubWebhookRoutes, { prefix: '/api/webhooks' });

  // 9. Standardized Global Error Handler
  app.setErrorHandler((error: Error & { statusCode?: number; code?: string; validation?: unknown }, req, reply) => {
    // AppError (Domain Exceptions)
    const isAppErr =
      error instanceof AppError ||
      (error && typeof error === 'object' && error.name === 'AppError') ||
      (error && typeof error === 'object' && error.code?.startsWith('AUTH_'));

    if (isAppErr) {
      const appErr = error as unknown as AppError;
      return reply.code(appErr.statusCode || 401).send({
        error: {
          code: appErr.code || 'AUTH_REQUIRED',
          message: appErr.message || 'Authentication required',
          details: appErr.details,
        },
        meta: { requestId: req.id },
      });
    }

    // Zod Schema Validation Errors
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload or parameters',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        meta: { requestId: req.id },
      });
    }

    // Fastify schema validation error
    if (error.validation) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.validation,
        },
        meta: { requestId: req.id },
      });
    }

    // Fastify JWT / Auth generic 401 error
    if (error.statusCode === 401 || error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.code(401).send({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication token is missing or invalid',
        },
        meta: { requestId: req.id },
      });
    }

    // Catch-all Unhandled Server Errors (No stack trace leaks in production)
    logger.error({ err: error, requestId: req.id }, 'Unhandled Server Error');
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal server error occurred',
      },
      meta: { requestId: req.id },
    });
  });

  // 10. 404 Handler
  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.url} not found`,
      },
      meta: { requestId: req.id },
    });
  });

  return app;
};
