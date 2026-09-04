import React from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const { user, demoLogin } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container">
      <div className="h-16 w-full px-6 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 rounded bg-navy-tailored text-white flex items-center justify-center font-bold text-lg tracking-tight font-serif shadow-sm">
              T
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-navy-tailored tracking-tight font-sans">
                Tickr
              </span>
              <span className="text-[10px] uppercase tracking-widest text-bronze-saddle font-semibold font-mono">
                Intelligence Core
              </span>
            </div>
          </div>

          {/* Macro Ticker Strip */}
          <div className="hidden 2xl:flex items-center gap-3 pl-4">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-subtle shadow-subtle border border-surface-container">
              <span className="text-[10px] text-text-secondary uppercase font-mono font-medium">S&P 500</span>
              <span className="text-xs text-text-primary font-mono">5,815.26</span>
              <span className="text-xs text-market-gain font-mono font-medium">+0.42%</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-subtle shadow-subtle border border-surface-container">
              <span className="text-[10px] text-text-secondary uppercase font-mono font-medium">NASDAQ</span>
              <span className="text-xs text-text-primary font-mono">18,518.61</span>
              <span className="text-xs text-market-gain font-mono font-medium">+0.83%</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-subtle shadow-subtle border border-surface-container">
              <span className="text-[10px] text-text-secondary uppercase font-mono font-medium">NIFTY 50</span>
              <span className="text-xs text-text-primary font-mono">24,854.05</span>
              <span className="text-xs text-market-loss font-mono font-medium">-0.31%</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-subtle shadow-subtle border border-surface-container">
              <span className="text-[10px] text-text-secondary uppercase font-mono font-medium">US 10Y</span>
              <span className="text-xs text-bronze-amber font-mono font-medium">4.182%</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-4 hidden lg:block">
          <div
            onClick={onOpenSearch}
            className="relative flex items-center cursor-pointer group"
          >
            <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-[18px] group-hover:text-navy-tailored transition-colors">
              search
            </span>
            <input
              readOnly
              className="w-full h-[38px] pl-9 pr-20 bg-surface-card rounded border border-surface-container text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none shadow-subtle cursor-pointer"
              placeholder="Search ticker, company name, or discover stocks..."
              type="text"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container text-text-secondary font-semibold">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onOpenSearch}
            className="lg:hidden p-2 rounded text-text-secondary hover:text-text-primary hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          <div className="relative">
            <button
              aria-label="Notifications"
              className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-bronze-saddle"></span>
            </button>
          </div>

          <div className="flex items-center gap-3 pl-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-text-primary leading-tight">
                {user ? user.name : 'Guest User'}
              </span>
              <span className="text-[10px] text-text-tertiary uppercase font-mono font-medium">
                Senior Analyst
              </span>
            </div>
            <button
              onClick={demoLogin}
              title="Click to Switch Account / Reset Demo"
              className="w-8 h-8 rounded-full bg-navy-tailored text-white flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-bronze-amber transition-all"
            >
              {user ? user.name.charAt(0) : 'A'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
