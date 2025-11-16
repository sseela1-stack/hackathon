import React from 'react';
import { GameState } from '../types/game';
import styles from './SimulationComplete.module.css';

interface SimulationCompleteProps {
  summary: {
    plannedDays: number;
    completedDays: number;
    finalState: GameState;
  };
  onRestart: () => void;
  onInvesting: () => void;
}

export const SimulationComplete: React.FC<SimulationCompleteProps> = ({
  summary,
  onRestart,
  onInvesting,
}) => {
  const { finalState, plannedDays, completedDays } = summary;
  const checking = finalState.accounts.find((a) => a.type === 'checking')?.balance ?? 0;
  const savings = finalState.accounts.find((a) => a.type === 'savings')?.balance ?? 0;
  const investments = finalState.accounts.find((a) => a.type === 'investment')?.balance ?? 0;
  const netWorth = Math.round(checking + savings + investments);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <div className={styles.badge}>Simulation Complete</div>
        <h2>Nice run! 🎉</h2>
        <p className={styles.subtitle}>
          You wrapped {completedDays} days (planned {plannedDays}). Take the insights further or queue
          up another story run.
        </p>

        <div className={styles.stats}>
          <div>
            <span>❤️ Health</span>
            <strong>{finalState.health}/100</strong>
          </div>
          <div>
            <span>📅 Months Played</span>
            <strong>M{finalState.monthsPlayed}</strong>
          </div>
          <div>
            <span>💼 Net Worth</span>
            <strong>${netWorth.toLocaleString()}</strong>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onRestart}>
            Start another simulation
          </button>
          <button type="button" className={styles.primary} onClick={onInvesting}>
            Try Investing District →
          </button>
        </div>
      </div>
    </div>
  );
};
