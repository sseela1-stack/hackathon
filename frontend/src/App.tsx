import React, { useState } from 'react';
import GameScreen from './pages/GameScreen';
import InvestingDistrict from './pages/InvestingDistrict';
import SettingsPanel from './components/SettingsPanel';
import WelcomePage from './pages/WelcomePage';
import InstalledPage from './pages/InstalledPage';
import { usePWA } from './hooks/usePWA';

type View = 'game' | 'investing' | 'settings';

/**
 * Main App Component
 */
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('game');
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const { isInstalled, isInstallable, handleInstall } = usePWA();

  // Show welcome page if not installed
  if (!isInstalled && !hasSeenWelcome) {
    return <WelcomePage onInstall={handleInstall} isInstallable={isInstallable} />;
  }

  // Show thank you page if just installed
  if (isInstalled && !hasSeenWelcome) {
    return <InstalledPage onContinue={() => setHasSeenWelcome(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'game':
        return <GameScreen />;
      case 'investing':
        return <InvestingDistrict />;
      case 'settings':
        return <SettingsPanel onClose={() => setCurrentView('game')} />;
      default:
        return <GameScreen />;
    }
  };

  return (
    <div className="app">
      {currentView !== 'settings' && (
        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navButton,
              backgroundColor: currentView === 'game' ? '#2196F3' : '#f0f0f0',
              color: currentView === 'game' ? 'white' : '#333',
            }}
            onClick={() => setCurrentView('game')}
          >
            🎮 Game
          </button>
          <button
            style={{
              ...styles.navButton,
              backgroundColor: currentView === 'investing' ? '#4CAF50' : '#f0f0f0',
              color: currentView === 'investing' ? 'white' : '#333',
            }}
            onClick={() => setCurrentView('investing')}
          >
            📈 Investing
          </button>
          <button
            style={styles.navButton}
            onClick={() => setCurrentView('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>
      )}

      <main style={styles.main}>
        {renderView()}
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  navButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  main: {
    minHeight: 'calc(100vh - 70px)',
  },
};

export default App;
