import React from 'react';
import { Mood } from '../types/game';

interface MoodSelectorProps {
  currentMood: Mood;
  onMoodChange: (mood: Mood) => void;
}

/**
 * Mood Selector - Allows player to select their emotional state
 */
const MoodSelector: React.FC<MoodSelectorProps> = ({ currentMood, onMoodChange }) => {
  const moods: { value: Mood; label: string; emoji: string; color: string }[] = [
    { value: 'anxious', label: 'Anxious', emoji: '😰', color: '#F44336' },
    { value: 'okay', label: 'Okay', emoji: '😐', color: '#FFC107' },
    { value: 'confident', label: 'Confident', emoji: '😊', color: '#4CAF50' },
  ];

  return (
    <div className="mood-selector" style={styles.container}>
      <h4 style={styles.heading}>How are you feeling?</h4>
      <div style={styles.moodsContainer}>
        {moods.map((mood) => (
          <button
            key={mood.value}
            style={{
              ...styles.moodButton,
              backgroundColor: currentMood === mood.value ? mood.color : '#f0f0f0',
              color: currentMood === mood.value ? 'white' : '#333',
              border: currentMood === mood.value ? `2px solid ${mood.color}` : '2px solid #ddd',
            }}
            onClick={() => onMoodChange(mood.value)}
            onMouseEnter={(e) => {
              if (currentMood !== mood.value) {
                e.currentTarget.style.backgroundColor = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (currentMood !== mood.value) {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }
            }}
          >
            <span style={styles.emoji}>{mood.emoji}</span>
            <span style={styles.label}>{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: 'transparent',
    padding: '0',
    borderRadius: '0',
    boxShadow: 'none',
    flex: 1,
  },
  heading: {
    fontSize: '10px',
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#666',
    textAlign: 'center',
  },
  moodsContainer: {
    display: 'flex',
    gap: '4px',
    justifyContent: 'space-between',
  },
  moodButton: {
    flex: 1,
    padding: '6px 4px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  emoji: {
    fontSize: '18px',
  },
  label: {
    fontSize: '9px',
    fontWeight: '500',
  },
};

export default MoodSelector;
