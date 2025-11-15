import React from 'react';
import { MoneyPlaybook } from '../types/game';

interface MoneyPlaybookViewProps {
  playbook: MoneyPlaybook;
  onClose: () => void;
}

/**
 * Money Playbook View - End-of-session summary
 */
const MoneyPlaybookView: React.FC<MoneyPlaybookViewProps> = ({ playbook, onClose }) => {
  return (
    <div className="money-playbook-view" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Your Money Playbook</h2>
        <button style={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      <div style={styles.summary}>
        <h3 style={styles.sectionTitle}>Session Summary</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Days</div>
            <div style={styles.statValue}>{playbook.totalDays}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Income</div>
            <div style={styles.statValue}>${playbook.totalIncome}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Spending</div>
            <div style={styles.statValue}>${playbook.totalSpending}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Saved</div>
            <div style={styles.statValue}>${playbook.totalSaved}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Invested</div>
            <div style={styles.statValue}>${playbook.totalInvested}</div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Key Decisions</h3>
        <div style={styles.decisionsList}>
          {playbook.keyDecisions.map((decision, index) => (
            <div key={index} style={styles.decisionCard}>
              <div style={styles.decisionDay}>Day {decision.day}</div>
              <div style={styles.decisionEvent}>{decision.event}</div>
              <div style={styles.decisionChoice}>Your choice: {decision.choice}</div>
              <div style={styles.decisionOutcome}>Outcome: {decision.outcome}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Insights & Recommendations</h3>
        <div style={styles.insightsList}>
          {playbook.insights.map((insight, index) => (
            <div key={index} style={styles.insightCard}>
              <span style={styles.insightIcon}>💡</span>
              <span style={styles.insightText}>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.footer}>
        <button style={styles.continueButton} onClick={onClose}>
          Continue Playing
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    maxWidth: '800px',
    margin: '0 auto',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
  },
  summary: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  section: {
    padding: '20px',
  },
  decisionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  decisionCard: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    borderLeft: '4px solid #2196F3',
  },
  decisionDay: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: '5px',
  },
  decisionEvent: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  decisionChoice: {
    fontSize: '13px',
    color: '#555',
    marginBottom: '3px',
  },
  decisionOutcome: {
    fontSize: '13px',
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  insightCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '8px',
    borderLeft: '4px solid #FFC107',
  },
  insightIcon: {
    fontSize: '20px',
  },
  insightText: {
    fontSize: '14px',
    color: '#333',
    flex: 1,
  },
  footer: {
    padding: '20px',
    borderTop: '2px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'center',
  },
  continueButton: {
    padding: '12px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};

export default MoneyPlaybookView;
