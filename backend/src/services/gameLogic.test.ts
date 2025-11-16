/**
 * Unit tests for game logic functions
 */

import { describe, it, expect } from 'vitest';
import {
  computeMonthlyIncomePlan,
  getDefaultBaseIncome,
  getDefaultFixedCosts,
  paymentsOnTimeRatio,
  savingsRateDelta,
  debtUtilization,
  emergencyFundMonths,
} from './gameLogic';
import type { Role, Difficulty } from '../models/GameState';

describe('Income Calculation', () => {
  describe('computeMonthlyIncomePlan', () => {
    it('should compute income plan for early career on normal difficulty', () => {
      const role: Role = 'earlyCareer';
      const difficulty: Difficulty = 'normal';
      const fixed = getDefaultFixedCosts(role);
      
      const plan = computeMonthlyIncomePlan(role, difficulty, fixed);
      
      expect(plan).toBeDefined();
      expect(plan.baseIncome).toBeGreaterThan(0);
      expect(plan.difficultyMultiplier).toBe(1.0);
      expect(plan.eventsDelta).toBe(0);
    });

    it('should apply difficulty multipliers correctly', () => {
      const role: Role = 'earlyCareer';
      const fixed = getDefaultFixedCosts(role);
      
      const easyPlan = computeMonthlyIncomePlan(role, 'easy', fixed);
      const normalPlan = computeMonthlyIncomePlan(role, 'normal', fixed);
      const hardPlan = computeMonthlyIncomePlan(role, 'hard', fixed);
      
      // Easy should have highest income
      expect(easyPlan.baseIncome).toBeGreaterThan(normalPlan.baseIncome);
      expect(normalPlan.baseIncome).toBeGreaterThan(hardPlan.baseIncome);
      
      // Check multipliers
      expect(easyPlan.difficultyMultiplier).toBe(1.2);
      expect(normalPlan.difficultyMultiplier).toBe(1.0);
      expect(hardPlan.difficultyMultiplier).toBe(0.8);
    });

    it('should calculate income based on fixed costs ratio (~65%)', () => {
      const role: Role = 'student';
      const difficulty: Difficulty = 'normal';
      const fixed = getDefaultFixedCosts(role);
      
      const plan = computeMonthlyIncomePlan(role, difficulty, fixed);
      
      // Fixed costs should be roughly 65% of income
      const fixedTotal = fixed.rent + fixed.food + fixed.transport + fixed.phoneInternet;
      const ratio = fixedTotal / plan.baseIncome;
      
      // Allow some rounding variance
      expect(ratio).toBeGreaterThan(0.6);
      expect(ratio).toBeLessThan(0.7);
    });

    it('should handle different roles with appropriate income levels', () => {
      const difficulty: Difficulty = 'normal';
      
      const studentPlan = computeMonthlyIncomePlan(
        'student',
        difficulty,
        getDefaultFixedCosts('student')
      );
      const earlyCareerPlan = computeMonthlyIncomePlan(
        'earlyCareer',
        difficulty,
        getDefaultFixedCosts('earlyCareer')
      );
      const midCareerPlan = computeMonthlyIncomePlan(
        'midCareer',
        difficulty,
        getDefaultFixedCosts('midCareer')
      );
      
      // Income should increase with career progression
      expect(studentPlan.baseIncome).toBeLessThan(earlyCareerPlan.baseIncome);
      expect(earlyCareerPlan.baseIncome).toBeLessThan(midCareerPlan.baseIncome);
    });

    it('should return plan with zero eventsDelta initially', () => {
      const plan = computeMonthlyIncomePlan(
        'earlyCareer',
        'normal',
        getDefaultFixedCosts('earlyCareer')
      );
      
      expect(plan.eventsDelta).toBe(0);
    });
  });

  describe('getDefaultBaseIncome', () => {
    it('should return positive income for all roles', () => {
      const roles: Role[] = ['student', 'earlyCareer', 'midCareer'];
      
      roles.forEach(role => {
        const income = getDefaultBaseIncome(role);
        expect(income).toBeGreaterThan(0);
      });
    });

    it('should return increasing income by role progression', () => {
      const studentIncome = getDefaultBaseIncome('student');
      const earlyCareerIncome = getDefaultBaseIncome('earlyCareer');
      const midCareerIncome = getDefaultBaseIncome('midCareer');
      
      expect(studentIncome).toBeLessThan(earlyCareerIncome);
      expect(earlyCareerIncome).toBeLessThan(midCareerIncome);
    });
  });

  describe('getDefaultFixedCosts', () => {
    it('should return valid fixed costs structure for all roles', () => {
      const roles: Role[] = ['student', 'earlyCareer', 'midCareer'];
      
      roles.forEach(role => {
        const costs = getDefaultFixedCosts(role);
        
        expect(costs).toBeDefined();
        expect(costs.rent).toBeGreaterThan(0);
        expect(costs.food).toBeGreaterThan(0);
        expect(costs.transport).toBeGreaterThan(0);
        expect(costs.phoneInternet).toBeGreaterThan(0);
      });
    });

    it('should return higher costs for higher career levels', () => {
      const studentCosts = getDefaultFixedCosts('student');
      const midCareerCosts = getDefaultFixedCosts('midCareer');
      
      // Mid-career typically has higher rent/food
      const studentTotal = studentCosts.rent + studentCosts.food + 
                          studentCosts.transport + studentCosts.phoneInternet;
      const midCareerTotal = midCareerCosts.rent + midCareerCosts.food + 
                            midCareerCosts.transport + midCareerCosts.phoneInternet;
      
      expect(midCareerTotal).toBeGreaterThan(studentTotal);
    });
  });
});

