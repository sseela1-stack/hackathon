/**
 * Unit tests for seeded RNG utilities
 */

import { describe, it, expect } from 'vitest';
import { makeRng } from './rng';

describe('makeRng', () => {
  describe('basic RNG functionality', () => {
    it('should create an RNG instance with next() method', () => {
      const rng = makeRng('test-seed-12345');
      
      expect(rng).toBeDefined();
      expect(typeof rng.next).toBe('function');
    });

    it('should generate numbers between 0 and 1', () => {
      const rng = makeRng('test-42');
      
      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should be deterministic with same seed', () => {
      const rng1 = makeRng('deterministic-seed');
      const rng2 = makeRng('deterministic-seed');
      
      const values1 = Array.from({ length: 10 }, () => rng1.next());
      const values2 = Array.from({ length: 10 }, () => rng2.next());
      
      expect(values1).toEqual(values2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = makeRng('seed-111');
      const rng2 = makeRng('seed-222');
      
      const values1 = Array.from({ length: 10 }, () => rng1.next());
      const values2 = Array.from({ length: 10 }, () => rng2.next());
      
      expect(values1).not.toEqual(values2);
    });
  });

  describe('int() method', () => {
    it('should generate integers within specified range', () => {
      const rng = makeRng('int-test');
      
      for (let i = 0; i < 50; i++) {
        const value = rng.int(1, 10);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should handle min === max', () => {
      const rng = makeRng('min-max-test');
      const value = rng.int(5, 5);
      expect(value).toBe(5);
    });

    it('should be deterministic', () => {
      const rng1 = makeRng('deterministic-int');
      const rng2 = makeRng('deterministic-int');
      
      expect(rng1.int(1, 100)).toBe(rng2.int(1, 100));
      expect(rng1.int(1, 100)).toBe(rng2.int(1, 100));
      expect(rng1.int(1, 100)).toBe(rng2.int(1, 100));
    });
  });

  describe('pick() method', () => {
    it('should pick an element from array', () => {
      const rng = makeRng('pick-test');
      const arr = ['a', 'b', 'c', 'd', 'e'];
      
      for (let i = 0; i < 20; i++) {
        const picked = rng.pick(arr);
        expect(arr).toContain(picked);
      }
    });

    it('should be deterministic', () => {
      const rng1 = makeRng('pick-deterministic');
      const rng2 = makeRng('pick-deterministic');
      const arr = [10, 20, 30, 40, 50];
      
      expect(rng1.pick(arr)).toBe(rng2.pick(arr));
      expect(rng1.pick(arr)).toBe(rng2.pick(arr));
      expect(rng1.pick(arr)).toBe(rng2.pick(arr));
    });

    it('should handle single-element array', () => {
      const rng = makeRng('single-pick');
      const arr = ['only'];
      
      expect(rng.pick(arr)).toBe('only');
    });
  });

  describe('shuffle() method', () => {
    it('should return array with same elements', () => {
      const rng = makeRng('shuffle-test');
      const arr = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle([...arr]);
      
      expect(shuffled).toHaveLength(arr.length);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('should be deterministic', () => {
      const rng1 = makeRng('shuffle-deterministic');
      const rng2 = makeRng('shuffle-deterministic');
      const arr = ['a', 'b', 'c', 'd', 'e'];
      
      const shuffled1 = rng1.shuffle([...arr]);
      const shuffled2 = rng2.shuffle([...arr]);
      
      expect(shuffled1).toEqual(shuffled2);
    });

    it('should not mutate original array', () => {
      const rng = makeRng('no-mutate');
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      
      rng.shuffle(original);
      
      expect(original).toEqual(copy);
    });

    it('should produce different order (statistically)', () => {
      const rng = makeRng('shuffle-variety');
      const arr = [1, 2, 3, 4, 5];
      
      // Shuffle multiple times and check at least one is different
      const shuffles = Array.from({ length: 10 }, () => 
        rng.shuffle([...arr]).join(',')
      );
      
      const uniqueShuffles = new Set(shuffles);
      expect(uniqueShuffles.size).toBeGreaterThan(1);
    });
  });

  describe('bool() method', () => {
    it('should return boolean values', () => {
      const rng = makeRng('bool-test');
      
      for (let i = 0; i < 20; i++) {
        const value = rng.bool();
        expect(typeof value).toBe('boolean');
      }
    });

    it('should be deterministic', () => {
      const rng1 = makeRng('bool-deterministic');
      const rng2 = makeRng('bool-deterministic');
      
      const bools1 = Array.from({ length: 10 }, () => rng1.bool());
      const bools2 = Array.from({ length: 10 }, () => rng2.bool());
      
      expect(bools1).toEqual(bools2);
    });

    it('should produce mix of true and false (statistically)', () => {
      const rng = makeRng('bool-variety');
      const bools = Array.from({ length: 100 }, () => rng.bool());
      
      const trueCount = bools.filter(b => b).length;
      const falseCount = bools.filter(b => !b).length;
      
      // With 100 samples, expect at least 20 of each (allowing for variance)
      expect(trueCount).toBeGreaterThan(20);
      expect(falseCount).toBeGreaterThan(20);
    });
  });

  describe('edge cases', () => {
    it('should handle numeric string seeds', () => {
      const rng = makeRng('0');
      const value = rng.next();
      
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle empty string seed', () => {
      const rng = makeRng('');
      const value = rng.next();
      
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle very long string seeds', () => {
      const rng = makeRng('a'.repeat(1000));
      const value = rng.next();
      
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });
});
