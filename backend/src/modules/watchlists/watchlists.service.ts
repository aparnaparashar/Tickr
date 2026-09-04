import { prisma } from '../../db/prisma.js';
import { AppError } from '../../shared/errors/app-error.js';

export class WatchlistsService {
  static async listUserWatchlists(userId: string) {
    return prisma.watchlist.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            instrument: {
              include: {
                snapshot: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async getWatchlistById(userId: string, watchlistId: string) {
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        userId, // Enforces user authorization
      },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            instrument: {
              include: {
                snapshot: true,
              },
            },
          },
        },
      },
    });

    if (!watchlist) {
      throw AppError.notFound('Watchlist not found');
    }

    return watchlist;
  }

  static async createWatchlist(userId: string, name: string, isDefault = false) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw AppError.badRequest('Watchlist name cannot be empty');
    }

    return prisma.watchlist.create({
      data: {
        userId,
        name: trimmed,
        isDefault,
      },
      include: {
        items: true,
      },
    });
  }

  static async updateWatchlist(userId: string, watchlistId: string, name?: string, isDefault?: boolean) {
    // 1. Verify ownership
    await this.getWatchlistById(userId, watchlistId);

    return prisma.watchlist.update({
      where: { id: watchlistId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });
  }

  static async deleteWatchlist(userId: string, watchlistId: string) {
    // 1. Verify ownership
    const watchlist = await this.getWatchlistById(userId, watchlistId);

    if (watchlist.isDefault) {
      throw AppError.badRequest('Cannot delete your default watchlist');
    }

    return prisma.watchlist.delete({
      where: { id: watchlistId },
    });
  }

  static async addItem(userId: string, watchlistId: string, instrumentId: string) {
    // 1. Verify watchlist ownership
    await this.getWatchlistById(userId, watchlistId);

    // 2. Verify instrument exists
    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw AppError.notFound('Instrument not found');
    }

    // 3. Count current items to set position
    const count = await prisma.watchlistItem.count({
      where: { watchlistId },
    });

    return prisma.watchlistItem.upsert({
      where: {
        watchlistId_instrumentId: {
          watchlistId,
          instrumentId,
        },
      },
      create: {
        watchlistId,
        instrumentId,
        position: count,
      },
      update: {},
      include: {
        instrument: {
          include: { snapshot: true },
        },
      },
    });
  }

  static async removeItem(userId: string, watchlistId: string, instrumentId: string) {
    // 1. Verify watchlist ownership
    await this.getWatchlistById(userId, watchlistId);

    return prisma.watchlistItem.deleteMany({
      where: {
        watchlistId,
        instrumentId,
      },
    });
  }

  static async reorderItems(userId: string, watchlistId: string, orderedInstrumentIds: string[]) {
    // 1. Verify watchlist ownership
    await this.getWatchlistById(userId, watchlistId);

    // 2. Perform reorder inside a transaction
    await prisma.$transaction(
      orderedInstrumentIds.map((instId, index) =>
        prisma.watchlistItem.updateMany({
          where: {
            watchlistId,
            instrumentId: instId,
          },
          data: {
            position: index,
          },
        })
      )
    );

    return this.getWatchlistById(userId, watchlistId);
  }
}
