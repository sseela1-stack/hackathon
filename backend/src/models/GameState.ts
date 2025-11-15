// User information
export interface User {
  id: string;
  name: string;
  checkingBalance: number;
  savingsBalance: number;
  investmentBalance: number;
  healthScore: number; // 0-100 financial health score
  currentDay: number;
  currentMonth: number;
}

// Mood types for emotional state tracking
export type Mood = 'anxious' | 'okay' | 'confident';

// Game event/scenario
export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'income' | 'expense' | 'investment' | 'crisis' | 'opportunity';
  choices: Choice[];
}

// Player choice option
export interface Choice {
  id: string;
  text: string;
  description: string;
  outcomes: {
    checkingChange?: number;
    savingsChange?: number;
    investmentChange?: number;
    healthScoreChange?: number;
  };
  relatedAgent?: AgentType; // Which agent would recommend this choice
}

// AI Agent types
export type AgentType = 
  | 'mentor' 
  | 'spenderSam' 
  | 'saverSiya' 
  | 'crisis' 
  | 'futureYou' 
  | 'translator';

// Complete game state
export interface GameState {
  user: User;
  currentEvent: Event | null;
  previousEvents: Event[];
  mood: Mood;
  timestamp: Date;
}

// Request payload for making a choice
export interface MakeChoiceRequest {
  eventId: string;
  choiceId: string;
  agentFollowed?: AgentType;
  mood: Mood;
}

// Money playbook summary
export interface MoneyPlaybook {
  totalDays: number;
  totalIncome: number;
  totalSpending: number;
  totalSaved: number;
  totalInvested: number;
  healthScoreProgression: number[];
  keyDecisions: {
    day: number;
    event: string;
    choice: string;
    outcome: string;
  }[];
  insights: string[];
}
