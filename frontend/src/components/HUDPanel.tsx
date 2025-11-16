import React from 'react';
import { GameState } from '../types/game';
import { AchievementCounter } from './Achievements';

interface HUDPanelProps {
  gameState: GameState;
}

/**
 * HUD Panel - Displays financial balances, health score, and current progress
 */
const HUDPanel: React.FC<HUDPanelProps> = ({ gameState }) => {
  const checking = gameState.accounts.find(a => a.type === 'checking')?.balance || 0;
  const savings = gameState.accounts.find(a => a.type === 'savings')?.balance || 0;
  const investment = gameState.accounts.find(a => a.type === 'investment')?.balance || 0;

  return (
    <div className="hud-panel" style={styles.container}>
      {/* Progression Header */}
      <div style={styles.progressionHeader}>
        <div style={styles.monthCounter}>
          <span style={styles.monthIcon}>📅</span>
          <span style={styles.monthText}>Month {gameState.monthsPlayed}</span>
        </div>
        <div style={styles.unlockStatus}>
          {gameState.unlocked.investingDistrict ? (
            <span style={styles.unlocked}>
              <span style={styles.unlockIcon}>🔓</span>
              Investing District: Unlocked
            </span>
          ) : (
            <span style={styles.locked}>
              <span style={styles.unlockIcon}>🔒</span>
              Investing District: Locked
            </span>
          )}
        </div>
        <AchievementCounter earned={gameState.achievements} />
      </div>

      <div style={styles.section}>
        <h3 style={styles.heading}>Financial Overview</h3>
        <div style={styles.balances}>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Checking:</span>
            <span style={styles.value}>${checking.toFixed(2)}</span>
          </div>
          <div style={styles.balanceItem} id="buffer-100">
            <span style={styles.label}>Savings:</span>
            <span style={styles.value}>${savings.toFixed(2)}</span>
          </div>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Investment:</span>
            <span style={styles.value}>${investment.toFixed(2)}</span>
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
                width: `${gameState.health}%`,
                backgroundColor: getHealthColor(gameState.health),
              }}
            />
          </div>
          <span style={styles.healthValue}>{gameState.health}/100</span>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.heading}>Monthly Fixed Expenses</h3>
        <div style={styles.progress} id="pay-bills">
          <div style={styles.balanceItem}>
            <span style={styles.label}>Rent:</span>
            <span style={styles.value}>${gameState.fixed.rent}</span>
          </div>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Food:</span>
            <span style={styles.value}>${gameState.fixed.food}</span>
          </div>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Transport:</span>
            <span style={styles.value}>${gameState.fixed.transport}</span>
          </div>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Phone/Internet:</span>
            <span style={styles.value}>${gameState.fixed.phoneInternet}</span>
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
  progressionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    flexWrap: 'wrap',
  },
  monthCounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '20px',
    fontWeight: 600,
    color: '#1976d2',
  },
  monthIcon: {
    fontSize: '18px',
  },
  monthText: {
    fontSize: '14px',
  },
  unlockStatus: {
    flex: 1,
  },
  unlocked: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#e8f5e9',
    borderRadius: '20px',
    color: '#2e7d32',
    fontWeight: 600,
    fontSize: '13px',
  },
  locked: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#fafafa',
    borderRadius: '20px',
    color: '#757575',
    fontWeight: 600,
    fontSize: '13px',
  },
  unlockIcon: {
    fontSize: '16px',
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
