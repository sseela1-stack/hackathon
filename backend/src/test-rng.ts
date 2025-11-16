/**
 * Tests for seeded RNG utilities
 * 
 * Run: npm run test:rng
 */

import { makeRng, makeRngGroup } from './utils/rng';

console.log('🧪 Testing seeded RNG...\n');

// Test 1: Determinism - same seed produces same sequence
{
  const rng1 = makeRng('test-seed-123');
  const rng2 = makeRng('test-seed-123');

  const sequence1 = [rng1.next(), rng1.next(), rng1.next()];
  const sequence2 = [rng2.next(), rng2.next(), rng2.next()];

  const match = sequence1.every((val, i) => val === sequence2[i]);

  if (match) {
    console.log('✅ Test 1: Determinism - same seed produces same sequence');
    console.log('   Sequence:', sequence1.map(n => n.toFixed(6)));
  } else {
    console.log('❌ Test 1: Determinism - failed');
    console.log('   Sequence 1:', sequence1);
    console.log('   Sequence 2:', sequence2);
  }
}

console.log();

// Test 2: Different seeds produce different sequences
{
  const rng1 = makeRng('seed-A');
  const rng2 = makeRng('seed-B');

  const val1 = rng1.next();
  const val2 = rng2.next();

  if (val1 !== val2) {
    console.log('✅ Test 2: Different seeds produce different sequences');
    console.log(`   seed-A: ${val1.toFixed(6)}, seed-B: ${val2.toFixed(6)}`);
  } else {
    console.log('❌ Test 2: Different seeds - failed (unlikely collision)');
  }
}

console.log();

// Test 3: next() returns values in [0, 1)
{
  const rng = makeRng('range-test');
  const samples = Array.from({ length: 100 }, () => rng.next());

  const allInRange = samples.every(val => val >= 0 && val < 1);
  const min = Math.min(...samples);
  const max = Math.max(...samples);

  if (allInRange) {
    console.log('✅ Test 3: next() returns values in [0, 1)');
    console.log(`   Range: [${min.toFixed(6)}, ${max.toFixed(6)})`);
  } else {
    console.log('❌ Test 3: next() range - failed');
    console.log('   Some values out of range');
  }
}

console.log();

// Test 4: int() generates integers in range [min, max]
{
  const rng = makeRng('int-test');
  const samples = Array.from({ length: 100 }, () => rng.int(1, 6));

  const allIntegers = samples.every(val => Number.isInteger(val));
  const allInRange = samples.every(val => val >= 1 && val <= 6);
  const hasVariety = new Set(samples).size > 1;

  if (allIntegers && allInRange && hasVariety) {
    console.log('✅ Test 4: int(1, 6) generates integers in [1, 6]');
    console.log('   Sample:', samples.slice(0, 10).join(', '));
    console.log('   Unique values:', new Set(samples).size);
  } else {
    console.log('❌ Test 4: int() - failed');
    console.log('   All integers?', allIntegers);
    console.log('   All in range?', allInRange);
    console.log('   Has variety?', hasVariety);
  }
}

console.log();

// Test 5: int() error handling
{
  const rng = makeRng('error-test');
  let errorCaught = false;

  try {
    rng.int(10, 5); // min > max
  } catch (err) {
    errorCaught = true;
  }

  if (errorCaught) {
    console.log('✅ Test 5: int() throws error when min > max');
  } else {
    console.log('❌ Test 5: int() error handling - failed');
  }
}

console.log();

// Test 6: pick() selects from array deterministically
{
  const rng1 = makeRng('pick-test');
  const rng2 = makeRng('pick-test');

  const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
  
  const picks1 = [rng1.pick(items), rng1.pick(items), rng1.pick(items)];
  const picks2 = [rng2.pick(items), rng2.pick(items), rng2.pick(items)];

  const match = picks1.every((val, i) => val === picks2[i]);

  if (match) {
    console.log('✅ Test 6: pick() is deterministic with same seed');
    console.log('   Picks:', picks1.join(', '));
  } else {
    console.log('❌ Test 6: pick() determinism - failed');
  }
}

console.log();

// Test 7: pick() covers all elements over many samples
{
  const rng = makeRng('pick-coverage');
  const items = ['A', 'B', 'C', 'D', 'E'];
  
  const picks = Array.from({ length: 100 }, () => rng.pick(items));
  const uniquePicks = new Set(picks);

  if (uniquePicks.size === items.length) {
    console.log('✅ Test 7: pick() eventually selects all elements');
    console.log('   Items:', items.join(', '));
    console.log('   All selected over 100 picks');
  } else {
    console.log('❌ Test 7: pick() coverage - failed');
    console.log('   Selected:', Array.from(uniquePicks).join(', '));
  }
}

console.log();

