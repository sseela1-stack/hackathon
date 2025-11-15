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
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  heading: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#666',
  },
  moodsContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'space-between',
  },
  moodButton: {
    flex: 1,
    padding: '12px 8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
  },
  emoji: {
    fontSize: '24px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
  },
};

export default MoodSelector;
