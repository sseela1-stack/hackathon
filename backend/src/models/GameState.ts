/**
 * Mood union type - player's emotional state
 */
export type Mood = 'anxious' | 'okay' | 'confident';

/**
 * Balance - financial accounts
 */
export interface Balance {
  checking: number;
  savings: number;
  investments: number;
}

/**
 * GameChoice - a single choice option in an event
 */
export interface GameChoice {
  id: string;
  label: string;
  agentSuggested?: 'mentor' | 'spenderSam' | 'saverSiya';
}

/**
 * GameEvent - a scenario or decision point
 */
export interface GameEvent {
  id: string;
  title: string;
  description: string;
  choices: GameChoice[];
}

/**
 * GameHistoryItem - record of a past decision
 */
export interface GameHistoryItem {
  eventId: string;
  choiceId: string;
  mood: Mood;
  timestamp: string;
}

/**
 * GameState - complete game state
 */
export interface GameState {
  day: number;
  month: number;
  balances: Balance;
  healthScore: number;
  currentEvent: GameEvent;
  history: GameHistoryItem[];
  mood: Mood;
}
