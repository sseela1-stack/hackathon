/**
 * Type definitions matching backend models
 */

export interface Player {
  id: string;
  role: 'student' | 'earlyCareer' | 'midCareer';
  mood: 'anxious' | 'okay' | 'confident';
  difficulty: 'easy' | 'normal' | 'hard';
  createdAt: string;
}

export interface Account {
  id: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
}

export interface FixedExpenses {
  rent: number;
  food: number;
  transport: number;
  phoneInternet: number;
}

export interface IncomePlan {
  baseIncome: number;
  difficultyMultiplier: number;
  eventsDelta: number;
}

export interface Scenario {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  choices?: Choice[];
  meta: {
    category: string;
    difficulty: string;
    generatedAt: string;
  };
}

export interface GameState {
  player: Player;
  accounts: Account[];
  fixed: FixedExpenses;
  incomePlan: IncomePlan;
  health: number;
  mood: Mood;
  monthsPlayed: number;
  netWorth: number;
  unlocked: {
    investingDistrict: boolean;
  };
  achievements: string[];
  uiHints?: {
    showCrisisCoach?: boolean;
    crisisType?: 'jobLoss' | 'bigUnexpectedBill' | 'rentHike';
  };
  history: any[];
  lastScenario: Scenario;
}

// Legacy types (kept for compatibility)
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
  label: string;
  consequences: {
    bankDelta: number;
    savingsDelta: number;
    debtDelta: number;
    investDelta: number;
    healthDelta: number;
    notes?: string;
  };
  relatedAgent?: AgentType;
  // Backward compatibility
  text?: string;
  description?: string;
}

export interface ChoiceResponse {
  success: boolean;
  state: GameState;
  applied: {
    choice: string;
    consequences: Choice['consequences'];
  };
  unlocked?: string[];
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
  scenarioId: string;
  choiceId: string;
  mood?: Mood;
}

export interface MoneyPlaybook {
  patterns: string[];
  tips: string[];
  stats: {
    onTimeBillsPct: number;
    avgSavingsRate: number;
    maxDebt: number;
    crisisHandled: number;
  };
}
