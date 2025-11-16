/**
 * Tests for health score helper functions
 * 
 * Run: npm run test:health-helpers
 */

import {
  paymentsOnTimeRatio,
  savingsRateDelta,
  debtUtilization,
  emergencyFundMonths,
  calculateHealthScore,
} from './services/gameLogic';

console.log('🧪 Testing health score helper functions...\n');

// ============================================================================
// Test paymentsOnTimeRatio
// ============================================================================

console.log('📊 Testing paymentsOnTimeRatio...\n');

// Test 1: Perfect payment history
{
  const history = [
    { billsPaidOnTime: true },
    { billsPaidOnTime: true },
    { billsPaidOnTime: true },
  ];
  const ratio = paymentsOnTimeRatio(history);
  
  if (ratio === 1.0) {
    console.log('✅ Test 1: Perfect payment history (3/3) = 1.0');
  } else {
    console.log('❌ Test 1: Failed. Expected 1.0, got', ratio);
  }
}

// Test 2: Mixed payment history
{
  const history = [
    { billsPaidOnTime: true },
    { billsPaidOnTime: true },
    { billsPaidOnTime: false },
    { billsPaidOnTime: true },
  ];
  const ratio = paymentsOnTimeRatio(history);
  const expected = 0.75;
  
  if (ratio === expected) {
    console.log('✅ Test 2: Mixed history (3/4) = 0.75');
  } else {
    console.log('❌ Test 2: Failed. Expected', expected, 'got', ratio);
  }
}

// Test 3: No on-time payments
{
  const history = [
    { billsPaidOnTime: false },
    { billsPaidOnTime: false },
  ];
  const ratio = paymentsOnTimeRatio(history);
  
  if (ratio === 0) {
    console.log('✅ Test 3: No on-time payments (0/2) = 0.0');
  } else {
    console.log('❌ Test 3: Failed. Expected 0, got', ratio);
  }
}

// Test 4: Empty history (default to perfect)
{
  const history: Array<{ billsPaidOnTime: boolean }> = [];
  const ratio = paymentsOnTimeRatio(history);
  
  if (ratio === 1.0) {
    console.log('✅ Test 4: Empty history defaults to 1.0 (benefit of doubt)');
  } else {
    console.log('❌ Test 4: Failed. Expected 1.0, got', ratio);
  }
}

console.log();

// ============================================================================
// Test savingsRateDelta
// ============================================================================

console.log('💰 Testing savingsRateDelta...\n');

// Test 5: Saved 25% of income
{
  const ratio = savingsRateDelta(1000, 1500, 2000);
  const expected = 0.25;
  
  if (ratio === expected) {
    console.log('✅ Test 5: Saved $500 out of $2000 income = 0.25');
  } else {
    console.log('❌ Test 5: Failed. Expected', expected, 'got', ratio);
  }
}

// Test 6: Saved 100% of income (clamped to 1.0)
{
  const ratio = savingsRateDelta(1000, 3000, 2000);
  const expected = 1.0;
  
  if (ratio === expected) {
    console.log('✅ Test 6: Saved $2000 out of $2000 income = 1.0 (100%)');
  } else {
    console.log('❌ Test 6: Failed. Expected', expected, 'got', ratio);
  }
}

// Test 7: Lost savings (negative, clamped to 0)
{
  const ratio = savingsRateDelta(1000, 800, 2000);
  const expected = 0;
  
  if (ratio === expected) {
    console.log('✅ Test 7: Lost $200 savings = 0.0 (clamped from negative)');
  } else {
    console.log('❌ Test 7: Failed. Expected', expected, 'got', ratio);
  }
}

// Test 8: No income (edge case)
{
  const ratio = savingsRateDelta(1000, 1200, 0);
  const expected = 0;
  
  if (ratio === expected) {
    console.log('✅ Test 8: No income case = 0.0 (avoid division by zero)');
  } else {
    console.log('❌ Test 8: Failed. Expected', expected, 'got', ratio);
  }
}

// Test 9: Over 100% savings (clamped)
{
  const ratio = savingsRateDelta(0, 5000, 2000);
  const expected = 1.0;
  
  if (ratio === expected) {
    console.log('✅ Test 9: Saved $5000 on $2000 income = 1.0 (clamped at 100%)');
  } else {
    console.log('❌ Test 9: Failed. Expected', expected, 'got', ratio);
  }
}

console.log();

// ============================================================================
// Test debtUtilization
// ============================================================================

console.log('📉 Testing debtUtilization...\n');

// Test 10: No debt (best case)
{
  const score = debtUtilization(0, 3000);
  const expected = 1.0;
  
  if (score === expected) {
    console.log('✅ Test 10: No debt = 1.0 (best score)');
  } else {
    console.log('❌ Test 10: Failed. Expected', expected, 'got', score);
  }
}

// Test 11: Debt equals monthly income
{
  const score = debtUtilization(3000, 3000);
  const expected = 0.5;
  
  if (score === expected) {
    console.log('✅ Test 11: Debt = income = 0.5 (50% score)');
  } else {
    console.log('❌ Test 11: Failed. Expected', expected, 'got', score);
  }
}

// Test 12: Debt is 2x income (capped at worst)
{
  const score = debtUtilization(6000, 3000);
  const expected = 0.0;
  
  if (score === expected) {
    console.log('✅ Test 12: Debt = 2x income = 0.0 (worst score, capped)');
  } else {
    console.log('❌ Test 12: Failed. Expected', expected, 'got', score);
  }
}

