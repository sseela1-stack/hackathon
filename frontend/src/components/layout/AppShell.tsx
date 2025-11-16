import React from 'react';
import '../../styles/AppShell.css';

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * AppShell - Main layout wrapper for the app with safe-area support
 * Provides header (top-safe), main content area, and footer (bottom-safe)
 */
export function AppShell({ children, header, footer }: AppShellProps) {
  return (
    <div className="app-shell">
      {header && (
        <header className="app-shell__header top-safe">
          {header}
        </header>
      )}
      
      <main role="main" className="app-shell__main stack">
        {children}
      </main>
      
      {footer && (
        <footer className="app-shell__footer bottom-safe">
          {footer}
        </footer>
      )}
    </div>
  );
}
