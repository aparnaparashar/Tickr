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
        if (!activeWatchlistId || !res.watchlists.some((w) => w.id === activeWatchlistId)) {
          setActiveWatchlistId(res.watchlists[0].id);
        }
      } else {
        setWatchlists([]);
      }
    } catch (err) {
      console.error('Failed to load watchlists:', err);
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

  const handleDeleteWatchlist = async (watchlistId: string) => {
    if (watchlists.length <= 1) return;
    try {
      await api.deleteWatchlist(watchlistId);
      await fetchWatchlists();
    } catch (err) {
      console.error('Failed to delete watchlist:', err);
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
    <div className="flex flex-col w-full pb-16 font-sans text-on-surface space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-surface-container-highest">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold">
              WATCHLIST MANAGER
            </span>
            <span className="text-on-surface-variant text-xs">•</span>
            <span className="text-[11px] font-mono text-on-surface-variant">
              {watchlists.length} Portfolios
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl text-on-surface font-bold tracking-tight mt-1">
            Watched Instruments
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Organize assets by sector, manage active watchlists, and monitor live price action.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-8 px-3.5 bg-surface-container-low border border-outline-variant hover:border-primary text-on-surface transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">playlist_add</span>
            <span>New Watchlist</span>
          </button>
          <button
            onClick={onOpenSearch}
            className="h-8 px-4 bg-primary hover:bg-primary-container text-on-primary font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* Watchlist Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-surface-container-highest font-mono text-xs">
        <div className="flex items-center gap-1">
          {watchlists.map((wl) => {
            const isActive = activeWatchlistId === wl.id;
            return (
              <button
                key={wl.id}
                onClick={() => setActiveWatchlistId(wl.id)}
                className={`px-3 py-1.5 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary font-medium'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant'
                }`}
              >
                <span>{wl.name}</span>
                <span
                  className={`text-[10px] px-1 ${
                    isActive ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-secondary'
                  }`}
                >
                  {wl.items?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {activeWatchlist && watchlists.length > 1 && (
          <button
            onClick={() => handleDeleteWatchlist(activeWatchlist.id)}
            title="Delete active watchlist"
            className="text-secondary hover:text-error text-xs flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            <span>Delete List</span>
          </button>
        )}
      </div>

      {/* Watched Items Table */}
      <div className="bg-surface-container-lowest border border-outline-variant">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-on-surface-variant animate-pulse">
            Loading watchlist instruments...
          </div>
        ) : !activeWatchlist || !activeWatchlist.items || activeWatchlist.items.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-10 h-10 border border-outline-variant bg-surface-container-low mx-auto flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </div>
            <h3 className="font-sans text-base text-on-surface font-semibold">This watchlist is empty</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Search tickers (e.g. NVDA, AAPL, RELIANCE) to populate this watchlist.
            </p>
            <button
              onClick={onOpenSearch}
              className="px-5 py-2.5 bg-primary text-on-primary text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Add Instruments
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-primary bg-surface-container-low text-secondary font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-4 font-semibold">Instrument</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Last Price</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Day Change</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Day Range</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Volume</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest font-mono">
                {activeWatchlist.items.map((item) => {
                  const inst = item.instrument;
                  const snap = inst?.snapshot;
                  const prevClose = snap?.previousClose || snap?.price || 100;
                  const delta = snap ? snap.price - prevClose : 0;
                  const pct = snap && prevClose ? ((delta / prevClose) * 100).toFixed(2) : '0.00';
                  const isGain = parseFloat(pct) >= 0;
                  const currency = inst.currency === 'INR' ? '₹' : '$';

                  const high = snap?.high || snap?.price || 100;
                  const low = snap?.low || snap?.price || 90;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectStock(inst.id)}
                      className="hover:bg-surface-container-low cursor-pointer transition-colors group"
                    >
                      {/* Instrument */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-surface-container-high border border-outline-variant flex items-center justify-center font-bold text-on-surface text-xs">
                            {inst.symbol.substring(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-on-surface text-xs group-hover:underline">
                                {inst.symbol}
                              </span>
                              <span className="text-[9px] uppercase px-1 bg-surface-container text-secondary border border-outline-variant">
                                {inst.exchange}
                              </span>
                            </div>
                            <span className="text-[11px] font-sans text-on-surface-variant block line-clamp-1 max-w-[160px]">
                              {inst.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-on-surface text-xs block">
                          {currency}{snap ? snap.price.toFixed(2) : '--'}
                        </span>
                        <span className="text-[9px] text-secondary uppercase">
                          {inst.currency}
                        </span>
                      </td>

                      {/* Day Change */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-semibold text-xs ${
                            isGain ? 'text-market-gain' : 'text-error'
                          }`}
                        >
                          {isGain ? '+' : ''}{pct}%
                        </span>
                      </td>

                      {/* Day Range */}
                      <td className="py-3 px-4 text-right text-on-surface-variant text-[11px]">
                        <span>{currency}{low.toFixed(2)} - {currency}{high.toFixed(2)}</span>
                      </td>

                      {/* Volume */}
                      <td className="py-3 px-4 text-right text-on-surface-variant text-[11px]">
                        {snap ? `${(snap.volume / 1000000).toFixed(2)}M` : '--'}
                      </td>

                      {/* Freshness Status */}
                      <td className="py-3 px-4 text-center">
                        <span className="px-1.5 py-0.2 bg-surface-container border border-outline-variant text-[10px] text-secondary font-semibold uppercase">
                          {snap?.freshnessStatus || 'FRESH'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => handleRemoveItem(activeWatchlist.id, inst.id, e)}
                          title="Remove from Watchlist"
                          className="p-1 hover:bg-error-container text-secondary hover:text-error transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
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

      {/* Create Watchlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface-container-lowest p-6 border border-outline-variant font-mono">
            <h3 className="text-sm font-bold text-on-surface mb-2 uppercase">
              CREATE WATCHLIST
            </h3>
            <p className="text-xs text-on-surface-variant font-sans mb-3">
              Enter a name for your new group of assets.
            </p>
            <input
              autoFocus
              type="text"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder="e.g. AI Datacenters, Indian Bluechips..."
              className="w-full p-2 bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary mb-4 font-mono"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWatchlist}
                className="px-4 py-1.5 bg-primary text-on-primary font-medium hover:bg-primary-container cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
