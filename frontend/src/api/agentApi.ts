import { AgentType } from '../types/game';

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Get or create a stable player ID stored in localStorage
 */
function getPlayerId(): string {
  const k = 'finquest_pid';
  let id = localStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(k, id);
  }
  return id;
}

/**
 * API functions for AI agent-related endpoints
 */

export interface AgentMessageContext {
  eventDescription?: string;
  userBalance?: number;
  mood?: string;
  previousChoices?: string[];
}

export interface AgentMessageResponse {
  agent: AgentType;
  message: string;
}

/**
 * Get a message from a specific AI agent
 */
export const getAgentMessage = async (
  agentType: AgentType,
  context?: AgentMessageContext
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/${agentType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': getPlayerId(),
      },
      body: JSON.stringify({ context: context || {} }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get agent message: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error(`Error getting message from ${agentType}:`, error);
    throw error;
  }
};

/**
 * Get a message from the Mentor agent
 */
export const getMentorMessage = (context?: AgentMessageContext): Promise<string> => {
  return getAgentMessage('mentor', context);
};

/**
 * Get a message from Spender Sam
 */
export const getSpenderSamMessage = (context?: AgentMessageContext): Promise<string> => {
  return getAgentMessage('spenderSam', context);
};

/**
 * Get a message from Saver Siya
 */
export const getSaverSiyaMessage = (context?: AgentMessageContext): Promise<string> => {
  return getAgentMessage('saverSiya', context);
};

/**
 * Get a crisis alert message
 */
export const getCrisisMessage = (context?: AgentMessageContext): Promise<string> => {
  return getAgentMessage('crisis', context);
};

/**
 * Get a message from Future You
 */
export const getFutureYouMessage = (context?: AgentMessageContext): Promise<string> => {
  return getAgentMessage('futureYou', context);
};

/**
 * Get a financial term translation
 */
export const getTranslatorMessage = (context?: AgentMessageContext): Promise<string> => {
  return getAgentMessage('translator', context);
};
