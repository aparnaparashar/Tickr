import React from 'react';
import { TickrLogo } from '../components/TickrLogo';

interface LandingPageProps {
  onEnterApp: (path?: string) => void;
  onOpenSearch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenSearch }) => {
  return (
    <div className="flex flex-col w-full pb-20 font-sans text-on-surface">
      {/* Hero Section */}
      <section className="pt-6 pb-12 border-b border-surface-container-highest">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <TickrLogo className="w-10 h-10" />
            <span className="font-brand font-extrabold text-3xl tracking-tight text-on-surface">
              Tickr
            </span>
          </div>

          <h1 className="font-brand text-4xl sm:text-5xl lg:text-6xl text-on-surface font-extrabold tracking-tight leading-[1.12] mb-6">
            The Intelligence Layer for Smart Market Watchlists.
          </h1>

          <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed font-sans max-w-2xl mb-8">
            Traditional watchlists only show what changed today. Tickr calculates what meaningfully changed <span className="text-on-surface font-semibold">since you last checked</span>—surfacing real price breakouts, volume surges, and verified catalysts into an auditable executive ledger.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
            <button
              onClick={() => onEnterApp('dashboard')}
              className="px-6 py-3 bg-primary text-on-primary hover:bg-primary-container transition-colors font-medium cursor-pointer shadow-subtle flex items-center gap-2"
            >
              <span>Launch Intelligence Feed</span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={() => onEnterApp('watchlists')}
              className="px-5 py-3 bg-surface-container-lowest border border-outline-variant hover:border-primary text-on-surface transition-colors cursor-pointer"
            >
              Manage Watchlists
            </button>
            <button
              onClick={onOpenSearch}
              className="px-5 py-3 bg-surface-container-low border border-outline-variant hover:border-primary text-on-surface-variant flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Search Universe (⌘K)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Market Pulse Ribbon */}
      <section className="py-8 border-b border-surface-container-highest">
        <div className="flex items-center justify-between mb-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">
          <span>Market Pulse & Major Indices</span>
          <span className="text-secondary text-[11px] font-mono">Live Synchronized</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="p-4 bg-surface-container-lowest border border-outline-variant">
            <span className="text-[11px] text-on-surface-variant block uppercase font-sans">S&P 500</span>
            <span className="text-xl font-medium text-on-surface mt-1 block">5,815.26</span>
            <span className="text-xs text-market-gain font-medium block mt-1">+0.42%</span>
          </div>

          <div className="p-4 bg-surface-container-lowest border border-outline-variant">
            <span className="text-[11px] text-on-surface-variant block uppercase font-sans">NASDAQ 100</span>
            <span className="text-xl font-medium text-on-surface mt-1 block">18,518.61</span>
            <span className="text-xs text-market-gain font-medium block mt-1">+0.83%</span>
          </div>

          <div className="p-4 bg-surface-container-lowest border border-outline-variant">
            <span className="text-[11px] text-on-surface-variant block uppercase font-sans">NIFTY 50 (NSE)</span>
            <span className="text-xl font-medium text-on-surface mt-1 block">24,854.05</span>
            <span className="text-xs text-error font-medium block mt-1">-0.31%</span>
          </div>

          <div className="p-4 bg-surface-container-lowest border border-outline-variant">
            <span className="text-[11px] text-on-surface-variant block uppercase font-sans">US 10Y YIELD</span>
            <span className="text-xl font-medium text-on-surface mt-1 block">4.182%</span>
            <span className="text-xs text-secondary font-medium block mt-1">-1.8 bps</span>
          </div>
        </div>
      </section>

      {/* Core Highlights */}
      <section className="py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-surface-container-lowest border border-outline-variant space-y-3">
            <div className="w-9 h-9 bg-surface-container-high flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
            </div>
            <h3 className="font-sans text-base font-bold text-on-surface">
              Personal Checkpoint Baselines
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
              Freezes your personal baseline timestamp and quote. Every subsequent visit compares what moved since that exact moment.
            </p>
          </div>

          <div className="p-6 bg-surface-container-lowest border border-outline-variant space-y-3">
            <div className="w-9 h-9 bg-surface-container-high flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">analytics</span>
            </div>
            <h3 className="font-sans text-base font-bold text-on-surface">
              Attention Anomaly Scoring
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
              Ranks your watchlist by calculating price velocity, 20-day volume ratios, and volatility spikes into a clean 0–100 score.
            </p>
          </div>

          <div className="p-6 bg-surface-container-lowest border border-outline-variant space-y-3">
            <div className="w-9 h-9 bg-surface-container-high flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">newspaper</span>
            </div>
            <h3 className="font-sans text-base font-bold text-on-surface">
              Audited Catalyst Feed
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
              Direct linkage to real corporate disclosures, exchange filings, and verified earnings reports with sentiment tagging.
            </p>
          </div>
        </div>
      </section>

      {/* Direct Workspace Launcher Banner */}
      <section className="pt-4">
        <div className="p-8 bg-surface-container-low border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-sans text-xl sm:text-2xl font-bold text-on-surface">
              Explore your live market watchlist
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 font-sans">
              Connect to live stocks, evaluate temporal checkpoints, and set up automated alert triggers.
            </p>
          </div>

          <button
            onClick={() => onEnterApp('dashboard')}
            className="px-6 py-3 bg-primary text-on-primary hover:bg-primary-container text-xs font-medium transition-colors shrink-0 cursor-pointer shadow-subtle flex items-center gap-2"
          >
            <span>Open Terminal Workspace</span>
            <span>&rarr;</span>
          </button>
        </div>
      </section>
    </div>
  );
};
