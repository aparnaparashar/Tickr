import React, { useState, useEffect } from 'react';
import { Instrument } from '../types';
import { api } from '../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (instrumentId: string) => void;
  onAddedToWatchlist?: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStock,
  onAddedToWatchlist,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    // Default top suggestions when opened
    handleSearch('NVDA');
  }, [isOpen]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.searchStocks(q);
      setResults(data.instruments || []);
    } catch {
      // fallback suggestions
      setResults([
        {
          id: 'nvda-mock-id',
          symbol: 'NVDA',
          exchange: 'NASDAQ',
          name: 'NVIDIA Corporation',
          currency: 'USD',
          type: 'Common Stock',
          providerSymbol: 'NVDA',
          snapshot: {
            price: 128.5,
            open: 122.4,
            high: 130.0,
            low: 121.0,
            previousClose: 122.4,
            volume: 45000000,
            provider: 'mock',
            providerTimestamp: new Date().toISOString(),
            freshnessStatus: 'FRESH',
          },
        },
        {
          id: 'aapl-mock-id',
          symbol: 'AAPL',
          exchange: 'NASDAQ',
          name: 'Apple Inc.',
          currency: 'USD',
          type: 'Common Stock',
          providerSymbol: 'AAPL',
          snapshot: {
            price: 224.2,
            open: 220.0,
            high: 226.0,
            low: 219.0,
            previousClose: 220.0,
            volume: 38000000,
            provider: 'mock',
            providerTimestamp: new Date().toISOString(),
            freshnessStatus: 'FRESH',
          },
        },
        {
          id: 'reliance-mock-id',
          symbol: 'RELIANCE',
          exchange: 'NSE',
          name: 'Reliance Industries Limited',
          currency: 'INR',
          type: 'Common Stock',
          providerSymbol: 'RELIANCE:NSE',
          snapshot: {
            price: 2980.5,
            open: 2950.0,
            high: 3010.0,
            low: 2940.0,
            previousClose: 2950.0,
            volume: 6500000,
            provider: 'mock',
            providerTimestamp: new Date().toISOString(),
            freshnessStatus: 'FRESH',
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (instrument: Instrument, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingId(instrument.id);
    try {
      const watchlistsRes = await api.getWatchlists();
      const defaultWl = watchlistsRes.watchlists[0];
      if (defaultWl) {
        await api.addItemToWatchlist(defaultWl.id, instrument.id);
        if (onAddedToWatchlist) onAddedToWatchlist();
      }
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-navy-deep/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-surface-card rounded-lg shadow-hover border border-surface-container overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-surface-container bg-surface-subtle">
          <span className="material-symbols-outlined text-text-tertiary mr-3 text-[22px]">
            search
          </span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search stock ticker (e.g. NVDA, AAPL, RELIANCE, SBIN)..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none text-base"
          />
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary px-2 py-1 text-xs font-mono rounded bg-surface-container"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-1 divide-y divide-surface-container">
          {loading && (
            <div className="py-8 text-center text-sm text-text-tertiary font-mono animate-pulse">
              Scanning market universe...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-8 text-center text-sm text-text-tertiary">
              No matching instruments found.
            </div>
          )}

          {!loading &&
            results.map((inst) => (
              <div
                key={inst.id}
                onClick={() => {
                  onSelectStock(inst.id);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded hover:bg-surface-subtle cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center font-mono font-bold text-navy-tailored text-sm">
                    {inst.symbol.substring(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-tailored text-sm font-mono">
                        {inst.symbol}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-container text-text-secondary">
                        {inst.exchange}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1">{inst.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {inst.snapshot && (
                    <div className="text-right">
                      <span className="text-sm font-mono font-semibold text-navy-tailored block">
                        {inst.currency === 'INR' ? '₹' : '$'}
                        {inst.snapshot.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-mono text-text-tertiary uppercase">
                        {inst.currency}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={(e) => handleAddToWatchlist(inst, e)}
                    disabled={addingId === inst.id}
                    className="px-3 py-1.5 rounded bg-surface-card border border-surface-container text-navy-tailored text-xs font-medium hover:bg-navy-tailored hover:text-white transition-all shadow-subtle flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {addingId === inst.id ? 'check' : 'add'}
                    </span>
                    {addingId === inst.id ? 'Added' : 'Watch'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
