import {
  GameState,
  PlayerProfile,
  Account,
  Scenario,
  Choice,
  GameDelta,
  MakeChoiceRequest,
  Role,
  Difficulty,
  FixedCosts,
  MonthlyIncomePlan,
  ScenarioType,
  Mood,
  PortfolioMix,
} from '../models/GameState';

/**
 * Core game logic service with income calculation, health scoring, and scenario generation
 * All functions are pure (no side effects) and strictly typed
 */

// ============================================================================
// Type Definitions for Internal Metrics
// ============================================================================

export interface HealthMetrics {
  paymentsOnTimeRatio: number; // 0-1, on-time bill payments
  savingsDelta: number; // Monthly savings change
  income: number; // Monthly income
  debt: number; // Current debt amount
  savings: number; // Current savings balance
  fixedCostsTotal: number; // Total monthly fixed costs
  heldThroughVolatility: boolean; // Did not panic sell in market crash
}

export interface MarketCondition {
  type: 'bull' | 'bear' | 'sideways';
  volatilityMultiplier: number;
}

export interface PortfolioSimulationResult {
  endValue: number;
  monthlyPath: number[];
  totalReturn: number;
  totalReturnPercent: number;
}

// ============================================================================
// 1) Income Calculation - "Tight but Fair"
// ============================================================================

/**
 * Base income and fixed cost targets by role
 */
const ROLE_INCOME_TARGETS = {
  student: {
    baseIncome: 1000,
    fixedCosts: { rent: 400, food: 200, transport: 100, phoneInternet: 50 },
  },
  earlyCareer: {
    baseIncome: 2500,
    fixedCosts: { rent: 900, food: 350, transport: 150, phoneInternet: 80 },
  },
  midCareer: {
    baseIncome: 4000,
    fixedCosts: { rent: 1400, food: 500, transport: 200, phoneInternet: 100 },
  },
};

/**
 * Difficulty multipliers for income
 * easy: +12.5%, normal: 0%, hard: -12.5%
 */
const DIFFICULTY_MULTIPLIERS = {
  easy: 1.125,
  normal: 1.0,
  hard: 0.875,
};

/**
 * Calculate total fixed costs
 */
function calculateFixedCostsTotal(fixed: FixedCosts): number {
  return fixed.rent + fixed.food + fixed.transport + fixed.phoneInternet;
}

/**
 * Round to nearest 10
 */
function roundToNearest10(value: number): number {
  return Math.round(value / 10) * 10;
}

/**
 * Compute monthly income plan ensuring fixed costs are 60-70% of income
 * Formula: income ≈ fixedCostsTotal / 0.65
 * 
 * @param role - Player's role (student, earlyCareer, midCareer)
 * @param difficulty - Game difficulty (easy, normal, hard)
 * @param fixed - Current fixed costs
 * @returns MonthlyIncomePlan with adjusted base income and multipliers
 */
export function computeMonthlyIncomePlan(
  role: Role,
  difficulty: Difficulty,
  fixed: FixedCosts
): MonthlyIncomePlan {
  const fixedTotal = calculateFixedCostsTotal(fixed);
  
  // Calculate income to maintain ~65% fixed cost ratio
  const targetIncome = fixedTotal / 0.65;
  
  // Apply difficulty multiplier
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];
  const adjustedIncome = roundToNearest10(targetIncome * difficultyMultiplier);
  
  return {
    baseIncome: adjustedIncome,
    difficultyMultiplier,
    eventsDelta: 0, // Will be updated by events (job loss, bonus, etc.)
  };
}

/**
 * Get default fixed costs for a role
 */
export function getDefaultFixedCosts(role: Role): FixedCosts {
  return { ...ROLE_INCOME_TARGETS[role].fixedCosts };
}

/**
 * Get default base income for a role
 */
export function getDefaultBaseIncome(role: Role): number {
  return ROLE_INCOME_TARGETS[role].baseIncome;
}

// ============================================================================
// 2) Health Score Calculation (0-100)
// ============================================================================

/**
 * Calculate the ratio of on-time bill payments from payment history
 * 
 * @param history - Array of historical payment records with billsPaidOnTime boolean
 * @returns Ratio between 0 and 1 (0 = no on-time payments, 1 = all on-time)
 * 
 * @example
 * ```ts
 * const history = [
 *   { billsPaidOnTime: true },
 *   { billsPaidOnTime: true },
 *   { billsPaidOnTime: false }
 * ];
 * const ratio = paymentsOnTimeRatio(history); // 0.666...
 * ```
 */
