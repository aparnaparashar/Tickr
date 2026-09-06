import React from 'react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'home', label: 'Overview / Home', icon: 'home', shortcut: 'H' },
    { id: 'dashboard', label: 'Intelligence Feed', icon: 'dashboard', shortcut: '1' },
    { id: 'watchlists', label: 'Watchlists', icon: 'format_list_bulleted', shortcut: '2' },
    { id: 'stock-detail', label: 'Stock Deep Dive', icon: 'analytics', shortcut: '3' },
    { id: 'news', label: 'News & Catalysts', icon: 'newspaper', shortcut: '4' },
    { id: 'alerts', label: 'Alert Rules', icon: 'notifications_active', shortcut: '5' },
    { id: 'settings', label: 'Calibration & Rules', icon: 'tune', shortcut: '6' },
  ];

  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 bg-white border-r border-surface-container-highest z-40 flex flex-col justify-between py-4 select-none transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-16 px-2' : 'w-60 px-3'
      }`}
    >
      <div className="flex flex-col gap-1">
        {/* Header / Collapse Toggle */}
        <div className={`flex items-center pb-2 ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
          {!isCollapsed && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-semibold truncate">
              RESEARCH WORKSPACE
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center text-xs transition-all text-left cursor-pointer ${
                  isCollapsed
                    ? 'justify-center py-2.5 px-0'
                    : 'justify-between px-3 py-2'
                } ${
                  isActive
                    ? 'bg-primary text-on-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`material-symbols-outlined text-[18px] shrink-0 ${
                      isActive ? 'text-on-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && (
                  <kbd
                    className={`text-[9px] font-mono px-1 py-0.2 border shrink-0 ${
                      isActive
                        ? 'bg-primary-container border-primary text-on-primary'
                        : 'bg-surface-container-high border-outline-variant text-secondary'
                    }`}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Engine & Cache Status Block */}
      <div
        className={`bg-surface-container-low border border-surface-container-highest text-xs font-mono transition-all ${
          isCollapsed ? 'p-2 flex flex-col items-center justify-center' : 'p-3'
        }`}
      >
        {isCollapsed ? (
          <div title="Temporal Engine: Active" className="flex items-center justify-center">
            <span className="w-2 h-2 bg-secondary-container"></span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase text-secondary font-semibold tracking-wider">
                ENGINE STATE
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-on-surface-variant space-y-0.5">
              <p className="leading-tight">Delta Evaluator: <span className="text-on-surface font-medium">v1.0.0</span></p>
              <p className="leading-tight text-secondary">Shared Cache: Connected</p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
