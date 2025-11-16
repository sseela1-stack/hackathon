import { GameState, MakeChoiceRequest, MoneyPlaybook, ChoiceResponse } from '../types/game';

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
 * API functions for game-related endpoints
 */

/**
 * Get the current game state
 */
export const getGameState = async (): Promise<GameState> => {
  try {
    const response = await fetch(`${API_BASE_URL}/game/state`, {
      headers: {
        'x-player-id': getPlayerId(),
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch game state: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.state;
  } catch (error) {
    console.error('Error fetching game state:', error);
    throw error;
  }
};

/**
 * Submit a player's choice
 */
export const postChoice = async (request: MakeChoiceRequest): Promise<ChoiceResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/game/choice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': getPlayerId(),
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to submit choice: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting choice:', error);
    throw error;
  }
};

/**
 * Get the Money Playbook summary
 */
export const getPlaybook = async (): Promise<MoneyPlaybook> => {
  try {
    const response = await fetch(`${API_BASE_URL}/game/playbook`, {
      headers: {
        'x-player-id': getPlayerId(),
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch playbook: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.playbook;
  } catch (error) {
    console.error('Error fetching playbook:', error);
    throw error;
  }
};

/**
 * Clear UI hints (dismiss Crisis Coach banner)
 */
export const clearUiHints = async (): Promise<GameState> => {
  try {
    const response = await fetch(`${API_BASE_URL}/game/state/ui`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': getPlayerId(),
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clear UI hints: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.state;
  } catch (error) {
    console.error('Error clearing UI hints:', error);
    throw error;
  }
};

/**
 * Update player mood
 */
export const updateMood = async (mood: 'anxious' | 'okay' | 'confident'): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/game/mood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': getPlayerId(),
      },
      body: JSON.stringify({ mood }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update mood: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating mood:', error);
    throw error;
  }
};

/**
 * Chat with financial mentor
 */
export const postChatMessage = async (
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/game/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': getPlayerId(),
      },
      body: JSON.stringify({ message, conversationHistory }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send chat message: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};
