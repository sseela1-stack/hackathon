import React, { useState, useEffect, Suspense, lazy } from 'react';
import GameScreen from './pages/GameScreen';
import SettingsPanel from './components/SettingsPanel';
import { InstallPrompt } from './components/InstallPrompt';
import { usePrefetchOnIdle } from './hooks/usePrefetch';
import { ProfileCreation, Role, Difficulty } from './pages/ProfileCreation';
import './App.css';

// Lazy load InvestingDistrict for code splitting
const InvestingDistrict = lazy(() => import('./pages/InvestingDistrict'));

type View = 'game' | 'investing' | 'settings';

/**
 * Loading fallback for lazy-loaded routes
 */
const LoadingFallback: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    fontSize: '18px',
    color: '#666',
  }}>
    Loading...
  </div>
);

/**
 * Main App Component
 */
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('game');
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<{ role: Role; difficulty: Difficulty; name: string } | null>(null);

  // Check if profile exists in localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('finquest_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setProfileData(profile);
        setHasProfile(true);
      } catch (e) {
        console.error('Failed to parse saved profile');
      }
    }
  }, []);

  const handleProfileComplete = (profile: { role: Role; difficulty: Difficulty; name: string }) => {
    localStorage.setItem('finquest_profile', JSON.stringify(profile));
    setProfileData(profile);
    setHasProfile(true);
  };

  // Prefetch InvestingDistrict chunk (always show investing now)
  usePrefetchOnIdle(() => import('./pages/InvestingDistrict'), true);

  // Show profile creation if no profile exists
  if (!hasProfile) {
    return <ProfileCreation onComplete={handleProfileComplete} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'game':
        return <GameScreen onInvestingUnlocked={() => {}} profileData={profileData} />;
      case 'investing':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <InvestingDistrict />
          </Suspense>
        );
      case 'settings':
        return <SettingsPanel onClose={() => setCurrentView('game')} />;
      default:
        return <GameScreen onInvestingUnlocked={() => {}} profileData={profileData} />;
    }
  };

  return (
    <div className="app">
      <InstallPrompt />

      {currentView !== 'settings' && (
        <nav className="app-nav">
          <button
            className="app-nav-button"
            style={{
              backgroundColor: currentView === 'game' ? '#2196F3' : '#f0f0f0',
              color: currentView === 'game' ? 'white' : '#333',
            }}
            onClick={() => setCurrentView('game')}
          >
            🎮 Game
          </button>
          <button
            className="app-nav-button"
            style={{
              backgroundColor: currentView === 'investing' ? '#4CAF50' : '#f0f0f0',
              color: currentView === 'investing' ? 'white' : '#333',
            }}
            onClick={() => setCurrentView('investing')}
          >
            📈 Investing
          </button>
          <button
            className="app-nav-button"
            style={{
              backgroundColor: '#f0f0f0',
              color: '#333',
            }}
            onClick={() => setCurrentView('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>
      )}

      <main className="app-main">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
