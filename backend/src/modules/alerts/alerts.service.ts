import { prisma } from '../../db/prisma.js';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../observability/logger.js';

export class AlertsService {
  static async listUserAlerts(userId: string) {
    return prisma.alert.findMany({
      where: { userId },
      include: {
        instrument: {
          include: { snapshot: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createAlert(
    userId: string,
    instrumentId: string,
    type: string,
    targetValue: number
  ) {
    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw AppError.notFound('Instrument not found');
    }

    return prisma.alert.create({
      data: {
        userId,
        instrumentId,
        type,
        targetValue,
        enabled: true,
      },
      include: {
        instrument: true,
      },
    });
  }

  static async updateAlert(
    userId: string,
    alertId: string,
    data: { enabled?: boolean; targetValue?: number }
  ) {
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw AppError.notFound('Alert not found');
    }

    return prisma.alert.update({
      where: { id: alertId },
      data: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
      },
    });
  }

  static async deleteAlert(userId: string, alertId: string) {
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw AppError.notFound('Alert not found');
    }

    return prisma.alert.delete({
      where: { id: alertId },
    });
  }

  /**
   * Evaluate active alerts against current snapshots
   */
  static async evaluateActiveAlerts() {
    const activeAlerts = await prisma.alert.findMany({
      where: {
        enabled: true,
        isTriggered: false,
      },
      include: {
        instrument: {
          include: { snapshot: true },
        },
      },
    });

    for (const alert of activeAlerts) {
      const snap = alert.instrument.snapshot;
      if (!snap) continue;

      let triggered = false;
      if (alert.type === 'PRICE_ABOVE' && snap.price >= alert.targetValue) {
        triggered = true;
      } else if (alert.type === 'PRICE_BELOW' && snap.price <= alert.targetValue) {
        triggered = true;
      } else if (alert.type === 'PERCENT_MOVE') {
        const percentChange = snap.previousClose
          ? ((snap.price - snap.previousClose) / snap.previousClose) * 100
          : 0;
        if (Math.abs(percentChange) >= alert.targetValue) {
          triggered = true;
        }
      }

      if (triggered) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            isTriggered: true,
            lastTriggeredAt: new Date(),
          },
        });
        logger.info({ alertId: alert.id, type: alert.type, userId: alert.userId }, 'Alert triggered');
      }
    }
  }
}
