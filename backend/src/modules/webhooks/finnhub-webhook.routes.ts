import { FastifyInstance } from 'fastify';
import { FinnhubWebhookController } from './finnhub-webhook.controller.js';

export async function finnhubWebhookRoutes(fastify: FastifyInstance) {
  fastify.post('/finnhub', FinnhubWebhookController.handleWebhook);
}
