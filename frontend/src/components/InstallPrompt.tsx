import { useState, useEffect } from 'react';
import '../styles/InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'finquest-install-dismissed';
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * InstallPrompt - PWA installation prompt for both Android/Chrome and iOS Safari
 * Shows install CTA based on platform capabilities
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already dismissed within 7 days
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISSED_DURATION) {
        return; // Still within dismissed period
      } else {
        // Expired, remove old timestamp
        localStorage.removeItem(DISMISSED_KEY);
      }
    }

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      return; // Already installed
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Android/Chrome: Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS: Show hint after 2 seconds if not installed
    if (iOS) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for user choice
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
      } else {
        console.log('User dismissed PWA install');
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    } finally {
      // Clear the prompt and hide
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    // Store dismissed timestamp
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt__content">
        {isIOS && !deferredPrompt ? (
          // iOS-specific hint
          <>
            <div className="install-prompt__icon">📱</div>
            <div className="install-prompt__text">
              <strong>Install FinQuest</strong>
              <span className="install-prompt__hint">
                Tap Share <span className="ios-share-icon">⎙</span> then "Add to Home Screen"
              </span>
            </div>
            <button
              className="install-prompt__button install-prompt__button--secondary"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
            >
              Got it
            </button>
          </>
        ) : (
          // Android/Chrome prompt
          <>
            <div className="install-prompt__icon">💰</div>
            <div className="install-prompt__text">
              <strong>Install FinQuest</strong>
              <span className="install-prompt__hint">
                Get quick access and offline support
              </span>
            </div>
            <div className="install-prompt__actions">
              <button
                className="install-prompt__button install-prompt__button--primary"
                onClick={handleInstallClick}
                aria-label="Install FinQuest"
              >
                Install
              </button>
              <button
                className="install-prompt__button install-prompt__button--secondary"
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
              >
                Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
