import React, { useState, useRef, useEffect } from 'react';

interface MentorReply {
  text: string;
  followUps?: string[];
  suggestions?: string[];
  domain: 'purchase' | 'investing' | 'budget' | 'debt' | 'career' | 'safety';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  rich?: MentorReply;
}

interface DialoguePanelProps {
  agentName: string;
  message: string;
  rich?: MentorReply;
  onAskMentor?: (mentor: string, input: string) => Promise<{ message: string; rich?: MentorReply }>;
}

type MentorDomain = 'mentor' | 'purchaseMentor' | 'investingMentor' | 'budgetMentor' | 'debtMentor' | 'careerMentor' | 'safetyMentor';

const MENTOR_TABS: { id: MentorDomain; label: string; icon: string; placeholder: string }[] = [
  { id: 'mentor', label: 'General', icon: '👨‍🏫', placeholder: 'Ask for general financial guidance...' },
  { id: 'purchaseMentor', label: 'Purchase', icon: '🛒', placeholder: 'Should I buy this? Ask about a purchase...' },
  { id: 'investingMentor', label: 'Investing', icon: '📈', placeholder: 'Ask about long-term investing basics...' },
  { id: 'budgetMentor', label: 'Budget', icon: '💰', placeholder: 'Ask about budgeting and daily spending...' },
  { id: 'debtMentor', label: 'Debt', icon: '💳', placeholder: 'Ask about managing debt...' },
  { id: 'careerMentor', label: 'Income', icon: '💼', placeholder: 'Ask about safe ways to earn more...' },
  { id: 'safetyMentor', label: 'Safety', icon: '🛡️', placeholder: 'Ask about emergency funds and safety nets...' },
];

/**
 * Dialogue Panel - Displays AI agent messages with domain mentor tabs
 */
