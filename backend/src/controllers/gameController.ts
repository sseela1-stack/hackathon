/**
 * Game Controller (Prisma-backed)
 * Handles game state management, choice processing, and playbook generation
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { gameLogicService } from '../services/gameLogic';
import {
  computeMonthlyIncomePlan,
  generateChoices,
  resolveChoice,
  calculateHealthScore,
  shouldUnlockInvesting,
} from '../services/gameLogic';
import { gameRepo, ConflictError } from '../services/repo';
import { GameState, Mood, Role, Difficulty } from '../models/GameState';
import { generatePlaybook } from '../services/playbook';
import { chatWithMentor } from '../services/azureChatService';
import createHttpError from 'http-errors';

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
export async function getGameState(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = getPlayerId(req);

    // Ensure player exists in database
    await gameRepo.ensurePlayer({
      id: playerId,
      role: 'student',
      mood: 'okay',
      difficulty: 'normal',
    });

    // Try to load existing game state
    const existing = await gameRepo.loadState(playerId);

    if (existing) {
      // Add choices to the scenario if they don't exist
      const state = existing.snapshot;
      if (state.lastScenario && (!state.lastScenario.choices || state.lastScenario.choices.length === 0)) {
        const choices = generateChoices(state.lastScenario, state);
        state.lastScenario = { ...state.lastScenario, choices };
      }
      
      res.json({
        success: true,
        state,
        playerId,
      });
      return;
    }

    // Initialize new game with defaults
    const initialState = gameLogicService.initializeGame(
      playerId,
      'student', // Default role
      'normal' // Default difficulty
    );

    // Calculate initial health
    const checkingAccount = initialState.accounts.find((a) => a.type === 'checking');
    const savingsAccount = initialState.accounts.find((a) => a.type === 'savings');

    const initialHealth = calculateHealthScore({
      paymentsOnTimeRatio: 1.0, // Perfect initial score
      savingsDelta: 0,
      income:
        initialState.incomePlan.baseIncome *
          initialState.incomePlan.difficultyMultiplier +
        initialState.incomePlan.eventsDelta,
      debt: 0,
      savings: savingsAccount?.balance || 0,
      fixedCostsTotal:
        initialState.fixed.rent +
        initialState.fixed.food +
        initialState.fixed.transport +
        initialState.fixed.phoneInternet +
        (initialState.fixed.other || 0),
      heldThroughVolatility: false,
    });

    // Generate choices for the initial scenario
    if (initialState.lastScenario) {
      const choices = generateChoices(initialState.lastScenario, initialState);
      initialState.lastScenario.choices = choices;
    }

    const stateWithChoices = {
      ...initialState,
      health: initialHealth,
    };

    // Save initial state (expectedVersion = 0 for new records)
    await gameRepo.saveState(playerId, stateWithChoices, 0, initialHealth);

    res.json({
      success: true,
      state: stateWithChoices,
      playerId,
    });
  } catch (error) {
    console.error('Error in getState:', error);
    next(error);
  }
}

/**
 * POST /api/game/choice
 * Process player's choice and update game state atomically
 * Body: { scenarioId: string, choiceId: string, mood?: Mood }
 */
export async function postChoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = getPlayerId(req);

    // Validate request body
    const validation = postChoiceSchema.safeParse(req.body);
    if (!validation.success) {
      throw createHttpError(400, 'Invalid request body', {
        details: validation.error.issues,
      });
    }

    const { scenarioId, choiceId, mood } = validation.data;

    // Load current state with version
    const existing = await gameRepo.loadState(playerId);
    if (!existing) {
      throw createHttpError(
        404,
        'Game state not found. Please initialize a game first by calling GET /api/game/state'
      );
    }

    const { snapshot: currentState, version: currentVersion } = existing;

    // Validate scenario ID matches last scenario
    if (!currentState.lastScenario || currentState.lastScenario.id !== scenarioId) {
      throw createHttpError(400, 'Invalid scenario ID', {
        expected: currentState.lastScenario?.id || 'none',
      });
    }

    // Generate choices for validation
    const choices = generateChoices(currentState.lastScenario, currentState);
    const selectedChoice = choices.find((c) => c.id === choiceId);

    if (!selectedChoice) {
      throw createHttpError(400, 'Invalid choice ID. Choice not found for this scenario', {
        availableChoices: choices.map((c) => ({ id: c.id, label: c.label })),
      });
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

    // Generate new scenario with choices for next turn
    const nextScenario = gameLogicService.generateScenario(newState);
    const nextChoices = generateChoices(nextScenario, newState);
    newState = {
      ...newState,
      lastScenario: { ...nextScenario, choices: nextChoices },
    };

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
    const wasInvestingLocked = !currentState.unlocked.investingDistrict;
    if (!newState.unlocked.investingDistrict && shouldUnlockInvesting(newState)) {
      newState = {
        ...newState,
        unlocked: { ...newState.unlocked, investingDistrict: true },
      };
    }

    // Get the last history entry to determine monthIndex
    const monthIndex = newState.history.length;

    // Atomic transaction: save state + append event
    try {
      // Save updated state with optimistic concurrency
      await gameRepo.saveState(playerId, newState, currentVersion, healthScore);

      // Append event to history (convert Partial to full GameDelta)
      const fullDelta: any = {
        bankDelta: selectedChoice.consequences.bankDelta || 0,
        savingsDelta: selectedChoice.consequences.savingsDelta || 0,
        debtDelta: selectedChoice.consequences.debtDelta || 0,
        investDelta: selectedChoice.consequences.investDelta || 0,
        healthDelta: selectedChoice.consequences.healthDelta || 0,
        notes: selectedChoice.consequences.notes,
      };

      await gameRepo.appendEvent(playerId, {
        scenarioId,
        choiceId,
        delta: fullDelta,
        healthAfter: healthScore,
        monthIndex,
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        throw createHttpError(
          409,
          'Concurrent update detected. Please reload and try again.',
          { type: 'version_conflict' }
        );
      }
      throw error;
    }

    res.json({
      success: true,
      state: newState,
      applied: {
        choice: selectedChoice.label,
        consequences: selectedChoice.consequences,
      },
      unlocked:
        wasInvestingLocked && newState.unlocked.investingDistrict
          ? ['investingDistrict']
          : [],
      newAchievements: newState.achievements.filter(
        (a) => !currentState.achievements.includes(a)
      ),
    });
  } catch (error) {
    console.error('Error in postChoice:', error);
    next(error);
  }
}



