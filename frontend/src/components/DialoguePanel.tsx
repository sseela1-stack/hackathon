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
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '2px solid #2196F3',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
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
    fontSize: '24px',
  },
  agentName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  messageContainer: {
    backgroundColor: '#f9f9f9',
    padding: '10px',
    borderRadius: '6px',
    flex: 1,
    overflow: 'auto',
  },
  message: {
    margin: 0,
    lineHeight: '1.4',
    color: '#333',
    fontSize: '12px',
  },
  askButton: {
    marginTop: '8px',
    padding: '10px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    minHeight: '40px',
    boxShadow: '0 1px 4px rgba(102, 126, 234, 0.3)',
    flexShrink: 0,
  },
};

export default DialoguePanel;
