import React from 'react';

interface WelcomePageProps {
  onInstall: () => void;
  isInstallable: boolean;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onInstall, isInstallable }) => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎮 FinQuest</h1>
          <p style={styles.subtitle}>Financial Literacy Game</p>
        </div>

        <div style={styles.description}>
          <h2 style={styles.sectionTitle}>Welcome to FinQuest!</h2>
          <p style={styles.text}>
            Learn financial literacy through an interactive and engaging game experience.
            Master the art of money management, investing, and financial decision-making.
          </p>

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>💰</span>
              <h3 style={styles.featureTitle}>Money Management</h3>
              <p style={styles.featureText}>Learn to budget, save, and spend wisely</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📈</span>
              <h3 style={styles.featureTitle}>Investing Skills</h3>
              <p style={styles.featureText}>Understand stocks, bonds, and portfolio management</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🎯</span>
              <h3 style={styles.featureTitle}>Real-World Scenarios</h3>
              <p style={styles.featureText}>Practice with realistic financial situations</p>
            </div>
          </div>
        </div>

        {isInstallable ? (
          <button style={styles.installButton} onClick={onInstall}>
            📥 Download as App
          </button>
        ) : (
          <div style={styles.installInfo}>
            <p style={styles.infoText}>
              To install this app:
            </p>
            <ul style={styles.infoList}>
              <li>On Chrome/Edge: Click the install icon in the address bar</li>
              <li>On Safari (iOS): Tap Share → Add to Home Screen</li>
              <li>On Firefox: Look for the install prompt or use "Add to Home Screen"</li>
            </ul>
          </div>
        )}

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Install FinQuest as a Progressive Web App for the best experience!
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  content: {
    maxWidth: '800px',
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '48px',
    margin: '0 0 10px 0',
    color: '#333',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: '24px',
    margin: '0',
    color: '#666',
  },
  description: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '28px',
    color: '#333',
    marginBottom: '15px',
  },
  text: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#555',
    marginBottom: '30px',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  feature: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
  },
  featureIcon: {
    fontSize: '40px',
    display: 'block',
    marginBottom: '10px',
  },
  featureTitle: {
    fontSize: '18px',
    color: '#333',
    margin: '0 0 8px 0',
  },
  featureText: {
    fontSize: '14px',
    color: '#666',
    margin: '0',
  },
  installButton: {
    width: '100%',
    padding: '18px 32px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
  },
  installInfo: {
    backgroundColor: '#e3f2fd',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #2196F3',
  },
  infoText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1976D2',
    margin: '0 0 10px 0',
  },
  infoList: {
    fontSize: '14px',
    color: '#555',
    margin: '0',
    paddingLeft: '20px',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0',
  },
  footerText: {
    fontSize: '14px',
    color: '#888',
    margin: '0',
  },
};

export default WelcomePage;