const DialoguePanel: React.FC<DialoguePanelProps> = ({ agentName, message, rich, onAskMentor }) => {
  const [activeTab, setActiveTab] = useState<MentorDomain>('mentor');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Record<MentorDomain, ChatMessage[]>>({
    mentor: [],
    purchaseMentor: [],
    investingMentor: [],
    budgetMentor: [],
    debtMentor: [],
    careerMentor: [],
    safetyMentor: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedTabs = useRef<Set<MentorDomain>>(new Set());
  const [loadingFunFact, setLoadingFunFact] = useState<Set<MentorDomain>>(new Set());

  const currentTab = MENTOR_TABS.find(t => t.id === activeTab) || MENTOR_TABS[0];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory[activeTab].length]);

  // Initialize tab with AI-generated fun fact on first visit
  useEffect(() => {
    if (!initializedTabs.current.has(activeTab) && chatHistory[activeTab].length === 0 && onAskMentor) {
      initializedTabs.current.add(activeTab);
      
      // Skip fun fact for general mentor
      if (activeTab === 'mentor') {
        setChatHistory(prev => ({
          ...prev,
          [activeTab]: [{ role: 'assistant', content: message || 'Hi! I\'m your general financial mentor. Ask me anything about managing your money!' }],
        }));
        return;
      }

      // Request AI-generated fun fact for domain mentors
      setLoadingFunFact(prev => new Set(prev).add(activeTab));
      
      const funFactPrompts: Record<MentorDomain, string> = {
        mentor: '',
        purchaseMentor: 'Tell me one surprising fun fact about smart purchasing or consumer psychology (max 2 sentences)',
        investingMentor: 'Tell me one fascinating fun fact about investing or compound interest (max 2 sentences)',
        budgetMentor: 'Tell me one eye-opening fun fact about budgeting or spending habits (max 2 sentences)',
        debtMentor: 'Tell me one powerful fun fact about debt management or interest rates (max 2 sentences)',
        careerMentor: 'Tell me one interesting fun fact about side hustles or earning extra income (max 2 sentences)',
        safetyMentor: 'Tell me one important fun fact about emergency funds or financial security (max 2 sentences)',
      };

      onAskMentor(activeTab, funFactPrompts[activeTab])
        .then(response => {
          setChatHistory(prev => ({
            ...prev,
            [activeTab]: [{ role: 'assistant', content: `💡 Fun Fact: ${response.message}` }],
          }));
          setLoadingFunFact(prev => {
            const newSet = new Set(prev);
            newSet.delete(activeTab);
            return newSet;
          });
        })
        .catch(() => {
          // Fallback to static message if AI fails
          const fallbackMessages: Record<MentorDomain, string> = {
            mentor: '',
            purchaseMentor: '🛒 Hi! I help you think through purchases. Ask me about something you\'re considering buying!',
            investingMentor: '📈 Hi! I teach long-term investing basics. What would you like to know about investing?',
            budgetMentor: '💰 Hi! I help with budgeting and daily spending. What\'s on your mind?',
            debtMentor: '💳 Hi! I help with debt management. How can I support you today?',
            careerMentor: '💼 Hi! I suggest safe ways to boost income. What are you curious about?',
            safetyMentor: '🛡️ Hi! I focus on emergency funds and financial safety. How can I help?',
          };
          setChatHistory(prev => ({
            ...prev,
            [activeTab]: [{ role: 'assistant', content: fallbackMessages[activeTab] }],
          }));
          setLoadingFunFact(prev => {
            const newSet = new Set(prev);
            newSet.delete(activeTab);
            return newSet;
          });
        });
    }
  }, [activeTab, message, chatHistory, onAskMentor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !onAskMentor || isLoading) return;

    const userMessage = input.trim();
    const currentTabId = activeTab;
    
    // Add user message to history
    setChatHistory(prev => ({
      ...prev,
      [currentTabId]: [...prev[currentTabId], { role: 'user', content: userMessage }],
    }));

    setInput('');
    setIsLoading(true);
    
    try {
      const response = await onAskMentor(currentTabId, userMessage);
      
      // Add assistant response to the SAME tab it was requested from
      setChatHistory(prev => ({
        ...prev,
        [currentTabId]: [...prev[currentTabId], { role: 'assistant', content: response.message, rich: response.rich }],
      }));
    } catch (error) {
      console.error('Failed to get mentor response:', error);
      setChatHistory(prev => ({
        ...prev,
        [currentTabId]: [...prev[currentTabId], { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = async (chipText: string) => {
    if (onAskMentor && !isLoading) {
      const currentTabId = activeTab;
      
      // Add user message to history
      setChatHistory(prev => ({
        ...prev,
        [currentTabId]: [...prev[currentTabId], { role: 'user', content: chipText }],
      }));
      
      setIsLoading(true);
      try {
        const response = await onAskMentor(currentTabId, chipText);
        
        // Add assistant response to the SAME tab
        setChatHistory(prev => ({
          ...prev,
          [currentTabId]: [...prev[currentTabId], { role: 'assistant', content: response.message, rich: response.rich }],
        }));
      } catch (error) {
        console.error('Failed to get mentor response:', error);
        setChatHistory(prev => ({
          ...prev,
          [currentTabId]: [...prev[currentTabId], { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }],
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' && index < MENTOR_TABS.length - 1) {
      setActiveTab(MENTOR_TABS[index + 1].id);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveTab(MENTOR_TABS[index - 1].id);
    }
  };

  const getAgentDisplayName = (name: string): string => {
    const tab = MENTOR_TABS.find(t => t.id === name);
    return tab ? `${tab.icon} ${tab.label} Mentor` : name;
  };

  const currentHistory = chatHistory[activeTab];
  const isLoadingFunFact = loadingFunFact.has(activeTab);

  return (
    <div className="dialogue-panel" style={styles.container}>
      {/* Mentor Tab Bar */}
      <div style={styles.tabBar} role="tablist" aria-label="Mentor domains">
        {MENTOR_TABS.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span style={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chat History Display */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        style={styles.messageArea}
      >
        <div style={styles.header}>
          <span style={styles.avatar}>{currentTab.icon}</span>
          <h3 style={styles.agentName}>{getAgentDisplayName(currentTab.label)}</h3>
        </div>

        <div style={styles.messagesContainer}>
          {currentHistory.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>
                {isLoadingFunFact ? '🎲 Getting a fun fact for you...' : `👋 ${currentTab.label} Mentor here! What can I help you with?`}
              </p>
            </div>
          ) : (
            currentHistory.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.messageBubble,
                  ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
                }}
              >
                <div style={styles.messageText}>{msg.content}</div>
                
                {/* Show chips only on the last assistant message */}
                {msg.role === 'assistant' && msg.rich && idx === currentHistory.length - 1 && (
                  <div style={styles.chipsContainer}>
                    {msg.rich.followUps?.map((chip, i) => (
                      <button
                        key={`followup-${i}`}
                        style={styles.chip}
                        onClick={() => handleChipClick(chip)}
                        disabled={isLoading}
                        aria-label={`Quick reply: ${chip}`}
                      >
                        {chip}
                      </button>
                    ))}
                    {msg.rich.suggestions?.map((chip, i) => (
                      <button
                        key={`suggestion-${i}`}
                        style={{ ...styles.chip, ...styles.chipSuggestion }}
                        onClick={() => handleChipClick(chip)}
                        disabled={isLoading}
                        aria-label={`Suggestion: ${chip}`}
                      >
                        💡 {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {onAskMentor && (
        <form onSubmit={handleSubmit} style={styles.inputForm}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentTab.placeholder}
            style={styles.input}
            disabled={isLoading}
            aria-label={`Ask ${currentTab.label} Mentor`}
          />
          <button
            type="submit"
            style={styles.sendButton}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </form>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '2px solid #2196F3',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '2px solid #e0e0e0',
    backgroundColor: '#f5f5f5',
    overflowX: 'auto',
    flexShrink: 0,
  },
  tab: {
    flex: '1 1 auto',
    minWidth: '80px',
    padding: '8px 6px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transition: 'all 0.2s',
    fontSize: '11px',
    color: '#666',
  },
  tabActive: {
    backgroundColor: '#fff',
    borderBottom: '3px solid #2196F3',
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tabIcon: {
    fontSize: '18px',
  },
  tabLabel: {
    fontSize: '10px',
    whiteSpace: 'nowrap',
  },
  messageArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    padding: '10px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '1px solid #eee',
    flexShrink: 0,
  },
  avatar: {
    fontSize: '20px',
  },
  agentName: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  messagesContainer: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '4px',
  },
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: '20px',
  },
  emptyText: {
    color: '#999',
    fontSize: '13px',
    textAlign: 'center',
    margin: 0,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: '10px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    lineHeight: '1.4',
    wordWrap: 'break-word',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196F3',
    color: 'white',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    color: '#333',
    borderBottomLeftRadius: '4px',
  },
  messageText: {
    margin: 0,
  },
  chipsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  chip: {
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    border: '1px solid #90caf9',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '32px',
  },
  chipSuggestion: {
    backgroundColor: '#fff3e0',
    color: '#e65100',
    border: '1px solid #ffb74d',
  },
  inputForm: {
    display: 'flex',
    gap: '8px',
    padding: '10px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '12px',
  },
  sendButton: {
    padding: '10px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    minWidth: '48px',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default DialoguePanel;
