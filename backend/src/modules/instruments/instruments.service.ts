import { prisma } from '../../db/prisma.js';
import { ProviderFactory } from '../../providers/provider.factory.js';
import { AppError } from '../../shared/errors/app-error.js';

export class InstrumentsService {
  /**
   * Search instruments: local DB first, then provider fallback
   */
  static async search(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    let localMatches: Array<{
      id: string;
      symbol: string;
      exchange: string;
      micCode: string | null;
      country: string | null;
      name: string;
      currency: string;
      type: string;
      providerSymbol: string;
      isActive: boolean;
      metadataUpdatedAt: Date;
    }> = [];

    // 1. Search local DB if connected
    try {
      const upper = trimmed.toUpperCase();
      const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();

      localMatches = await prisma.instrument.findMany({
        where: {
          isActive: true,
          OR: [
            { symbol: { contains: upper } },
            { symbol: { contains: trimmed } },
            { name: { contains: trimmed } },
            { name: { contains: upper } },
            { name: { contains: capitalized } },
          ],
        },
        take: 20,
      });

      if (localMatches.length >= 3) {
        return localMatches;
      }
    } catch {
      // If DB is offline or not yet seeded, continue to provider fallback
    }

    // 2. Query market provider for live lookup
    try {
      const provider = ProviderFactory.getMarketProvider();
      const providerResults = await provider.searchStocks(trimmed);

      // 3. Upsert discovered instruments into local DB if reachable
      try {
        for (const item of providerResults) {
          await prisma.instrument.upsert({
            where: {
              symbol_exchange: {
                symbol: item.symbol,
                exchange: item.exchange,
              },
            },
            create: {
              symbol: item.symbol,
              exchange: item.exchange,
              micCode: item.micCode,
              country: item.country,
              name: item.name,
              currency: item.currency,
              type: item.type,
              providerSymbol: item.providerSymbol,
              isActive: true,
            },
            update: {
              name: item.name,
              currency: item.currency,
              metadataUpdatedAt: new Date(),
            },
          });
        }
      } catch {
        // Return provider results directly if DB is unavailable
        return providerResults;
      }

      const upper = trimmed.toUpperCase();
      const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();

      // Re-fetch sorted results from DB if connected
      const dbResults = await prisma.instrument.findMany({
        where: {
          isActive: true,
          OR: [
            { symbol: { contains: upper } },
            { symbol: { contains: trimmed } },
            { name: { contains: trimmed } },
            { name: { contains: upper } },
            { name: { contains: capitalized } },
          ],
        },
        take: 20,
      });

      return dbResults.length > 0 ? dbResults : providerResults;
    } catch {
      return localMatches;
    }
  }

  static async getById(id: string) {
    const instrument = await prisma.instrument.findUnique({
      where: { id },
      include: {
        snapshot: true,
      },
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument with ID ${id} not found`);
    }

    return instrument;
  }

  static async getBySymbol(symbol: string, exchange = 'NASDAQ') {
    const instrument = await prisma.instrument.findUnique({
      where: {
        symbol_exchange: {
          symbol: symbol.toUpperCase(),
          exchange: exchange.toUpperCase(),
        },
      },
      include: {
        snapshot: true,
      },
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument ${symbol}:${exchange} not found`);
    }

    return instrument;
  }
}