export function paymentsOnTimeRatio(
  history: Array<{ billsPaidOnTime: boolean }>
): number {
  if (history.length === 0) return 1; // Default to perfect score if no history
  
  const onTimeCount = history.filter((h) => h.billsPaidOnTime).length;
  return onTimeCount / history.length;
}

/**
 * Calculate savings rate delta as a ratio of income
 * Formula: (nextSavings - prevSavings) / income
 * 
 * @param prevSavings - Previous savings balance
 * @param nextSavings - Current savings balance
 * @param income - Monthly income for normalization
 * @returns Ratio clamped to [0, 1] where 1 = saved 100% of income, 0 = no savings growth
 * 
 * @example
 * ```ts
 * // Saved $500 out of $2000 income
 * const ratio = savingsRateDelta(1000, 1500, 2000); // 0.25 (25% savings rate)
 * 
 * // Lost savings (negative)
 * const ratio2 = savingsRateDelta(1000, 800, 2000); // 0 (clamped from -0.1)
 * ```
 */
export function savingsRateDelta(
  prevSavings: number,
  nextSavings: number,
  income: number
): number {
  if (income <= 0) return 0; // Avoid division by zero
  
  const delta = nextSavings - prevSavings;
  const ratio = delta / income;
  
  // Clamp to [0, 1] range (negative savings = 0, >100% savings = 1)
  return Math.max(0, Math.min(1, ratio));
}

/**
 * Calculate debt utilization as a ratio of monthly income (inverse contribution)
 * Higher debt relative to income = worse score
 * 
 * @param debt - Current total debt balance
 * @param income - Monthly income
 * @returns Ratio between 0 and 1 where:
 *   - 0 = debt >= 2x income (worst case, capped)
 *   - 0.5 = debt = 1x income
 *   - 1 = no debt (best case)
 * 
 * @example
 * ```ts
 * // No debt
 * const score1 = debtUtilization(0, 3000); // 1.0 (best)
 * 
 * // Debt equals monthly income
 * const score2 = debtUtilization(3000, 3000); // 0.5
 * 
 * // Debt is double monthly income (capped)
 * const score3 = debtUtilization(6000, 3000); // 0.0 (worst)
 * ```
 */
export function debtUtilization(debt: number, income: number): number {
  if (income <= 0) return 0; // Worst case if no income
  if (debt <= 0) return 1; // Best case if no debt
  
  const ratio = debt / income;
  const clampedRatio = Math.min(2, ratio); // Cap at 2x income
  
  // Inverse contribution: lower debt = higher score
  return 1 - clampedRatio / 2;
}

/**
 * Calculate emergency fund in months of fixed costs coverage
 * Capped at 6 months for scoring purposes (industry standard recommendation)
 * 
 * @param savings - Current savings balance
 * @param fixedCostsTotal - Total monthly fixed costs
 * @returns Number of months covered, capped at 6
 * 
 * @example
 * ```ts
 * // $6000 savings, $2000/month fixed costs
 * const months1 = emergencyFundMonths(6000, 2000); // 3.0 months
 * 
 * // $15000 savings (more than 6 months)
 * const months2 = emergencyFundMonths(15000, 2000); // 6.0 (capped)
 * 
 * // No savings
 * const months3 = emergencyFundMonths(0, 2000); // 0.0
 * ```
 */
export function emergencyFundMonths(
  savings: number,
  fixedCostsTotal: number
): number {
  if (fixedCostsTotal <= 0) return 0; // Avoid division by zero
  if (savings <= 0) return 0; // No emergency fund
  
  const months = savings / fixedCostsTotal;
  
  // Cap at 6 months (standard financial planning recommendation)
  return Math.min(6, months);
}

/**
 * Calculate health score based on financial metrics
 * Weights:
 * - On-time bills: 35%
 * - Savings rate: 25%
 * - Debt utilization (inverse): 15%
 * - Emergency fund months: 15%
 * - Investment discipline: 10%
 * 
 * @param metrics - Financial health metrics
 * @returns Health score between 0 and 100
 */
