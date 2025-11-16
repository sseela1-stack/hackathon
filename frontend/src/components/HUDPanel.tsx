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
      {/* Compact Header Row */}
      <div style={styles.topRow}>
        <div style={styles.monthCounter}>
          📅 M{gameState.monthsPlayed}
        </div>
        <div style={styles.healthCompact}>
          ❤️ {gameState.health}/100
        </div>
        <AchievementCounter earned={gameState.achievements} />
      </div>

      {/* Financial Overview - Compact Grid */}
      <div style={styles.balancesGrid}>
        <div style={styles.balanceCompact}>
          <span style={styles.labelCompact}>💵</span>
          <span style={styles.valueCompact}>${Math.round(checking)}</span>
        </div>
        <div style={styles.balanceCompact} id="buffer-100">
          <span style={styles.labelCompact}>🏦</span>
          <span style={styles.valueCompact}>${Math.round(savings)}</span>
        </div>
        <div style={styles.balanceCompact}>
          <span style={styles.labelCompact}>📈</span>
          <span style={styles.valueCompact}>${Math.round(investment)}</span>
        </div>
      </div>

      {/* Health Bar - Compact */}
      <div style={styles.healthBar}>
        <div 
          style={{
            ...styles.healthBarFill,
            width: `${gameState.health}%`,
            backgroundColor: getHealthColor(gameState.health),
          }}
        />
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
    padding: '8px 10px',
    borderRadius: '0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  monthCounter: {
    padding: '4px 10px',
    backgroundColor: '#e3f2fd',
    borderRadius: '12px',
    fontWeight: 700,
    color: '#1976d2',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  healthCompact: {
    padding: '4px 10px',
    backgroundColor: 'white',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  balancesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '6px',
  },
  balanceCompact: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '6px 4px',
    backgroundColor: 'white',
    borderRadius: '8px',
    gap: '2px',
  },
  labelCompact: {
    fontSize: '16px',
  },
  valueCompact: {
    fontWeight: 700,
    fontSize: '11px',
    color: '#333',
  },
  healthBar: {
    height: '6px',
    backgroundColor: '#ddd',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
};

export default HUDPanel;
