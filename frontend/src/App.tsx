import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SearchModal } from './components/SearchModal';
import { DashboardPage } from './pages/DashboardPage';
import { WatchlistsPage } from './pages/WatchlistsPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('dashboard');
  const [selectedStockId, setSelectedStockId] = useState<string>('nvda-demo-id');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Global keyboard shortcut for Search (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectStock = (instrumentId: string) => {
    setSelectedStockId(instrumentId);
    setCurrentPath('stock-detail');
  };

  return (
    <div className="min-h-screen bg-canvas-alabaster flex flex-col text-text-primary">
      {/* Top Fixed Header */}
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Main Layout Area */}
      <div className="flex pt-16">
        {/* Fixed Left Sidebar */}
        <Sidebar currentPath={currentPath} onNavigate={(path) => setCurrentPath(path)} />

        {/* Dynamic Main Workspace */}
        <main className="pl-64 w-full min-h-[calc(100vh-4rem)] p-8 max-w-7xl mx-auto">
          {currentPath === 'dashboard' && (
            <DashboardPage
              onSelectStock={handleSelectStock}
              onOpenSettings={() => setCurrentPath('settings')}
              onOpenAlerts={() => setCurrentPath('alerts')}
            />
          )}

          {currentPath === 'watchlists' && (
            <WatchlistsPage
              onSelectStock={handleSelectStock}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}

          {currentPath === 'discover' && (
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
    </div>
  );
};
