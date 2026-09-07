import dns from 'node:dns';
import { MarketRefreshWorker } from './workers/market-refresh.worker.js';
import { AlertsService } from './modules/alerts/alerts.service.js';
import { config } from './config/env.js';
import { logger } from './observability/logger.js';

// Prioritize IPv4 DNS lookups on Windows to avoid Cloudflare 522 timeouts
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
}

let isRunning = true;

const startWorker = async () => {
  logger.info('🚀 Background Worker Process Started');

  // Schedule Market Data Refresh Loop
  const marketInterval = setInterval(async () => {
    if (!isRunning) return;
    try {
      await MarketRefreshWorker.refreshWatchedInstruments();
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes('Twelve Data API quota exhausted')
      ) {
        logger.warn('Twelve Data quota exhausted. Skipping this refresh cycle.');
        return;
      }
      logger.error({ error: err }, 'Market refresh background cycle error');
    }
  }, config.REFRESH_WORKER_INTERVAL_MS);

  // Schedule Alert Evaluation Loop
  const alertInterval = setInterval(async () => {
    if (!isRunning) return;
    try {
      await AlertsService.evaluateActiveAlerts();
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Alert evaluation background cycle error');
    }
  }, config.ALERT_EVAL_INTERVAL_MS);

  // Run initial iteration immediately
  MarketRefreshWorker.refreshWatchedInstruments().catch(() => null);
  AlertsService.evaluateActiveAlerts().catch(() => null);

  const shutdown = () => {
    logger.info('Shutting down background workers gracefully...');
    isRunning = false;
    clearInterval(marketInterval);
    clearInterval(alertInterval);
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startWorker().catch((err) => {
  logger.fatal({ error: (err as Error).message }, 'Worker failed to start');
  process.exit(1);
});
