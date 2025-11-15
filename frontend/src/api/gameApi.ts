import { GameState, MakeChoiceRequest, MoneyPlaybook } from '../types/game';

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * API functions for game-related endpoints
 */

/**
 * Get the current game state
 */
export const getGameState = async (): Promise<GameState> => {
  try {
    const response = await fetch(`${API_BASE_URL}/game/state`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch game state: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching game state:', error);
    throw error;
  }
};

/**
 * Submit a player's choice
 */
export const postChoice = async (request: MakeChoiceRequest): Promise<GameState> => {
  try {
    const response = await fetch(`${API_BASE_URL}/game/choice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit choice: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
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
    const response = await fetch(`${API_BASE_URL}/game/playbook`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch playbook: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching playbook:', error);
    throw error;
  }
};