export function calculateHealthScore(metrics: HealthMetrics): number {
  // 1. On-time payments (35%) - already 0-1 ratio from helper
  const paymentsScore = metrics.paymentsOnTimeRatio * 35;
  
  // 2. Savings rate (25%) - clamp to 0-30% range for reasonable scoring
  // Note: Helper already clamps to [0, 1], we scale to 0-30% expected range
  const savingsRate = metrics.income > 0 ? metrics.savingsDelta / metrics.income : 0;
  const savingsRateClamped = Math.max(0, Math.min(0.3, savingsRate)); // 0-30%
  const savingsScore = (savingsRateClamped / 0.3) * 25;
  
  // 3. Debt utilization (15%) - helper returns inverse contribution [0-1]
  const debtUtilizationScore = debtUtilization(metrics.debt, metrics.income);
  const debtScore = debtUtilizationScore * 15;
  
  // 4. Emergency fund months (15%) - helper returns capped months [0-6]
  const emergencyMonthsValue = emergencyFundMonths(
    metrics.savings,
    metrics.fixedCostsTotal
  );
  const emergencyScore = (emergencyMonthsValue / 6) * 15;
  
  // 5. Investment discipline (10%) - boolean converted to 0 or 10
  const disciplineScore = metrics.heldThroughVolatility ? 10 : 0;
  
  // Sum and clamp to 0-100
  const totalScore =
    paymentsScore + savingsScore + debtScore + emergencyScore + disciplineScore;
  
  return Math.max(0, Math.min(100, Math.round(totalScore)));
}

// ============================================================================
// 3) Scenario Engine with Seeded RNG
// ============================================================================

/**
 * Simple seeded random number generator for reproducibility
 */
class SeededRNG {
  private seed: number;
  
