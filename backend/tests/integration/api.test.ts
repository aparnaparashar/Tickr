import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import { FastifyInstance } from 'fastify';

describe('API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live should return 200 UP', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/live',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.status).toBe('UP');
    expect(json.uptime).toBeDefined();
  });

  it('GET /metrics should return metrics registry snapshot', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.metrics).toBeDefined();
    expect(json.metrics.http_5xx_total).toBeDefined();
  });

  it('GET /api/v1/stocks/search with query should return stock candidates', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/stocks/search?q=NVDA',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.data).toBeDefined();
    expect(Array.isArray(json.data.instruments)).toBe(true);
  });

  it('GET unauthenticated /api/v1/watchlists should reject with AUTH_REQUIRED', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/watchlists',
    });

    expect(res.statusCode).toBe(401);
    const json = JSON.parse(res.payload);
    expect(json.error.code).toBe('AUTH_REQUIRED');
  });
});
