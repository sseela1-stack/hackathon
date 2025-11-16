import React, { useState, useEffect } from 'react';
import '../styles/SimulationGame.css';

interface Account {
  checking: number;
  savings: number;
  investments: number;
}

interface HUD {
  month: number;
  day_in_month: number;
  health: number;
  trophies: {
    earned: number;
    total: number;
  };
  accounts: Account;
}

interface Choice {
  code: string;
  label: string;
  amount_now: number;
  triggers?: any[];
  effects?: any;
}

interface Offer {
  offer_id: string;
  day: number;
  scenario_id: string;
  name: string;
  type: string;
  tags: string[];
  deterministic: boolean;
  proposed_amount: number;
  probability: number;
  prob_details: any;
  options: Choice[];
}

interface CommittedEvent {
  id: string;
  day: number;
  scenario_id: string;
  name: string;
  type: string;
  amount: number;
  chosen_option: string;
  chosen_label: string;
}

interface SimulationGameProps {
  totalDays: number;
  onComplete: (playbook: any) => void;
  onBack: () => void;
}

const SimulationGame: React.FC<SimulationGameProps> = ({ totalDays, onComplete, onBack }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [hud, setHud] = useState<HUD | null>(null);
  const [balance, setBalance] = useState<number>(1500);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [lastCommitted, setLastCommitted] = useState<CommittedEvent[]>([]);
  const [showDayResults, setShowDayResults] = useState<boolean>(false);

  // Initialize simulation
  useEffect(() => {
    startSimulation();
  }, []);

  const startSimulation = async () => {
    try {
      setLoading(true);

      // Get profile from localStorage
      const savedProfile = localStorage.getItem('finquest_profile');
      let profile = { role: 'earlyCareer', difficulty: 'normal', name: 'Player' };

      if (savedProfile) {
        try {
          profile = JSON.parse(savedProfile);
        } catch (e) {
          console.error('Failed to parse profile');
        }
      }

      // Map role to segment_key
      const segmentMap: Record<string, string> = {
        'student': 'student_independent',
        'earlyCareer': 'early_career',
        'midCareer': 'mid_career',
      };

      const segment_key = segmentMap[profile.role] || 'early_career';

      // Start simulation session
      const response = await fetch('/api/simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          segment_key,
          mood: 'optimistic',
          pay_type: 'biweekly',
          pay_start_day: 1,
          pay_amount: profile.role === 'student' ? 1000 : profile.role === 'earlyCareer' ? 2500 : 4000,
          base_balance: 1500,
          predispositions: {},
        }),
      });

      const data = await response.json();
      setSessionId(data.session_id);
      setCurrentDay(data.day);
      setOffers(data.offers);
      setHud(data.hud);
      setBalance(data.balance);

      // Initialize choices for all offers
      const initialChoices: Record<string, string> = {};
      data.offers.forEach((offer: Offer) => {
        initialChoices[offer.offer_id] = offer.options[0].code;
      });
      setChoices(initialChoices);
    } catch (error) {
      console.error('Failed to start simulation:', error);
      alert('Failed to start simulation. Please try again.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleChoiceChange = (offerId: string, choiceCode: string) => {
    setChoices((prev) => ({
      ...prev,
      [offerId]: choiceCode,
    }));
  };

  const handleSubmitDay = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const response = await fetch('/api/simulation/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          choices,
        }),
      });

      const data = await response.json();
      setLastCommitted(data.committed);
      setBalance(data.balance);
      setCurrentDay(data.day);
      setHud(data.hud);
      setOffers(data.next_offers);
      setShowDayResults(true);

      // Reset choices for next day
      const initialChoices: Record<string, string> = {};
      data.next_offers.forEach((offer: Offer) => {
        initialChoices[offer.offer_id] = offer.options[0].code;
      });
      setChoices(initialChoices);
    } catch (error) {
      console.error('Failed to commit day:', error);
      alert('Failed to submit choices. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    setShowDayResults(false);

    // Check if simulation is complete
    if (currentDay > totalDays) {
      fetchPlaybookAndComplete();
    }
  };

  const fetchPlaybookAndComplete = async () => {
    try {
      const response = await fetch(`/api/simulation/state?session_id=${sessionId}`);
      const data = await response.json();

      // Calculate playbook points
      const playbookPoints = calculatePlaybookPoints(data);

      onComplete({
        ...data,
        playbookPoints,
        totalDays,
      });
    } catch (error) {
      console.error('Failed to fetch playbook:', error);
      onComplete({
        playbookPoints: 0,
        totalDays,
        hud,
      });
    }
  };

  const calculatePlaybookPoints = (state: any): number => {
    let points = 0;

    // Health score points (0-50 points)
    if (state.hud?.health) {
      points += Math.round(state.hud.health / 2);
    }

    // Achievement points (10 points each)
    if (state.hud?.trophies) {
      points += state.hud.trophies.earned * 10;
    }

    // Savings/investment points (0-30 points)
    if (state.hud?.accounts) {
      const totalSavings = (state.hud.accounts.savings || 0) + (state.hud.accounts.investments || 0);
      points += Math.min(30, Math.round(totalSavings / 100));
    }

    // Positive balance bonus (20 points)
    if (state.balance > 0) {
      points += 20;
    }

    return Math.round(points);
  };

  if (loading) {
    return (
      <div className="simulation-game loading">
        <div className="loading-spinner"></div>
        <p>Starting simulation...</p>
      </div>
    );
  }

  if (showDayResults) {
    return (
      <div className="simulation-game day-results">
        <div className="day-results-container">
          <h2>Day {currentDay - 1} Results</h2>

          <div className="committed-events">
            {lastCommitted.map((event, index) => (
              <div
                key={index}
                className={`event-card ${event.amount >= 0 ? 'positive' : 'negative'}`}
              >
                <div className="event-header">
                  <span className="event-name">{event.name}</span>
                  <span className={`event-amount ${event.amount >= 0 ? 'income' : 'expense'}`}>
                    {event.amount >= 0 ? '+' : ''}${Math.abs(event.amount).toFixed(2)}
                  </span>
                </div>
                <div className="event-choice">{event.chosen_label}</div>
              </div>
            ))}
          </div>

          {hud && (
            <div className="day-summary">
              <div className="summary-item">
                <span>Health Score</span>
                <span className="health-value">{hud.health.toFixed(1)}</span>
              </div>
              <div className="summary-item">
                <span>Balance</span>
                <span className={balance >= 0 ? 'positive' : 'negative'}>
                  ${balance.toFixed(2)}
                </span>
              </div>
              <div className="summary-item">
                <span>Achievements</span>
                <span>{hud.trophies.earned} / {hud.trophies.total}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            className="continue-button"
          >
            {currentDay > totalDays ? 'View Playbook →' : `Continue to Day ${currentDay} →`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="simulation-game">
      {/* HUD */}
      {hud && (
        <div className="sim-hud">
          <div className="hud-top">
            <div className="day-counter">
              Day {currentDay} / {totalDays}
            </div>
            <div className="month-info">
              Month {hud.month}, Day {hud.day_in_month}
            </div>
          </div>

          <div className="hud-accounts">
            <div className="account-item">
              <span className="account-label">Checking</span>
              <span className="account-value">${hud.accounts.checking.toFixed(2)}</span>
            </div>
            <div className="account-item">
              <span className="account-label">Savings</span>
              <span className="account-value">${hud.accounts.savings.toFixed(2)}</span>
            </div>
            <div className="account-item">
              <span className="account-label">Investments</span>
              <span className="account-value">${hud.accounts.investments.toFixed(2)}</span>
            </div>
          </div>

          <div className="hud-bottom">
            <div className="health-bar">
              <span className="health-label">Health</span>
              <div className="health-bar-container">
                <div
                  className="health-bar-fill"
                  style={{
                    width: `${hud.health}%`,
                    backgroundColor: hud.health > 70 ? '#4caf50' : hud.health > 40 ? '#ff9800' : '#f44336',
                  }}
                ></div>
              </div>
              <span className="health-value">{hud.health.toFixed(1)}</span>
            </div>
            <div className="trophies">
              🏆 {hud.trophies.earned} / {hud.trophies.total}
            </div>
          </div>
        </div>
      )}

      {/* Offers */}
      <div className="offers-container">
        <h2 className="offers-title">Today's Decisions</h2>

        {offers.map((offer) => (
          <div key={offer.offer_id} className={`offer-card offer-type-${offer.type}`}>
            <div className="offer-header">
              <h3 className="offer-name">{offer.name}</h3>
              <span className={`offer-amount ${offer.proposed_amount >= 0 ? 'income' : 'expense'}`}>
                {offer.proposed_amount >= 0 ? '+' : ''}${Math.abs(offer.proposed_amount).toFixed(2)}
              </span>
            </div>

            <div className="offer-tags">
              {offer.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="offer-choices">
              {offer.options.map((option) => (
                <label
                  key={option.code}
                  className={`choice-option ${choices[offer.offer_id] === option.code ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={offer.offer_id}
                    value={option.code}
                    checked={choices[offer.offer_id] === option.code}
                    onChange={() => handleChoiceChange(offer.offer_id, option.code)}
                  />
                  <div className="choice-content">
                    <span className="choice-label">{option.label}</span>
                    <span className={`choice-amount ${option.amount_now >= 0 ? 'income' : 'expense'}`}>
                      {option.amount_now >= 0 ? '+' : ''}${Math.abs(option.amount_now).toFixed(2)}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="actions-container">
        <button onClick={onBack} className="action-button back-button" disabled={submitting}>
          ← Exit
        </button>
        <button
          onClick={handleSubmitDay}
          className="action-button submit-button"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Decisions →'}
        </button>
      </div>
    </div>
  );
};

export default SimulationGame;