  constructor(seed: string) {
    // Convert string seed to number
    this.seed = this.hashCode(seed);
  }
  
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  /**
   * Get random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
  
  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }
}

/**
 * Scenario templates with mood-based biasing
 */
const SCENARIO_TEMPLATES: Record<
  ScenarioType,
  {
    titles: string[];
    descriptions: string[];
    moodWeight: Record<Mood, number>;
    amountRange: [number, number];
  }
> = {
  bill: {
    titles: ['Monthly Utilities Due', 'Phone Bill Arrived', 'Internet Bill Due'],
    descriptions: [
      'Your monthly utility bill has arrived. Time to pay up!',
      'Your phone bill is due this month.',
      'Internet service bill needs to be paid.',
    ],
    moodWeight: { anxious: 1.5, okay: 1.0, confident: 0.8 },
    amountRange: [50, 150],
  },
  surpriseExpense: {
    titles: [
      'Laptop Needs Repair',
      'Car Broke Down',
      'Medical Emergency',
      'Friend\'s Wedding Gift',
    ],
    descriptions: [
      'Your laptop screen cracked and needs urgent repair.',
      'Your car won\'t start. Looks like battery replacement time.',
      'Unexpected dental work required.',
      'Your best friend is getting married next month!',
    ],
    moodWeight: { anxious: 2.0, okay: 1.0, confident: 0.5 },
    amountRange: [200, 800],
  },
  jobLoss: {
    titles: ['Layoff Notice', 'Contract Ended', 'Company Downsizing'],
    descriptions: [
      'Your company announced layoffs and you\'re affected.',
      'Your contract position has ended unexpectedly.',
      'The company is restructuring and your department is being cut.',
    ],
    moodWeight: { anxious: 3.0, okay: 0.8, confident: 0.3 },
    amountRange: [-1000, -500], // Income reduction
  },
  marketCrash: {
    titles: [
      'Market Volatility!',
      'Stock Market Dip',
      'Economic Uncertainty',
    ],
    descriptions: [
      'The stock market dropped 15% this week. Your investments are down.',
      'Economic news triggered a market sell-off. Portfolio value decreased.',
      'Market correction underway. Investment values have declined.',
    ],
    moodWeight: { anxious: 2.5, okay: 1.0, confident: 0.5 },
    amountRange: [-500, -100],
  },
  rentHike: {
    titles: ['Rent Increase Notice', 'Lease Renewal', 'Landlord Letter'],
    descriptions: [
      'Your landlord is raising rent by 10% next month.',
      'Lease renewal time and rent is going up.',
      'Your landlord sent notice of a rent increase.',
    ],
    moodWeight: { anxious: 1.8, okay: 1.0, confident: 0.7 },
    amountRange: [50, 150], // Monthly increase
  },
  tripInvite: {
    titles: [
      'Weekend Getaway?',
      'Concert Tickets Available',
      'Friend\'s Trip Invitation',
      'Sale on Flights',
    ],
    descriptions: [
      'Friends are planning a weekend trip. Want to join?',
      'Your favorite band is in town! Tickets still available.',
      'A friend invited you on a road trip adventure.',
      'Amazing flight deals to your dream destination!',
    ],
    moodWeight: { anxious: 0.5, okay: 1.0, confident: 2.0 },
    amountRange: [150, 600],
  },
};

/**
 * Generate a scenario biased by player's mood
 * 
 * @param state - Current game state
 * @returns Generated scenario
 */
export function generateScenario(state: GameState): Scenario {
  const rng = new SeededRNG(state.player.id + state.history.length.toString());
  
  // Build weighted scenario type array based on mood
  const weightedTypes: ScenarioType[] = [];
  const scenarioTypes = Object.keys(SCENARIO_TEMPLATES) as ScenarioType[];
  
  scenarioTypes.forEach((type) => {
    const weight = SCENARIO_TEMPLATES[type].moodWeight[state.mood];
    const count = Math.ceil(weight * 10); // Scale to integer weights
    for (let i = 0; i < count; i++) {
      weightedTypes.push(type);
    }
  });
  
  // Pick scenario type
  const scenarioType = rng.pick(weightedTypes);
  const template = SCENARIO_TEMPLATES[scenarioType];
  
  // Generate scenario details
  const title = rng.pick(template.titles);
  const description = rng.pick(template.descriptions);
  const [minAmount, maxAmount] = template.amountRange;
  const amount = rng.nextInt(minAmount, maxAmount + 1);
  
  return {
    id: `scenario-${Date.now()}-${rng.nextInt(1000, 9999)}`,
    type: scenarioType,
    title,
    description,
    amount: Math.abs(amount), // Ensure amount is always a positive number
    meta: {
      category: scenarioType === 'tripInvite' ? 'discretionary' : 'necessary',
      difficulty: state.player.difficulty,
      generatedAt: new Date(),
    },
  };
}

/**
 * Generate contextual choices for a scenario
 * 
 * @param scenario - The scenario to generate choices for
 * @param state - Current game state for context
 * @returns Array of 3 choices with consequences
 */
export function generateChoices(scenario: Scenario, state: GameState): Choice[] {
  const checkingAccount = state.accounts.find((a) => a.type === 'checking');
  const savingsAccount = state.accounts.find((a) => a.type === 'savings');
  const currentBalance = checkingAccount?.balance || 0;
  const amount = scenario.amount || 100; // Default amount if not specified
  
  // Base choices depend on scenario type
  switch (scenario.type) {
    case 'bill':
      return [
        {
          id: `${scenario.id}-choice-1`,
          label: 'Pay on time from checking',
          consequences: {
            bankDelta: -amount,
            savingsDelta: 0,
            debtDelta: 0,
            investDelta: 0,
            healthDelta: 3,
            notes: 'Paid bill on time, maintained good payment history',
          },
          relatedAgent: 'mentor',
        },
        {
          id: `${scenario.id}-choice-2`,
          label: 'Pay late (incur fee)',
          consequences: {
            bankDelta: -(amount * 1.1),
            savingsDelta: 0,
            debtDelta: 0,
            investDelta: 0,
            healthDelta: -5,
            notes: 'Paid late, incurred 10% late fee and hurt credit',
          },
          relatedAgent: 'crisisCoach',
        },
        {
          id: `${scenario.id}-choice-3`,
          label: 'Transfer from savings to cover',
          consequences: {
            bankDelta: 0,
            savingsDelta: -amount,
            debtDelta: 0,
            investDelta: 0,
            healthDelta: 1,
            notes: 'Used emergency fund to pay bill on time',
          },
          relatedAgent: 'saverSiya',
        },
      ];
      
    case 'surpriseExpense':
      return [
        {
          id: `${scenario.id}-choice-1`,
          label: 'Pay from checking account',
          consequences: {
            bankDelta: -amount,
            savingsDelta: 0,
            debtDelta: 0,
            investDelta: 0,
            healthDelta: -2,
            notes: 'Handled expense but depleted checking balance',
          },
          relatedAgent: 'mentor',
        },
        {
          id: `${scenario.id}-choice-2`,
          label: 'Use credit card (debt)',
          consequences: {
            bankDelta: 0,
            savingsDelta: 0,
            debtDelta: amount,
            investDelta: 0,
            healthDelta: -5,
            notes: 'Took on debt at high interest rate',
          },
          relatedAgent: 'crisisCoach',
        },
        {
          id: `${scenario.id}-choice-3`,
          label: 'Split: half checking, half savings',
          consequences: {
            bankDelta: -amount / 2,
            savingsDelta: -amount / 2,
            debtDelta: 0,
            investDelta: 0,
            healthDelta: 0,
            notes: 'Balanced approach, preserved some emergency fund',
          },
          relatedAgent: 'saverSiya',
        },
      ];
      
    case 'tripInvite':
      return [
        {
          id: `${scenario.id}-choice-1`,
          label: 'Go for it! YOLO',
          consequences: {
            bankDelta: -amount,
            savingsDelta: 0,
            debtDelta: 0,
            investDelta: 0,
            healthDelta: -3,
            notes: 'Had fun but spent discretionary funds',
          },
          relatedAgent: 'spenderSam',
        },
        {
          id: `${scenario.id}-choice-2`,
          label: 'Skip it, save the money',
          consequences: {
            bankDelta: 0,
            savingsDelta: amount * 0.3, // "Saved" by not spending
            debtDelta: 0,
            investDelta: 0,
            healthDelta: 5,
            notes: 'Showed discipline, built savings instead',
          },
          relatedAgent: 'saverSiya',
        },
        {
          id: `${scenario.id}-choice-3`,
          label: 'Go, but budget-friendly version',
          consequences: {
            bankDelta: -amount * 0.5,
            savingsDelta: 0,
            debtDelta: 0,
            investDelta: amount * 0.2,
            healthDelta: 2,
            notes: 'Enjoyed life while staying financially responsible',
          },
          relatedAgent: 'mentor',
        },
      ];
      
    case 'marketCrash':
      return [
        {
          id: `${scenario.id}-choice-1`,
          label: 'Panic sell everything',
          consequences: {
            bankDelta: state.accounts.find((a) => a.type === 'investment')?.balance || 0,
            savingsDelta: 0,
            debtDelta: 0,
            investDelta: -(state.accounts.find((a) => a.type === 'investment')?.balance || 0),
            healthDelta: -8,
            notes: 'Sold at loss, locked in losses, missed recovery',
          },
          relatedAgent: 'crisisCoach',
        },
        {
          id: `${scenario.id}-choice-2`,
          label: 'Hold steady, ride it out',
          consequences: {
            bankDelta: 0,
            savingsDelta: 0,
            debtDelta: 0,
            investDelta: 0,
            healthDelta: 7,
            notes: 'Held through volatility, positioned for recovery',
          },
          relatedAgent: 'mentor',
        },
        {
          id: `${scenario.id}-choice-3`,
          label: 'Buy the dip (invest more)',
          consequences: {
            bankDelta: -200,
            savingsDelta: 0,
            debtDelta: 0,
            investDelta: 200,
            healthDelta: 5,
            notes: 'Bought at discount, increased long-term position',
          },
          relatedAgent: 'futureYou',
        },
      ];
      
    default:
      // Generic choices for other scenarios
      return [
        {
          id: `${scenario.id}-choice-1`,
          label: 'Handle it from checking',
          consequences: {
            bankDelta: -amount,
            savingsDelta: 0,
            debtDelta: 0,
            investDelta: 0,
            healthDelta: 0,
            notes: 'Addressed the situation directly',
          },
          relatedAgent: 'mentor',
        },
        {
          id: `${scenario.id}-choice-2`,
          label: 'Use savings',
          consequences: {
            bankDelta: 0,
            savingsDelta: -amount,
            debtDelta: 0,
            investDelta: 0,
            healthDelta: -2,
            notes: 'Used emergency fund',
          },
          relatedAgent: 'saverSiya',
        },
        {
          id: `${scenario.id}-choice-3`,
          label: 'Take on debt',
          consequences: {
            bankDelta: 0,
            savingsDelta: 0,
            debtDelta: amount,
            investDelta: 0,
            healthDelta: -5,
            notes: 'Financed with credit',
          },
          relatedAgent: 'crisisCoach',
        },
      ];
  }
}

/**
 * Resolve a choice and return updated game state
 * Pure function - returns new state without modifying input
 * 
 * @param state - Current game state
 * @param choice - The choice made by player
 * @returns Updated game state with applied consequences
 */
export function resolveChoice(state: GameState, choice: Choice): GameState {
  // Apply consequences to accounts
  const updatedAccounts = state.accounts.map((account) => {
    let balanceChange = 0;
    
    if (account.type === 'checking' && choice.consequences.bankDelta) {
      balanceChange = choice.consequences.bankDelta;
    } else if (account.type === 'savings' && choice.consequences.savingsDelta) {
      balanceChange = choice.consequences.savingsDelta;
    } else if (account.type === 'investment' && choice.consequences.investDelta) {
      balanceChange = choice.consequences.investDelta;
    }
    
    return {
      ...account,
      balance: Math.max(0, account.balance + balanceChange), // Can't go negative
    };
  });
  
  // Update health score
  const newHealth = Math.min(
    100,
    Math.max(0, state.health + (choice.consequences.healthDelta || 0))
  );
  
  // Record decision in history - ensure all GameDelta fields are present
  const historyEntry = {
    scenarioId: state.lastScenario?.id || 'unknown',
    choiceId: choice.id,
    delta: {
      bankDelta: choice.consequences.bankDelta || 0,
      savingsDelta: choice.consequences.savingsDelta || 0,
      debtDelta: choice.consequences.debtDelta || 0,
      investDelta: choice.consequences.investDelta || 0,
      healthDelta: choice.consequences.healthDelta || 0,
      notes: choice.consequences.notes,
    },
    at: new Date(),
  };
  
  // Generate next scenario
  const nextScenario = generateScenario({
    ...state,
    accounts: updatedAccounts,
    health: newHealth,
    history: [...state.history, historyEntry],
  });
  
  // Return new state
  return {
    ...state,
    accounts: updatedAccounts,
    health: newHealth,
    lastScenario: nextScenario,
    history: [...state.history, historyEntry],
  };
}

// ============================================================================
// 4) Investing District Unlock Logic
// ============================================================================

/**
 * Determine if player should unlock the investing district
 * Requirements:
 * - Health score >= 55
 * - At least 2 on-time bill payment cycles
 * 
 * @param state - Current game state
 * @returns true if investing district should be unlocked
 */
export function shouldUnlockInvesting(state: GameState): boolean {
  // Check health requirement
  if (state.health < 55) {
    return false;
  }
  
  // Count on-time bill payments from history
  const billPayments = state.history.filter((entry) => {
    // Check if it was a bill scenario and paid with positive health delta (on-time)
    const wasOnTime =
      entry.delta.healthDelta !== undefined && entry.delta.healthDelta >= 0;
    // Approximate detection of bill scenarios by checking for negative bank delta
    const wasBill =
      entry.delta.bankDelta !== undefined &&
      entry.delta.bankDelta < 0 &&
      Math.abs(entry.delta.bankDelta) < 200; // Bills typically < 200
    return wasBill && wasOnTime;
  });
  
  return billPayments.length >= 2;
}

// ============================================================================
// 5) Portfolio Simulation with Market Conditions
// ============================================================================

/**
 * Expected annual returns and volatility by portfolio mix
 */
const PORTFOLIO_STATS = {
  conservative: { meanReturn: 0.05, volatility: 0.08 }, // 5% return, 8% vol
  balanced: { meanReturn: 0.08, volatility: 0.15 }, // 8% return, 15% vol
  aggressive: { meanReturn: 0.12, volatility: 0.25 }, // 12% return, 25% vol
};

/**
 * Simulate portfolio performance over one year
 * Uses geometric Brownian motion approximation
 * 
 * @param mix - Portfolio allocation mix
 * @param startValue - Initial portfolio value
 * @param market - Market condition ('bull', 'bear', 'sideways')
 * @returns Simulation result with end value and monthly path
 */
export function simulateYear(
  mix: PortfolioMix,
  startValue: number,
  market: 'bull' | 'bear' | 'sideways' = 'sideways'
): PortfolioSimulationResult {
  // Determine dominant portfolio type
  let portfolioType: keyof typeof PORTFOLIO_STATS = 'balanced';
  if (mix.stocks >= 70) {
    portfolioType = 'aggressive';
  } else if (mix.stocks <= 30) {
    portfolioType = 'conservative';
  }
  
  const stats = PORTFOLIO_STATS[portfolioType];
  
  // Adjust returns based on market condition
  const marketAdjustment = {
    bull: 1.3,
    bear: 0.6,
    sideways: 1.0,
  };
  
  const adjustedReturn = stats.meanReturn * marketAdjustment[market];
  const monthlyReturn = adjustedReturn / 12;
  const monthlyVol = stats.volatility / Math.sqrt(12);
  
  // Simulate 12 months
  const monthlyPath: number[] = [startValue];
  let currentValue = startValue;
  
  for (let month = 1; month <= 12; month++) {
    // Add randomness (simplified: use sine wave for determinism in demo)
    const randomFactor = Math.sin(month * 0.7) * monthlyVol;
    const monthReturn = monthlyReturn + randomFactor;
    
    currentValue = currentValue * (1 + monthReturn);
    monthlyPath.push(currentValue);
  }
  
  const endValue = monthlyPath[monthlyPath.length - 1];
  const totalReturn = endValue - startValue;
  const totalReturnPercent = (totalReturn / startValue) * 100;
  
  return {
    endValue: Math.round(endValue * 100) / 100,
    monthlyPath: monthlyPath.map((v) => Math.round(v * 100) / 100),
    totalReturn: Math.round(totalReturn * 100) / 100,
    totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
  };
}

/**
 * Rebalance portfolio to target mix
 * Hook for future implementation of automatic rebalancing
 * 
 * @param valuePath - Historical portfolio values
 * @param targetMix - Target allocation mix
 * @returns Rebalancing recommendations
 */
export function rebalance(
  valuePath: number[],
  targetMix: PortfolioMix
): { rebalanceNeeded: boolean; recommendations: string[] } {
  // TODO: Implement rebalancing logic
  // For now, return placeholder
  return {
    rebalanceNeeded: false,
    recommendations: [
      `Target: ${targetMix.stocks}% stocks, ${targetMix.bonds}% bonds, ${targetMix.cash}% cash`,
      'Portfolio rebalancing will be automated in future update',
    ],
  };
}

// ============================================================================
// GameLogicService Class (backward compatibility)
// ============================================================================

/**
 * Service for game logic and state management using new domain model
 */
export class GameLogicService {
  /**
   * Initialize a new game state for a player
   */
  initializeGame(
    userId: string,
    role: Role = 'student',
    difficulty: Difficulty = 'normal'
  ): GameState {
    // Create player profile
    const player: PlayerProfile = {
      id: userId,
      role,
      mood: 'okay',
      difficulty,
      createdAt: new Date(),
    };

    // Get default fixed costs and compute income
    const fixed = getDefaultFixedCosts(role);
    const incomePlan = computeMonthlyIncomePlan(role, difficulty, fixed);

    // Initialize accounts based on role
    const { checking, savings, investment } = this.getInitialBalances(role, difficulty);
    const accounts: Account[] = [
      { id: `${userId}-checking`, type: 'checking', balance: checking },
      { id: `${userId}-savings`, type: 'savings', balance: savings },
      { id: `${userId}-investment`, type: 'investment', balance: investment },
    ];

    // Initialize game state
    const initialState: GameState = {
      player,
      accounts,
      fixed,
      incomePlan,
      health: 50,
      mood: 'okay',
      unlocked: {
        investingDistrict: false,
      },
      history: [],
    };

    // Generate first scenario
    const firstScenario = generateScenario(initialState);

    return {
      ...initialState,
      lastScenario: firstScenario,
    };
  }

