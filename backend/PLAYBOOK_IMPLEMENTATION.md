# Money Playbook Generator - Implementation Summary

## Overview
Created `backend/src/services/playbook.ts` with a deterministic financial behavior analysis system that generates personalized insights from player history.

## Core Function

```typescript
generatePlaybook(state: GameState) → PlaybookResult
```

### Returns:
```typescript
{
  patterns: string[],  // Top 3 behavioral patterns detected
  tips: string[],      // 3-5 actionable micro-tips
  stats: {
    onTimeBillsPct: number,    // 0-100
    avgSavingsRate: number,    // 0-100
    maxDebt: number,           // Peak debt reached
    crisisHandled: number      // Crisis scenarios handled well
  }
}
```

## Key Features

### 1. Deterministic Output
- Same game state always produces identical results
- No randomness or timestamps affecting output
- Consistent pattern detection and tip generation

### 2. Behavioral Pattern Detection (7 patterns tracked)
- **Impulse spender** - Frequent discretionary spending
- **Steady saver** - High savings rate (>50%)
- **Debt avoider** - Zero debt across history
- **Crisis survivor** - Successfully handles 70%+ of crises
- **Bills always on time** - 100% on-time payment record
- **Panic seller** - Investment volatility reactions
- **Lives paycheck to paycheck** - Low savings rate

Patterns are ranked by strength and top 3 are returned.

### 3. Actionable Micro-Tips (Tiny & Specific)
Examples of generated tips:
- "24-hour wait before big buys"
- "First $100 emergency fund"
- "$50 buffer stops overdrafts"
- "Pay minimum on all, extra on smallest"
- "Emergency fund = 1 month rent first"
- "Markets recover—hold through dips"
- "One financial choice at a time"

### 4. Statistical Analysis
- **On-time bills**: Tracks bill payment reliability
- **Savings rate**: Percentage of savings actions vs total decisions
- **Max debt**: Peak cumulative debt reached
- **Crisis handling**: Count of crisis scenarios handled without catastrophic outcomes

## Test Coverage

### Three Personas Tested

#### 1. Impulsive Spender
- 8 decisions with mostly discretionary spending
- Detects impulse pattern
- Low savings rate (<20%)
- Recommends waiting strategies

#### 2. Steady Saver  
- 10 decisions with 70% savings actions
- Detects steady saver + debt avoider patterns
- 100% on-time bills
- Recommends investing unlock

#### 3. Crisis-Recovery
- 10 decisions including 3 crisis scenarios
- Medical emergency, car breakdown, layoff
- Successfully pays down debt
- Detects crisis survivor pattern
- Provides debt payoff tips

### Test Results
```
✓ Impulsive spender detection
✓ Impulsive spender deterministic
✓ Steady saver detection  
✓ Steady saver deterministic
✓ Crisis recovery detection
✓ Crisis recovery deterministic
✓ Empty history edge case
✓ Statistical calculation accuracy

8/8 tests passing
```

## Usage Example

```typescript
import { generatePlaybook } from './services/playbook';

const playbook = generatePlaybook(gameState);

console.log(playbook.patterns);
// ["Steady saver", "Bills always on time", "Debt avoider"]

console.log(playbook.tips);
// ["Unlock investing at 60 health", "Build 3-month emergency cushion", ...]

console.log(playbook.stats);
// { onTimeBillsPct: 100, avgSavingsRate: 70, maxDebt: 0, crisisHandled: 0 }
```

## Implementation Details

### Pattern Strength Scoring
Each pattern has a strength value (0-1) based on:
- Frequency of behavior (e.g., impulse ratio)
- Achievement thresholds (e.g., 100% on-time bills)
- Severity indicators (e.g., crisis scenarios)

Top 3 patterns by strength are returned, ensuring most relevant insights surface first.

### Tip Prioritization
Tips are generated in priority order:
1. Critical issues (late bills, high debt)
2. Growth opportunities (investing unlock, emergency fund)
3. Pattern-specific advice (wait strategies, rebalancing)
4. Encouragement (health milestones)

Up to 5 tips returned, with fallback general tips if < 3 specific tips apply.

### Crisis Detection
Crisis scenarios identified by scenarioId containing:
- `crisis`
- `emergency`
- `layoff`
- `medical`
- `crash`

Handled well if: debtDelta < 500 AND healthDelta > -10

## Files Created

1. `backend/src/services/playbook.ts` - Core implementation (350 lines)
2. `backend/src/test-playbook.ts` - Test runner (500 lines)
3. Updated `backend/package.json` - Added `test:playbook` script

## Acceptance Criteria Met

✅ **Deterministic output** - Same input always produces same result  
✅ **Tiny, actionable language** - All tips are short, specific micro-actions  
✅ **Three persona tests** - Impulsive, steady saver, crisis-recovery  
✅ **generatePlaybook function** - Returns patterns, tips, stats as specified

## Run Tests

```bash
npm run test:playbook
```
