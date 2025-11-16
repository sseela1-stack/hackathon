/**
 * Money Playbook Generator
 * Analyzes player history to provide actionable financial insights
 */

import { GameState, GameDelta } from '../models/GameState';

/**
 * Playbook analysis result
 */
export interface PlaybookResult {
  /** Detected behavioral patterns */
  patterns: string[];
  
  /** Actionable micro-tips */
  tips: string[];
  
  /** Statistical summary */
  stats: {
    /** Percentage of bills paid on time (0-100) */
    onTimeBillsPct: number;
    
    /** Average savings rate (0-100) */
    avgSavingsRate: number;
    
    /** Maximum debt reached */
    maxDebt: number;
    
    /** Number of crisis scenarios successfully handled */
    crisisHandled: number;
  };
}

/**
 * Decision record from game history
 */
interface HistoryEntry {
  scenarioId: string;
  choiceId: string;
  delta: GameDelta;
  at: Date;
}

/**
 * Generate a personalized financial playbook based on player history
 * Output is deterministic for the same game state
 * 
 * @param state Current game state with decision history
 * @returns Playbook with patterns, tips, and statistics
 */
export function generatePlaybook(state: GameState): PlaybookResult {
  const history = state.history;
  
  // Calculate statistics
  const stats = calculateStats(state, history);
  
  // Detect behavioral patterns
  const patterns = detectPatterns(state, history, stats);
  
  // Generate actionable tips
  const tips = generateTips(state, patterns, stats);
  
  return {
    patterns,
    tips,
    stats,
  };
}

/**
 * Calculate key financial statistics from history
 */
function calculateStats(state: GameState, history: HistoryEntry[]): PlaybookResult['stats'] {
  if (history.length === 0) {
    return {
      onTimeBillsPct: 100,
      avgSavingsRate: 0,
      maxDebt: 0,
      crisisHandled: 0,
    };
  }
  
  // On-time bill payments: look for late payment indicators
  const billScenarios = history.filter(h => 
    h.scenarioId.includes('bill') || 
    h.scenarioId.includes('rent') ||
    h.scenarioId.includes('utilities')
  );
  
  const latePayments = history.filter(h =>
    h.choiceId.includes('late') ||
    h.choiceId.includes('skip') ||
    (h.delta.healthDelta < -2 && (h.scenarioId.includes('bill') || h.scenarioId.includes('rent')))
  );
  
  const onTimeBillsPct = billScenarios.length > 0
    ? Math.round(((billScenarios.length - latePayments.length) / billScenarios.length) * 100)
    : 100;
  
  // Average savings rate: positive savings deltas as percentage of available decisions
  const savingsActions = history.filter(h => h.delta.savingsDelta > 0);
  const avgSavingsRate = Math.round((savingsActions.length / history.length) * 100);
  
  // Maximum debt: cumulative debt delta (positive debtDelta = more debt)
  let currentDebt = 0;
  let maxDebt = 0;
  
  for (const entry of history) {
    currentDebt += entry.delta.debtDelta;
    if (currentDebt > maxDebt) {
      maxDebt = currentDebt;
    }
  }
  
  maxDebt = Math.round(maxDebt);
  
  // Crisis scenarios handled: crisis/emergency scenarios where player avoided worst outcome
  const crisisScenarios = history.filter(h =>
    h.scenarioId.includes('crisis') ||
    h.scenarioId.includes('emergency') ||
    h.scenarioId.includes('layoff') ||
    h.scenarioId.includes('medical') ||
    h.scenarioId.includes('crash')
  );
  
  const crisisHandled = crisisScenarios.filter(h => {
    // Handled well if: didn't take on massive debt AND health didn't tank
    return h.delta.debtDelta < 500 && h.delta.healthDelta > -10;
  }).length;
  
  return {
    onTimeBillsPct,
    avgSavingsRate,
    maxDebt,
    crisisHandled,
  };
}

/**
 * Detect behavioral patterns from history
 * Patterns are sorted by strength (most prominent first)
 */
