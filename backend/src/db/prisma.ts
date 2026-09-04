import { PrismaClient } from '@prisma/client';
import { logger } from '../observability/logger.js';
import { config } from '../config/env.js';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      config.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (config.NODE_ENV === 'development') {
  // @ts-expect-error prisma event listener
  prisma.$on('query', (e: { query: string; duration: number }) => {
    logger.trace({ query: e.query, durationMs: e.duration }, 'Database Query');
  });
}

// @ts-expect-error prisma event listener
prisma.$on('error', (e: { message: string }) => {
  logger.error({ error: e.message }, 'Database Error');
});

if (config.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
