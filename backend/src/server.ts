import dns from 'node:dns';
import { buildApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './observability/logger.js';

// Prioritize IPv4 DNS lookups on Windows to avoid Cloudflare 522 timeouts
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
}

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });
    logger.info(`✨ Smart Market Watchlist API server listening on http://${config.HOST}:${config.PORT}`);
    logger.info(`📚 Swagger Documentation available at http://${config.HOST}:${config.PORT}/docs`);
  } catch (err) {
    logger.fatal({ err }, 'Failed to start API server');
    process.exit(1);
  }

  // Graceful shutdown handling
  const shutdown = async () => {
    logger.info('Shutting down server gracefully...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();
