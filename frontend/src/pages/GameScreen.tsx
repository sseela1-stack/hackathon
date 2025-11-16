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
import { CardSwiper } from '../components/CardSwiper';
import { getFlow, initializeFlow, complete as completeFlowStep } from '../flow/flowStore';
import { shouldShowBeacon, detectMilestones, shouldUnlockInvesting } from '../flow/flowEngine';
import { FlowState } from '../flow/flowTypes';
import css from './GameScreen.module.css';

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
  const [mentorStatus, setMentorStatus] = useState<'ready' | 'offline'>('ready');
  const [activeCard, setActiveCard] = useState<number>(0);
  const [scenarioCardIndex, setScenarioCardIndex] = useState<number>(0);

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

    document.body.classList.add('no-scroll-game');
    return () => {
      document.body.classList.remove('no-scroll-game');
    };
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

  // Reset scenario card deck whenever a new scenario arrives
  useEffect(() => {
    if (gameState?.lastScenario?.id) {
      setScenarioCardIndex(0);
    }
  }, [gameState?.lastScenario?.id]);

  const loadMentorMessage = async () => {
    try {
      const message = await getMentorMessage();
      setAgentMessage(message);
      setMentorStatus('ready');
    } catch (err) {
      console.error('Failed to load mentor message:', err);
      setMentorStatus('offline');
      setAgentMessage('I\'m syncing with your latest choices. Open Mentor Chat for live help.');
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
      <div className={css.errorContainer}>
        <h2 className={css.errorTitle}>⚠️ Error</h2>
        <p className={css.errorMessage}>{error}</p>
        <button className={css.retryButton} onClick={loadGameState}>
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && !gameState) {
    return (
      <div className={css.loadingContainer}>
        <h2>Loading FinQuest...</h2>
      </div>
    );
  }

  if (!gameState || !gameState.lastScenario) {
    return (
      <div className={css.loadingContainer}>
        <h2>No game data available</h2>
      </div>
    );
  }

  const cardTabs = [
    { label: 'Scenario', icon: '💰' },
    { label: 'Progress', icon: '🎯' },
    { label: 'Mentor', icon: '🧙' },
  ];

  const hasCrisisCard = Boolean(gameState.uiHints?.showCrisisCoach && gameState.uiHints.crisisType);

  const scenarioDeckCards = [
    {
      id: 'story',
      label: 'Story',
      content: (
        <div className={css.storyCardContent}>
          <p className={css.scenarioCardEyebrow}>Your setup</p>
          <h2 className={css.eventTitle}>{gameState.lastScenario.title}</h2>
          <p className={css.eventDescription}>{gameState.lastScenario.description}</p>
          {gameState.lastScenario.amount > 0 && (
            <div className={css.scenarioAmountHighlight}>
              Amount in play: <strong>${gameState.lastScenario.amount}</strong>
            </div>
          )}
        </div>
      ),
    },
    ...(hasCrisisCard
      ? [{
          id: 'coach',
          label: 'Coach Tip',
          content: (
            <div className={css.scenarioCoachCard}>
              <p className={css.scenarioCardEyebrow}>Heads up</p>
              {gameState.uiHints?.crisisType && (
                <CrisisBanner
                  crisisType={gameState.uiHints.crisisType}
                  onDismiss={handleDismissCrisis}
                />
              )}
            </div>
          ),
        }]
      : []),
    {
      id: 'decision',
      label: 'Decision',
      content: (
        <div className={css.scenarioDecisionCard}>
          {gameState.lastScenario.choices && gameState.lastScenario.choices.length > 0 ? (
            <ChoicePanel
              choices={gameState.lastScenario.choices}
              onChoiceSelect={handleChoiceSelect}
              disabled={isSubmittingChoice}
            />
          ) : (
            <div className={`${css.placeholder} ${css.scenarioPlaceholder}`}>
              <p>Choices are being generated...</p>
              <button onClick={loadGameState} className={css.retryButton} disabled={isLoading}>
                Generate New Scenario
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const scenarioDeckIsFirst = scenarioCardIndex === 0;
  const scenarioDeckIsLast = scenarioCardIndex === scenarioDeckCards.length - 1;

  const goToScenarioCard = (index: number) => {
    if (index < 0 || index > scenarioDeckCards.length - 1) return;
    setScenarioCardIndex(index);
  };

  const handleScenarioDeckNav = (direction: 'prev' | 'next') => {
    setScenarioCardIndex((prev) => {
      if (direction === 'prev') {
        return Math.max(prev - 1, 0);
      }
      return Math.min(prev + 1, scenarioDeckCards.length - 1);
    });
  };

  // Prepare cards for swiper
  const cards = [
    // Card 1: Main Game - Scenario & Choices
    <div className={css.cardContent} key="main">
      <header className={css.cardHeader}>
        <h1 className={css.cardTitle}>💰 Scenario</h1>
      </header>

      <div className={css.scenarioContent}>
        <div className={css.scenarioDeck}>
          <div className={css.scenarioDeckTabs} role="tablist" aria-label="Scenario cards">
            {scenarioDeckCards.map((card, index) => (
              <button
                key={card.id}
                id={`scenario-tab-${card.id}`}
                className={`${css.scenarioDeckTab} ${scenarioCardIndex === index ? css.scenarioDeckTabActive : ''}`}
                type="button"
                role="tab"
                aria-selected={scenarioCardIndex === index}
                aria-controls={`scenario-panel-${card.id}`}
                onClick={() => goToScenarioCard(index)}
                disabled={index > scenarioCardIndex}
                aria-disabled={index > scenarioCardIndex}
              >
                <span className={css.scenarioDeckTabNumber}>{index + 1}</span>
                <span>{card.label}</span>
              </button>
            ))}
          </div>

          <div className={css.scenarioDeckViewport}>
            <div
              className={css.scenarioDeckSlider}
              style={{ transform: `translateX(-${scenarioCardIndex * 100}%)` }}
            >
              {scenarioDeckCards.map((card, index) => (
                <section
                  key={card.id}
                  id={`scenario-panel-${card.id}`}
                  className={css.scenarioStepCard}
                  role="tabpanel"
                  aria-labelledby={`scenario-tab-${card.id}`}
                  aria-hidden={scenarioCardIndex !== index}
                >
                  <div className={css.scenarioStepMeta}>
                    <span className={css.scenarioStepNumber}>Card {index + 1}</span>
                    <h3 className={css.scenarioStepTitle}>{card.label}</h3>
                  </div>
                  {card.content}
                </section>
              ))}
            </div>
          </div>

          <div className={css.scenarioDeckControls}>
            <button
              type="button"
              className={css.scenarioDeckButton}
              onClick={() => handleScenarioDeckNav('prev')}
              disabled={scenarioDeckIsFirst}
            >
              ← Back
            </button>
            <div className={css.scenarioDeckProgress}>
              {scenarioDeckIsLast ? 'Make your choice on this card' : `Card ${scenarioCardIndex + 1} of ${scenarioDeckCards.length}`}
            </div>
            <button
              type="button"
              className={`${css.scenarioDeckButton} ${scenarioDeckIsLast ? css.scenarioDeckButtonDisabled : ''}`}
              onClick={() => handleScenarioDeckNav('next')}
              disabled={scenarioDeckIsLast}
            >
              {scenarioDeckIsLast ? 'Ready' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>,

    // Card 2: Progress & Quests
    <div className={css.cardContent} key="progress">
      <header className={css.cardHeader}>
        <h1 className={css.cardTitle}>🎯 Progress</h1>
      </header>

      <div className={css.progressContent}>
        <ProgressPath flow={flow} investingUnlocked={shouldUnlockInvesting(gameState)} />

        {flow.monthIndex === 0 && <QuestTracker flow={flow} />}

        <FlowBeacons
          beacon={shouldShowBeacon(flow.current)}
          onDismiss={() => {
            const updatedFlow = { ...flow, showHints: false };
            setFlow(updatedFlow);
          }}
        />
      </div>
    </div>,

    // Card 3: Mentor & Dialogue
    <div className={css.cardContent} key="mentor">
      <header className={css.cardHeader}>
        <h1 className={css.cardTitle}>🧙 Mentor</h1>
      </header>

      <div className={css.mentorContent}>
        <DialoguePanel agentName="mentor" message={agentMessage} onAskMentor={handleAskMentor} />

        <div className={css.mentorInfo}>
          <p className={css.mentorHint}>
            💡 Swipe left/right or tap the tabs to explore
          </p>
          {mentorStatus === 'offline' && (
            <p className={css.mentorWarning}>
              Mentor tips are reconnecting. Tap Mentor Chat below for live help.
            </p>
          )}
        </div>
      </div>
    </div>,
  ];

  return (
    <AppShell
      header={<HUDPanel gameState={gameState} />}
      footer={
        <div className={css.footerContainer}>
          <button
            className={`${css.chatButton} ${mentorStatus === 'offline' ? css.chatButtonOffline : ''}`}
            onClick={handleAskMentor}
            aria-label="Open mentor chat"
          >
            🧙 Mentor Chat
            {mentorStatus === 'offline' && (
              <span className={css.chatStatus}>
                reconnecting
              </span>
            )}
          </button>
          <button
            className={css.playbookButton}
            onClick={handleViewPlaybook}
            aria-label="View Money Playbook"
          >
            📊 Playbook
          </button>
          <div className={css.moodSelectorWrapper}>
            <MoodSelector currentMood={currentMood} onMoodChange={handleMoodChange} />
          </div>
        </div>
      }
    >
      <div className={`game-screen ${css.container}`}>
        <div className={css.cardNavWrapper}>
          <div className={css.cardNav} role="tablist" aria-label="Game panels">
            {cardTabs.map((tab, index) => (
              <button
                key={tab.label}
                className={`${css.cardNavButton} ${activeCard === index ? css.cardNavButtonActive : ''}`}
                onClick={() => setActiveCard(index)}
                aria-selected={activeCard === index}
                role="tab"
                type="button"
              >
                <span className={css.cardNavIcon}>{tab.icon}</span>
                <span className={css.cardNavLabel}>{tab.label}</span>
              </button>
            ))}
          </div>
          <p className={css.swipeHint}>Swipe or tap a tab to switch cards</p>
        </div>
        <div className={css.swiperRegion}>
          <CardSwiper cards={cards} activeIndex={activeCard} onCardChange={(index) => setActiveCard(index)} />
        </div>

        {/* Toast notifications */}
        <div className={css.toastContainer}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${css.toast} ${
                toast.type === 'success' ? css.toastSuccess :
                toast.type === 'info' ? css.toastInfo :
                css.toastError
              }`}
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
            <div className={css.modalOverlay} onClick={handleClosePlaybook} />
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

export default GameScreen;