/**
 * GET /api/game/playbook
 * Generate personalized playbook with patterns and tips using playbook service
 */
export async function getPlaybook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = getPlayerId(req);

    // Load current state
    const existing = await gameRepo.loadState(playerId);
    if (!existing) {
      throw createHttpError(
        404,
        'Game state not found. Please initialize a game first by calling GET /api/game/state'
      );
    }

    const state = existing.snapshot;

    // Generate playbook using the dedicated service
    const playbook = generatePlaybook(state);

    res.json({
      success: true,
      playbook,
    });
  } catch (error) {
    console.error('Error in getPlaybook:', error);
    next(error);
  }
}

/**
 * PATCH /api/game/state/ui
 * Clear UI hints (e.g., dismiss Crisis Coach banner)
 */
export async function patchUiHints(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = getPlayerId(req);

    // Load current state
    const existing = await gameRepo.loadState(playerId);
    if (!existing) {
      throw createHttpError(404, 'Game state not found');
    }

    const { snapshot: currentState, version: currentVersion } = existing;

    // Clear uiHints
    const updatedState = {
      ...currentState,
      uiHints: {
        showCrisisCoach: false,
        crisisType: undefined,
      },
    };

    // Save updated state
    await gameRepo.saveState(playerId, updatedState, currentVersion, currentState.health);

    res.json({
      success: true,
      state: updatedState,
    });
  } catch (error) {
    console.error('Error in patchUiHints:', error);
    next(error);
  }
}

/**
 * POST /api/game/mood
 * Update player's mood which affects scenario generation and AI agent tone
 * Body: { mood: 'anxious' | 'okay' | 'confident' }
 */
export async function postMood(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = getPlayerId(req);

    // Validate mood
    const moodSchema = z.object({
      mood: z.enum(['anxious', 'okay', 'confident']),
    });

    const validation = moodSchema.safeParse(req.body);
    if (!validation.success) {
      throw createHttpError(400, 'Invalid mood', {
        details: validation.error.issues,
      });
    }

    const { mood } = validation.data;

    // Load current state
    const existing = await gameRepo.loadState(playerId);
    if (!existing) {
      throw createHttpError(404, 'Game state not found');
    }

    const { snapshot: currentState, version: currentVersion } = existing;

    // Update mood in both player profile and game state
    const updatedState = {
      ...currentState,
      mood,
      player: {
        ...currentState.player,
        mood,
      },
    };

    // Save updated state
    await gameRepo.saveState(playerId, updatedState, currentVersion, currentState.health);

    res.json({
      success: true,
      mood,
      message: `Mood updated to ${mood}. This will affect future scenarios and AI guidance.`,
    });
  } catch (error) {
    console.error('Error in postMood:', error);
    next(error);
  }
}

/**
 * POST /api/game/chat
 * Chat with financial mentor using Azure OpenAI
 * Request body: { message: string, conversationHistory?: Array<{role, content}> }
 */
export async function postChatMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = getPlayerId(req);
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Get current game state for context
    const stateData = await gameRepo.loadState(playerId);
    const currentState = stateData?.snapshot || null;

    if (!currentState) {
      res.status(404).json({ error: 'Game state not found. Please start a new game first.' });
      return;
    }

    // Call Azure OpenAI with game state context
    const response = await chatWithMentor(message, currentState, conversationHistory);

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in postChatMessage:', error);
    next(error);
  }
}