// Test 13: Debt is 3x income (still capped at 0)
{
  const score = debtUtilization(9000, 3000);
  const expected = 0.0;
  
  if (score === expected) {
    console.log('✅ Test 13: Debt = 3x income = 0.0 (capped at 2x)');
  } else {
    console.log('❌ Test 13: Failed. Expected', expected, 'got', score);
  }
}

// Test 14: Half of income in debt
{
  const score = debtUtilization(1500, 3000);
  const expected = 0.75;
  
  if (score === expected) {
    console.log('✅ Test 14: Debt = 0.5x income = 0.75');
  } else {
    console.log('❌ Test 14: Failed. Expected', expected, 'got', score);
  }
}

// Test 15: No income (edge case)
{
  const score = debtUtilization(1000, 0);
  const expected = 0;
  
  if (score === expected) {
    console.log('✅ Test 15: No income with debt = 0.0 (worst case)');
  } else {
    console.log('❌ Test 15: Failed. Expected', expected, 'got', score);
  }
}

console.log();

// ============================================================================
// Test emergencyFundMonths
// ============================================================================

console.log('🏦 Testing emergencyFundMonths...\n');

// Test 16: 3 months of coverage
{
  const months = emergencyFundMonths(6000, 2000);
  const expected = 3.0;
  
  if (months === expected) {
    console.log('✅ Test 16: $6000 savings / $2000 costs = 3.0 months');
  } else {
    console.log('❌ Test 16: Failed. Expected', expected, 'got', months);
  }
}

// Test 17: Over 6 months (capped)
{
  const months = emergencyFundMonths(15000, 2000);
  const expected = 6.0;
  
  if (months === expected) {
    console.log('✅ Test 17: $15000 savings = 6.0 months (capped at 6)');
  } else {
    console.log('❌ Test 17: Failed. Expected', expected, 'got', months);
  }
}

// Test 18: No savings
{
  const months = emergencyFundMonths(0, 2000);
  const expected = 0;
  
  if (months === expected) {
    console.log('✅ Test 18: No savings = 0.0 months');
  } else {
    console.log('❌ Test 18: Failed. Expected', expected, 'got', months);
  }
}

// Test 19: Exactly 6 months
{
  const months = emergencyFundMonths(12000, 2000);
  const expected = 6.0;
  
  if (months === expected) {
    console.log('✅ Test 19: $12000 savings / $2000 costs = 6.0 months (at cap)');
  } else {
    console.log('❌ Test 19: Failed. Expected', expected, 'got', months);
  }
}

// Test 20: Fractional months
{
  const months = emergencyFundMonths(3500, 2000);
  const expected = 1.75;
  
  if (months === expected) {
    console.log('✅ Test 20: $3500 savings / $2000 costs = 1.75 months');
  } else {
    console.log('❌ Test 20: Failed. Expected', expected, 'got', months);
  }
}

// Test 21: Zero fixed costs (edge case)
{
  const months = emergencyFundMonths(5000, 0);
  const expected = 0;
  
  if (months === expected) {
    console.log('✅ Test 21: Zero fixed costs = 0.0 (avoid division by zero)');
  } else {
    console.log('❌ Test 21: Failed. Expected', expected, 'got', months);
  }
}

console.log();

// ============================================================================
// Test calculateHealthScore integration
// ============================================================================

console.log('🎯 Testing calculateHealthScore with helpers...\n');

// Test 22: Perfect financial health
{
  const score = calculateHealthScore({
    paymentsOnTimeRatio: 1.0, // Perfect payments
    savingsDelta: 600, // 30% savings rate on 2000 income
    income: 2000,
    debt: 0, // No debt
    savings: 12000, // 6 months emergency fund
    fixedCostsTotal: 2000,
    heldThroughVolatility: true, // Discipline bonus
  });
  
  // Expected: 35 + 25 + 15 + 15 + 10 = 100
  if (score === 100) {
    console.log('✅ Test 22: Perfect financial health = 100');
  } else {
    console.log('❌ Test 22: Failed. Expected 100, got', score);
  }
}

// Test 23: Average financial health
{
  const score = calculateHealthScore({
    paymentsOnTimeRatio: 0.75, // 75% on-time
    savingsDelta: 150, // 7.5% savings rate
    income: 2000,
    debt: 2000, // Debt = income
    savings: 6000, // 3 months emergency fund
    fixedCostsTotal: 2000,
    heldThroughVolatility: false,
  });
  
  // Roughly: (0.75*35) + (0.25*25) + (0.5*15) + (0.5*15) + 0 = 26.25 + 6.25 + 7.5 + 7.5 + 0 = 47.5 ≈ 48
  if (score >= 45 && score <= 50) {
    console.log(`✅ Test 23: Average financial health = ${score} (expected ~47-48)`);
  } else {
    console.log('❌ Test 23: Failed. Expected ~47-48, got', score);
  }
}

// Test 24: Poor financial health
{
  const score = calculateHealthScore({
    paymentsOnTimeRatio: 0.25, // Only 25% on-time
    savingsDelta: -200, // Losing savings (clamped to 0 contribution)
    income: 2000,
    debt: 4000, // 2x income (worst)
    savings: 500, // 0.25 months
    fixedCostsTotal: 2000,
    heldThroughVolatility: false,
  });
  
  // Roughly: (0.25*35) + 0 + 0 + (~0.04*15) + 0 = 8.75 + 0 + 0 + 0.6 + 0 ≈ 9
  if (score >= 8 && score <= 11) {
    console.log(`✅ Test 24: Poor financial health = ${score} (expected ~9)`);
  } else {
    console.log('❌ Test 24: Failed. Expected ~9, got', score);
  }
}

console.log('\n✨ Health score helper tests complete!');
