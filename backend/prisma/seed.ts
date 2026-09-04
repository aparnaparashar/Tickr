import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SAMPLE_INSTRUMENTS = [
  {
    symbol: 'NVDA',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'NVIDIA Corporation',
    currency: 'USD',
    type: 'Common Stock',
    providerSymbol: 'NVDA',
    price: 128.5,
    volume: 45000000,
    previousClose: 122.4,
  },
  {
    symbol: 'AAPL',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'Apple Inc.',
    currency: 'USD',
    type: 'Common Stock',
    providerSymbol: 'AAPL',
    price: 224.2,
    volume: 38000000,
    previousClose: 220.0,
  },
  {
    symbol: 'MSFT',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'Microsoft Corporation',
    currency: 'USD',
    type: 'Common Stock',
    providerSymbol: 'MSFT',
    price: 420.8,
    volume: 21000000,
    previousClose: 418.5,
  },
  {
    symbol: 'TSLA',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'Tesla, Inc.',
    currency: 'USD',
    type: 'Common Stock',
    providerSymbol: 'TSLA',
    price: 218.4,
    volume: 58000000,
    previousClose: 206.0,
  },
  {
    symbol: 'GOOGL',
    exchange: 'NASDAQ',
    micCode: 'XNAS',
    country: 'United States',
    name: 'Alphabet Inc.',
    currency: 'USD',
    type: 'Common Stock',
    providerSymbol: 'GOOGL',
    price: 162.3,
    volume: 24000000,
    previousClose: 161.0,
  },
  {
    symbol: 'RELIANCE',
    exchange: 'NSE',
    micCode: 'XNSE',
    country: 'India',
    name: 'Reliance Industries Limited',
    currency: 'INR',
    type: 'Common Stock',
    providerSymbol: 'RELIANCE:NSE',
    price: 2980.5,
    volume: 6500000,
    previousClose: 2950.0,
  },
  {
    symbol: 'SBIN',
    exchange: 'NSE',
    micCode: 'XNSE',
    country: 'India',
    name: 'State Bank of India',
    currency: 'INR',
    type: 'Common Stock',
    providerSymbol: 'SBIN:NSE',
    price: 815.0,
    volume: 12000000,
    previousClose: 810.0,
  },
];

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Seed Instruments and Latest Market Snapshots
  const createdInstruments: Record<string, string> = {};

  for (const inst of SAMPLE_INSTRUMENTS) {
    const instrument = await prisma.instrument.upsert({
      where: {
        symbol_exchange: {
          symbol: inst.symbol,
          exchange: inst.exchange,
        },
      },
      create: {
        symbol: inst.symbol,
        exchange: inst.exchange,
        micCode: inst.micCode,
        country: inst.country,
        name: inst.name,
        currency: inst.currency,
        type: inst.type,
        providerSymbol: inst.providerSymbol,
        isActive: true,
        snapshot: {
          create: {
            price: inst.price,
            open: inst.previousClose * 1.002,
            high: inst.price * 1.015,
            low: inst.previousClose * 0.99,
            previousClose: inst.previousClose,
            volume: inst.volume,
            provider: 'seed_data',
            providerTimestamp: new Date(),
            freshnessStatus: 'FRESH',
          },
        },
      },
      update: {
        name: inst.name,
        currency: inst.currency,
      },
    });

    createdInstruments[inst.symbol] = instrument.id;
  }
  console.log(`✅ Seeded ${SAMPLE_INSTRUMENTS.length} stock instruments with market snapshots`);

  // 2. Seed Demo User
  const passwordHash = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    create: {
      email: 'demo@example.com',
      name: 'Alex Demo Trader',
      passwordHash,
    },
    update: {
      passwordHash,
    },
  });
  console.log(`✅ Seeded demo user: demo@example.com (Password: password123)`);

  // 3. Seed Demo Watchlist
  let watchlist = await prisma.watchlist.findFirst({
    where: { userId: demoUser.id, name: 'Tech Leaders' },
  });

  if (!watchlist) {
    watchlist = await prisma.watchlist.create({
      data: {
        userId: demoUser.id,
        name: 'Tech Leaders',
        isDefault: true,
      },
    });
  }

  // 4. Attach Items (NVDA, AAPL, TSLA) to Demo Watchlist
  const watchlistSymbols = ['NVDA', 'AAPL', 'TSLA'];
  for (let i = 0; i < watchlistSymbols.length; i++) {
    const sym = watchlistSymbols[i];
    const instId = createdInstruments[sym];
    if (instId) {
      await prisma.watchlistItem.upsert({
        where: {
          watchlistId_instrumentId: {
            watchlistId: watchlist.id,
            instrumentId: instId,
          },
        },
        create: {
          watchlistId: watchlist.id,
          instrumentId: instId,
          position: i,
        },
        update: {},
      });
    }
  }
  console.log(`✅ Seeded demo watchlist with items: ${watchlistSymbols.join(', ')}`);

  // 5. Seed an older checkpoint for NVDA to simulate a prior visit
  const nvdaId = createdInstruments['NVDA'];
  if (nvdaId) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.userStockCheckpoint.upsert({
      where: {
        userId_instrumentId: {
          userId: demoUser.id,
          instrumentId: nvdaId,
        },
      },
      create: {
        userId: demoUser.id,
        instrumentId: nvdaId,
        lastOpenedAt: yesterday,
        lastAcknowledgedAt: yesterday,
        comparisonCheckpointAt: yesterday,
        checkpointPrice: 118.2, // previous price was $118.2, current is $128.5 (+8.7% move!)
        checkpointVolume: 28000000,
        version: 1,
      },
      update: {
        comparisonCheckpointAt: yesterday,
        checkpointPrice: 118.2,
      },
    });
    console.log(`✅ Seeded NVDA checkpoint for demo user (yesterday at $118.20 vs current $128.50)`);
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
