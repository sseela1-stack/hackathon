import { registerSW } from 'virtual:pwa-register';

/**
 * Initialize PWA service worker registration with update prompts
 */
export function initPWA(): void {
  const updateSW = registerSW({
    onNeedRefresh() {
      showUpdateBanner(updateSW);
    },
    onOfflineReady() {
      showOfflineReadyToast();
    },
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      console.log('Service Worker registered:', registration);
    },
    onRegisterError(error: unknown) {
      console.error('Service Worker registration failed:', error);
    },
  });
}

/**
 * Show a banner when a service worker update is available
 */
function showUpdateBanner(updateSW: () => Promise<void>): void {
  // Remove any existing update banner
  const existingBanner = document.getElementById('pwa-update-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  // Create update banner
  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
    left: 50%;
    transform: translateX(-50%);
    background: #0B132B;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    animation: slideUp 0.3s ease-out;
    max-width: calc(100vw - 32px);
    width: 400px;
  `;

  const message = document.createElement('span');
  message.textContent = 'Update available';
  banner.appendChild(message);

  const reloadButton = document.createElement('button');
  reloadButton.textContent = 'Reload';
  reloadButton.style.cssText = `
    background: #3A86FF;
    color: white;
    border: none;
    padding: 6px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: background 0.2s;
  `;
  reloadButton.onmouseover = () => {
    reloadButton.style.background = '#2563eb';
  };
  reloadButton.onmouseout = () => {
    reloadButton.style.background = '#3A86FF';
  };
  reloadButton.onclick = async () => {
    banner.remove();
    await updateSW();
    window.location.reload();
  };
  banner.appendChild(reloadButton);

  const dismissButton = document.createElement('button');
  dismissButton.textContent = '×';
  dismissButton.style.cssText = `
    background: transparent;
    color: white;
    border: none;
    padding: 0 8px;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    opacity: 0.7;
    transition: opacity 0.2s;
  `;
  dismissButton.onmouseover = () => {
    dismissButton.style.opacity = '1';
  };
  dismissButton.onmouseout = () => {
    dismissButton.style.opacity = '0.7';
  };
  dismissButton.onclick = () => {
    banner.remove();
  };
  banner.appendChild(dismissButton);

  // Add animation keyframes
  if (!document.getElementById('pwa-animations')) {
    const style = document.createElement('style');
    style.id = 'pwa-animations';
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);
}

/**
 * Show a one-time toast when the app is ready to work offline
 */
function showOfflineReadyToast(): void {
  // Check if we've already shown this toast
  const hasShownOfflineToast = sessionStorage.getItem('pwa-offline-ready-shown');
  if (hasShownOfflineToast) {
    return;
  }

  const toast = document.createElement('div');
  toast.id = 'pwa-offline-toast';
  toast.style.cssText = `
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 20px);
    left: 50%;
    transform: translateX(-50%);
    background: #06D6A0;
    color: #0B132B;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideUp 0.3s ease-out;
    max-width: calc(100vw - 32px);
  `;
  toast.textContent = '✓ Ready to work offline';

  document.body.appendChild(toast);

  // Mark as shown
  sessionStorage.setItem('pwa-offline-ready-shown', 'true');

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