describe('Health Score Helper Functions', () => {
  describe('paymentsOnTimeRatio', () => {
    it('should return 1.0 for all on-time payments', () => {
      const history = [
        { billsPaidOnTime: true },
        { billsPaidOnTime: true },
        { billsPaidOnTime: true },
      ];
      
      const ratio = paymentsOnTimeRatio(history);
      expect(ratio).toBe(1.0);
    });

    it('should return 0.0 for all late payments', () => {
      const history = [
        { billsPaidOnTime: false },
        { billsPaidOnTime: false },
        { billsPaidOnTime: false },
      ];
      
      const ratio = paymentsOnTimeRatio(history);
      expect(ratio).toBe(0.0);
    });

    it('should calculate correct ratio for mixed payments', () => {
      const history = [
        { billsPaidOnTime: true },
        { billsPaidOnTime: true },
        { billsPaidOnTime: false },
        { billsPaidOnTime: true },
      ];
      
      const ratio = paymentsOnTimeRatio(history);
      expect(ratio).toBe(0.75); // 3 out of 4
    });

    it('should handle empty history', () => {
      const ratio = paymentsOnTimeRatio([]);
      expect(ratio).toBe(0);
    });
  });

  describe('savingsRateDelta', () => {
    it('should calculate positive savings rate', () => {
      const prevSavings = 1000;
      const nextSavings = 1200;
      const income = 3000;
      
      const rate = savingsRateDelta(prevSavings, nextSavings, income);
      
      // Saved $200 out of $3000 income = 0.0666...
      expect(rate).toBeCloseTo(0.067, 2);
    });

    it('should clamp negative savings rate to 0', () => {
      const prevSavings = 1000;
      const nextSavings = 800; // Withdrew $200
      const income = 3000;
      
      const rate = savingsRateDelta(prevSavings, nextSavings, income);
      expect(rate).toBe(0);
    });

    it('should clamp savings rate above 1 to 1', () => {
      const prevSavings = 0;
      const nextSavings = 5000; // Saved more than income
      const income = 3000;
      
      const rate = savingsRateDelta(prevSavings, nextSavings, income);
      expect(rate).toBe(1.0);
    });

    it('should handle zero income', () => {
      const rate = savingsRateDelta(1000, 1200, 0);
      expect(rate).toBe(0);
    });
  });

  describe('debtUtilization', () => {
    it('should return 1.0 for zero debt', () => {
      const utilization = debtUtilization(0, 5000);
      expect(utilization).toBe(1.0);
    });

    it('should return lower values for higher debt', () => {
      const income = 5000;
      
      const lowDebt = debtUtilization(1000, income);
      const highDebt = debtUtilization(10000, income);
      
      expect(lowDebt).toBeGreaterThan(highDebt);
      expect(highDebt).toBeGreaterThan(0);
      expect(lowDebt).toBeLessThanOrEqual(1.0);
    });

    it('should handle zero income', () => {
      const utilization = debtUtilization(1000, 0);
      expect(utilization).toBe(0);
    });

    it('should return value between 0 and 1', () => {
      const utilization = debtUtilization(5000, 5000);
      expect(utilization).toBeGreaterThanOrEqual(0);
      expect(utilization).toBeLessThanOrEqual(1.0);
    });
  });

  describe('emergencyFundMonths', () => {
    it('should calculate months of coverage correctly', () => {
      const savings = 3000;
      const fixedCosts = 1000;
      
      const months = emergencyFundMonths(savings, fixedCosts);
      expect(months).toBe(3);
    });

    it('should cap at 6 months', () => {
      const savings = 10000;
      const fixedCosts = 1000;
      
      const months = emergencyFundMonths(savings, fixedCosts);
      expect(months).toBe(6);
    });

    it('should handle zero savings', () => {
      const months = emergencyFundMonths(0, 1000);
      expect(months).toBe(0);
    });

    it('should handle zero fixed costs', () => {
      const months = emergencyFundMonths(5000, 0);
      expect(months).toBe(6); // Defaults to max
    });

    it('should handle fractional months', () => {
      const savings = 1500;
      const fixedCosts = 1000;
      
      const months = emergencyFundMonths(savings, fixedCosts);
      expect(months).toBe(1); // Floors to 1 month
    });
  });
});
