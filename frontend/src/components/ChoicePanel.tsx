import React from 'react';
import { Choice } from '../types/game';

interface ChoicePanelProps {
  choices: Choice[];
  onChoiceSelect: (choiceId: string) => void;
  disabled?: boolean;
}

/**
 * Choice Panel - Displays choice buttons for the player
 */
const ChoicePanel: React.FC<ChoicePanelProps> = ({ choices, onChoiceSelect, disabled = false }) => {
  return (
    <div className="choice-panel" style={styles.container}>
      <h3 style={styles.heading}>What will you do?</h3>
      <div style={styles.choicesContainer}>
        {choices.map((choice) => (
          <button
            key={choice.id}
            style={styles.choiceButton}
            onClick={() => onChoiceSelect(choice.id)}
            disabled={disabled}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#1976D2';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = disabled ? '#ccc' : '#2196F3';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={styles.choiceText}>{choice.text}</div>
            <div style={styles.choiceDescription}>{choice.description}</div>
            {choice.relatedAgent && (
              <div style={styles.agentTag}>
                Recommended by: {getAgentDisplayName(choice.relatedAgent)}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const getAgentDisplayName = (agentType: string): string => {
  const displayNames: { [key: string]: string } = {
    mentor: 'Mentor',
    spenderSam: 'Spender Sam',
    saverSiya: 'Saver Siya',
    crisis: 'Crisis Alert',
    futureYou: 'Future You',
    translator: 'Translator',
  };
  return displayNames[agentType] || agentType;
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  heading: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  choicesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  choiceButton: {
    padding: '15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  choiceText: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  choiceDescription: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '8px',
  },
  agentTag: {
    fontSize: '12px',
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: '5px',
  },
};

export default ChoicePanel;
