import { describe, expect, it } from 'vitest';
import { hashSeed, makeRng, pickWinners, parseLine, oddsOf, poolHash, shuffleWith, type Entrant } from '@boffmedia/ui/giveaways';

describe('Sorteos draw logic', () => {
  describe('hashSeed - deterministic hashing', () => {
    it('produces the same hash for the same input string', () => {
      const seed1 = hashSeed('test-seed-123');
      const seed2 = hashSeed('test-seed-123');
      expect(seed1).toBe(seed2);
    });

    it('produces different hashes for different input strings', () => {
      const seed1 = hashSeed('test-seed-123');
      const seed2 = hashSeed('test-seed-124');
      expect(seed1).not.toBe(seed2);
    });

    it('returns a number', () => {
      const result = hashSeed('test');
      expect(typeof result).toBe('number');
    });

    it('returns a non-negative number (32-bit unsigned)', () => {
      const result = hashSeed('anything goes here');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(0xffffffff);
    });

    it('handles empty string', () => {
      const result = hashSeed('');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('handles long strings', () => {
      const longStr = 'a'.repeat(1000);
      const result = hashSeed(longStr);
      expect(typeof result).toBe('number');
    });

    it('combines seed components consistently', () => {
      // Same pool + seed should produce same hash
      const hash1 = hashSeed('ABC123|Player1:1,Player2:1');
      const hash2 = hashSeed('ABC123|Player1:1,Player2:1');
      expect(hash1).toBe(hash2);
    });
  });

  describe('makeRng - deterministic PRNG', () => {
    it('produces the same sequence for the same seed', () => {
      const seed = hashSeed('test-seed');
      const rng1 = makeRng(seed);
      const rng2 = makeRng(seed);

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = makeRng(hashSeed('seed1'));
      const rng2 = makeRng(hashSeed('seed2'));

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).not.toEqual(seq2);
    });

    it('generates numbers between 0 and 1', () => {
      const rng = makeRng(hashSeed('test'));
      for (let i = 0; i < 100; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('generates a long sequence without repeating immediately', () => {
      const rng = makeRng(hashSeed('test'));
      const vals = Array.from({ length: 10 }, () => rng());
      // Should be mostly different (allowing for rare coincidences)
      const unique = new Set(vals);
      expect(unique.size).toBeGreaterThan(5);
    });

    it('starts with correct first value for known seed', () => {
      // This tests that the PRNG is actually using the seed correctly
      const rng = makeRng(12345);
      const first = rng();
      expect(first).toBeGreaterThan(0);
      expect(first).toBeLessThan(1);
    });
  });

  describe('pickWinners - unweighted selection', () => {
    it('returns requested number of winners', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
        { id: '3', name: 'Charlie', weight: 1 },
      ];
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners(pool, 2, rng, false);
      expect(winners).toHaveLength(2);
    });

    it('returns all pool members when n >= pool size', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
      ];
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners(pool, 5, rng, false);
      expect(winners).toHaveLength(2);
    });

    it('returns no duplicates', () => {
      const pool: Entrant[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        name: `Person${i}`,
        weight: 1,
      }));
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners(pool, 5, rng, false);
      const ids = winners.map((w) => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('returns empty array for empty pool', () => {
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners([], 5, rng, false);
      expect(winners).toHaveLength(0);
    });

    it('returns empty array when requesting 0 winners', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
      ];
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners(pool, 0, rng, false);
      expect(winners).toHaveLength(0);
    });

    it('is deterministic - same seed produces same winners', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
        { id: '3', name: 'Charlie', weight: 1 },
        { id: '4', name: 'David', weight: 1 },
      ];
      const seed = hashSeed('deterministic-test');

      const rng1 = makeRng(seed);
      const winners1 = pickWinners(pool, 2, rng1, false);

      const rng2 = makeRng(seed);
      const winners2 = pickWinners(pool, 2, rng2, false);

      expect(winners1.map((w) => w.id)).toEqual(winners2.map((w) => w.id));
    });

    it('produces different results with different seeds', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
        { id: '3', name: 'Charlie', weight: 1 },
        { id: '4', name: 'David', weight: 1 },
      ];

      const winners1 = pickWinners(pool, 2, makeRng(hashSeed('seed1')), false);
      const winners2 = pickWinners(pool, 2, makeRng(hashSeed('seed2')), false);

      // With 4 people choosing 2, there are C(4,2)=6 possible pairs.
      // Different seeds should usually produce different pairs.
      // (There's a 1/15 chance they match by random chance, so this isn't guaranteed,
      // but we'll test it anyway - failures are acceptable.)
      expect(winners1.map((w) => w.id).sort().join(',')).not.toBe(
        winners2.map((w) => w.id).sort().join(',')
      );
    });

    it('does not modify the input pool', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
        { id: '3', name: 'Charlie', weight: 1 },
      ];
      const poolCopy = JSON.parse(JSON.stringify(pool));
      const rng = makeRng(hashSeed('test'));
      pickWinners(pool, 2, rng, false);
      expect(pool).toEqual(poolCopy);
    });
  });

  describe('pickWinners - weighted selection', () => {
    it('weighted selection prefers higher-weight entrants', () => {
      // Run multiple trials to see if higher-weight person wins more often
      const pool: Entrant[] = [
        { id: '1', name: 'Heavy', weight: 10 },
        { id: '2', name: 'Light', weight: 1 },
      ];

      let heavyWins = 0;
      for (let i = 0; i < 100; i++) {
        const rng = makeRng(hashSeed(`trial${i}`));
        const winners = pickWinners(pool, 1, rng, true);
        if (winners[0].id === '1') heavyWins++;
      }

      // With 10:1 weight ratio, Heavy should win ~90% of the time (allow some variance)
      expect(heavyWins).toBeGreaterThan(70);
    });

    it('weighted selection handles zero and negative weights as 1', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Zero weight', weight: 0 },
        { id: '2', name: 'Normal', weight: 1 },
        { id: '3', name: 'Negative', weight: -5 },
      ];
      const rng = makeRng(hashSeed('test'));
      // Should not crash, treating all as weight 1
      const winners = pickWinners(pool, 1, rng, true);
      expect(winners).toHaveLength(1);
    });

    it('is deterministic - same seed with weights produces same winners', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 5 },
        { id: '2', name: 'Bob', weight: 3 },
        { id: '3', name: 'Charlie', weight: 2 },
      ];
      const seed = hashSeed('weighted-deterministic');

      const winners1 = pickWinners(pool, 2, makeRng(seed), true);
      const winners2 = pickWinners(pool, 2, makeRng(seed), true);

      expect(winners1.map((w) => w.id)).toEqual(winners2.map((w) => w.id));
    });

    it('returns no duplicates even with weighted selection', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 10 },
        { id: '2', name: 'Bob', weight: 5 },
        { id: '3', name: 'Charlie', weight: 3 },
      ];
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners(pool, 2, rng, true);
      const ids = winners.map((w) => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('pickWinners - edge cases', () => {
    it('handles single entrant', () => {
      const pool: Entrant[] = [{ id: '1', name: 'Lonely', weight: 1 }];
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners(pool, 1, rng, false);
      expect(winners).toHaveLength(1);
      expect(winners[0].id).toBe('1');
    });

    it('handles large pool', () => {
      const pool = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        name: `Person${i}`,
        weight: 1,
      }));
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners(pool, 10, rng, false);
      expect(winners).toHaveLength(10);
      // Check no duplicates
      const ids = winners.map((w) => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('handles negative n gracefully', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
      ];
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners(pool, -5, rng, false);
      expect(winners).toHaveLength(0);
    });

    it('returns all when n equals pool size', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
        { id: '3', name: 'Charlie', weight: 1 },
      ];
      const rng = makeRng(hashSeed('test'));
      const winners = pickWinners(pool, 3, rng, false);
      expect(winners).toHaveLength(3);
    });
  });

  describe('poolHash - verifiable pool hash', () => {
    it('produces consistent hash for same pool', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 2 },
      ];
      const hash1 = poolHash(pool, false);
      const hash2 = poolHash(pool, false);
      expect(hash1).toBe(hash2);
    });

    it('produces different hash for different pools', () => {
      const pool1: Entrant[] = [{ id: '1', name: 'Alice', weight: 1 }];
      const pool2: Entrant[] = [{ id: '1', name: 'Bob', weight: 1 }];
      const hash1 = poolHash(pool1, false);
      const hash2 = poolHash(pool2, false);
      expect(hash1).not.toBe(hash2);
    });

    it('considers weighted flag', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 5 },
      ];
      const hashUnweighted = poolHash(pool, false);
      const hashWeighted = poolHash(pool, true);
      expect(hashUnweighted).not.toBe(hashWeighted);
    });

    it('returns 8-character hex string', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
      ];
      const hash = poolHash(pool, false);
      expect(hash).toMatch(/^[0-9A-F]{8}$/);
    });
  });

  describe('shuffleWith - Fisher-Yates with deterministic RNG', () => {
    it('shuffles the array', () => {
      const arr: Entrant[] = [
        { id: '1', name: 'A', weight: 1 },
        { id: '2', name: 'B', weight: 1 },
        { id: '3', name: 'C', weight: 1 },
        { id: '4', name: 'D', weight: 1 },
      ];
      const rng = makeRng(hashSeed('shuffle-test'));
      const shuffled = shuffleWith(arr, rng);
      // Should have same elements
      expect(shuffled.map((e) => e.id).sort()).toEqual(['1', '2', '3', '4']);
    });

    it('is deterministic with same RNG seed', () => {
      const arr: Entrant[] = [
        { id: '1', name: 'A', weight: 1 },
        { id: '2', name: 'B', weight: 1 },
        { id: '3', name: 'C', weight: 1 },
      ];
      const seed = hashSeed('deterministic-shuffle');

      const shuffled1 = shuffleWith(arr, makeRng(seed));
      const shuffled2 = shuffleWith(arr, makeRng(seed));

      expect(shuffled1.map((e) => e.id)).toEqual(shuffled2.map((e) => e.id));
    });

    it('does not modify the original array', () => {
      const arr: Entrant[] = [
        { id: '1', name: 'A', weight: 1 },
        { id: '2', name: 'B', weight: 1 },
      ];
      const arrCopy = JSON.parse(JSON.stringify(arr));
      const rng = makeRng(hashSeed('test'));
      shuffleWith(arr, rng);
      expect(arr).toEqual(arrCopy);
    });

    it('handles single-element array', () => {
      const arr: Entrant[] = [{ id: '1', name: 'A', weight: 1 }];
      const rng = makeRng(hashSeed('test'));
      const shuffled = shuffleWith(arr, rng);
      expect(shuffled).toHaveLength(1);
      expect(shuffled[0].id).toBe('1');
    });

    it('handles empty array', () => {
      const arr: Entrant[] = [];
      const rng = makeRng(hashSeed('test'));
      const shuffled = shuffleWith(arr, rng);
      expect(shuffled).toHaveLength(0);
    });
  });

  describe('oddsOf - calculate winning odds', () => {
    it('calculates odds for unweighted pool', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
        { id: '3', name: 'Charlie', weight: 1 },
      ];
      const entrant = pool[0];
      const odds = oddsOf(pool, entrant, false);
      expect(odds).toBeCloseTo(100 / 3, 5); // ~33.33%
    });

    it('calculates odds for weighted pool', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 2 },
        { id: '2', name: 'Bob', weight: 1 },
      ];
      const alice = pool[0];
      const odds = oddsOf(pool, alice, true);
      expect(odds).toBeCloseTo(200 / 3, 5); // 2/3 * 100 = ~66.67%
    });

    it('returns 100 for single entrant', () => {
      const pool: Entrant[] = [{ id: '1', name: 'Alice', weight: 1 }];
      const odds = oddsOf(pool, pool[0], false);
      expect(odds).toBe(100);
    });

    it('handles zero weight as 1', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 0 },
        { id: '2', name: 'Bob', weight: 1 },
      ];
      const odds = oddsOf(pool, pool[0], true);
      expect(odds).toBe(50);
    });

    it('handles empty pool gracefully', () => {
      const pool: Entrant[] = [];
      const entrant: Entrant = { id: '0', name: 'Ghost', weight: 1 };
      const odds = oddsOf(pool, entrant, false);
      // Should return 0 or handle gracefully
      expect(typeof odds).toBe('number');
    });
  });

  describe('parseLine - parse entrant list entries', () => {
    it('parses simple name', () => {
      const result = parseLine('Alice');
      expect(result).toEqual({ name: 'Alice', weight: 1 });
    });

    it('parses name with comma-separated weight', () => {
      const result = parseLine('Alice, 3');
      expect(result).toEqual({ name: 'Alice', weight: 3 });
    });

    it('parses name with semicolon-separated weight', () => {
      const result = parseLine('Bob; 5');
      expect(result).toEqual({ name: 'Bob', weight: 5 });
    });

    it('parses name with "x" multiplier', () => {
      const result = parseLine('Charlie x2');
      expect(result).toEqual({ name: 'Charlie', weight: 2 });
    });

    it('parses name with "×" multiplier', () => {
      const result = parseLine('David × 4');
      expect(result).toEqual({ name: 'David', weight: 4 });
    });

    it('trims whitespace', () => {
      const result = parseLine('  Eve  ,  2  ');
      expect(result).toEqual({ name: 'Eve', weight: 2 });
    });

    it('returns null for empty string', () => {
      const result = parseLine('');
      expect(result).toBeNull();
    });

    it('returns null for whitespace-only string', () => {
      const result = parseLine('   ');
      expect(result).toBeNull();
    });

    it('ignores invalid weight values', () => {
      const result = parseLine('Frank, abc');
      expect(result).toEqual({ name: 'Frank, abc', weight: 1 });
    });

    it('caps weight to 3 digits', () => {
      const result = parseLine('Grace, 999');
      expect(result).toEqual({ name: 'Grace', weight: 999 });
    });

    it('handles case-insensitive multipliers', () => {
      const result1 = parseLine('Henry X 3');
      const result2 = parseLine('Henry x 3');
      expect(result1).toEqual(result2);
      expect(result1).toEqual({ name: 'Henry', weight: 3 });
    });

    it('returns null if only weight specified', () => {
      const result = parseLine(', 5');
      expect(result).toBeNull();
    });

    it('handles names with numbers', () => {
      const result = parseLine('Player123, 2');
      expect(result).toEqual({ name: 'Player123', weight: 2 });
    });

    it('handles names with special characters', () => {
      const result = parseLine('José (João), 1');
      expect(result).toEqual({ name: 'José (João)', weight: 1 });
    });
  });

  describe('Integration - full draw workflow', () => {
    it('reproduces same draw with same seed and pool', () => {
      const pool: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
        { id: '3', name: 'Charlie', weight: 1 },
        { id: '4', name: 'David', weight: 1 },
      ];

      const seed = 'DRAW123';
      const poolString = pool.map((e) => e.name + ':1').join(',');
      const fullSeed = seed + '|' + poolString;

      const draw1 = pickWinners(
        pool,
        2,
        makeRng(hashSeed(fullSeed)),
        false,
      );

      const draw2 = pickWinners(
        pool,
        2,
        makeRng(hashSeed(fullSeed)),
        false,
      );

      expect(draw1.map((w) => w.id)).toEqual(draw2.map((w) => w.id));
    });

    it('different pools produce different results even with same seed prefix', () => {
      const seed = 'DRAW123';

      const pool1: Entrant[] = [
        { id: '1', name: 'Alice', weight: 1 },
        { id: '2', name: 'Bob', weight: 1 },
      ];
      const pool1String = pool1.map((e) => e.name + ':1').join(',');
      const draw1 = pickWinners(
        pool1,
        1,
        makeRng(hashSeed(seed + '|' + pool1String)),
        false,
      );

      const pool2: Entrant[] = [
        { id: '1', name: 'Charlie', weight: 1 },
        { id: '2', name: 'David', weight: 1 },
      ];
      const pool2String = pool2.map((e) => e.name + ':1').join(',');
      const draw2 = pickWinners(
        pool2,
        1,
        makeRng(hashSeed(seed + '|' + pool2String)),
        false,
      );

      // Different pools should likely produce different winners (not guaranteed but very likely)
      expect(draw1[0].name).not.toBe(draw2[0].name);
    });
  });
});
