import React, { useState, useEffect } from 'react';
import { MeaningfulChangesResult } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onSelectStock: (instrumentId: string) => void;
  onOpenSettings: () => void;
  onOpenAlerts: () => void;
  onOpenSearch: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectStock,
  onOpenSettings,
  onOpenAlerts,
  onOpenSearch,
}) => {
  const { user } = useAuth();
  const [changes, setChanges] = useState<MeaningfulChangesResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardChanges();
      if (res.items && res.items.length > 0) {
        setChanges(res.items);
      } else {
        setChanges([]);
      }
    } catch (err) {
      console.warn('Dashboard fetch notice:', err);
      setChanges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleAcknowledge = async (instrumentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAcknowledgingId(instrumentId);
    try {
      await api.acknowledgeCheckpoint(instrumentId);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to advance checkpoint:', err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleAcknowledgeAll = async () => {
    for (const item of changes) {
      await api.acknowledgeCheckpoint(item.instrumentId).catch(() => null);
    }
    await fetchDashboardData();
  };

  const highAttentionCount = changes.filter((c) => c.attention.score >= 50).length;

  return (
    <div className="flex flex-col w-full pb-16 font-sans text-on-surface space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-surface-container-highest">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold">
              TEMPORAL INTELLIGENCE REPORT
            </span>
            <span className="text-on-surface-variant text-xs">•</span>
            <span className="text-[11px] font-mono text-on-surface-variant">
              Active Watchlists
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl text-on-surface font-bold tracking-tight mt-1">
            Since You Last Checked
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5 max-w-2xl">
            Calculated drift across monitored assets since your previous checkpoint timestamp. Highlights verified catalysts, volume surges, and price breakouts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 font-mono text-xs">
          <button
            onClick={onOpenSearch}
            className="h-8 px-3.5 bg-surface-container-low border border-outline-variant hover:border-primary text-on-surface transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Stock</span>
          </button>
          <button
            onClick={onOpenAlerts}
            className="h-8 px-3.5 bg-surface-container-low border border-outline-variant hover:border-primary text-on-surface transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Alerts</span>
          </button>
          <button
            onClick={handleAcknowledgeAll}
            disabled={changes.length === 0}
            className="h-8 px-4 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            <span>Acknowledge All ({changes.length})</span>
          </button>
        </div>
      </div>

      {/* Metric Matrices */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="p-4 bg-surface-container-lowest border border-outline-variant">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Watched Assets</span>
          <span className="text-2xl font-medium text-on-surface mt-1 block">{changes.length}</span>
          <span className="text-[11px] text-secondary mt-0.5 block">Portfolio universe</span>
        </div>

        <div className="p-4 bg-surface-container-lowest border border-outline-variant">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">High Drift Events</span>
          <span className="text-2xl font-medium text-on-surface mt-1 block">{highAttentionCount}</span>
          <span className="text-[11px] text-secondary mt-0.5 block">&gt; 50 attention score</span>
        </div>

        <div className="p-4 bg-surface-container-lowest border border-outline-variant">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Engine State</span>
          <span className="text-2xl font-medium text-on-surface mt-1 block">Synchronized</span>
          <span className="text-[11px] text-secondary mt-0.5 block">Deterministic scoring</span>
        </div>

        <div className="p-4 bg-surface-container-lowest border border-outline-variant">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Shared Cache</span>
          <span className="text-2xl font-medium text-on-surface mt-1 block">Live Feed</span>
          <span className="text-[11px] text-secondary mt-0.5 block">Sub-minute cache TTL</span>
        </div>
      </div>

      {/* Attention Queue Table */}
      <div className="bg-surface-container-lowest border border-outline-variant">
        <div className="px-4 py-3 border-b border-surface-container-highest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase text-on-surface tracking-wider">
              Attention Queue
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-surface-container-low border border-outline-variant text-secondary">
              Ranked by Temporal Drift
            </span>
          </div>

          <button
            onClick={fetchDashboardData}
            title="Refresh delta computation"
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-on-surface-variant animate-pulse">
            Computing temporal checkpoints and anomaly vectors...
          </div>
        ) : changes.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-10 h-10 border border-outline-variant bg-surface-container-low mx-auto flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">checklist</span>
            </div>
            <h3 className="font-sans text-base text-on-surface font-semibold">No items in your watchlist</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Add tickers to your watchlist to begin tracking "Since You Last Checked" price breakouts, volume surges, and catalyst explanations.
            </p>
            <button
              onClick={onOpenSearch}
              className="px-5 py-2.5 bg-primary text-on-primary text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Search & Add Stocks
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-primary bg-surface-container-low text-secondary font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-4 font-semibold">Instrument</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Current Price</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Last Checkpoint</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Temporal Delta</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Score</th>
                  <th className="py-2.5 px-4 font-semibold">Primary Catalyst / Summary</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest font-mono">
                {changes.map((item) => {
                  const priceChange = item.changes.find((c) => c.type === 'PRICE_CHANGE');
                  const deltaPct = priceChange?.value ?? 0;
                  const isGain = deltaPct >= 0;
                  const currency = item.exchange === 'NSE' ? '₹' : '$';
                  const checkpointPrice = item.checkpoint?.price;

                  return (
                    <tr
                      key={item.instrumentId}
                      onClick={() => onSelectStock(item.instrumentId)}
                      className="hover:bg-surface-container-low cursor-pointer transition-colors group"
                    >
                      {/* Instrument */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-surface-container-high border border-outline-variant flex items-center justify-center font-bold text-on-surface text-xs">
                            {item.symbol.substring(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-on-surface text-xs group-hover:underline">
                                {item.symbol}
                              </span>
                              <span className="text-[9px] uppercase px-1 bg-surface-container text-secondary border border-outline-variant">
                                {item.exchange}
                              </span>
                            </div>
                            <span className="text-[11px] font-sans text-on-surface-variant block line-clamp-1 max-w-[140px]">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Current Price */}
                      <td className="py-3 px-4 text-right font-medium text-on-surface">
                        {currency}{item.current.price.toFixed(2)}
                      </td>

                      {/* Last Checkpoint */}
                      <td className="py-3 px-4 text-right text-on-surface-variant">
                        {checkpointPrice ? (
                          <div>
                            <span>{currency}{checkpointPrice.toFixed(2)}</span>
                            <span className="text-[10px] text-secondary block">
                              {item.checkpoint?.lastAcknowledgedAt
                                ? new Date(item.checkpoint.lastAcknowledgedAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Baseline'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-secondary text-[11px]">First Check</span>
                        )}
                      </td>

                      {/* Temporal Delta */}
                      <td className="py-3 px-4 text-right">
                        {item.isFirstVisit ? (
                          <span className="px-1.5 py-0.2 bg-surface-container text-secondary text-[10px]">
                            BASELINE
                          </span>
                        ) : (
                          <span
                            className={`font-semibold text-xs ${
                              isGain ? 'text-market-gain' : 'text-error'
                            }`}
                          >
                            {isGain ? '+' : ''}{deltaPct.toFixed(2)}%
                          </span>
                        )}
                      </td>

                      {/* Attention Score Pill */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 bg-surface-container-high border border-outline-variant text-[10px] font-semibold text-on-surface uppercase">
                          {item.attention.score}/100
                        </span>
                      </td>

                      {/* Catalyst Explanation */}
                      <td className="py-3 px-4 max-w-sm">
                        <p className="text-[11px] font-sans text-on-surface-variant line-clamp-2 leading-relaxed">
                          {item.explanation.summary}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => handleAcknowledge(item.instrumentId, e)}
                          disabled={acknowledgingId === item.instrumentId}
                          title="Advance checkpoint to current quote"
                          className="px-2.5 py-1 bg-surface-container-low hover:bg-primary hover:text-on-primary border border-outline-variant text-on-surface text-[11px] transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {acknowledgingId === item.instrumentId ? 'sync' : 'done'}
                          </span>
                          <span>
                            {acknowledgingId === item.instrumentId ? 'Saving...' : 'Acknowledge'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
