import React, { useState, useEffect } from 'react';
import { GameState, Mood } from '../types/game';
import { getGameState, postChoice } from '../api/gameApi';
import { getMentorMessage } from '../api/agentApi';
import HUDPanel from '../components/HUDPanel';
import DialoguePanel from '../components/DialoguePanel';
import ChoicePanel from '../components/ChoicePanel';
import MoodSelector from '../components/MoodSelector';

/**
 * Main Game Screen
 */
const GameScreen: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentMood, setCurrentMood] = useState<Mood>('okay');
  const [agentMessage, setAgentMessage] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load game state on mount
  useEffect(() => {
    loadGameState();
    loadMentorMessage();
  }, []);

  const loadGameState = async () => {
    try {
      setIsLoading(true);
      const state = await getGameState();
      setGameState(state);
      setCurrentMood(state.mood);
      setError(null);
    } catch (err) {
      setError('Failed to load game state. Please make sure the backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMentorMessage = async () => {
    try {
      const message = await getMentorMessage();
      setAgentMessage(message);
    } catch (err) {
      console.error('Failed to load mentor message:', err);
    }
  };

  const handleChoiceSelect = async (choiceId: string) => {
    if (!gameState || !gameState.currentEvent) return;

    try {
      setIsLoading(true);
      const updatedState = await postChoice({
        eventId: gameState.currentEvent.id,
        choiceId,
        mood: currentMood,
      });
      setGameState(updatedState);
      setCurrentMood(updatedState.mood);
      
      // Reload mentor message for new event
      loadMentorMessage();
      setError(null);
    } catch (err) {
      setError('Failed to process choice. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodChange = (mood: Mood) => {
    setCurrentMood(mood);
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>⚠️ Error</h2>
        <p style={styles.errorMessage}>{error}</p>
        <button style={styles.retryButton} onClick={loadGameState}>
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && !gameState) {
    return (
      <div style={styles.loadingContainer}>
        <h2>Loading FinQuest...</h2>
      </div>
    );
  }

  if (!gameState || !gameState.currentEvent) {
    return (
      <div style={styles.loadingContainer}>
        <h2>No game data available</h2>
      </div>
    );
  }

  return (
    <div className="game-screen" style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>💰 FinQuest</h1>
      </header>

      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <HUDPanel user={gameState.user} />
          <MoodSelector currentMood={currentMood} onMoodChange={handleMoodChange} />
        </div>

        <div style={styles.centerPanel}>
          <div style={styles.eventCard}>
            <h2 style={styles.eventTitle}>{gameState.currentEvent.title}</h2>
            <p style={styles.eventDescription}>{gameState.currentEvent.description}</p>
          </div>

          <DialoguePanel agentName="mentor" message={agentMessage} />

          <ChoicePanel
            choices={gameState.currentEvent.choices}
            onChoiceSelect={handleChoiceSelect}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#2196F3',
    margin: 0,
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  centerPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderTop: '4px solid #FF9800',
  },
  eventTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginTop: 0,
    marginBottom: '15px',
  },
  eventDescription: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#555',
    margin: 0,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '20px',
    color: '#666',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
  },
  errorTitle: {
    fontSize: '32px',
    color: '#F44336',
    marginBottom: '10px',
  },
  errorMessage: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '20px',
    textAlign: 'center',
  },
  retryButton: {
    padding: '12px 30px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default GameScreen;
