/**
 * FinQuest Game State Domain Model
 * 
 * Core types for the financial literacy game engine.
 * Maps to the README concepts: player profiles, scenarios, choices, and game progression.
 */

// ============================================================================
// PLAYER ATTRIBUTES
// ============================================================================

/**
 * Player role representing life stage and financial situation
 * - student: Limited income, learning basics, lower stakes
 * - earlyCareer: Entry-level income, building emergency fund
 * - midCareer: Established income, complex financial decisions
 */
export type Role = 'student' | 'earlyCareer' | 'midCareer';

/**
 * Emotional state affecting risk tolerance and decision-making
 * - anxious: Lower risk tolerance, conservative recommendations
 * - okay: Balanced perspective, moderate risk
 * - confident: Higher risk tolerance, aggressive strategies
 */
export type Mood = 'anxious' | 'okay' | 'confident';

/**
 * Game difficulty level affecting income, expenses, and scenario complexity
 * - easy: Higher income buffer, simpler scenarios
 * - normal: Realistic income/expense ratio
 * - hard: Tight budget, complex multi-factor scenarios
 */
export type Difficulty = 'easy' | 'normal' | 'hard';

// ============================================================================
// FINANCIAL ACCOUNTS
// ============================================================================

/**
 * Types of financial accounts available in the game
 * Maps to the three-account system in README
 */
export type AccountType = 'checking' | 'savings' | 'investment';

/**
 * Individual financial account
 * Represents one of the player's money containers
 */
export interface Account {
  /** Unique account identifier */
  id: string;
  
  /** Account category */
  type: AccountType;
  
  /** Current balance in dollars */
  balance: number;
}

// ============================================================================
// PLAYER PROFILE & CONFIG
// ============================================================================

/**
 * Player profile containing identity and game configuration
 * Persistent across sessions
 */
export interface PlayerProfile {
  /** Unique player identifier */
  id: string;
  
  /** Player's life stage and income level */
  role: Role;
  
  /** Current emotional state */
  mood: Mood;
  
  /** Selected difficulty level */
  difficulty: Difficulty;
  
  /** Profile creation timestamp */
  createdAt: Date;
}

// ============================================================================
// BUDGETS & CASH FLOWS
// ============================================================================

/**
 * Monthly fixed costs that player must cover
 * Based on role and difficulty settings
 */
export interface FixedCosts {
  /** Housing costs (rent/mortgage) */
  rent: number;
  
  /** Groceries and dining */
  food: number;
  
  /** Transportation (car, transit, gas) */
  transport: number;
  
  /** Phone and internet utilities */
  phoneInternet: number;
  
  /** Optional miscellaneous fixed expenses */
  other?: number;
}

/**
 * Monthly income calculation
 * Accounts for base salary plus game events
 */
export interface MonthlyIncomePlan {
  /** Base monthly income for the role */
  baseIncome: number;
  
  /** Difficulty multiplier (0.8 for hard, 1.0 for normal, 1.2 for easy) */
  difficultyMultiplier: number;
  
  /** Cumulative income adjustments from events (bonuses, raises, job loss) */
  eventsDelta: number;
}

// ============================================================================
// GAME METRICS
// ============================================================================

/**
 * Financial health score (0-100)
 * Composite metric based on:
 * - Emergency fund coverage (months of expenses)
 * - Debt-to-income ratio
 * - Savings rate
 * - Investment allocation
 */
export type HealthScore = number;

/**
 * Investment portfolio allocation
 * Percentages should sum to approximately 1.0
 */
export interface PortfolioMix {
  /** Equity allocation (higher risk, higher return) */
  stocks: number;
  
  /** Fixed income allocation (lower risk, stable return) */
  bonds: number;
  
  /** Cash/money market allocation (no risk, minimal return) */
  cash: number;
}

/**
 * Long-term financial goals available in the game
 * - car3y: Save for car down payment in 3 years
 * - grad5y: Save for graduate school in 5 years
 * - retire30y: Build retirement nest egg over 30 years
 */
export type GoalType = 'car3y' | 'grad5y' | 'retire30y';

// ============================================================================
// EVENTS & CHOICES
// ============================================================================

/**
 * Types of scenarios/events that can occur
 * Maps to the event generation system
 */
export type ScenarioType = 
  | 'bill'              // Regular monthly bill
  | 'surpriseExpense'   // One-time expense opportunity
  | 'jobLoss'           // CRISIS: Income disruption
  | 'bigUnexpectedBill' // CRISIS: Major unexpected expense
  | 'rentHike'          // CRISIS: Fixed cost increase
  | 'marketCrash'       // Investment volatility
  | 'tripInvite';       // Social spending pressure

/**
 * Game scenario/event
 * Presents a financial decision point to the player
 */
export interface Scenario {
  /** Unique scenario identifier */
  id: string;
  
  /** Scenario category */
  type: ScenarioType;
  
  /** Display title */
  title: string;
  
  /** Detailed description of the situation */
  description: string;
  
  /** Optional monetary amount involved */
  amount?: number;
  
  /** Available choices for this scenario */
  choices?: Choice[];
  
  /** Optional metadata for scenario-specific data */
  meta?: Record<string, unknown>;
}

/**
 * Player choice option within a scenario
 * Each choice leads to different financial consequences
 */
export interface Choice {
  /** Unique choice identifier */
  id: string;
  
  /** Display text for the choice button */
  label: string;
  
  /** Financial and health impacts of this choice */
  consequences: Partial<GameDelta>;
  
  /** @deprecated Use label instead - maintained for backward compatibility */
  text?: string;
  
