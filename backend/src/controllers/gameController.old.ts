/**
 * Game Controller
 * Handles game state management, choice processing, and playbook generation
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { gameLogicService } from '../services/gameLogic';
import {
  computeMonthlyIncomePlan,
  generateChoices,
  resolveChoice,
  calculateHealthScore,
  shouldUnlockInvesting,
} from '../services/gameLogic';
import { getGameState as loadGameState, saveGameState } from '../store';
import { GameState, Mood } from '../models/GameState';

// Default player ID for development
const DEV_PLAYER_ID = 'dev-player-001';

/**
 * Zod schema for postChoice request body
 */
const postChoiceSchema = z.object({
  scenarioId: z.string().min(1, 'Scenario ID is required'),
  choiceId: z.string().min(1, 'Choice ID is required'),
  mood: z.enum(['anxious', 'okay', 'confident']).optional(),
});

/**
 * Extract player ID from request header or use default
 */
function getPlayerId(req: Request): string {
  const playerId = req.headers['x-player-id'];
  if (typeof playerId === 'string' && playerId.length > 0) {
    return playerId;
  }
  return DEV_PLAYER_ID;
}

/**
 * GET /api/game/state
 * Returns current game state for the authenticated player
 * Creates new game if player doesn't exist
 */
export async function getGameState(req: Request, res: Response): Promise<void> {
  try {
    const playerId = getPlayerId(req);

    // Check if player has existing state
    let state = loadGameState(playerId);

    if (!state) {
      // Initialize new game with defaults
      state = gameLogicService.initializeGame(
        playerId,
        'student', // Default role
        'normal' // Default difficulty
      );

      // Save initial state
      saveGameState(playerId, state);
    }

    res.json({
      success: true,
      state,
      playerId,
    });
  } catch (error) {
    console.error('Error in getState:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve game state',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/game/choice
 * Process player's choice and update game state
 * Body: { scenarioId: string, choiceId: string, mood?: Mood }
 */
export async function postChoice(req: Request, res: Response): Promise<void> {
  try {
    const playerId = getPlayerId(req);

    // Validate request body
    const validation = postChoiceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const { scenarioId, choiceId, mood } = validation.data;

    // Get current state
    const currentState = loadGameState(playerId);
    if (!currentState) {
      res.status(404).json({
        success: false,
        error: 'Game state not found',
        message: 'Please initialize a game first by calling GET /api/game/state',
      });
      return;
    }

    // Validate scenario ID matches last scenario
    if (!currentState.lastScenario || currentState.lastScenario.id !== scenarioId) {
      res.status(400).json({
        success: false,
        error: 'Invalid scenario ID',
        message: `Expected scenario ID: ${currentState.lastScenario?.id || 'none'}`,
      });
      return;
    }

    // Generate choices for validation
    const choices = generateChoices(currentState.lastScenario, currentState);
    const selectedChoice = choices.find((c) => c.id === choiceId);

    if (!selectedChoice) {
      res.status(400).json({
        success: false,
        error: 'Invalid choice ID',
        message: 'Choice not found for this scenario',
        availableChoices: choices.map((c) => ({ id: c.id, label: c.label })),
      });
      return;
    }

    // Apply choice and get new state
    let newState = resolveChoice(currentState, selectedChoice);

    // Update mood if provided
    if (mood) {
      newState = { ...newState, mood };
    }

    // Recalculate income plan for next month
    const updatedIncomePlan = computeMonthlyIncomePlan(
      newState.player.role,
      newState.player.difficulty,
      newState.fixed
    );
    newState = { ...newState, incomePlan: updatedIncomePlan };

    // Recalculate health score based on current metrics
    const checkingAccount = newState.accounts.find((a) => a.type === 'checking');
    const savingsAccount = newState.accounts.find((a) => a.type === 'savings');
    const investmentAccount = newState.accounts.find((a) => a.type === 'investment');

    // Calculate metrics from history for accurate health score
    const recentHistory = newState.history.slice(-10); // Last 10 decisions
    const billPayments = recentHistory.filter(
      (h) => h.delta.bankDelta < 0 && Math.abs(h.delta.bankDelta) < 200
    );
    const onTimePayments = billPayments.filter((h) => h.delta.healthDelta >= 0);
    const paymentsOnTimeRatio =
      billPayments.length > 0 ? onTimePayments.length / billPayments.length : 1.0;

    // Calculate savings delta (average from recent history)
    const savingsDeltas = recentHistory.map((h) => h.delta.savingsDelta);
    const avgSavingsDelta =
      savingsDeltas.length > 0
        ? savingsDeltas.reduce((sum, d) => sum + d, 0) / savingsDeltas.length
        : 0;

    // Calculate total debt from history
    const totalDebt = Math.max(
      0,
      recentHistory.reduce((sum, h) => sum + h.delta.debtDelta, 0)
    );

    // Check if held through market crashes
    const hadMarketCrash = newState.history.some((h) => h.scenarioId.includes('marketCrash'));
    const panicSold = newState.history.some(
      (h) => h.choiceId.includes('panic') || h.choiceId.includes('sell')
    );
    const heldThroughVolatility = hadMarketCrash && !panicSold;

    const healthScore = calculateHealthScore({
      paymentsOnTimeRatio,
      savingsDelta: avgSavingsDelta,
      income:
        newState.incomePlan.baseIncome * newState.incomePlan.difficultyMultiplier +
        newState.incomePlan.eventsDelta,
      debt: totalDebt,
      savings: savingsAccount?.balance || 0,
      fixedCostsTotal:
        newState.fixed.rent +
        newState.fixed.food +
        newState.fixed.transport +
        newState.fixed.phoneInternet +
        (newState.fixed.other || 0),
      heldThroughVolatility,
    });

    newState = { ...newState, health: healthScore };

    // Check if investing should be unlocked
    if (!newState.unlocked.investingDistrict && shouldUnlockInvesting(newState)) {
      newState = {
        ...newState,
        unlocked: { ...newState.unlocked, investingDistrict: true },
      };
    }

    // Persist updated state
    saveGameState(playerId, newState);

    res.json({
      success: true,
      state: newState,
      applied: {
        choice: selectedChoice.label,
        consequences: selectedChoice.consequences,
      },
      unlocked:
        !currentState.unlocked.investingDistrict && newState.unlocked.investingDistrict
          ? ['investingDistrict']
          : [],
    });
  } catch (error) {
    console.error('Error in postChoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process choice',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Analyze player patterns from history
 */
function analyzePatterns(state: GameState): string[] {
  const patterns: string[] = [];
  const history = state.history;

  if (history.length < 3) {
    return ['Not enough decisions yet to identify patterns'];
  }

  // Pattern 1: Spending behavior
  const spendingChoices = history.filter(
    (h) =>
      h.choiceId.includes('yolo') ||
      h.choiceId.includes('trip') ||
      h.delta.bankDelta < -200
  );
  const spendingRatio = spendingChoices.length / history.length;

  if (spendingRatio > 0.5) {
    patterns.push('You often choose immediate enjoyment over long-term savings');
  } else if (spendingRatio < 0.2) {
    patterns.push('You consistently prioritize saving over spending');
  }

  // Pattern 2: Debt usage
  const debtChoices = history.filter((h) => h.delta.debtDelta > 0);
  if (debtChoices.length > 2) {
    patterns.push('You frequently rely on credit when faced with expenses');
  } else if (debtChoices.length === 0 && history.length > 5) {
    patterns.push('You successfully avoid taking on debt');
  }

  // Pattern 3: Emergency fund usage
  const savingsUsage = history.filter((h) => h.delta.savingsDelta < -100);
  if (savingsUsage.length > 3) {
    patterns.push('You often dip into your emergency fund instead of using checking');
  }

  // Pattern 4: Bill payment behavior
  const latePayments = history.filter(
    (h) => h.choiceId.includes('late') || h.delta.healthDelta < -3
  );
  if (latePayments.length > 1) {
    patterns.push('You sometimes pay bills late, which hurts your financial health');
  }

  // Pattern 5: Investment discipline
  const investmentMoves = history.filter((h) => Math.abs(h.delta.investDelta) > 0);
  if (investmentMoves.length > 2) {
    const panicSells = history.filter((h) => h.choiceId.includes('panic'));
    if (panicSells.length > 0) {
      patterns.push('You tend to panic during market downturns');
    } else {
      patterns.push('You actively manage your investments');
    }
  }

  // Default pattern if none detected
  if (patterns.length === 0) {
    patterns.push('Your financial decisions show a balanced approach');
  }

  return patterns.slice(0, 3); // Return top 3 patterns
}

/**
 * Generate personalized tips based on patterns and state
 */
function generateTips(state: GameState, patterns: string[]): string[] {
  const tips: string[] = [];

  // Tip based on health score
  if (state.health < 40) {
    tips.push('Focus on paying bills on time and building a small emergency fund');
  } else if (state.health < 60 && !state.unlocked.investingDistrict) {
    tips.push('Keep up the good habits to unlock the Investing District');
  }

  // Tip based on patterns
  if (patterns.some((p) => p.includes('immediate enjoyment'))) {
    tips.push('Try a 24-hour rule: wait a day before making discretionary purchases');
  }

  if (patterns.some((p) => p.includes('credit') || p.includes('debt'))) {
    tips.push('Build a small emergency buffer to avoid relying on credit cards');
  }

  if (patterns.some((p) => p.includes('emergency fund'))) {
    tips.push('Try to cover monthly expenses from checking; save your emergency fund for true emergencies');
  }

  // Tip based on accounts
  const savingsAccount = state.accounts.find((a) => a.type === 'savings');
  const fixedTotal =
    state.fixed.rent +
    state.fixed.food +
    state.fixed.transport +
    state.fixed.phoneInternet +
    (state.fixed.other || 0);
  const emergencyMonths = savingsAccount
    ? savingsAccount.balance / fixedTotal
    : 0;

  if (emergencyMonths < 3) {
    tips.push('Aim to save 3-6 months of expenses in your emergency fund');
  }

  // Tip for good performance
  if (state.health >= 70) {
    tips.push('Great job! Consider automating your savings to maintain these habits');
  }

  // Investment tip if unlocked
  if (state.unlocked.investingDistrict) {
    const investmentAccount = state.accounts.find((a) => a.type === 'investment');
    if (!investmentAccount || investmentAccount.balance < 500) {
      tips.push('Start small with investing - even $50/month adds up over time');
    }
  }

  // General wisdom
  if (tips.length < 2) {
    tips.push('Remember: financial health is about consistent habits, not perfection');
  }

  return tips.slice(0, 3); // Return top 3 tips
}

/**
 * GET /api/game/playbook
 * Generate personalized playbook with patterns and tips
 */
export async function getPlaybook(req: Request, res: Response): Promise<void> {
  try {
    const playerId = getPlayerId(req);

    // Get current state
    const state = loadGameState(playerId);
    if (!state) {
      res.status(404).json({
        success: false,
        error: 'Game state not found',
        message: 'Please initialize a game first by calling GET /api/game/state',
      });
      return;
    }

    // Analyze patterns
    const patterns = analyzePatterns(state);

    // Generate tips
    const tips = generateTips(state, patterns);

    // Additional summary stats
    const totalDays = state.history.length;
    const checkingAccount = state.accounts.find((a) => a.type === 'checking');
    const savingsAccount = state.accounts.find((a) => a.type === 'savings');
    const investmentAccount = state.accounts.find((a) => a.type === 'investment');

    res.json({
      success: true,
      playbook: {
        patterns,
        tips,
        summary: {
          totalDecisions: totalDays,
          healthScore: state.health,
          currentBalances: {
            checking: checkingAccount?.balance || 0,
            savings: savingsAccount?.balance || 0,
            investment: investmentAccount?.balance || 0,
          },
          investingUnlocked: state.unlocked.investingDistrict,
        },
      },
    });
  } catch (error) {
    console.error('Error in getPlaybook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate playbook',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
