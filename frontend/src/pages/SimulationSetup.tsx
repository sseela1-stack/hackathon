import React, { useState } from 'react';
import '../styles/SimulationSetup.css';

interface SimulationSetupProps {
  onStart: (days: number) => void;
  onBack: () => void;
}

const SimulationSetup: React.FC<SimulationSetupProps> = ({ onStart, onBack }) => {
  const [days, setDays] = useState<number>(30);
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (days < 1) {
      setError('Please enter at least 1 day');
      return;
    }

    if (days > 365) {
      setError('Maximum 365 days allowed');
      return;
    }

    onStart(days);
  };

  const presetDays = [7, 14, 30, 60, 90];

  return (
    <div className="simulation-setup">
      <div className="simulation-setup-container">
        <h1 className="simulation-title">Financial Simulation</h1>
        <p className="simulation-subtitle">
          Test your financial skills by simulating real-world scenarios
        </p>

        <form onSubmit={handleSubmit} className="simulation-form">
          <div className="form-group">
            <label htmlFor="days-input" className="form-label">
              How many days do you want to simulate?
            </label>

            <input
              id="days-input"
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={(e) => {
                setDays(parseInt(e.target.value) || 0);
                setError('');
              }}
              className="days-input"
              placeholder="Enter number of days"
            />

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="preset-buttons">
            <p className="preset-label">Quick select:</p>
            <div className="preset-grid">
              {presetDays.map((presetDay) => (
                <button
                  key={presetDay}
                  type="button"
                  onClick={() => {
                    setDays(presetDay);
                    setError('');
                  }}
                  className={`preset-button ${days === presetDay ? 'active' : ''}`}
                >
                  {presetDay} days
                </button>
              ))}
            </div>
          </div>

          <div className="info-box">
            <h3>What to expect:</h3>
            <ul>
              <li>Real-world financial scenarios (bills, expenses, income)</li>
              <li>Make decisions that impact your health score</li>
              <li>Build emergency funds and manage cash flow</li>
              <li>Earn achievements for smart financial choices</li>
              <li>See your playbook summary at the end</li>
            </ul>
          </div>

          <div className="action-buttons">
            <button type="button" onClick={onBack} className="back-button">
              ← Back
            </button>
            <button type="submit" className="start-button">
              Start Simulation →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimulationSetup;