  /** @deprecated Use consequences instead - maintained for backward compatibility */
  description?: string;
  
  /** @deprecated Use consequences instead - maintained for backward compatibility */
  outcomes?: {
    checkingChange?: number;
    savingsChange?: number;
    investmentChange?: number;
    healthScoreChange?: number;
  };
  
  /** @deprecated Maintained for backward compatibility */
  relatedAgent?: AgentType;
}

/**
 * Financial delta representing the impact of a choice
 * All monetary values can be positive or negative
 */
export interface GameDelta {
  /** Change to checking account balance */
  bankDelta: number;
  
  /** Change to savings account balance */
  savingsDelta: number;
  
  /** Change to debt balance (negative = more debt) */
  debtDelta: number;
  
  /** Change to investment account balance */
  investDelta: number;
  
  /** Change to health score (-100 to +100) */
  healthDelta: number;
  
  /** Optional explanation of the outcome */
  notes?: string;
}

// ============================================================================
// GAME STATE SNAPSHOT
// ============================================================================

/**
 * Complete game state at a point in time
 * Represents everything needed to continue or save the game
 */
export interface GameState {
  /** Player identity and configuration */
  player: PlayerProfile;
  
  /** All financial accounts (checking, savings, investment) */
  accounts: Account[];
  
  /** Monthly fixed expenses */
  fixed: FixedCosts;
  
  /** Income calculation parameters */
  incomePlan: MonthlyIncomePlan;
  
  /** Optional investment portfolio details (unlocked after investing district) */
  portfolio?: {
    /** Asset allocation percentages */
    mix: PortfolioMix;
    
    /** Total portfolio value in dollars */
    value: number;
  };
  
  /** Current financial health score (0-100) */
  health: HealthScore;
  
  /** Current emotional state */
  mood: Mood;
  
  /** Number of in-game months elapsed (increments after each resolved choice) */
  monthsPlayed: number;
  
  /** Calculated net worth (sum of all accounts minus debt) */
  netWorth: number;
  
  /** Feature flags for progressive unlocking */
  unlocked: {
    /** Whether player has access to investing features */
    investingDistrict: boolean;
  };
  
  /** Earned achievements for player progression */
  achievements: string[];
  
  /** UI hints for displaying contextual help */
  uiHints?: {
    /** Show Crisis Coach banner with actionable steps */
    showCrisisCoach?: boolean;
    /** Crisis type for customized advice */
    crisisType?: 'jobLoss' | 'bigUnexpectedBill' | 'rentHike';
  };
  
  /** Most recent scenario presented to player */
  lastScenario?: Scenario;
  
  /** Complete history of player decisions and outcomes */
  history: Array<{
    /** Scenario that was presented */
    scenarioId: string;
    
    /** Choice player made */
    choiceId: string;
    
    /** Financial impact of the choice */
    delta: GameDelta;
    
    /** Timestamp of the decision */
    at: Date;
  }>;
  
  /** @deprecated Use player instead - maintained for backward compatibility */
  user?: User;
  
  /** @deprecated Use lastScenario instead - maintained for backward compatibility */
  currentEvent?: Event | null;
  
  /** @deprecated Use history instead - maintained for backward compatibility */
  previousEvents?: Event[];
  
  /** @deprecated Use Date.now() - maintained for backward compatibility */
  timestamp?: Date;
}

// ============================================================================
// AI AGENT TYPES (from original model)
// ============================================================================

/**
 * AI Agent personality types for guidance
 * Each agent provides different financial perspectives
 */
export type AgentType = 
  | 'mentor'      // Balanced financial guidance
  | 'spenderSam'  // Encourages enjoying money now
  | 'saverSiya'   // Promotes aggressive saving
  | 'crisis'      // Alerts to urgent financial issues
  | 'crisisCoach' // Crisis management and triage
  | 'futureYou'   // Long-term perspective
  | 'translator'; // Explains financial jargon

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request payload when player makes a choice
 */
export interface MakeChoiceRequest {
  /** Scenario being responded to */
  scenarioId: string;
  
  /** Choice player selected */
  choiceId: string;
  
  /** Optional: which AI agent influenced this choice */
  agentFollowed?: AgentType;
  
  /** Player's emotional state when making choice */
  mood: Mood;
  
  /** @deprecated Use scenarioId instead - maintained for backward compatibility */
  eventId?: string;
}

/**
 * End-of-session summary (Money Playbook)
 * Analytics and insights about player's financial journey
 */
export interface MoneyPlaybook {
  /** Total days played in this session */
  totalDays: number;
  
  /** Cumulative income earned */
  totalIncome: number;
  
  /** Cumulative spending */
  totalSpending: number;
  
  /** Total amount saved */
  totalSaved: number;
  
  /** Total amount invested */
  totalInvested: number;
  
  /** Health score progression over time */
  healthScoreProgression: number[];
  
  /** Key decisions and their outcomes */
  keyDecisions: Array<{
    /** Game day when decision was made */
    day: number;
    
    /** Scenario description */
    event: string;
    
    /** Choice made by player */
    choice: string;
    
    /** Result of the choice */
    outcome: string;
  }>;
  
  /** Personalized financial insights and recommendations */
  insights: string[];
}

// ============================================================================
// LEGACY TYPES (for backward compatibility during migration)
// ============================================================================

/**
 * @deprecated Use PlayerProfile and GameState instead
 * Legacy User type from original model
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

/**
 * @deprecated Use Scenario instead
 * Legacy Event type from original model
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'income' | 'expense' | 'investment' | 'crisis' | 'opportunity';
  choices: Choice[];
}
