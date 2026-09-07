import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(16, 'REFRESH_TOKEN_SECRET must be at least 16 chars'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 chars'),

  MARKET_PROVIDER: z.enum(['twelve_data', 'mock']).default('mock'),
  TWELVE_DATA_API_KEY: z.string().default('demo'),
  TWELVE_DATA_BASE_URL: z.string().default('https://api.twelvedata.com'),
  TWELVE_DATA_MINUTE_CREDIT_BUDGET: z.coerce.number().default(8),
  TWELVE_DATA_DAILY_CREDIT_BUDGET: z.coerce.number().default(800),
  PROVIDER_HTTP_TIMEOUT_MS: z.coerce.number().default(5000),

  FINNHUB_API_KEY: z.string().default(''),
  FINNHUB_BASE_URL: z.string().default('https://finnhub.io/api/v1'),
  FINNHUB_SECRET: z.string().default(''),
  FINNHUB_MINUTE_CREDIT_BUDGET: z.coerce.number().default(60),

  NEWS_PROVIDER: z.enum(['alpha_vantage', 'mock']).default('mock'),
  ALPHA_VANTAGE_API_KEY: z.string().default('demo'),

  CHANGE_PRICE_MODERATE_PCT: z.coerce.number().default(2.0),
  CHANGE_PRICE_HIGH_PCT: z.coerce.number().default(5.0),
  CHANGE_PRICE_VERY_HIGH_PCT: z.coerce.number().default(8.0),
  CHANGE_VOLUME_ANOMALY_RATIO: z.coerce.number().default(1.75),
  CHANGE_VOLATILITY_RATIO: z.coerce.number().default(1.5),
  ALGORITHM_VERSION: z.string().default('1.0.0'),

  TTL_QUOTE_LIVE: z.coerce.number().default(15),
  TTL_QUOTE_CLOSED: z.coerce.number().default(180),
  TTL_HISTORY: z.coerce.number().default(900),
  TTL_FUNDAMENTALS: z.coerce.number().default(86400),
  TTL_NEWS: z.coerce.number().default(600),
  TTL_INDICATORS: z.coerce.number().default(900),
  TTL_DASHBOARD_CHANGES: z.coerce.number().default(30),

  REFRESH_WORKER_INTERVAL_MS: z.coerce.number().default(30000),
  ALERT_EVAL_INTERVAL_MS: z.coerce.number().default(30000),
});

const parseEnv = () => {
  const rawEnv = {
    ...process.env,
    FINNHUB_SECRET:
      process.env.FINNHUB_SECRET ||
      process.env.FINNHUB_WEBHOOK_SECRET ||
      process.env.X_FINNHUB_SECRET ||
      process.env['X-Finnhub-Secret'] ||
      '',
  };

  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
};

export const config = parseEnv();
export type Config = z.infer<typeof envSchema>;
