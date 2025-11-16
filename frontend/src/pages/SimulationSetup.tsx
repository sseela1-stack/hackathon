import React, { useState } from 'react';
import styles from './SimulationSetup.module.css';

interface SimulationSetupProps {
  profileName?: string;
  onStart: (days: number) => void;
}

const MIN_DAYS = 5;
const MAX_DAYS = 30;
const QUICK_PRESETS = [5, 10, 15, 21, 30];

export const SimulationSetup: React.FC<SimulationSetupProps> = ({
  profileName = 'Explorer',
  onStart,
}) => {
  const [days, setDays] = useState<number>(15);

  const handleDaysChange = (value: number) => {
    setDays(value);
  };

  const handleStart = () => {
    if (days >= MIN_DAYS) {
      onStart(days);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>
        <div className={styles.panelScroll}>
          <div className={styles.header}>
            <div className={styles.badge}>Simulation Prep</div>
            <h1>
              Ready, {profileName}?<br />
              <span>Choose how many days to run.</span>
            </h1>
            <p>
              You&apos;ll experience new scenarios, track progress, and get mentor guidance for the
              amount of time you pick. Each day is a fresh financial story.
            </p>
          </div>

          <div className={styles.selector}>
            <div className={styles.selectorHeader}>
              <span>Simulation length</span>
              <span className={styles.selectorValue}>{days} days</span>
            </div>
            <input
              type="range"
              min={MIN_DAYS}
              max={MAX_DAYS}
              value={days}
              onChange={(event) => handleDaysChange(Number(event.target.value))}
              className={styles.slider}
            />
            <div className={styles.tickLabels}>
              <span>{MIN_DAYS} days</span>
              <span>{MAX_DAYS} days</span>
            </div>

            <div className={styles.quickPills}>
              {QUICK_PRESETS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.pill} ${days === value ? styles.pillActive : ''}`}
                  onClick={() => handleDaysChange(value)}
                >
                  {value}d
                </button>
              ))}
            </div>
          </div>

          <div className={styles.features}>
            <div>
              <span>💡</span>
              <p>Scenario cards adapt to your choices and mood.</p>
            </div>
            <div>
              <span>📊</span>
              <p>Progress + mentor view stay in sync during the run.</p>
            </div>
            <div>
              <span>🏁</span>
              <p>Wrap-up gives you options to replay or invest.</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.startButton}
          onClick={handleStart}
        >
          Launch Simulation →
        </button>
      </div>
    </div>
  );
};
