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
} from '../models/GameState';

/**
 * Service for game logic and state management using new domain model
 * TODO: Implement actual game mechanics, scenario generation, and state persistence
 */

export class GameLogicService {
  /**
   * Initialize a new game state for a player
   * TODO: Load from database or create new user profile
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

    // Initialize accounts based on role
    const { checking, savings, investment } = this.getInitialBalances(role, difficulty);
    const accounts: Account[] = [
      { id: `${userId}-checking`, type: 'checking', balance: checking },
      { id: `${userId}-savings`, type: 'savings', balance: savings },
      { id: `${userId}-investment`, type: 'investment', balance: investment },
    ];

    // Set fixed costs based on role
    const fixed = this.getFixedCosts(role, difficulty);

    // Set income plan based on role and difficulty
    const incomePlan = this.getIncomePlan(role, difficulty);

    // Generate first scenario
    const firstScenario = this.generateScenario({ player, accounts, fixed, incomePlan, health: 50, mood: 'okay', unlocked: { investingDistrict: false }, history: [] });

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
      lastScenario: firstScenario,
      history: [],
    };

    return initialState;
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
   * Get fixed costs based on role and difficulty
   */
  private getFixedCosts(role: Role, difficulty: Difficulty) {
    const baseCosts = {
      student: { rent: 600, food: 250, transport: 100, phoneInternet: 80 },
      earlyCareer: { rent: 1200, food: 400, transport: 200, phoneInternet: 100 },
      midCareer: { rent: 2000, food: 600, transport: 300, phoneInternet: 120 },
    };

    const multipliers = {
      easy: 0.8,
      normal: 1.0,
      hard: 1.3,
    };

    const base = baseCosts[role];
    const mult = multipliers[difficulty];

    return {
      rent: Math.round(base.rent * mult),
      food: Math.round(base.food * mult),
      transport: Math.round(base.transport * mult),
      phoneInternet: Math.round(base.phoneInternet * mult),
    };
  }

  /**
   * Get income plan based on role and difficulty
   */
  private getIncomePlan(role: Role, difficulty: Difficulty) {
    const baseIncomes = {
      student: 1200,
      earlyCareer: 3500,
      midCareer: 6500,
    };

    const multipliers = {
      easy: 1.2,
      normal: 1.0,
      hard: 0.8,
    };

    return {
      baseIncome: baseIncomes[role],
      difficultyMultiplier: multipliers[difficulty],
      eventsDelta: 0,
    };
  }

  /**
   * Generate a new scenario based on current game state
   * TODO: Implement sophisticated scenario generation based on progress, difficulty curve, etc.
   */
  generateScenario(state: GameState): Scenario {
    console.log(`TODO: Generate contextual scenario for ${state.player.role} with ${state.player.difficulty} difficulty`);

    // Mock scenario for now
    const mockScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      type: 'surpriseExpense',
      title: 'Coffee Shop Dilemma',
      description: "You're at your favorite coffee shop. The barista mentions they have a new loyalty card program. What do you do?",
      amount: 5,
      meta: {
        category: 'discretionary',
        difficulty: state.player.difficulty,
      },
    };

