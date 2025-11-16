import React from 'react';
import '../styles/SimulationPlaybook.css';

interface PlaybookData {
  playbookPoints: number;
  totalDays: number;
  hud: {
    health: number;
    trophies: {
      earned: number;
      total: number;
    };
    accounts: {
      checking: number;
      savings: number;
      investments: number;
    };
  };
  balance: number;
  history?: any[];
}

interface SimulationPlaybookProps {
  data: PlaybookData;
  onClose: () => void;
  onRestart: () => void;
}

const SimulationPlaybook: React.FC<SimulationPlaybookProps> = ({ data, onClose, onRestart }) => {
  const { playbookPoints, totalDays, hud, balance } = data;

  const getGrade = (points: number): { letter: string; color: string; message: string } => {
    if (points >= 90) return { letter: 'A+', color: '#4caf50', message: 'Outstanding!' };
    if (points >= 80) return { letter: 'A', color: '#66bb6a', message: 'Excellent!' };
    if (points >= 70) return { letter: 'B', color: '#9ccc65', message: 'Great job!' };
    if (points >= 60) return { letter: 'C', color: '#ffca28', message: 'Good effort!' };
    if (points >= 50) return { letter: 'D', color: '#ffa726', message: 'Keep trying!' };
    return { letter: 'F', color: '#ef5350', message: 'Try again!' };
  };

  const grade = getGrade(playbookPoints);
  const totalSavings = (hud?.accounts?.savings || 0) + (hud?.accounts?.investments || 0);

  return (
    <div className="simulation-playbook">
      <div className="playbook-container">
        <div className="playbook-header">
          <h1 className="playbook-title">Simulation Complete!</h1>
          <p className="playbook-subtitle">
            You completed {totalDays} days of financial decisions
          </p>
        </div>

        {/* Grade */}
        <div className="grade-section" style={{ borderColor: grade.color }}>
          <div className="grade-circle" style={{ borderColor: grade.color }}>
            <div className="grade-letter" style={{ color: grade.color }}>
              {grade.letter}
            </div>
            <div className="grade-points">{playbookPoints} pts</div>
          </div>
          <div className="grade-message" style={{ color: grade.color }}>
            {grade.message}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💚</div>
            <div className="stat-label">Final Health</div>
            <div className="stat-value" style={{ color: hud?.health > 70 ? '#4caf50' : hud?.health > 40 ? '#ff9800' : '#f44336' }}>
              {hud?.health?.toFixed(1) || '0.0'}
            </div>
            <div className="stat-max">/ 100</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-label">Achievements</div>
            <div className="stat-value">
              {hud?.trophies?.earned || 0}
            </div>
            <div className="stat-max">/ {hud?.trophies?.total || 5}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Final Balance</div>
            <div className="stat-value" style={{ color: balance >= 0 ? '#4caf50' : '#f44336' }}>
              ${Math.abs(balance).toFixed(2)}
            </div>
            <div className="stat-max">{balance >= 0 ? 'positive' : 'negative'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏦</div>
            <div className="stat-label">Total Savings</div>
            <div className="stat-value" style={{ color: '#667eea' }}>
              ${totalSavings.toFixed(2)}
            </div>
            <div className="stat-max">saved + invested</div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="breakdown-section">
          <h3>Account Breakdown</h3>
          <div className="account-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Checking</span>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar"
                  style={{
                    width: `${Math.min(100, Math.abs(hud?.accounts?.checking || 0) / 50)}%`,
                    backgroundColor: '#667eea',
                  }}
                ></div>
              </div>
              <span className="breakdown-value">${(hud?.accounts?.checking || 0).toFixed(2)}</span>
            </div>

            <div className="breakdown-item">
              <span className="breakdown-label">Savings</span>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar"
                  style={{
                    width: `${Math.min(100, Math.abs(hud?.accounts?.savings || 0) / 50)}%`,
                    backgroundColor: '#4caf50',
                  }}
                ></div>
              </div>
              <span className="breakdown-value">${(hud?.accounts?.savings || 0).toFixed(2)}</span>
            </div>

            <div className="breakdown-item">
              <span className="breakdown-label">Investments</span>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar"
                  style={{
                    width: `${Math.min(100, Math.abs(hud?.accounts?.investments || 0) / 50)}%`,
                    backgroundColor: '#f39c12',
                  }}
                ></div>
              </div>
              <span className="breakdown-value">${(hud?.accounts?.investments || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="insights-section">
          <h3>Key Insights</h3>
          <ul className="insights-list">
            {hud?.health > 70 && (
              <li className="insight positive">
                <span className="insight-icon">✓</span>
                You maintained excellent financial health!
              </li>
            )}
            {hud?.health <= 40 && (
              <li className="insight negative">
                <span className="insight-icon">!</span>
                Your health score needs improvement. Focus on building an emergency fund.
              </li>
            )}
            {totalSavings >= 500 && (
              <li className="insight positive">
                <span className="insight-icon">✓</span>
                Great job building savings and investments!
              </li>
            )}
            {totalSavings < 500 && (
              <li className="insight warning">
                <span className="insight-icon">→</span>
                Try to save more for emergencies in your next simulation.
              </li>
            )}
            {(hud?.trophies?.earned || 0) === (hud?.trophies?.total || 5) && (
              <li className="insight positive">
                <span className="insight-icon">✓</span>
                Perfect! You unlocked all achievements!
              </li>
            )}
            {balance < 0 && (
              <li className="insight negative">
                <span className="insight-icon">!</span>
                You ended with a negative balance. Review your spending choices.
              </li>
            )}
            {balance >= 0 && balance < 100 && (
              <li className="insight warning">
                <span className="insight-icon">→</span>
                Your balance is low. Build a buffer for unexpected expenses.
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="playbook-actions">
          <button onClick={onRestart} className="action-button restart-button">
            🔄 Try Again
          </button>
          <button onClick={onClose} className="action-button close-button">
            ← Back to Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationPlaybook;
