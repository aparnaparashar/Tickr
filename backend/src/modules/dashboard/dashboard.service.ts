import { prisma } from '../../db/prisma.js';
import { CheckpointsService } from '../checkpoints/checkpoints.service.js';
import { CacheService } from '../../cache/cache.service.js';
import { CACHE_KEYS } from '../../config/constants.js';
import { config } from '../../config/env.js';
import { MeaningfulChangesResult } from '../../shared/types/index.js';

export class DashboardService {
  /**
   * Get Smart Changes Dashboard: All watched instruments ranked by attention score
   */
  static async getDashboardChanges(userId: string): Promise<MeaningfulChangesResult[]> {
    const cacheKey = CACHE_KEYS.dashboardChanges(userId);

    return CacheService.getOrFetch(
      cacheKey,
      async () => {
        // 1. Find all distinct instruments in user's watchlists
        const items = await prisma.watchlistItem.findMany({
          where: {
            watchlist: {
              userId,
            },
          },
          select: {
            instrumentId: true,
          },
          distinct: ['instrumentId'],
        });

        if (items.length === 0) {
          return [];
        }

        // 2. Fetch change results in parallel (utilizes shared cache)
        const results = await Promise.all(
          items.map((item) =>
            CheckpointsService.getChangesSinceLastCheck(userId, item.instrumentId).catch(
              () => null
            )
          )
        );

        // 3. Filter nulls and sort by attention score descending
        const validResults = results.filter((r): r is MeaningfulChangesResult => r !== null);
        return validResults.sort((a, b) => b.attention.score - a.attention.score);
      },
      config.TTL_DASHBOARD_CHANGES
    );
  }
}
