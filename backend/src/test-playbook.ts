/**
 * Test runner for playbook service
 * Run with: npm run test:playbook
 */

import { generatePlaybook } from './services/playbook';
import { GameState, GameDelta, PlayerProfile } from './models/GameState';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;
let currentSuite = '';

function describe(suiteName: string, fn: () => void): void {
  currentSuite = suiteName;
  console.log(`\n${suiteName}`);
  fn();
}

function it(testName: string, fn: () => void): void {
  try {
    fn();
    testsPassed++;
    console.log(`  ✓ ${testName}`);
  } catch (error) {
    testsFailed++;
    console.log(`  ✗ ${testName}`);
    if (error instanceof Error) {
      console.log(`    ${error.message}`);
    }
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual(expected: any) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${actualStr} to equal ${expectedStr}`);
      }
    },
    toContain(expected: any) {
      if (!Array.isArray(actual) || !actual.includes(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to contain ${expected}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (actual < expected) {
        throw new Error(`Expected ${actual} to be >= ${expected}`);
      }
    },
    toBeCloseTo(expected: number, precision: number) {
      const diff = Math.abs(actual - expected);
      if (diff > Math.pow(10, -precision)) {
        throw new Error(`Expected ${actual} to be close to ${expected}`);
      }
    },
    toBeInstanceOf(expectedClass: any) {
      if (!(actual instanceof expectedClass)) {
        throw new Error(`Expected ${actual} to be instance of ${expectedClass.name}`);
      }
    },
    arrayContaining(expectedItems: any[]) {
      return {
        matches(arr: any[]) {
          for (const item of expectedItems) {
            let found = false;
            for (const arrItem of arr) {
              if (typeof item === 'object' && 'test' in item) {
                // It's a regex matcher
                if (item.test(arrItem)) {
                  found = true;
                  break;
                }
              } else if (arrItem === item) {
                found = true;
                break;
              }
            }
            if (!found) {
              throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
            }
          }
        },
      };
    },
    stringMatching(pattern: RegExp) {
      return {
        test: (str: string) => pattern.test(str),
      };
    },
  };
}

// Helper to check array containing with matchers
function expectArrayContaining(actual: any[], matchers: any[]) {
  for (const matcher of matchers) {
    let found = false;
    for (const item of actual) {
      if (typeof matcher === 'object' && 'test' in matcher && matcher.test(item)) {
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error(
        `Expected array ${JSON.stringify(actual)} to contain item matching pattern`
      );
    }
  }
}

// Test data helpers
function createBaseState(overrides?: Partial<GameState>): GameState {
  const basePlayer: PlayerProfile = {
    id: 'test-player',
    role: 'earlyCareer',
    mood: 'okay',
    difficulty: 'normal',
    createdAt: new Date('2025-01-01'),
  };

  return {
    player: basePlayer,
    accounts: [
      { id: 'checking', type: 'checking', balance: 1000 },
      { id: 'savings', type: 'savings', balance: 500 },
      { id: 'investment', type: 'investment', balance: 0 },
    ],
    fixed: {
      rent: 800,
      food: 300,
      transport: 100,
      phoneInternet: 100,
    },
    incomePlan: {
      baseIncome: 3000,
      difficultyMultiplier: 1.0,
      eventsDelta: 0,
    },
    health: 50,
    mood: 'okay',
    unlocked: {
      investingDistrict: false,
    },
    history: [],
    ...overrides,
  };
}

function createHistoryEntry(
  scenarioId: string,
  choiceId: string,
  delta: Partial<GameDelta>,
  daysAgo: number = 0
): {
  scenarioId: string;
  choiceId: string;
  delta: GameDelta;
  at: Date;
} {
  const fullDelta: GameDelta = {
    bankDelta: 0,
    savingsDelta: 0,
    debtDelta: 0,
    investDelta: 0,
    healthDelta: 0,
    ...delta,
  };

  const date = new Date('2025-01-01');
  date.setDate(date.getDate() + daysAgo);

  return {
    scenarioId,
    choiceId,
    delta: fullDelta,
    at: date,
  };
}

// Run tests
console.log('\n=== Money Playbook Generator Tests ===\n');

describe('Impulsive Spender Persona', () => {
  it('should detect impulsive spending patterns', () => {
    const state = createBaseState({
      health: 35,
      history: [
        createHistoryEntry('coffeeChoice', 'yoloBuy', { bankDelta: -50, healthDelta: -1 }, 1),
        createHistoryEntry('lunchChoice', 'splurgeRestaurant', { bankDelta: -80, healthDelta: -1 }, 2),
        createHistoryEntry('shoppingChoice', 'treatYourself', { bankDelta: -150, healthDelta: -2 }, 3),
        createHistoryEntry('weekendChoice', 'tripWithFriends', { bankDelta: -300, healthDelta: 1 }, 4),
        createHistoryEntry('gadgetChoice', 'yoloBuy', { bankDelta: -400, healthDelta: -3 }, 5),
        createHistoryEntry('rentBill', 'payOnTime', { bankDelta: -800, healthDelta: 2 }, 6),
        createHistoryEntry('entertainmentChoice', 'splurge', { bankDelta: -120, healthDelta: -1 }, 7),
        createHistoryEntry('clothesChoice', 'yoloBuy', { bankDelta: -200, healthDelta: -2 }, 8),
      ],
    });

    const playbook = generatePlaybook(state);

    expect(playbook.patterns).toContain('Impulse spender');
    expect(playbook.stats.avgSavingsRate).toBeLessThan(20);
    expectArrayContaining(playbook.tips, [/24-hour wait|wait/i]);
    expect(playbook.stats.onTimeBillsPct).toBeGreaterThan(0);
    expect(playbook.stats.maxDebt).toBe(0);
  });

  it('should be deterministic for same input', () => {
    const state = createBaseState({
      health: 35,
      history: [
        createHistoryEntry('choice1', 'yoloBuy', { bankDelta: -250 }, 1),
        createHistoryEntry('choice2', 'splurge', { bankDelta: -180 }, 2),
        createHistoryEntry('choice3', 'treatYourself', { bankDelta: -220 }, 3),
      ],
    });

    const playbook1 = generatePlaybook(state);
    const playbook2 = generatePlaybook(state);

    expect(playbook1).toEqual(playbook2);
  });
});

describe('Steady Saver Persona', () => {
  it('should detect consistent saving patterns', () => {
    const state = createBaseState({
      health: 75,
      history: [
        createHistoryEntry('paydayChoice', 'autoSave', { savingsDelta: 300, healthDelta: 2 }, 1),
        createHistoryEntry('bonusChoice', 'saveHalf', { savingsDelta: 250, healthDelta: 1 }, 2),
        createHistoryEntry('rentBill', 'payOnTime', { bankDelta: -800, healthDelta: 2 }, 3),
        createHistoryEntry('extraIncomeChoice', 'saveAll', { savingsDelta: 150, healthDelta: 1 }, 4),
        createHistoryEntry('monthlyChoice', 'autoSave', { savingsDelta: 300, healthDelta: 2 }, 5),
        createHistoryEntry('utilitiesBill', 'payOnTime', { bankDelta: -100, healthDelta: 1 }, 6),
        createHistoryEntry('savingsGoal', 'contribute', { savingsDelta: 200, healthDelta: 2 }, 7),
        createHistoryEntry('paydayChoice', 'autoSave', { savingsDelta: 300, healthDelta: 2 }, 8),
        createHistoryEntry('foodBill', 'budgetMeal', { bankDelta: -50, healthDelta: 1 }, 9),
        createHistoryEntry('monthlyChoice', 'autoSave', { savingsDelta: 300, healthDelta: 2 }, 10),
      ],
    });

    const playbook = generatePlaybook(state);

    expect(playbook.patterns).toContain('Steady saver');
    expect(playbook.stats.avgSavingsRate).toBeGreaterThanOrEqual(60);
    expect(playbook.stats.onTimeBillsPct).toBe(100);
    expect(playbook.stats.maxDebt).toBe(0);
    expectArrayContaining(playbook.tips, [/investing|unlock|60 health/i]);
  });

  it('should be deterministic for same input', () => {
    const state = createBaseState({
      health: 75,
      history: [
        createHistoryEntry('save1', 'autoSave', { savingsDelta: 300 }, 1),
        createHistoryEntry('save2', 'autoSave', { savingsDelta: 300 }, 2),
        createHistoryEntry('bill1', 'payOnTime', { bankDelta: -800, healthDelta: 2 }, 3),
        createHistoryEntry('save3', 'autoSave', { savingsDelta: 300 }, 4),
        createHistoryEntry('save4', 'autoSave', { savingsDelta: 300 }, 5),
      ],
    });

    const playbook1 = generatePlaybook(state);
    const playbook2 = generatePlaybook(state);

    expect(playbook1).toEqual(playbook2);
  });
});

describe('Crisis-Recovery Persona', () => {
  it('should detect crisis handling patterns', () => {
    const state = createBaseState({
      health: 58,
      history: [
        createHistoryEntry('setup1', 'autoSave', { savingsDelta: 300 }, 1),
        createHistoryEntry('setup2', 'autoSave', { savingsDelta: 300 }, 2),
        createHistoryEntry('medicalCrisis', 'useEmergencyFund', {
          savingsDelta: -800,
          healthDelta: -8,
        }, 3),
        createHistoryEntry('medicalCrisis', 'paymentPlan', {
          debtDelta: 400,
          healthDelta: -5,
        }, 4),
        createHistoryEntry('carEmergency', 'useCredit', {
          debtDelta: 600,
          healthDelta: -3,
        }, 5),
        createHistoryEntry('recovery1', 'payDebt', {
          bankDelta: -200,
          debtDelta: -200,
          healthDelta: 3,
        }, 6),
        createHistoryEntry('recovery2', 'payDebt', {
          bankDelta: -200,
          debtDelta: -200,
          healthDelta: 3,
        }, 7),
        createHistoryEntry('recovery3', 'budgetMode', {
          savingsDelta: 100,
          healthDelta: 2,
        }, 8),
        createHistoryEntry('layoffCrisis', 'useEmergencyFund', {
          savingsDelta: -500,
          debtDelta: 300,
          healthDelta: -6,
        }, 9),
        createHistoryEntry('recovery4', 'sidehustle', {
          bankDelta: 400,
          healthDelta: 4,
        }, 10),
      ],
    });

    const playbook = generatePlaybook(state);

    expectArrayContaining(playbook.patterns, [/crisis/i]);
    expect(playbook.stats.crisisHandled).toBeGreaterThanOrEqual(1);
    expect(playbook.stats.maxDebt).toBeGreaterThan(0);
    expectArrayContaining(playbook.tips, [/debt|minimum|smallest|pay/i]);
  });

  it('should be deterministic for same input', () => {
    const state = createBaseState({
      health: 58,
      history: [
        createHistoryEntry('medicalCrisis', 'useEmergencyFund', {
          savingsDelta: -800,
          healthDelta: -8,
        }, 1),
        createHistoryEntry('recovery', 'payDebt', {
          bankDelta: -200,
          debtDelta: -200,
          healthDelta: 3,
        }, 2),
        createHistoryEntry('carEmergency', 'useCredit', {
          debtDelta: 600,
          healthDelta: -3,
        }, 3),
      ],
    });

    const playbook1 = generatePlaybook(state);
    const playbook2 = generatePlaybook(state);

    expect(playbook1).toEqual(playbook2);
  });
});

describe('Edge Cases', () => {
  it('should handle empty history gracefully', () => {
    const state = createBaseState({
      history: [],
    });

    const playbook = generatePlaybook(state);

    expect(playbook.patterns).toEqual(['Building financial habits']);
    expect(playbook.tips.length).toBeGreaterThanOrEqual(3);
    expect(playbook.stats.onTimeBillsPct).toBe(100);
    expect(playbook.stats.avgSavingsRate).toBe(0);
    expect(playbook.stats.maxDebt).toBe(0);
    expect(playbook.stats.crisisHandled).toBe(0);
  });

  it('should calculate correct statistics', () => {
    const state = createBaseState({
      history: [
        createHistoryEntry('bill1', 'payOnTime', { bankDelta: -100, healthDelta: 1 }, 1),
        createHistoryEntry('bill2', 'payLate', { bankDelta: -100, healthDelta: -5 }, 2),
        createHistoryEntry('save1', 'autoSave', { savingsDelta: 300 }, 3),
        createHistoryEntry('debt1', 'takeCredit', { debtDelta: 500 }, 4),
        createHistoryEntry('bill3', 'payOnTime', { bankDelta: -100, healthDelta: 1 }, 5),
        createHistoryEntry('debt2', 'payOff', { debtDelta: -200 }, 6),
        createHistoryEntry('save2', 'autoSave', { savingsDelta: 300 }, 7),
        createHistoryEntry('crisis1', 'handle', { debtDelta: 200, healthDelta: -3 }, 8),
      ],
    });

    const playbook = generatePlaybook(state);

    // Bill payment: 2 on time out of 3 bills = 67%
    expect(playbook.stats.onTimeBillsPct).toBeCloseTo(67, 0);

    // Savings: 2 savings actions out of 8 total = 25%
    expect(playbook.stats.avgSavingsRate).toBe(25);

    // Max debt: 500 + 200 - 200 = 500
    expect(playbook.stats.maxDebt).toBe(500);

    // Crisis handled: 1 crisis with reasonable outcome
    expect(playbook.stats.crisisHandled).toBe(1);
  });
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);
console.log(`${'='.repeat(50)}\n`);

if (testsFailed > 0) {
  process.exit(1);
}
