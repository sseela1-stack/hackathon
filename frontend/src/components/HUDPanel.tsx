import React from 'react';
import { User } from '../types/game';

interface HUDPanelProps {
  user: User;
}

/**
 * HUD Panel - Displays financial balances, health score, and current day/month
 */
const HUDPanel: React.FC<HUDPanelProps> = ({ user }) => {
  return (
    <div className="hud-panel" style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.heading}>Financial Overview</h3>
        <div style={styles.balances}>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Checking:</span>
            <span style={styles.value}>${user.checkingBalance.toFixed(2)}</span>
          </div>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Savings:</span>
            <span style={styles.value}>${user.savingsBalance.toFixed(2)}</span>
          </div>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Investment:</span>
            <span style={styles.value}>${user.investmentBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.heading}>Financial Health Score</h3>
        <div style={styles.healthScore}>
          <div style={styles.healthBar}>
            <div 
              style={{
                ...styles.healthBarFill,
                width: `${user.healthScore}%`,
                backgroundColor: getHealthColor(user.healthScore),
              }}
            />
          </div>
          <span style={styles.healthValue}>{user.healthScore}/100</span>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.heading}>Progress</h3>
        <div style={styles.progress}>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Day:</span>
            <span style={styles.value}>{user.currentDay}</span>
          </div>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Month:</span>
            <span style={styles.value}>{user.currentMonth}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const getHealthColor = (score: number): string => {
  if (score >= 70) return '#4CAF50'; // Green
  if (score >= 40) return '#FFC107'; // Yellow
  return '#F44336'; // Red
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '20px',
  },
  heading: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  balances: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  balanceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '4px',
  },
  label: {
    fontWeight: '500',
    color: '#666',
  },
  value: {
    fontWeight: 'bold',
    color: '#333',
  },
  healthScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  healthBar: {
    flex: 1,
    height: '24px',
    backgroundColor: '#ddd',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  healthValue: {
    fontWeight: 'bold',
    minWidth: '60px',
    textAlign: 'right',
  },
  progress: {
    display: 'flex',
    gap: '10px',
  },
};

export default HUDPanel;
