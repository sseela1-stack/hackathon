/**
 * Seeded Random Number Generator utilities
 * Uses Mulberry32 algorithm for deterministic pseudo-random number generation
 * 
 * References:
 * - https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 * - Mulberry32 by Tommy Ettinger
 */

/**
 * RNG interface with utility methods
 */
export interface Rng {
  /**
   * Generate next random number in range [0, 1)
   */
  next(): number;

  /**
   * Generate random integer in range [min, max] (inclusive)
   */
  int(min: number, max: number): number;

  /**
   * Pick random element from array
   */
  pick<T>(arr: T[]): T;

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   */
  shuffle<T>(arr: T[]): T[];

  /**
   * Generate random boolean with optional probability
   * @param probability - Probability of returning true (default: 0.5)
   */
  bool(probability?: number): boolean;
}

/**
 * Simple string hash function (djb2 algorithm)
 * Converts string seed to 32-bit unsigned integer
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Mulberry32 PRNG algorithm
 * Fast, simple, and high-quality 32-bit PRNG
 * 
 * @param seed - 32-bit unsigned integer seed
 * @returns Function that generates next random number in [0, 1)
 */
function mulberry32(seed: number): () => number {
  return function (): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a seeded random number generator
 * 
 * @param seed - String seed for deterministic random generation
 * @returns RNG object with utility methods
 * 
 * @example
 * ```ts
 * const rng = makeRng('my-seed');
 * const num = rng.next();           // 0.123456...
 * const dice = rng.int(1, 6);       // 1, 2, 3, 4, 5, or 6
 * const choice = rng.pick(['a', 'b', 'c']);  // 'a', 'b', or 'c'
 * ```
 */
export function makeRng(seed: string): Rng {
  // Convert string seed to numeric seed
  const numericSeed = hashString(seed);
  
  // Create base RNG function
  const nextRandom = mulberry32(numericSeed);

  return {
    next(): number {
      return nextRandom();
    },

    int(min: number, max: number): number {
      if (min > max) {
        throw new Error(`min (${min}) must be <= max (${max})`);
      }
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new Error('min and max must be integers');
      }
      const range = max - min + 1;
      return Math.floor(nextRandom() * range) + min;
    },

    pick<T>(arr: T[]): T {
      if (arr.length === 0) {
        throw new Error('Cannot pick from empty array');
      }
      const index = Math.floor(nextRandom() * arr.length);
      return arr[index];
    },

    shuffle<T>(arr: T[]): T[] {
      // Fisher-Yates shuffle
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(nextRandom() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    bool(probability: number = 0.5): boolean {
      if (probability < 0 || probability > 1) {
        throw new Error('probability must be between 0 and 1');
      }
      return nextRandom() < probability;
    },
  };
}

/**
 * Create multiple independent RNGs from a base seed
 * Useful for generating multiple deterministic random streams
 * 
 * @param baseSeed - Base seed string
 * @param count - Number of RNGs to create
 * @returns Array of independent RNG instances
 * 
 * @example
 * ```ts
 * const [rng1, rng2, rng3] = makeRngGroup('game-123', 3);
 * // Each RNG produces independent but deterministic sequences
 * ```
 */
export function makeRngGroup(baseSeed: string, count: number): Rng[] {
  const rngs: Rng[] = [];
  for (let i = 0; i < count; i++) {
    rngs.push(makeRng(`${baseSeed}-${i}`));
  }
  return rngs;
}
