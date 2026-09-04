import React from 'react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'watchlists', label: 'Watchlists', icon: 'stacks' },
    { id: 'discover', label: 'Discover / Screen', icon: 'radar' },
    { id: 'stock-detail', label: 'Stock Deep Dive', icon: 'analytics' },
    { id: 'alerts', label: 'Smart Alerts & Log', icon: 'history_toggle_off' },
    { id: 'settings', label: 'Settings & Rules', icon: 'tune' },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-subtle/90 backdrop-blur-md z-40 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container">
      <div className="flex flex-col py-6 px-3">
        <div className="px-3 mb-4">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-mono font-semibold">
            Intelligence Platform
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all text-left group ${
                  isActive
                    ? 'bg-navy-tailored text-white font-medium shadow-sm'
                    : 'text-text-secondary hover:bg-surface-container-high hover:text-text-primary'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[19px] ${
                    isActive ? 'text-white' : 'text-text-secondary group-hover:text-navy-tailored'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Market Status Widget */}
      <div className="p-4 mx-3 mb-4 rounded bg-surface-card border border-surface-container shadow-subtle">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs uppercase text-bronze-saddle font-semibold font-serif tracking-wider">
            Market Status
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-market-gain opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-market-gain"></span>
          </span>
        </div>
        <p className="text-xs text-text-primary font-medium mb-0.5">
          US & Indian Markets Active
        </p>
        <p className="text-[10px] font-mono text-text-tertiary">
          Shared Cache Synchronized
        </p>
      </div>
    </aside>
  );
};