  /**
   * Get initial account balances based on role and difficulty
   */
  private getInitialBalances(role: Role, difficulty: Difficulty): { checking: number; savings: number; investment: number } {
    const baseBalances = {
      student: { checking: 500, savings: 200, investment: 0 },
      earlyCareer: { checking: 1500, savings: 1000, investment: 500 },
      midCareer: { checking: 3000, savings: 5000, investment: 2000 },
    };

    const multipliers = {
      easy: 1.5,
      normal: 1.0,
      hard: 0.7,
    };

    const base = baseBalances[role];
    const mult = multipliers[difficulty];

    return {
      checking: Math.round(base.checking * mult),
      savings: Math.round(base.savings * mult),
      investment: Math.round(base.investment * mult),
    };
  }

  /**
   * Generate a new scenario based on current game state
   */
  generateScenario(state: GameState): Scenario {
    return generateScenario(state);
  }

  /**
   * Generate choices for a scenario
   */
  generateChoices(scenario: Scenario, state: GameState): Choice[] {
    return generateChoices(scenario, state);
  }

  /**
   * Process a player's choice and update game state
   */
  processChoice(currentState: GameState, request: MakeChoiceRequest): GameState {
    const scenarioId = request.scenarioId || request.eventId;

    // Validate scenario
    if (!currentState.lastScenario || currentState.lastScenario.id !== scenarioId) {
      throw new Error('Invalid scenario ID');
    }

    // Generate choices for current scenario
    const choices = this.generateChoices(currentState.lastScenario, currentState);
    const choice = choices.find((c) => c.id === request.choiceId);
    if (!choice) {
      throw new Error('Invalid choice ID');
    }

    // Apply choice and get new state
    let newState = resolveChoice(currentState, choice);
    
    // Update mood if provided
    if (request.mood) {
      newState = { ...newState, mood: request.mood };
    }
    
    // Check if investing should be unlocked
    if (!newState.unlocked.investingDistrict && shouldUnlockInvesting(newState)) {
      newState = {
        ...newState,
        unlocked: { ...newState.unlocked, investingDistrict: true },
      };
    }

    return newState;
  }