    return mockScenario;
  }

  /**
   * Generate choices for a scenario
   * TODO: Make choices contextual and role-specific
   */
  generateChoices(scenario: Scenario): Choice[] {
    // Mock choices for now
    return [
      {
        id: 'choice-1',
        label: 'Buy the $5 coffee and sign up for the loyalty program',
        consequences: {
          bankDelta: -5,
          savingsDelta: 0,
          debtDelta: 0,
          investDelta: 0,
          healthDelta: 2,
          notes: 'Enjoyed the treat, small positive mood boost',
        },
        text: 'Buy the $5 coffee and sign up for the loyalty program',
        description: 'Enjoy your treat and potentially save in the future',
        outcomes: { checkingChange: -5, healthScoreChange: 2 },
        relatedAgent: 'spenderSam',
      },
      {
        id: 'choice-2',
        label: 'Skip the coffee and save the money',
        consequences: {
          bankDelta: 0,
          savingsDelta: 5,
          debtDelta: 0,
          investDelta: 0,
          healthDelta: 5,
          notes: 'Resisted temptation, built savings discipline',
        },
        text: 'Skip the coffee and save the money',
        description: 'Resist the temptation and add to your savings',
        outcomes: { savingsChange: 5, healthScoreChange: 5 },
        relatedAgent: 'saverSiya',
      },
      {
        id: 'choice-3',
        label: 'Buy a cheaper option and invest the difference',
        consequences: {
          bankDelta: -2,
          savingsDelta: 0,
          debtDelta: 0,
          investDelta: 3,
          healthDelta: 7,
          notes: 'Balanced approach, started investing habit',
        },
        text: 'Buy a cheaper option and invest the difference',
        description: 'Find a middle ground approach',
        outcomes: { checkingChange: -2, investmentChange: 3, healthScoreChange: 7 },
        relatedAgent: 'mentor',
      },
    ];
  }

  /**
   * Process a player's choice and update game state
   * TODO: Implement complex state transitions, cascading effects, and save to database
   */
  processChoice(currentState: GameState, request: MakeChoiceRequest): GameState {
    const scenarioId = request.scenarioId || request.eventId;
    console.log(`TODO: Process choice ${request.choiceId} for scenario ${scenarioId}`);

    // Validate scenario
    if (!currentState.lastScenario || currentState.lastScenario.id !== scenarioId) {
      throw new Error('Invalid scenario ID');
    }

    // Generate choices for current scenario
    const choices = this.generateChoices(currentState.lastScenario);
    const choice = choices.find((c) => c.id === request.choiceId);
    if (!choice) {
      throw new Error('Invalid choice ID');
    }

    // Apply consequences to accounts
    const updatedAccounts = currentState.accounts.map((account) => {
      let balanceChange = 0;
      if (account.type === 'checking' && choice.consequences.bankDelta) {
        balanceChange = choice.consequences.bankDelta;
      } else if (account.type === 'savings' && choice.consequences.savingsDelta) {
        balanceChange = choice.consequences.savingsDelta;
      } else if (account.type === 'investment' && choice.consequences.investDelta) {
        balanceChange = choice.consequences.investDelta;
      }
      return { ...account, balance: account.balance + balanceChange };
    });

    // Update health score
    const newHealth = Math.min(
      100,
      Math.max(0, currentState.health + (choice.consequences.healthDelta || 0))
    );

    // Record decision in history
    const historyEntry = {
      scenarioId: currentState.lastScenario.id,
      choiceId: choice.id,
      delta: choice.consequences as GameDelta,
      at: new Date(),
    };

    // Generate next scenario
    const nextScenario = this.generateScenario({
      ...currentState,
      accounts: updatedAccounts,
      health: newHealth,
    });

    // Create updated game state
    const newState: GameState = {
      ...currentState,
      accounts: updatedAccounts,
      health: newHealth,
      mood: request.mood,
      lastScenario: nextScenario,
      history: [...currentState.history, historyEntry],
    };

    return newState;
  }

  /**
   * Calculate end-of-session statistics and insights
   * TODO: Implement comprehensive analytics and personalized insights
   */
  generatePlaybookSummary(gameState: GameState) {
    console.log('TODO: Generate comprehensive playbook summary with analytics');

    // Calculate totals from history
    const totalDays = gameState.history.length;
    const checkingAccount = gameState.accounts.find((a) => a.type === 'checking');
    const savingsAccount = gameState.accounts.find((a) => a.type === 'savings');
    const investmentAccount = gameState.accounts.find((a) => a.type === 'investment');

    return {
      totalDays,
      totalIncome: gameState.incomePlan.baseIncome * gameState.incomePlan.difficultyMultiplier,
      totalSpending: 200, // TODO: Calculate from history
      totalSaved: savingsAccount?.balance || 0,
      totalInvested: investmentAccount?.balance || 0,
      healthScoreProgression: [50, gameState.health], // TODO: Track over time
      keyDecisions: gameState.history.slice(-5).map((entry, idx) => ({
        day: idx + 1,
        event: 'Financial Decision',
        choice: entry.choiceId,
        outcome: entry.delta.notes || 'Decision made',
      })),
      insights: [
        "You're showing great restraint with discretionary spending!",
        'Consider increasing your emergency fund to 3 months of expenses.',
        'Your investment balance could benefit from more consistent contributions.',
      ],
    };
  }
}

export const gameLogicService = new GameLogicService();
