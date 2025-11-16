/**
 * Chat Panel - Interactive chat with Financial Mentor using Azure GPT-4
 */

import { useState, useRef, useEffect } from 'react';
import styles from './ChatPanel.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  onSendMessage: (message: string, history: Array<{ role: 'user' | 'assistant'; content: string }>) => Promise<string>;
  onClose?: () => void;
}

export function ChatPanel({ onSendMessage, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Financial Mentor. I can see your current accounts and financial health. Ask me anything about budgeting, saving, investing, or managing your money! 💰",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      // Get AI response
      const response = await onSendMessage(userMessage.content, history);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting. Please try again in a moment.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Should I save or invest this month?",
    "How can I improve my financial health?",
    "What's my spending looking like?",
    "Tips for building emergency fund?",
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.avatar}>👨‍🏫</span>
            <div>
              <h3 className={styles.title}>Financial Mentor</h3>
              <p className={styles.subtitle}>Context-aware AI advisor</p>
            </div>
          </div>
          {onClose && (
            <button className={styles.closeButton} onClick={onClose} aria-label="Close chat">
              ✕
            </button>
          )}
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map(message => (
            <div
              key={message.id}
              className={`${styles.message} ${
                message.role === 'user' ? styles.messageUser : styles.messageAssistant
              }`}
            >
              <div className={styles.messageContent}>
                {message.content}
              </div>
              <div className={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.messageAssistant}`}>
              <div className={styles.messageContent}>
                <span className={styles.typing}>●●●</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className={styles.quickQuestions}>
            <p className={styles.quickQuestionsLabel}>Quick questions:</p>
            <div className={styles.quickQuestionsGrid}>
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  className={styles.quickQuestion}
                  onClick={() => handleQuickQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className={styles.inputContainer}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Ask about your finances..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            aria-label="Send message"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  );
}
