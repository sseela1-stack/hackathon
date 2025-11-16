import React, { useState, useEffect } from 'react';
import { GameState, Mood, MoneyPlaybook } from '../types/game';
import { getGameState, postChoice, clearUiHints, updateMood, getPlaybook, postChatMessage } from '../api/gameApi';
import { getMentorMessage } from '../api/agentApi';
import HUDPanel from '../components/HUDPanel';
import DialoguePanel from '../components/DialoguePanel';
import MoodSelector from '../components/MoodSelector';
import ChoicePanel from '../components/ChoicePanel';
import CrisisBanner from '../components/CrisisBanner';
import MoneyPlaybookView from '../components/MoneyPlaybookView';
import { AchievementToast } from '../components/Achievements';
import { AppShell } from '../components/layout/AppShell';
import { usePrefetchOnIdle } from '../hooks/usePrefetch';
import { QuestTracker } from '../components/flow/QuestTracker';
import { FlowBeacons } from '../components/flow/FlowBeacons';
import { ProgressPath } from '../components/flow/ProgressPath';
import { ChatPanel } from '../components/ChatPanel';
import { getFlow, initializeFlow, complete as completeFlowStep } from '../flow/flowStore';
import { shouldShowBeacon, detectMilestones, shouldUnlockInvesting } from '../flow/flowEngine';
import { FlowState } from '../flow/flowTypes';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface GameScreenProps {
  onInvestingUnlocked?: (unlocked: boolean) => void;
  profileData?: { role: string; difficulty: string; name: string } | null;
}

/**
 * Main Game Screen
 */
