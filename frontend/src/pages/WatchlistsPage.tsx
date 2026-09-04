import React, { useState, useEffect } from 'react';
import { Watchlist } from '../types';
import { api } from '../services/api';

interface WatchlistsPageProps {
  onSelectStock: (instrumentId: string) => void;
  onOpenSearch: () => void;
}

export const WatchlistsPage: React.FC<WatchlistsPageProps> = ({
  onSelectStock,
  onOpenSearch,
}) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('');
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWatchlists = async () => {
    setLoading(true);
    try {
      const res = await api.getWatchlists();
      if (res.watchlists && res.watchlists.length > 0) {
        setWatchlists(res.watchlists);
        if (!activeWatchlistId) {
          setActiveWatchlistId(res.watchlists[0].id);
        }
      } else {
        // Mock fallback for presentation
        const mockWl: Watchlist = {
          id: 'wl-default-1',
          userId: 'u1',
          name: 'Core Holdings & Tech',
          isDefault: true,
          createdAt: new Date().toISOString(),
          items: [
            {
              id: 'item-1',
              watchlistId: 'wl-default-1',
              instrumentId: 'nvda-id',
              position: 0,
              instrument: {
                id: 'nvda-id',
                symbol: 'NVDA',
                exchange: 'NASDAQ',
                name: 'NVIDIA Corporation',
                currency: 'USD',
                type: 'Common Stock',
                providerSymbol: 'NVDA',
                snapshot: {
                  price: 138.45,
                  open: 122.4,
                  high: 140.0,
                  low: 121.0,
                  previousClose: 120.5,
                  volume: 142600000,
                  provider: 'mock',
                  providerTimestamp: new Date().toISOString(),
                  freshnessStatus: 'FRESH',
                },
              },
            },
            {
              id: 'item-2',
              watchlistId: 'wl-default-1',
              instrumentId: 'aapl-id',
              position: 1,
              instrument: {
                id: 'aapl-id',
                symbol: 'AAPL',
                exchange: 'NASDAQ',
                name: 'Apple Inc.',
                currency: 'USD',
                type: 'Common Stock',
                providerSymbol: 'AAPL',
                snapshot: {
                  price: 228.1,
                  open: 221.0,
                  high: 229.5,
                  low: 220.0,
                  previousClose: 221.0,
                  volume: 64100000,
                  provider: 'mock',
                  providerTimestamp: new Date().toISOString(),
                  freshnessStatus: 'FRESH',
                },
              },
            },
            {
              id: 'item-3',
              watchlistId: 'wl-default-1',
              instrumentId: 'reliance-id',
              position: 2,
              instrument: {
                id: 'reliance-id',
                symbol: 'RELIANCE',
                exchange: 'NSE',
                name: 'Reliance Industries Ltd.',
                currency: 'INR',
                type: 'Common Stock',
                providerSymbol: 'RELIANCE:NSE',
                snapshot: {
                  price: 2988.1,
                  open: 3024.0,
                  high: 3040.0,
                  low: 2975.0,
                  previousClose: 3024.0,
                  volume: 18200000,
                  provider: 'mock',
                  providerTimestamp: new Date().toISOString(),
                  freshnessStatus: 'FRESH',
                },
              },
            },
          ],
        };
        setWatchlists([mockWl]);
        setActiveWatchlistId(mockWl.id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    try {
      const res = await api.createWatchlist(newWatchlistName.trim());
      setWatchlists([...watchlists, res.watchlist]);
      setActiveWatchlistId(res.watchlist.id);
      setNewWatchlistName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create watchlist:', err);
    }
  };

  const handleRemoveItem = async (watchlistId: string, instrumentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.removeItemFromWatchlist(watchlistId, instrumentId);
      await fetchWatchlists();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-container mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy-tailored">
            Watchlists & Workspace
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Organize watched instruments and inspect personalized check metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded bg-surface-card hover:bg-surface-subtle border border-surface-container text-xs font-medium text-navy-tailored transition-colors shadow-subtle flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Watchlist</span>
          </button>
          <button
            onClick={onOpenSearch}
            className="px-3.5 py-2 rounded bg-navy-tailored hover:bg-navy-slate text-white text-xs font-medium transition-colors shadow-subtle flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* Watchlist Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-surface-container">
        {watchlists.map((wl) => (
          <button
            key={wl.id}
            onClick={() => setActiveWatchlistId(wl.id)}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeWatchlistId === wl.id
                ? 'bg-navy-tailored text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-subtle text-text-secondary border border-surface-container'
            }`}
          >
            <span>{wl.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20">
              {wl.items?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Watched Items Table */}
      <div className="bg-surface-card rounded shadow-subtle border border-surface-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-container bg-surface-subtle text-text-secondary font-mono text-[10px] uppercase">
                <th className="p-4 font-semibold">Instrument</th>
                <th className="p-4 font-semibold text-right">Price</th>
                <th className="p-4 font-semibold text-right">Today / Delta</th>
                <th className="p-4 font-semibold text-right">Volume</th>
                <th className="p-4 font-semibold text-center">Freshness</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-mono">
              {activeWatchlist?.items?.map((item) => {
                const inst = item.instrument;
                const snap = inst.snapshot;
                const prevClose = snap?.previousClose || snap?.price || 100;
                const delta = snap ? snap.price - prevClose : 0;
                const pct = snap && prevClose ? ((delta / prevClose) * 100).toFixed(2) : '0.00';
                const isGain = parseFloat(pct) >= 0;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectStock(inst.id)}
                    className="hover:bg-surface-subtle/80 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center font-bold text-navy-tailored text-xs font-mono">
                          {inst.symbol.substring(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-navy-tailored text-sm font-mono">
                              {inst.symbol}
                            </span>
                            <span className="text-[9px] uppercase px-1 rounded bg-surface-container text-text-tertiary">
                              {inst.exchange}
                            </span>
                          </div>
                          <span className="text-[11px] font-sans text-text-secondary line-clamp-1">
                            {inst.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <span className="font-bold text-navy-tailored text-sm">
                        {inst.currency === 'INR' ? '₹' : '$'}
                        {snap ? snap.price.toFixed(2) : '--'}
                      </span>
                      <span className="text-[10px] text-text-tertiary uppercase block">
                        {inst.currency}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <span
                        className={`font-semibold text-xs px-2 py-0.5 rounded ${
                          isGain
                            ? 'bg-green-50 text-market-gain'
                            : 'bg-red-50 text-market-loss'
                        }`}
                      >
                        {isGain ? '+' : ''}
                        {pct}%
                      </span>
                    </td>

                    <td className="p-4 text-right text-text-secondary">
                      {snap ? `${(snap.volume / 1000000).toFixed(2)}M` : '--'}
                    </td>

                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] text-text-secondary uppercase">
                        {snap?.freshnessStatus || 'FRESH'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => handleRemoveItem(activeWatchlist.id, inst.id, e)}
                        title="Remove from Watchlist"
                        className="p-1.5 rounded hover:bg-red-50 text-text-tertiary hover:text-market-loss transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Watchlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-card rounded p-6 shadow-hover border border-surface-container">
            <h3 className="text-lg font-serif font-semibold text-navy-tailored mb-3">
              Create New Watchlist
            </h3>
            <input
              type="text"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder="e.g. High Growth Tech, Indian Bluechips..."
              className="w-full p-2.5 rounded border border-surface-container text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-navy-tailored mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded bg-surface-subtle text-text-secondary text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWatchlist}
                className="px-4 py-2 rounded bg-navy-tailored text-white text-xs font-medium"
              >
                Create Watchlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
