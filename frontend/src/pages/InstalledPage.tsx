import React, { useEffect, useState } from 'react';

interface InstalledPageProps {
  onContinue: () => void;
}

const InstalledPage: React.FC<InstalledPageProps> = ({ onContinue }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Animate content in
    setTimeout(() => setShowContent(true), 100);
  }, []);

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.content,
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'scale(1)' : 'scale(0.9)',
        transition: 'all 0.5s ease',
      }}>
        <div style={styles.iconContainer}>
          <span style={styles.checkIcon}>✓</span>
        </div>

        <h1 style={styles.title}>Thanks for Installing!</h1>
        
        <p style={styles.message}>
          You've successfully installed FinQuest as a Progressive Web App.
          Now you can access the game anytime, even offline!
        </p>

        <div style={styles.benefits}>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>🚀</span>
            <span style={styles.benefitText}>Fast & Responsive</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>📱</span>
            <span style={styles.benefitText}>Works Offline</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>🎮</span>
            <span style={styles.benefitText}>Full App Experience</span>
          </div>
        </div>

        <button style={styles.continueButton} onClick={onContinue}>
          Start Playing 🎯
        </button>

        <p style={styles.footer}>
          Ready to master your financial future?
        </p>
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
    maxWidth: '600px',
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '60px 40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  iconContainer: {
    width: '100px',
    height: '100px',
    margin: '0 auto 30px',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)',
  },
  checkIcon: {
    fontSize: '60px',
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: '36px',
    color: '#333',
    margin: '0 0 20px 0',
    fontWeight: 'bold',
  },
  message: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#555',
    margin: '0 0 40px 0',
  },
  benefits: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '40px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  benefit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  benefitIcon: {
    fontSize: '32px',
  },
  benefitText: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  continueButton: {
    padding: '16px 48px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#2196F3',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
    marginBottom: '20px',
  },
  footer: {
    fontSize: '14px',
    color: '#888',
    margin: '0',
  },
};

export default InstalledPage;
