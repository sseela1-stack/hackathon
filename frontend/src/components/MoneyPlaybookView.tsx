import React from 'react';
import { MoneyPlaybook } from '../types/game';
import styles from './MoneyPlaybookView.module.css';

interface MoneyPlaybookViewProps {
  playbook: MoneyPlaybook;
  onClose: () => void;
}

/**
 * Money Playbook View - Personalized financial insights
 * Displays behavioral patterns, actionable tips, and key statistics
 */
const MoneyPlaybookView: React.FC<MoneyPlaybookViewProps> = ({ playbook, onClose }) => {
  return (
    <div className={styles.container} role="dialog" aria-labelledby="playbook-title">
      <div className={styles.header}>
        <h2 id="playbook-title" className={styles.title}>📊 Your Money Playbook</h2>
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Close playbook"
        >
          ✕
        </button>
      </div>

      {/* Behavioral Patterns Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🔍</span>
          Your Patterns
        </h3>
        <ul className={styles.patternsList} role="list">
          {playbook.patterns.map((pattern, index) => (
            <li key={index} className={styles.patternItem}>
              <span className={styles.patternIcon}>📌</span>
              <span className={styles.patternText}>{pattern}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Actionable Tips Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>💡</span>
          Micro-Tips
        </h3>
        <ul className={styles.tipsList} role="list">
          {playbook.tips.map((tip, index) => (
            <li key={index} className={styles.tipItem}>
              <span className={styles.tipIcon}>✨</span>
              <span className={styles.tipText}>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Statistics Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📈</span>
          Your Stats
        </h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statLabel}>Bills On Time</div>
            <div className={styles.statValue}>{playbook.stats.onTimeBillsPct}%</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statLabel}>Savings Rate</div>
            <div className={styles.statValue}>{playbook.stats.avgSavingsRate}%</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💳</div>
            <div className={styles.statLabel}>Max Debt</div>
            <div className={styles.statValue}>${playbook.stats.maxDebt}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🆘</div>
            <div className={styles.statLabel}>Crisis Handled</div>
            <div className={styles.statValue}>{playbook.stats.crisisHandled}</div>
          </div>
        </div>
      </section>

      <div className={styles.footer}>
        <button className={styles.continueButton} onClick={onClose}>
          Continue Playing
        </button>
      </div>
    </div>
  );
};

export default MoneyPlaybookView;