const GameScreen: React.FC<GameScreenProps> = ({ onInvestingUnlocked, profileData }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [previousGameState, setPreviousGameState] = useState<GameState | null>(null);
  const [currentMood, setCurrentMood] = useState<Mood>('okay');
  const [agentMessage, setAgentMessage] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmittingChoice, setIsSubmittingChoice] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showPlaybook, setShowPlaybook] = useState<boolean>(false);
  const [playbook, setPlaybook] = useState<MoneyPlaybook | null>(null);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowState>(() => initializeFlow(0));
  const [showChat, setShowChat] = useState<boolean>(false);

  // Prefetch InvestingDistrict when health >= 55 (unlock threshold)
  const shouldPrefetch = gameState?.health ? gameState.health >= 55 : false;
  usePrefetchOnIdle(() => import('./InvestingDistrict'), shouldPrefetch);

  // Load game state on mount
  useEffect(() => {
    loadGameState();
    loadMentorMessage();
    
    // Initialize flow system
    const savedFlow = getFlow();
    if (savedFlow) {
      setFlow(savedFlow);
    }
  }, []);

  // Notify parent when investing unlocks
  useEffect(() => {
    if (gameState && onInvestingUnlocked) {
      onInvestingUnlocked(gameState.unlocked.investingDistrict);
    }
  }, [gameState?.unlocked.investingDistrict, onInvestingUnlocked]);

  const loadGameState = async () => {
    try {
      setIsLoading(true);
      setPreviousGameState(gameState);
      const state = await getGameState();
      setGameState(state);
      setCurrentMood(state.mood);
      setError(null);
      
      // Detect milestones and auto-complete quests
      if (previousGameState) {
        const milestones = detectMilestones(state, previousGameState);
        milestones.forEach(step => {
          completeFlowStep(step);
        });
        
        // Refresh flow state
        const updatedFlow = getFlow();
        if (updatedFlow) {
          setFlow(updatedFlow);
        }
      }
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

  const handleMoodChange = async (mood: Mood) => {
    const previousMood = currentMood;
    setCurrentMood(mood);
    
    try {
      // Update mood on backend
      await updateMood(mood);
      
      // Show toast notification
      showToast(`Mood changed to ${mood}. Future scenarios will reflect this.`, 'info');
    } catch (err: any) {
      console.error('Failed to update mood:', err);
      // Revert on error
      setCurrentMood(previousMood);
      showToast('Failed to update mood. Please try again.', 'error');
    }
  };

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleChoiceSelect = async (choiceId: string) => {
    if (!gameState?.lastScenario || isSubmittingChoice) return;

    try {
      setIsSubmittingChoice(true);
      
      const response = await postChoice({
        scenarioId: gameState.lastScenario.id,
        choiceId,
        mood: currentMood,
      });

      // Update game state
      setPreviousGameState(gameState);
      setGameState(response.state);
      
      // Detect milestones and auto-complete quests
      const milestones = detectMilestones(response.state, gameState);
      milestones.forEach(step => {
        completeFlowStep(step);
      });
      
      // Refresh flow state
      const updatedFlow = getFlow();
      if (updatedFlow) {
        setFlow(updatedFlow);
      }

      // Build delta summary for toast
      const { consequences } = response.applied;
      const deltaParts: string[] = [];
      
      if (consequences.bankDelta !== 0) {
        deltaParts.push(`Checking: ${consequences.bankDelta > 0 ? '+' : ''}$${consequences.bankDelta}`);
      }
      if (consequences.savingsDelta !== 0) {
        deltaParts.push(`Savings: ${consequences.savingsDelta > 0 ? '+' : ''}$${consequences.savingsDelta}`);
      }
      if (consequences.investDelta !== 0) {
        deltaParts.push(`Investment: ${consequences.investDelta > 0 ? '+' : ''}$${consequences.investDelta}`);
      }
      if (consequences.debtDelta !== 0) {
        deltaParts.push(`Debt: ${consequences.debtDelta > 0 ? '+' : ''}$${consequences.debtDelta}`);
      }
      if (consequences.healthDelta !== 0) {
        deltaParts.push(`Health: ${consequences.healthDelta > 0 ? '+' : ''}${consequences.healthDelta}`);
      }

      const toastMsg = `✅ ${response.applied.choice}\\n${deltaParts.join(' | ')}`;
      showToast(toastMsg, 'success');

      // Show unlock notification
      if (response.unlocked && response.unlocked.length > 0) {
        setTimeout(() => {
          showToast('🎉 New feature unlocked: Investing District!', 'info');
        }, 500);
      }

      // Show achievement notifications
      if ((response as any).newAchievements && (response as any).newAchievements.length > 0) {
        (response as any).newAchievements.forEach((achievementId: string, index: number) => {
          setTimeout(() => {
            setNewAchievement(achievementId);
            // Clear after animation completes
            setTimeout(() => setNewAchievement(null), 4000);
          }, 500 + index * 300);
        });
      }

      // Refresh mentor message for new scenario
      loadMentorMessage();
    } catch (err: any) {
      console.error('Failed to submit choice:', err);
      showToast(`Failed to submit choice: ${err.message}`, 'error');
    } finally {
      setIsSubmittingChoice(false);
    }
  };

  const handleDismissCrisis = async () => {
    try {
      const updatedState = await clearUiHints();
      setGameState(updatedState);
    } catch (err: any) {
      console.error('Failed to dismiss crisis banner:', err);
      // Optimistically hide it anyway
      if (gameState) {
        setGameState({
          ...gameState,
          uiHints: {
            showCrisisCoach: false,
            crisisType: undefined,
          },
        });
      }
    }
  };

  const handleViewPlaybook = async () => {
    try {
      const playbookData = await getPlaybook();
      setPlaybook(playbookData);
      setShowPlaybook(true);
    } catch (err: any) {
      console.error('Failed to load playbook:', err);
      showToast('Failed to load playbook. Make a few choices first!', 'error');
    }
  };

  const handleClosePlaybook = () => {
    setShowPlaybook(false);
  };

  const handleAskMentor = () => {
    // Complete the "Ask Mentor" quest
    completeFlowStep('q.askMentor');
    const updatedFlow = getFlow();
    if (updatedFlow) {
      setFlow(updatedFlow);
    }
    
    // Open chat panel
    setShowChat(true);
  };

  const handleChatMessage = async (
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> => {
    const response = await postChatMessage(message, history);
    return response;
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

  if (!gameState || !gameState.lastScenario) {
    return (
      <div style={styles.loadingContainer}>
        <h2>No game data available</h2>
      </div>
    );
  }

  return (
    <AppShell
      header={<HUDPanel gameState={gameState} />}
      footer={
        <div style={styles.footerContainer}>
          <button 
            style={styles.playbookButton}
            onClick={handleViewPlaybook}
            aria-label="View Money Playbook"
          >
            📊 View Playbook
          </button>
          <MoodSelector currentMood={currentMood} onMoodChange={handleMoodChange} />
        </div>
      }
    >
      <div className="game-screen" style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>
            💰 FinQuest{profileData?.name ? ` - ${profileData.name}'s Journey` : ''}
          </h1>
        </header>

        {/* Progress Path */}
        <ProgressPath flow={flow} investingUnlocked={shouldUnlockInvesting(gameState)} />

        {/* Quest Tracker for Month 1 */}
        {flow.monthIndex === 0 && <QuestTracker flow={flow} />}

        <div style={styles.mainContent}>
          <div style={styles.centerPanel}>
            <div style={styles.eventCard}>
              <h2 style={styles.eventTitle}>{gameState.lastScenario.title}</h2>
              <p style={styles.eventDescription}>{gameState.lastScenario.description}</p>
              {gameState.lastScenario.amount > 0 && (
                <p style={styles.eventAmount}>Amount: ${gameState.lastScenario.amount}</p>
              )}
            </div>

            {gameState.uiHints?.showCrisisCoach && gameState.uiHints.crisisType && (
              <CrisisBanner 
                crisisType={gameState.uiHints.crisisType}
                onDismiss={handleDismissCrisis}
              />
            )}

            <DialoguePanel agentName="mentor" message={agentMessage} onAskMentor={handleAskMentor} />

            {gameState.lastScenario.choices && gameState.lastScenario.choices.length > 0 ? (
              <ChoicePanel 
                choices={gameState.lastScenario.choices}
                onChoiceSelect={handleChoiceSelect}
                disabled={isSubmittingChoice}
              />
            ) : (
              <div style={styles.placeholder}>
                <p>Choices are being generated...</p>
                <button onClick={loadGameState} style={styles.retryButton} disabled={isLoading}>
                  Generate New Scenario
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Flow Beacons */}
        <FlowBeacons 
          beacon={shouldShowBeacon(flow.current)} 
          onDismiss={() => {
            // User dismissed the beacon, mark hints as disabled
            const updatedFlow = { ...flow, showHints: false };
            setFlow(updatedFlow);
          }}
        />

        {/* Toast notifications */}
        <div style={styles.toastContainer}>
          {toasts.map((toast) => (
            <div 
              key={toast.id} 
              style={{
                ...styles.toast,
                ...(toast.type === 'success' && styles.toastSuccess),
                ...(toast.type === 'info' && styles.toastInfo),
                ...(toast.type === 'error' && styles.toastError),
              }}
            >
              {toast.message.split('\\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          ))}
        </div>

        {/* Achievement Toast */}
        {newAchievement && <AchievementToast achievementId={newAchievement} />}

        {/* Money Playbook Modal */}
        {showPlaybook && playbook && (
          <>
            <div style={styles.modalOverlay} onClick={handleClosePlaybook} />
            <MoneyPlaybookView playbook={playbook} onClose={handleClosePlaybook} />
          </>
        )}

        {/* Chat Panel */}
        {showChat && (
          <ChatPanel 
            onSendMessage={handleChatMessage}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </AppShell>
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
  placeholder: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  eventAmount: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: '12px',
  },
  toastContainer: {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 1000,
    maxWidth: '400px',
  },
  toast: {
    padding: '16px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'slideIn 0.3s ease-out',
    color: 'white',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  toastSuccess: {
    backgroundColor: '#4CAF50',
  },
  toastInfo: {
    backgroundColor: '#2196F3',
  },
  toastError: {
    backgroundColor: '#F44336',
  },
  footerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '0 20px',
  },
  playbookButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
};

export default GameScreen;
