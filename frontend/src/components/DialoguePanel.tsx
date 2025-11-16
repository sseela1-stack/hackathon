import React from 'react';

interface DialoguePanelProps {
  agentName: string;
  message: string;
  onAskMentor?: () => void;
}

/**
 * Dialogue Panel - Displays AI agent messages
 */
const DialoguePanel: React.FC<DialoguePanelProps> = ({ agentName, message, onAskMentor }) => {
  const getAgentDisplayName = (name: string): string => {
    const displayNames: { [key: string]: string } = {
      mentor: 'Financial Mentor',
      spenderSam: 'Spender Sam',
      saverSiya: 'Saver Siya',
      crisis: 'Crisis Alert',
      futureYou: 'Future You',
      translator: 'Financial Translator',
    };
    return displayNames[name] || name;
  };

  const getAgentAvatar = (name: string): string => {
    const avatars: { [key: string]: string } = {
      mentor: '👨‍🏫',
      spenderSam: '💸',
      saverSiya: '💰',
      crisis: '🚨',
      futureYou: '🔮',
      translator: '📖',
    };
    return avatars[name] || '🤖';
  };

  return (
    <div className="dialogue-panel" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.avatar}>{getAgentAvatar(agentName)}</span>
        <h3 style={styles.agentName}>{getAgentDisplayName(agentName)}</h3>
      </div>
      <div style={styles.messageContainer}>
        <p style={styles.message}>{message}</p>
      </div>
      {onAskMentor && (
        <button 
          style={styles.askButton} 
          onClick={onAskMentor}
          id="ask-mentor"
          aria-label="Ask mentor for advice"
        >
          💡 Ask for Advice
        </button>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '2px solid #2196F3',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
  },
  avatar: {
    fontSize: '32px',
  },
  agentName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  messageContainer: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
  },
  message: {
    margin: 0,
    lineHeight: '1.6',
    color: '#333',
  },
  askButton: {
    marginTop: '12px',
    padding: '12px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    minHeight: '44px',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  },
};

export default DialoguePanel;