function detectPatterns(
  state: GameState,
  history: HistoryEntry[],
  stats: PlaybookResult['stats']
): string[] {
  if (history.length < 3) {
    return ['Building financial habits'];
  }
  
  const patterns: Array<{ pattern: string; strength: number }> = [];
  
  // Pattern 1: Impulsive spending (high spending choices)
  const impulseChoices = history.filter(h =>
    h.choiceId.includes('yolo') ||
    h.choiceId.includes('splurge') ||
    h.choiceId.includes('trip') ||
    h.choiceId.includes('treat') ||
    (h.delta.bankDelta < -200 && !h.scenarioId.includes('bill'))
  );
  
  const impulseRatio = impulseChoices.length / history.length;
  if (impulseRatio > 0.4) {
    patterns.push({ pattern: 'Impulse spender', strength: impulseRatio });
  } else if (impulseRatio < 0.15 && history.length > 5) {
    patterns.push({ pattern: 'Disciplined spender', strength: 1 - impulseRatio });
  }
  
  // Pattern 2: Steady saver
  if (stats.avgSavingsRate > 50) {
    patterns.push({ pattern: 'Steady saver', strength: 0.98 }); // High priority
  } else if (stats.avgSavingsRate > 30) {
    patterns.push({ pattern: 'Steady saver', strength: 0.85 });
  } else if (stats.avgSavingsRate < 15 && history.length > 5) {
    patterns.push({ pattern: 'Lives paycheck to paycheck', strength: 0.7 });
  }
  
  // Pattern 3: Debt avoidance or dependency
  if (stats.maxDebt === 0 && history.length > 7) {
    patterns.push({ pattern: 'Debt avoider', strength: 0.9 });
  } else if (stats.maxDebt > 2000) {
    patterns.push({ pattern: 'Debt dependent', strength: Math.min(stats.maxDebt / 3000, 1) });
  }
  
  // Pattern 4: Crisis recovery
  const crisisScenarios = history.filter(h =>
    h.scenarioId.includes('crisis') || 
    h.scenarioId.includes('emergency') ||
    h.scenarioId.includes('layoff') ||
    h.scenarioId.includes('medical')
  );
  
  if (crisisScenarios.length > 0 && stats.crisisHandled >= crisisScenarios.length * 0.7) {
    patterns.push({ pattern: 'Crisis survivor', strength: 0.92 });
  } else if (crisisScenarios.length > 2 && stats.crisisHandled === 0) {
    patterns.push({ pattern: 'Crisis struggles', strength: 0.8 });
  }
  
  // Pattern 5: Bill payment reliability
  if (stats.onTimeBillsPct === 100 && history.length > 5) {
    patterns.push({ pattern: 'Bills always on time', strength: 0.95 });
  } else if (stats.onTimeBillsPct < 70) {
    patterns.push({ pattern: 'Late payment pattern', strength: 0.75 });
  }
  
  // Pattern 6: Investment behavior (if unlocked)
  if (state.unlocked.investingDistrict) {
    const investmentMoves = history.filter(h => Math.abs(h.delta.investDelta) > 0);
    const panicSells = history.filter(h =>
      h.choiceId.includes('panic') || h.choiceId.includes('sell')
    );
    
    if (investmentMoves.length > 3) {
      if (panicSells.length > 1) {
        patterns.push({ pattern: 'Panic seller', strength: 0.7 });
      } else {
        patterns.push({ pattern: 'Long-term investor', strength: 0.8 });
      }
    }
  }
  
  // Pattern 7: Emergency fund usage
  const emergencyDips = history.filter(h =>
    h.delta.savingsDelta < -100 && !h.scenarioId.includes('transfer')
  );
  
  if (emergencyDips.length > 3) {
    patterns.push({ pattern: 'Taps emergency fund often', strength: 0.65 });
  }
  
  // Sort by strength and return top 3 patterns
  patterns.sort((a, b) => b.strength - a.strength);
  
  const result = patterns.slice(0, 3).map(p => p.pattern);
  
  // Default if no strong patterns
  if (result.length === 0) {
    return ['Balanced approach'];
  }
  
  return result;
}

/**
 * Generate actionable micro-tips based on patterns and stats
 * Tips are tiny, specific, and immediately actionable
 */
function generateTips(
  state: GameState,
  patterns: string[],
  stats: PlaybookResult['stats']
): string[] {
  const tips: string[] = [];
  
  // Tip 1: Based on spending pattern
  if (patterns.includes('Impulse spender')) {
    tips.push('24-hour wait before big buys');
  } else if (patterns.includes('Lives paycheck to paycheck')) {
    tips.push('$50 buffer stops overdrafts');
  }
  
  // Tip 2: Based on savings behavior
  if (stats.avgSavingsRate < 20) {
    tips.push('First $100 emergency fund');
  } else if (stats.avgSavingsRate > 40 && !state.unlocked.investingDistrict) {
    tips.push('Unlock investing at 60 health');
  }
  
  // Tip 3: Based on debt
  if (stats.maxDebt > 500) {
    tips.push('Pay minimum on all, extra on smallest');
  } else if (stats.maxDebt === 0 && state.health > 50) {
    tips.push('Build 3-month emergency cushion');
  }
  
  // Tip 4: Based on bill payment
  if (stats.onTimeBillsPct < 90) {
    tips.push('Set auto-pay for fixed bills');
  }
  
  // Tip 5: Based on crisis handling
  if (patterns.includes('Crisis struggles')) {
    tips.push('Emergency fund = 1 month rent first');
  } else if (patterns.includes('Crisis survivor') && stats.crisisHandled > 2) {
    tips.push('You handle surprises well—keep it up');
  }
  
  // Tip 6: Investment-specific
  if (state.unlocked.investingDistrict) {
    if (patterns.includes('Panic seller')) {
      tips.push('Markets recover—hold through dips');
    } else if (patterns.includes('Long-term investor')) {
      tips.push('Rebalance yearly, not daily');
    }
  }
  
  // Tip 7: Emergency fund usage
  if (patterns.includes('Taps emergency fund often')) {
    tips.push('Emergency fund = true emergencies only');
  }
  
  // Tip 8: Health-based encouragement
  if (state.health < 40) {
    tips.push('Small wins: one on-time bill');
  } else if (state.health >= 60 && state.health < 80) {
    tips.push("You're in the green zone");
  } else if (state.health >= 80) {
    tips.push('Financial confidence unlocked');
  }
  
  // Ensure we have at least 3 tips, prioritize most relevant
  const prioritizedTips = tips.slice(0, 5);
  
  // Add general fallback tips if needed
  if (prioritizedTips.length < 3) {
    const fallbacks = [
      'Track spending for one week',
      'Round up purchases to nearest $5',
      'One financial choice at a time',
    ];
    
    for (const fallback of fallbacks) {
      if (prioritizedTips.length >= 3) break;
      if (!prioritizedTips.includes(fallback)) {
        prioritizedTips.push(fallback);
      }
    }
  }
  
  return prioritizedTips.slice(0, 5); // Return up to 5 tips
}
