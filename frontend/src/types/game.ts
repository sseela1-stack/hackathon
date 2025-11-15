/**
 * Type definitions matching backend models
 */

export interface User {
  id: string;
  name: string;
  checkingBalance: number;
  savingsBalance: number;
  investmentBalance: number;
  healthScore: number;
  currentDay: number;
  currentMonth: number;
}

export type Mood = 'anxious' | 'okay' | 'confident';

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'income' | 'expense' | 'investment' | 'crisis' | 'opportunity';
  choices: Choice[];
}

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
  relatedAgent?: AgentType;
}

export type AgentType = 
  | 'mentor' 
  | 'spenderSam' 
  | 'saverSiya' 
  | 'crisis' 
  | 'futureYou' 
  | 'translator';

export interface GameState {
  user: User;
  currentEvent: Event | null;
  previousEvents: Event[];
  mood: Mood;
  timestamp: Date;
}

export interface MakeChoiceRequest {
  eventId: string;
  choiceId: string;
  agentFollowed?: AgentType;
  mood: Mood;
}

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