// Test 8: pick() error handling for empty array
{
  const rng = makeRng('empty-test');
  let errorCaught = false;

  try {
    rng.pick([]);
  } catch (err) {
    errorCaught = true;
  }

  if (errorCaught) {
    console.log('✅ Test 8: pick() throws error for empty array');
  } else {
    console.log('❌ Test 8: pick() empty array - failed');
  }
}

console.log();

// Test 9: shuffle() is deterministic
{
  const rng1 = makeRng('shuffle-test');
  const rng2 = makeRng('shuffle-test');

  const arr1 = [1, 2, 3, 4, 5];
  const arr2 = [1, 2, 3, 4, 5];

  rng1.shuffle(arr1);
  rng2.shuffle(arr2);

  const match = arr1.every((val, i) => val === arr2[i]);

  if (match) {
    console.log('✅ Test 9: shuffle() is deterministic with same seed');
    console.log('   Shuffled:', arr1.join(', '));
  } else {
    console.log('❌ Test 9: shuffle() determinism - failed');
    console.log('   Array 1:', arr1);
    console.log('   Array 2:', arr2);
  }
}

console.log();

// Test 10: shuffle() actually shuffles (doesn't return original order)
{
  const rng = makeRng('shuffle-variety');
  const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = [...original];
  
  rng.shuffle(shuffled);

  const isDifferent = shuffled.some((val, i) => val !== original[i]);
  const sameElements = shuffled.slice().sort((a, b) => a - b).every((val, i) => val === original[i]);

  if (isDifferent && sameElements) {
    console.log('✅ Test 10: shuffle() changes order but preserves elements');
    console.log('   Original:', original.join(', '));
    console.log('   Shuffled:', shuffled.join(', '));
  } else {
    console.log('❌ Test 10: shuffle() - failed');
    console.log('   Is different?', isDifferent);
    console.log('   Same elements?', sameElements);
  }
}

console.log();

// Test 11: bool() with default probability (0.5)
{
  const rng = makeRng('bool-test');
  const samples = Array.from({ length: 100 }, () => rng.bool());
  
  const trueCount = samples.filter(v => v).length;
  const falseCount = samples.filter(v => !v).length;
  const ratio = trueCount / samples.length;

  // Should be roughly 50/50 (allow 30-70% range for randomness)
  if (ratio >= 0.3 && ratio <= 0.7) {
    console.log('✅ Test 11: bool() produces roughly 50/50 split');
    console.log(`   True: ${trueCount}, False: ${falseCount} (${(ratio * 100).toFixed(1)}% true)`);
  } else {
    console.log('❌ Test 11: bool() distribution - failed');
    console.log(`   Ratio: ${ratio.toFixed(2)} (expected ~0.5)`);
  }
}

console.log();

// Test 12: bool() with custom probability
{
  const rng = makeRng('bool-custom');
  const samples = Array.from({ length: 100 }, () => rng.bool(0.8));
  
  const trueCount = samples.filter(v => v).length;
  const ratio = trueCount / samples.length;

  // Should be roughly 80% true (allow 60-95% range)
  if (ratio >= 0.6 && ratio <= 0.95) {
    console.log('✅ Test 12: bool(0.8) produces ~80% true');
    console.log(`   True: ${trueCount}/100 (${(ratio * 100).toFixed(1)}%)`);
  } else {
    console.log('❌ Test 12: bool(0.8) - failed');
    console.log(`   Ratio: ${ratio.toFixed(2)} (expected ~0.8)`);
  }
}

console.log();

// Test 13: makeRngGroup creates independent RNGs
{
  const [rng1, rng2, rng3] = makeRngGroup('group-test', 3);

  const val1 = rng1.next();
  const val2 = rng2.next();
  const val3 = rng3.next();

  const allDifferent = val1 !== val2 && val2 !== val3 && val1 !== val3;

  if (allDifferent) {
    console.log('✅ Test 13: makeRngGroup creates independent RNGs');
    console.log(`   RNG 1: ${val1.toFixed(6)}`);
    console.log(`   RNG 2: ${val2.toFixed(6)}`);
    console.log(`   RNG 3: ${val3.toFixed(6)}`);
  } else {
    console.log('❌ Test 13: makeRngGroup - failed (unlikely collision)');
  }
}

console.log();

// Test 14: Cross-process determinism (simulate by recreating RNG)
{
  // Simulate "process 1"
  const rng1 = makeRng('cross-process-test');
  const value1 = rng1.int(1, 100);

  // Simulate "process 2" (new RNG with same seed)
  const rng2 = makeRng('cross-process-test');
  const value2 = rng2.int(1, 100);

  if (value1 === value2) {
    console.log('✅ Test 14: Cross-process determinism verified');
    console.log(`   Both processes generated: ${value1}`);
  } else {
    console.log('❌ Test 14: Cross-process determinism - failed');
    console.log(`   Process 1: ${value1}, Process 2: ${value2}`);
  }
}

console.log('\n✨ Seeded RNG tests complete!');
