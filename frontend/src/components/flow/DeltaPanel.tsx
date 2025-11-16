/**
 * Delta Panel - Before/after preview for choices
 */

import styles from './DeltaPanel.module.css';

export interface DeltaPreview {
  health: number;
  happiness: number;
  savings: number;
}

interface DeltaPanelProps {
  current: {
    health: number;
    happiness: number;
    savings: number;
  };
  delta: DeltaPreview;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeltaPanel({ current, delta, onConfirm, onCancel }: DeltaPanelProps) {
  const stats = [
    { label: 'Health', key: 'health' as const, icon: '❤️', color: '#e74c3c' },
    { label: 'Happiness', key: 'happiness' as const, icon: '😊', color: '#f39c12' },
    { label: 'Savings', key: 'savings' as const, icon: '💰', color: '#27ae60' },
  ];

  const formatDelta = (value: number): string => {
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  const getDeltaClass = (value: number): string => {
    if (value > 0) return styles.positive;
    if (value < 0) return styles.negative;
    return styles.neutral;
  };

  return (
    <div className={styles.overlay} role="dialog" aria-label="Choice preview">
      <div className={styles.panel}>
        <h3 className={styles.title}>Preview Impact</h3>
        
        <div className={styles.stats}>
          {stats.map(stat => {
            const currentValue = current[stat.key];
            const deltaValue = delta[stat.key];
            const newValue = currentValue + deltaValue;

            return (
              <div key={stat.key} className={styles.stat}>
                <div className={styles.statHeader}>
                  <span className={styles.icon}>{stat.icon}</span>
                  <span className={styles.label}>{stat.label}</span>
                </div>
                
                <div className={styles.comparison}>
                  <div className={styles.before}>
                    <span className={styles.value}>{currentValue}</span>
                    <span className={styles.sublabel}>Current</span>
                  </div>

                  <div className={styles.arrow} aria-hidden="true">→</div>

                  <div className={styles.after}>
                    <span className={`${styles.value} ${getDeltaClass(deltaValue)}`}>
                      {newValue}
                    </span>
                    <span className={styles.sublabel}>
                      {formatDelta(deltaValue)}
                    </span>
                  </div>
                </div>

                {/* Visual bar */}
                <div className={styles.bar}>
                  <div 
                    className={styles.barFill}
                    style={{
                      width: `${Math.min(100, Math.max(0, currentValue))}%`,
                      background: stat.color,
                    }}
                  />
                  <div 
                    className={`${styles.barDelta} ${getDeltaClass(deltaValue)}`}
                    style={{
                      left: `${Math.min(100, Math.max(0, currentValue))}%`,
                      width: `${Math.abs(deltaValue)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.cancelButton} 
            onClick={onCancel}
            aria-label="Cancel choice"
          >
            Cancel
          </button>
          <button 
            className={styles.confirmButton} 
            onClick={onConfirm}
            aria-label="Confirm choice"
          >
            Confirm Choice
          </button>
        </div>
      </div>
    </div>
  );
}
