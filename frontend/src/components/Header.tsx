import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TickrLogo } from './TickrLogo';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
  onOpenAuthModal?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  onOpenAuthModal,
  onToggleSidebar,
  isSidebarCollapsed,
}) => {
  const { user, logout, demoLogin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-container-highest shadow-subtle text-on-surface font-sans">
      <div className="h-14 w-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Menu Toggle + Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer rounded hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSidebarCollapsed ? 'menu' : 'menu_open'}
              </span>
            </button>
          )}

          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <TickrLogo className="w-7 h-7 shrink-0 transition-transform group-hover:scale-105" />
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-brand font-extrabold tracking-tight text-on-surface">
                Tickr
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-secondary font-semibold hidden sm:inline">
                CORE
              </span>
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 font-sans text-xs">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 transition-colors cursor-pointer rounded-sm ${
              currentPath === 'home'
                ? 'bg-primary text-on-primary font-medium'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 transition-colors cursor-pointer rounded-sm ${
              currentPath === 'dashboard'
                ? 'bg-primary text-on-primary font-medium'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            Intelligence Feed
          </button>
          <button
            onClick={() => onNavigate('watchlists')}
            className={`px-3 py-1.5 transition-colors cursor-pointer rounded-sm ${
              currentPath === 'watchlists'
                ? 'bg-primary text-on-primary font-medium'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            Watchlists
          </button>
          <button
            onClick={() => onNavigate('news')}
            className={`px-3 py-1.5 transition-colors cursor-pointer rounded-sm ${
              currentPath === 'news'
                ? 'bg-primary text-on-primary font-medium'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            News & Catalysts
          </button>
          <button
            onClick={() => onNavigate('alerts')}
            className={`px-3 py-1.5 transition-colors cursor-pointer rounded-sm ${
              currentPath === 'alerts'
                ? 'bg-primary text-on-primary font-medium'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            Alerts
          </button>
        </nav>

        {/* Right Search & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSearch}
            className="h-8 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-on-surface-variant text-xs font-sans transition-colors flex items-center gap-2 cursor-pointer rounded-sm"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span className="hidden sm:inline">Search (⌘K)</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 py-1 pr-1 border border-transparent hover:border-outline-variant transition-colors cursor-pointer rounded-sm"
            >
              <div className="w-7 h-7 bg-surface-container-high border border-outline-variant text-on-surface flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-on-surface leading-none">
                  {user?.name || 'Trader'}
                </span>
                <span className="text-[10px] text-secondary font-sans leading-none mt-1">
                  Senior Analyst
                </span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                expand_more
              </span>
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-outline-variant shadow-card py-1 z-50 text-xs font-sans"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-3 py-2 border-b border-surface-container-highest">
                  <p className="font-semibold text-on-surface">{user?.name}</p>
                  <p className="text-on-surface-variant text-[11px] truncate">{user?.email}</p>
                </div>

                <button
                  onClick={demoLogin}
                  className="w-full text-left px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Reset Demo Account</span>
                </button>

                {onOpenAuthModal && (
                  <button
                    onClick={onOpenAuthModal}
                    className="w-full text-left px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">switch_account</span>
                    <span>Sign In to Another Account</span>
                  </button>
                )}

                <div className="border-t border-surface-container-highest my-1"></div>

                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 text-error hover:bg-error-container flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
