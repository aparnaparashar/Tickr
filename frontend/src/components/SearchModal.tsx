import React, { useState, useEffect, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      handleSearch('A'); // initial quick results
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.searchStocks(q.trim());
      setResults(data.instruments || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (instrument: Instrument, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingId(instrument.id);
    try {
      const watchlistsRes = await api.getWatchlists();
      const targetWl = watchlistsRes.watchlists[0];
      if (targetWl) {
        await api.addItemToWatchlist(targetWl.id, instrument.id);
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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-primary/40 backdrop-blur-sm animate-fade-in font-sans text-on-surface"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-outline-variant shadow-card overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-surface-container-highest bg-surface-container-low">
          <span className="material-symbols-outlined text-secondary mr-3 text-[20px]">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search stock symbol, company, or exchange (e.g. NVDA, AAPL, RELIANCE)..."
            className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant focus:outline-none text-sm font-sans"
          />
          <button
            onClick={onClose}
            className="text-secondary hover:text-on-surface px-2 py-0.5 text-[11px] font-mono border border-outline-variant bg-surface-container-lowest cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1">
          {loading && (
            <div className="py-8 text-center text-xs font-mono text-secondary animate-pulse">
              Scanning instrument universe...
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="py-8 text-center text-xs text-secondary font-mono">
              No instruments found for "{query}". Try NVDA, AAPL, MSFT, TSLA, RELIANCE, SBIN.
            </div>
          )}

          {!loading &&
            results.map((inst) => {
              const price = inst.snapshot?.price;
              const currency = inst.currency === 'INR' ? '₹' : '$';

              return (
                <div
                  key={inst.id}
                  onClick={() => {
                    onSelectStock(inst.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 hover:bg-surface-container-low border border-transparent hover:border-outline-variant cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-container-high border border-outline-variant flex items-center justify-center font-mono font-bold text-on-surface text-xs">
                      {inst.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface text-xs font-mono group-hover:underline">
                          {inst.symbol}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-1 bg-surface-container text-secondary border border-outline-variant">
                          {inst.exchange}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1">{inst.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {price !== undefined && (
                      <div className="text-right font-mono">
                        <span className="text-xs font-medium text-on-surface block">
                          {currency}{price.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-secondary uppercase">
                          {inst.currency}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={(e) => handleAddToWatchlist(inst, e)}
                      disabled={addingId === inst.id}
                      className="px-3 py-1 bg-surface-container-low hover:bg-primary hover:text-on-primary border border-outline-variant text-on-surface text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {addingId === inst.id ? 'check' : 'add'}
                      </span>
                      <span>{addingId === inst.id ? 'Added' : 'Watch'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
