import React, { useState, useRef, useEffect } from 'react';
import { Choice } from '../types/game';

interface ChoicePanelProps {
  choices: Choice[];
  onChoiceSelect: (choiceId: string) => void;
  disabled?: boolean;
}

/**
 * Choice Panel - Displays choice buttons for the player
 * Features: keyboard navigation (Arrow Up/Down + Enter), ARIA accessibility, visual feedback
 */
const ChoicePanel: React.FC<ChoicePanelProps> = ({ choices, onChoiceSelect, disabled = false }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset refs array when choices change
  useEffect(() => {
    choiceRefs.current = choiceRefs.current.slice(0, choices.length);
  }, [choices.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev + 1) % choices.length;
          choiceRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev - 1 + choices.length) % choices.length;
          choiceRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const choice = choices[selectedIndex];
        if (choice) {
          setPressedId(choice.id);
          onChoiceSelect(choice.id);
        }
        break;
    }
  };

  const handleClick = (choiceId: string, index: number) => {
    if (disabled) return;
    setSelectedIndex(index);
    setPressedId(choiceId);
    onChoiceSelect(choiceId);
  };

  const formatDelta = (value: number, prefix: string = ''): string => {
    if (value === 0) return '';
    const sign = value > 0 ? '+' : '';
    return `${sign}${prefix}${value}`;
  };

  return (
    <div 
      className="choice-panel" 
      style={styles.container}
      role="radiogroup"
      aria-label="Available choices"
      onKeyDown={handleKeyDown}
      id="choice-panel"
    >
      <h3 style={styles.heading}>What will you do?</h3>
      <div style={styles.choicesContainer}>
        {choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isPressed = pressedId === choice.id;
          const label = choice.label || choice.text || 'Choose';
          
          return (
            <button
              key={choice.id}
              ref={(el) => (choiceRefs.current[index] = el)}
              data-testid={`choice-${index}`}
              role="radio"
              aria-checked={isPressed}
              aria-pressed={isPressed}
              aria-disabled={disabled}
              style={{
                ...styles.choiceButton,
                ...(disabled && styles.choiceButtonDisabled),
                ...(isSelected && !disabled && styles.choiceButtonFocused),
                ...(isPressed && styles.choiceButtonPressed),
              }}
              onClick={() => handleClick(choice.id, index)}
              disabled={disabled}
              tabIndex={isSelected ? 0 : -1}
            >
              <div style={styles.choiceLabel}>{label}</div>
              
              {choice.consequences && (
                <div style={styles.consequencesPreview}>
                  {choice.consequences.bankDelta !== 0 && (
                    <span style={styles.deltaTag}>
                      💵 {formatDelta(choice.consequences.bankDelta, '$')}
                    </span>
                  )}
                  {choice.consequences.savingsDelta !== 0 && (
                    <span style={styles.deltaTag}>
                      🏦 {formatDelta(choice.consequences.savingsDelta, '$')}
                    </span>
                  )}
                  {choice.consequences.investDelta !== 0 && (
                    <span style={styles.deltaTag}>
                      📈 {formatDelta(choice.consequences.investDelta, '$')}
                    </span>
                  )}
                  {choice.consequences.healthDelta !== 0 && (
                    <span style={{
                      ...styles.deltaTag,
                      color: choice.consequences.healthDelta > 0 ? '#4CAF50' : '#F44336',
                    }}>
                      ❤️ {formatDelta(choice.consequences.healthDelta)}
                    </span>
                  )}
                </div>
              )}
              
              {choice.consequences?.notes && (
                <div style={styles.choiceNotes}>{choice.consequences.notes}</div>
              )}
              
              {choice.relatedAgent && (
                <div style={styles.agentTag}>
                  💡 {getAgentDisplayName(choice.relatedAgent)}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div style={styles.hint}>Use ↑↓ arrow keys to navigate, Enter to select</div>
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
    marginBottom: '10px',
  },
  choiceButton: {
    padding: '16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: '2px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    minHeight: '48px', // Touch target
    outline: 'none',
  },
  choiceButtonFocused: {
    backgroundColor: '#1976D2',
    borderColor: '#FFD700',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
  choiceButtonPressed: {
    backgroundColor: '#1565C0',
    borderColor: '#4CAF50',
    transform: 'scale(0.98)',
  },
  choiceButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  choiceLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  consequencesPreview: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px',
  },
  deltaTag: {
    fontSize: '13px',
    padding: '3px 8px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    fontWeight: '600',
  },
  choiceNotes: {
    fontSize: '13px',
    opacity: 0.9,
    marginBottom: '6px',
    lineHeight: '1.4',
  },
  agentTag: {
    fontSize: '12px',
    opacity: 0.85,
    marginTop: '6px',
    fontStyle: 'italic',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '8px',
  },
};

export default ChoicePanel;