  /**
   * Calculate end-of-session statistics and insights
   */
  generatePlaybookSummary(gameState: GameState) {
    const totalDays = gameState.history.length;
    const checkingAccount = gameState.accounts.find((a) => a.type === 'checking');
    const savingsAccount = gameState.accounts.find((a) => a.type === 'savings');
    const investmentAccount = gameState.accounts.find((a) => a.type === 'investment');

    // Calculate health metrics for insights
    const totalIncome = gameState.incomePlan.baseIncome * gameState.incomePlan.difficultyMultiplier;
    const fixedTotal = calculateFixedCostsTotal(gameState.fixed);
    
    return {
      totalDays,
      totalIncome,
      totalSpending: fixedTotal * totalDays, // Approximate
      totalSaved: savingsAccount?.balance || 0,
      totalInvested: investmentAccount?.balance || 0,
      healthScore: gameState.health,
      healthScoreProgression: [50, gameState.health],
      keyDecisions: gameState.history.slice(-5).map((entry, idx) => ({
        day: totalDays - 5 + idx + 1,
        event: 'Financial Decision',
        choice: entry.choiceId,
        outcome: entry.delta.notes || 'Decision made',
      })),
      insights: this.generateInsights(gameState),
    };
  }

  /**
   * Generate personalized insights based on game state
   */
  private generateInsights(state: GameState): string[] {
    const insights: string[] = [];
    const savingsAccount = state.accounts.find((a) => a.type === 'savings');
    const fixedTotal = calculateFixedCostsTotal(state.fixed);
    const emergencyMonths = savingsAccount ? savingsAccount.balance / fixedTotal : 0;

    if (state.health >= 70) {
      insights.push("You're doing great! Your financial health is strong.");
    } else if (state.health < 40) {
      insights.push('Consider focusing on building your emergency fund and paying bills on time.');
    }

    if (emergencyMonths < 3) {
      insights.push('Work towards saving 3-6 months of expenses in your emergency fund.');
    } else if (emergencyMonths >= 6) {
      insights.push('Excellent! You have a solid emergency fund. Consider investing extra savings.');
    }

    if (!state.unlocked.investingDistrict) {
      insights.push('Keep building healthy habits to unlock the Investing District!');
    } else {
      insights.push('Investing District unlocked! Time to grow your wealth long-term.');
    }

    return insights;
  }
}

export const gameLogicService = new GameLogicService();
