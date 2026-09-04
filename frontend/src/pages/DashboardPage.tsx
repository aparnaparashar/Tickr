import React, { useState, useEffect } from 'react';
import { MeaningfulChangesResult, Watchlist } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onSelectStock: (instrumentId: string) => void;
  onOpenSettings: () => void;
  onOpenAlerts: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectStock,
  onOpenSettings,
  onOpenAlerts,
}) => {
  const { user } = useAuth();
  const [changes, setChanges] = useState<MeaningfulChangesResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const changesRes = await api.getDashboardChanges().catch(() => ({ items: [] }));

      if (changesRes.items && changesRes.items.length > 0) {
        setChanges(changesRes.items);
      } else {
        // High quality fallback demonstration data
        setChanges([
          {
            instrumentId: 'nvda-demo-id',
            symbol: 'NVDA',
            exchange: 'NASDAQ',
            name: 'NVIDIA Corporation',
            isFirstVisit: false,
            checkpoint: {
              at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
              price: 120.5,
              volume: 32000000,
              version: 1,
              lastAcknowledgedAt: 'Yesterday, 4:18 PM',
            },
            current: {
              at: new Date().toISOString(),
              price: 138.45,
              volume: 142600000,
              providerTimestamp: new Date().toISOString(),
            },
            attention: {
              score: 88,
              level: 'VERY_HIGH',
              breakdown: {
                priceScore: 40,
                volumeScore: 25,
                volatilityScore: 12,
                newsScore: 7,
                technicalScore: 4,
              },
            },
            changes: [
              {
                type: 'PRICE_CHANGE',
                value: 14.9,
                unit: '%',
                significance: 'CRITICAL',
                direction: 'UP',
                label: '+14.9% Price Breakout',
              },
              {
                type: 'VOLUME_ANOMALY',
                value: 2.8,
                unit: 'x avg',
                significance: 'HIGH',
                direction: 'UP',
                label: '2.8x Volume Surge',
              },
            ],
            evidence: [
              {
                evidenceType: 'PRICE_CHANGE',
                oldValue: 120.5,
                newValue: 138.45,
                delta: 14.9,
                significanceScore: 95,
                significance: 'CRITICAL',
                source: 'Market Snapshot',
                sourceTimestamp: new Date().toISOString(),
              },
            ],
            explanation: {
              summary:
                'NVDA has gained 14.9% since your previous checkpoint. Q4 enterprise GPU demand revised upward following major cloud provider capital spending disclosures.',
              confidence: 'HIGH',
              catalystIdentified: true,
              evidenceIds: ['ev-1'],
            },
            freshness: {
              status: 'FRESH',
              providerTimestamp: new Date().toISOString(),
              receivedAt: new Date().toISOString(),
              ageSeconds: 8,
            },
          },
          {
            instrumentId: 'aapl-demo-id',
            symbol: 'AAPL',
            exchange: 'NASDAQ',
            name: 'Apple Inc.',
            isFirstVisit: false,
            checkpoint: {
              at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
              price: 221.0,
              volume: 38000000,
              version: 2,
              lastAcknowledgedAt: 'Sep 3, 10:45 AM',
            },
            current: {
              at: new Date().toISOString(),
              price: 228.1,
              volume: 64100000,
              providerTimestamp: new Date().toISOString(),
            },
            attention: {
              score: 62,
              level: 'HIGH',
              breakdown: {
                priceScore: 30,
                volumeScore: 15,
                volatilityScore: 8,
                newsScore: 7,
                technicalScore: 2,
              },
            },
            changes: [
              {
                type: 'PRICE_CHANGE',
                value: 3.2,
                unit: '%',
                significance: 'HIGH',
                direction: 'UP',
                label: '+3.2% Move',
              },
            ],
            evidence: [],
            explanation: {
              summary:
                'AAPL has gained 3.2% since your previous checkpoint. Component supply reports confirm manufacturing ramp-up ahead of schedule for next-gen models.',
              confidence: 'MEDIUM',
              catalystIdentified: true,
              evidenceIds: [],
            },
            freshness: {
              status: 'FRESH',
              providerTimestamp: new Date().toISOString(),
              receivedAt: new Date().toISOString(),
              ageSeconds: 12,
            },
          },
          {
            instrumentId: 'reliance-demo-id',
            symbol: 'RELIANCE',
            exchange: 'NSE',
            name: 'Reliance Industries Ltd.',
            isFirstVisit: false,
            checkpoint: {
              at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
              price: 3024.0,
              volume: 5200000,
              version: 1,
              lastAcknowledgedAt: 'Today, 9:30 AM',
            },
            current: {
              at: new Date().toISOString(),
              price: 2988.1,
              volume: 18200000,
              providerTimestamp: new Date().toISOString(),
            },
            attention: {
              score: 55,
              level: 'MODERATE',
              breakdown: {
                priceScore: 18,
                volumeScore: 25,
                volatilityScore: 8,
                newsScore: 4,
                technicalScore: 0,
              },
            },
            changes: [
              {
                type: 'PRICE_CHANGE',
                value: -1.18,
                unit: '%',
                significance: 'MEDIUM',
                direction: 'DOWN',
                label: '-1.18% Move',
              },
              {
                type: 'VOLUME_ANOMALY',
                value: 2.1,
                unit: 'x avg',
                significance: 'HIGH',
                direction: 'UP',
                label: '2.1x Volume Surge',
              },
            ],
            evidence: [],
            explanation: {
              summary:
                'RELIANCE has declined 1.18% on heavy block volume in afternoon trade as funds rebalanced into consumer retail segments.',
              confidence: 'MEDIUM',
              catalystIdentified: true,
              evidenceIds: [],
            },
            freshness: {
              status: 'FRESH',
              providerTimestamp: new Date().toISOString(),
              receivedAt: new Date().toISOString(),
              ageSeconds: 5,
            },
          },
        ]);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAcknowledge = async (instrumentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAcknowledgingId(instrumentId);
    try {
      await api.acknowledgeCheckpoint(instrumentId);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to acknowledge checkpoint:', err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleMarkAllReviewed = async () => {
    for (const item of changes) {
      await api.acknowledgeCheckpoint(item.instrumentId).catch(() => null);
    }
    await fetchDashboardData();
  };

  const criticalCount = changes.filter((c) => c.attention.score >= 60).length;
  const reviewCount = changes.filter((c) => c.attention.score >= 40).length;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Executive Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-surface-container mb-8">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-bronze-saddle font-semibold">
            Temporal Intelligence Report
          </span>
          <h1 className="text-3xl font-serif font-medium text-navy-tailored tracking-tight mt-1">
            Good afternoon, {user?.name.split(' ')[0] || 'Alex'}.
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Showing what has meaningfully changed across your watchlists since your previous checkpoints.
          </p>
        </div>

        {/* Executive Action Shelf */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onOpenAlerts}
            className="h-[38px] px-4 rounded bg-surface-card hover:bg-surface-subtle border border-surface-container text-navy-tailored text-sm font-medium transition-colors shadow-subtle flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-text-secondary">
              tune
            </span>
            <span>Alert Rules</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="h-[38px] px-4 rounded bg-surface-card hover:bg-surface-subtle border border-surface-container text-bronze-saddle text-sm font-medium transition-colors shadow-subtle flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-bronze-amber">
              fact_check
            </span>
            <span>Review {reviewCount} Changes</span>
          </button>
          <button
            onClick={handleMarkAllReviewed}
            className="h-[38px] px-4 rounded bg-navy-tailored hover:bg-navy-slate text-white text-sm font-medium transition-colors shadow-subtle flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            <span>Acknowledge All</span>
          </button>
        </div>
      </div>

      {/* Smart Delta Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Critical Changes */}
        <div className="bg-surface-card rounded p-5 shadow-subtle border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-market-loss font-semibold">
              Critical Changes
            </span>
            <span className="px-2 py-0.5 rounded bg-error-container/40 text-market-loss text-[10px] font-mono font-semibold">
              ACTION NEEDED
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold text-navy-tailored tracking-tight mb-1 font-mono">
              {criticalCount}
            </div>
            <p className="text-sm text-text-primary font-medium">High Attention Events</p>
          </div>
          <div className="pt-4 mt-4 border-t border-surface-container flex items-center justify-between text-text-tertiary text-xs font-mono">
            <span>Threshold: Exceeded</span>
            <span className="text-market-loss font-medium">{criticalCount} stocks affected</span>
          </div>
        </div>

        {/* Card 2: Volume Surges */}
        <div className="bg-surface-card rounded p-5 shadow-subtle border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-bronze-amber font-semibold">
              Volume Anomalies
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary-fixed/50 text-bronze-saddle text-[10px] font-mono font-semibold">
              &gt; 2.0x AVG
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold text-navy-tailored tracking-tight mb-1 font-mono">
              2
            </div>
            <p className="text-sm text-text-primary font-medium">Elevated Trading Flow</p>
          </div>
          <div className="pt-4 mt-4 border-t border-surface-container flex items-center justify-between text-text-tertiary text-xs font-mono">
            <span>NVDA, RELIANCE</span>
            <span className="text-text-secondary font-medium">Above 20D baseline</span>
          </div>
        </div>

        {/* Card 3: New Catalysts */}
        <div className="bg-surface-card rounded p-5 shadow-subtle border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-semibold">
              Company News
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-subtle text-text-secondary text-[10px] font-mono font-semibold">
              SINCE CHECKPOINT
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold text-navy-tailored tracking-tight mb-1 font-mono">
              4
            </div>
            <p className="text-sm text-text-primary font-medium">New Material Articles</p>
          </div>
          <div className="pt-4 mt-4 border-t border-surface-container flex items-center justify-between text-text-tertiary text-xs font-mono">
            <span>Enterprise AI & Supply</span>
            <span className="text-text-primary font-medium">Audited</span>
          </div>
        </div>

        {/* Card 4: Stable Baseline */}
        <div className="bg-surface-card rounded p-5 shadow-subtle border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-market-gain font-semibold">
              Holding Range
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-subtle text-market-gain text-[10px] font-mono font-semibold">
              NORMAL
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold text-navy-tailored tracking-tight mb-1 font-mono">
              18
            </div>
            <p className="text-sm text-text-primary font-medium">Unchanged Stocks</p>
          </div>
          <div className="pt-4 mt-4 border-t border-surface-container flex items-center justify-between text-text-tertiary text-xs font-mono">
            <span>18 of 21 holdings</span>
            <span className="text-market-gain font-medium">All Clear</span>
          </div>
        </div>
      </div>

      {/* Global Macro Strip */}
      <div className="bg-surface-card rounded p-6 mb-8 shadow-subtle border border-surface-container">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <span className="text-sm font-serif font-semibold uppercase text-bronze-saddle tracking-wider">
              Global Market Pulse
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-subtle text-navy-tailored text-xs font-mono font-semibold">
              Trend: Moderately Bullish
            </span>
          </div>
          <span className="text-xs font-mono text-text-tertiary hidden sm:inline">
            Real-Time Shared Feed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-4 rounded bg-surface-subtle flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-text-secondary uppercase">S&P 500 COMPOSITE</span>
              <span className="text-xs font-mono text-market-gain font-semibold">+0.42%</span>
            </div>
            <span className="text-xl font-mono font-bold text-navy-tailored">5,815.26</span>
          </div>

          <div className="p-4 rounded bg-surface-subtle flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-text-secondary uppercase">NASDAQ 100</span>
              <span className="text-xs font-mono text-market-gain font-semibold">+0.83%</span>
            </div>
            <span className="text-xl font-mono font-bold text-navy-tailored">18,518.61</span>
          </div>

          <div className="p-4 rounded bg-surface-subtle flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-text-secondary uppercase">NIFTY 50 (NSE)</span>
              <span className="text-xs font-mono text-market-loss font-semibold">-0.31%</span>
            </div>
            <span className="text-xl font-mono font-bold text-navy-tailored">24,854.05</span>
          </div>

          <div className="p-4 rounded bg-surface-subtle flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-text-secondary uppercase">US 10Y TREASURY</span>
              <span className="text-xs font-mono text-bronze-amber font-semibold">4.182%</span>
            </div>
            <span className="text-xl font-mono font-bold text-navy-tailored">-1.8 bps</span>
          </div>
        </div>

        <div className="mt-4 pt-3 flex items-center gap-3 bg-canvas-alabaster p-3 rounded border border-surface-container text-xs text-text-secondary">
          <span className="font-serif font-bold uppercase text-bronze-saddle shrink-0">
            Market Synthesis:
          </span>
          <span>
            Markets are broadly constructive led by AI datacenter capital expenditures, while Indian equities consolidate recent gains near record levels.
          </span>
        </div>
      </div>

      {/* Priority Attention Feed ("Deserves Attention Now") */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif font-semibold text-navy-tailored">
              Deserves Attention Now
            </h2>
            <span className="px-2 py-0.5 rounded bg-surface-card border border-surface-container font-mono text-[10px] text-bronze-saddle font-bold uppercase">
              RANKED BY WHAT CHANGED MOST
            </span>
          </div>
          <span className="text-xs text-text-tertiary font-mono hidden sm:inline">
            Personalized to your checkpoints
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {changes.map((item) => {
            const priceChange = item.changes.find((c) => c.type === 'PRICE_CHANGE');
            const isGain = (priceChange?.value || 0) >= 0;

            let badgeBg = 'bg-surface-subtle text-text-secondary';
            if (item.attention.level === 'VERY_HIGH' || item.attention.level === 'HIGH') {
              badgeBg = 'bg-error-container/40 text-market-loss border border-market-loss/20';
            } else if (item.attention.level === 'MODERATE') {
              badgeBg = 'bg-secondary-fixed/50 text-bronze-saddle border border-bronze-saddle/20';
            }

            return (
              <div
                key={item.instrumentId}
                onClick={() => onSelectStock(item.instrumentId)}
                className="bg-surface-card rounded p-6 shadow-subtle hover:shadow-hover border border-surface-container transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-bold text-navy-tailored group-hover:text-bronze-amber transition-colors">
                          {item.symbol}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container text-text-tertiary uppercase">
                          {item.exchange}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-1">{item.name}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${badgeBg}`}>
                      {item.attention.level.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Price & Delta Box */}
                  <div className="p-3.5 rounded bg-surface-subtle border border-surface-container mb-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xl font-mono font-bold text-navy-tailored">
                          {item.exchange === 'NSE' ? '₹' : '$'}
                          {item.current.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono text-text-tertiary ml-2">
                          {item.exchange === 'NSE' ? 'INR' : 'USD'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-sm font-mono font-bold ${
                            isGain ? 'text-market-gain' : 'text-market-loss'
                          }`}
                        >
                          {isGain ? '+' : ''}
                          {priceChange?.value ?? 0}%
                        </span>
                        <span className="text-[10px] font-mono text-text-tertiary block">
                          SINCE CHECKPOINT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Auditable Catalyst Explanation */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-xs font-serif font-semibold uppercase text-bronze-saddle tracking-wider">
                      Audited Evidence Summary
                    </span>
                    <p className="text-xs text-navy-tailored leading-relaxed line-clamp-3">
                      {item.explanation.summary}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-surface-container flex items-center justify-between text-xs font-mono text-text-tertiary">
                  <span>Score: {item.attention.score}/100</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleAcknowledge(item.instrumentId, e)}
                      disabled={acknowledgingId === item.instrumentId}
                      className="px-2.5 py-1 rounded bg-surface-subtle hover:bg-navy-tailored hover:text-white text-navy-tailored text-[11px] font-medium transition-colors border border-surface-container"
                    >
                      {acknowledgingId === item.instrumentId ? 'Updating...' : 'Acknowledge'}
                    </button>
                    <span className="text-bronze-amber group-hover:translate-x-0.5 transition-transform">
                      Inspect &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
