import React from 'react';

/**
 * Investing District Page - Placeholder for investing module
 * TODO: Implement investing features, stock market simulation, educational content
 */
const InvestingDistrict: React.FC = () => {
  return (
    <div className="investing-district" style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>📈 Investing District</h1>
        <p style={styles.subtitle}>Learn about investing and grow your wealth</p>
      </header>

      <div style={styles.content}>
        <div style={styles.comingSoon}>
          <h2 style={styles.comingSoonTitle}>🚧 Coming Soon!</h2>
          <p style={styles.comingSoonText}>
            The Investing District is under construction. Soon you'll be able to:
          </p>
          <ul style={styles.featureList}>
            <li style={styles.featureItem}>📊 Learn about different investment types</li>
            <li style={styles.featureItem}>💼 Build a diversified portfolio</li>
            <li style={styles.featureItem}>📉 Practice with simulated market scenarios</li>
            <li style={styles.featureItem}>🎓 Complete investing challenges</li>
            <li style={styles.featureItem}>🏆 Earn badges for smart investing decisions</li>
          </ul>
        </div>

        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>💡 Investing Basics</h3>
          <p style={styles.infoText}>
            Investing is the act of putting your money to work for you. When you invest,
            you're buying assets that have the potential to increase in value over time,
            such as stocks, bonds, or real estate.
          </p>
          <p style={styles.infoText}>
            The key principles of investing include diversification, understanding risk vs.
            reward, and thinking long-term.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#4CAF50',
    margin: 0,
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    margin: 0,
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  comingSoon: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  comingSoonTitle: {
    fontSize: '28px',
    color: '#FF9800',
    marginTop: 0,
    marginBottom: '15px',
  },
  comingSoonText: {
    fontSize: '16px',
    color: '#555',
    marginBottom: '20px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    textAlign: 'left',
    display: 'inline-block',
  },
  featureItem: {
    fontSize: '16px',
    color: '#333',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
  },
  infoCard: {
    backgroundColor: '#e8f5e9',
    padding: '30px',
    borderRadius: '8px',
    borderLeft: '4px solid #4CAF50',
  },
  infoTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 0,
    marginBottom: '15px',
  },
  infoText: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '10px',
  },
};

export default InvestingDistrict;
