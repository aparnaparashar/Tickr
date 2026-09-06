import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SearchModal } from './components/SearchModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WatchlistsPage } from './pages/WatchlistsPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { NewsPage } from './pages/NewsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';

export const App: React.FC = () => {
  const { user, login, register } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('home');
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('tickr_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('tickr_sidebar_collapsed', String(next));
      return next;
    });
  };

  // On mount, auto-pick default stock ID if none selected
  useEffect(() => {
    const pickInitialStock = async () => {
      try {
        const data = await api.searchStocks('NVDA');
        if (data.instruments && data.instruments.length > 0) {
          setSelectedStockId(data.instruments[0].id);
        }
      } catch {
        // ignore
      }
    };
    pickInitialStock();
  }, [user]);

  // Global keyboard shortcuts (⌘K / Ctrl+K, H, 1-6 for navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key.toLowerCase() === 'h') setCurrentPath('home');
      if (e.key === '1') setCurrentPath('dashboard');
      if (e.key === '2') setCurrentPath('watchlists');
      if (e.key === '3') setCurrentPath('stock-detail');
      if (e.key === '4') setCurrentPath('news');
      if (e.key === '5') setCurrentPath('alerts');
      if (e.key === '6') setCurrentPath('settings');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectStock = (instrumentId: string) => {
    setSelectedStockId(instrumentId);
    setCurrentPath('stock-detail');
  };

  // Auth modal state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        await login(authEmail, authPass);
      } else {
        await register(authName, authEmail, authPass);
      }
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPass('');
      setAuthName('');
    } catch (err: unknown) {
      setAuthError((err as Error).message || 'Authentication failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans">
      {/* Top Fixed Header with Sidebar Toggle & Nav */}
      <Header
        currentPath={currentPath}
        onNavigate={(path) => setCurrentPath(path)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Layout Area */}
      <div className="flex pt-14">
        {/* Left Sidebar (Collapsible) */}
        <Sidebar
          currentPath={currentPath}
          onNavigate={(path) => setCurrentPath(path)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        {/* Dynamic Main Workspace adapting to collapsed/expanded state */}
        <main
          className={`w-full min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto transition-all duration-200 ease-in-out ${
            isSidebarCollapsed ? 'pl-20' : 'pl-64'
          }`}
        >
          {currentPath === 'home' && (
            <LandingPage
              onEnterApp={(path) => setCurrentPath(path || 'dashboard')}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}

          {currentPath === 'dashboard' && (
            <DashboardPage
              onSelectStock={handleSelectStock}
              onOpenSettings={() => setCurrentPath('settings')}
              onOpenAlerts={() => setCurrentPath('alerts')}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}

          {currentPath === 'watchlists' && (
            <WatchlistsPage
              onSelectStock={handleSelectStock}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}

          {currentPath === 'stock-detail' && (
            <StockDetailPage
              instrumentId={selectedStockId}
              onBack={() => setCurrentPath('dashboard')}
            />
          )}

          {currentPath === 'news' && (
            <NewsPage
              onSelectStock={handleSelectStock}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}

          {currentPath === 'alerts' && <AlertsPage />}

          {currentPath === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Quick Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStock={handleSelectStock}
      />

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest p-6 border border-outline-variant font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-highest">
              <span className="font-bold text-on-surface uppercase tracking-wider">
                {authMode === 'login' ? 'ACCOUNT SIGN IN' : 'CREATE ACCOUNT'}
              </span>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-2.5 mb-3 bg-error-container border border-error text-error">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-secondary mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Alex Sterling"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-secondary mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-secondary mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full mt-2 py-2.5 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary font-bold transition-colors cursor-pointer"
              >
                {authSubmitting ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Register'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-surface-container-highest text-center text-[11px] text-on-surface-variant font-sans">
              {authMode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError('');
                    }}
                    className="text-primary font-semibold underline cursor-pointer"
                  >
                    Register
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    className="text-primary font-semibold underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
