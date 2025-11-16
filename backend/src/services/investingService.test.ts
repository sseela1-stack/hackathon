import { describe, it, expect } from 'vitest';
import { simulatePortfolio, monteCarlo, PORTFOLIO_PROFILES } from './investingService';

describe('investingService', () => {
  describe('simulatePortfolio', () => {
    it('should return monthly snapshots', () => {
      const years = 10;
      const result = simulatePortfolio({
        startValue: 10000,
        mix: PORTFOLIO_PROFILES.balanced,
        years,
        seed: 'test-seed-1'
      });

      expect(result).toHaveProperty('monthly');
      expect(result).toHaveProperty('trades');
      expect(result).toHaveProperty('stats');
      expect(Array.isArray(result.monthly)).toBe(true);
    });

    it('should match years to monthly length', () => {
      const years = 5;
      const result = simulatePortfolio({
        startValue: 10000,
        mix: PORTFOLIO_PROFILES.balanced,
        years,
        seed: 'test-seed-2'
      });

      expect(result.monthly.length).toBe(years * 12);
    });

    it('should be deterministic with same seed', () => {
      const seed = 'deterministic-test';
      const params = {
        startValue: 10000,
        mix: PORTFOLIO_PROFILES.balanced,
        years: 10,
        seed
      };
      
      const result1 = simulatePortfolio(params);
      const result2 = simulatePortfolio(params);

      expect(result1.monthly).toEqual(result2.monthly);
      expect(result1.stats).toEqual(result2.stats);
    });

    it('should apply DCA contributions', () => {
      const result = simulatePortfolio({
        startValue: 10000,
        mix: PORTFOLIO_PROFILES.balanced,
        contribMonthly: 500,
        years: 5,
        seed: 'dca-test'
      });

      expect(result.stats.endValue).toBeGreaterThan(10000);
    });

    it('should apply fees correctly', () => {
      const noFees = simulatePortfolio({
        startValue: 10000,
        mix: PORTFOLIO_PROFILES.balanced,
        years: 10,
        feesBps: 0,
        seed: 'fee-test'
      });

      const withFees = simulatePortfolio({
        startValue: 10000,
        mix: PORTFOLIO_PROFILES.balanced,
        years: 10,
        feesBps: 50,
        seed: 'fee-test'
      });

      expect(withFees.stats.endValue).toBeLessThan(noFees.stats.endValue);
      expect(withFees.stats.feeTotal).toBeGreaterThan(0);
    });

    it('should record rebalancing trades', () => {
      const result = simulatePortfolio({
        startValue: 10000,
        mix: PORTFOLIO_PROFILES.balanced,
        years: 10,
        rebalance: 'annual',
        seed: 'rebalance-test'
      });

      expect(result.trades.length).toBeGreaterThan(0);
    });
  });

  describe('monteCarlo', () => {
    it('should return bands and success probability', () => {
      const result = monteCarlo({
        startValue: 10000,
        mix: PORTFOLIO_PROFILES.balanced,
        years: 10,
        runs: 50,
        targetAmount: 15000,
        seed: 'mc-test'
      });

      expect(result).toHaveProperty('bands');
      expect(result).toHaveProperty('successProb');
      expect(Array.isArray(result.bands)).toBe(true);
      expect(result.bands.length).toBe(120);
      expect(result.successProb).toBeGreaterThanOrEqual(0);
      expect(result.successProb).toBeLessThanOrEqual(1);
    });
  });
});
