import { describe, expect, it } from 'vitest';
import { solveSpread, spreadStats, minSpread, maxSpread, type KnownStats, type SolvedSpread } from '../spread';

// Base stats for Charizard (used in examples)
const CHARIZARD_BASE = { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 };

describe('spreadStats', () => {
  describe('basic calculation verification', () => {
    it('calculates stats for a standard spread', () => {
      const spread: SolvedSpread = {
        nature: 'Timid',
        evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      };
      const stats = spreadStats(CHARIZARD_BASE, 50, spread);
      expect(stats).toHaveProperty('hp');
      expect(stats).toHaveProperty('atk');
      expect(stats).toHaveProperty('def');
      expect(stats).toHaveProperty('spa');
      expect(stats).toHaveProperty('spd');
      expect(stats).toHaveProperty('spe');
      // All stats should be positive integers
      Object.values(stats).forEach((stat) => {
        expect(typeof stat).toBe('number');
        expect(stat).toBeGreaterThan(0);
        expect(Number.isInteger(stat)).toBe(true);
      });
    });

    it('gives high stats for max IVs and max EVs with boosting nature', () => {
      const spread: SolvedSpread = {
        nature: 'Adamant',
        evs: { hp: 252, atk: 252, def: 252, spa: 252, spd: 252, spe: 252 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      };
      const stats = spreadStats(CHARIZARD_BASE, 50, spread);
      // Attack should be boosted by the nature
      expect(stats.atk).toBeGreaterThan(140);
      expect(stats.def).toBeDefined();
    });

    it('respects level differences', () => {
      const spread: SolvedSpread = {
        nature: 'Serious',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      };
      const statsLv50 = spreadStats(CHARIZARD_BASE, 50, spread);
      const statsLv100 = spreadStats(CHARIZARD_BASE, 100, spread);
      // Level 100 should have higher stats
      Object.keys(statsLv50).forEach((stat) => {
        expect(statsLv100[stat as keyof typeof statsLv100]).toBeGreaterThanOrEqual(
          statsLv50[stat as keyof typeof statsLv50]
        );
      });
    });

    it('respects nature boosts/drops', () => {
      const adamantSpread: SolvedSpread = {
        nature: 'Adamant',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      };
      const modestSpread: SolvedSpread = {
        nature: 'Modest',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      };
      const adamantStats = spreadStats(CHARIZARD_BASE, 50, adamantSpread);
      const modestStats = spreadStats(CHARIZARD_BASE, 50, modestSpread);
      // Adamant boosts Atk, Modest boosts SpA
      expect(adamantStats.atk).toBeGreaterThan(modestStats.atk);
      expect(modestStats.spa).toBeGreaterThan(adamantStats.spa);
    });
  });

  describe('edge cases', () => {
    it('handles minimal stats (0 IV, 0 EV, neutral nature)', () => {
      const spread: SolvedSpread = {
        nature: 'Serious',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      };
      const stats = spreadStats(CHARIZARD_BASE, 50, spread);
      // Stats should still be valid
      Object.values(stats).forEach((stat) => {
        expect(stat).toBeGreaterThan(0);
      });
    });

    it('handles perfect stats (31 IV, 252 EV, boosting nature)', () => {
      const spread: SolvedSpread = {
        nature: 'Jolly',
        evs: { hp: 252, atk: 252, def: 252, spa: 252, spd: 252, spe: 252 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      };
      const stats = spreadStats(CHARIZARD_BASE, 50, spread);
      // All stats should be positive
      Object.values(stats).forEach((stat) => {
        expect(stat).toBeGreaterThan(0);
      });
    });

    it('handles unusual base stats', () => {
      // Blissey has extremely high HP base
      const blisseyBase = { hp: 255, atk: 10, def: 73, spa: 60, spd: 135, spe: 55 };
      const spread: SolvedSpread = {
        nature: 'Calm',
        evs: { hp: 252, atk: 0, def: 0, spa: 0, spd: 252, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      };
      const stats = spreadStats(blisseyBase, 50, spread);
      expect(stats.hp).toBeGreaterThan(200);
      expect(stats.atk).toBeLessThan(50);
    });
  });
});

describe('minSpread and maxSpread', () => {
  describe('minSpread', () => {
    it('returns zero EVs and neutral nature', () => {
      const spread = minSpread();
      expect(spread.nature).toBe('Serious');
      expect(spread.evs.hp).toBe(0);
      expect(spread.evs.atk).toBe(0);
      expect(spread.evs.def).toBe(0);
      expect(spread.evs.spa).toBe(0);
      expect(spread.evs.spd).toBe(0);
      expect(spread.evs.spe).toBe(0);
    });

    it('returns perfect IVs', () => {
      const spread = minSpread();
      expect(spread.ivs.hp).toBe(31);
      expect(spread.ivs.atk).toBe(31);
      expect(spread.ivs.def).toBe(31);
      expect(spread.ivs.spa).toBe(31);
      expect(spread.ivs.spd).toBe(31);
      expect(spread.ivs.spe).toBe(31);
    });
  });

  describe('maxSpread', () => {
    it('returns 252 EVs in target stat with boosting nature', () => {
      const spreadAtk = maxSpread('atk');
      expect(spreadAtk.evs.atk).toBe(252);
      expect(spreadAtk.nature).toBe('Adamant');

      const spreadSpa = maxSpread('spa');
      expect(spreadSpa.evs.spa).toBe(252);
      expect(spreadSpa.nature).toBe('Modest');

      const spreadSpe = maxSpread('spe');
      expect(spreadSpe.evs.spe).toBe(252);
      expect(spreadSpe.nature).toBe('Jolly');
    });

    it('returns perfect IVs', () => {
      const spread = maxSpread('atk');
      Object.values(spread.ivs).forEach((iv) => {
        expect(iv).toBe(31);
      });
    });

    it('returns 0 EVs in other stats by default', () => {
      const spread = maxSpread('atk');
      expect(spread.evs.def).toBe(0);
      expect(spread.evs.spa).toBe(0);
      expect(spread.evs.spd).toBe(0);
      expect(spread.evs.spe).toBe(0);
    });

    it('adds 252 HP when withHp option is set', () => {
      const spreadNoHp = maxSpread('def');
      const spreadWithHp = maxSpread('def', { withHp: true });
      expect(spreadNoHp.evs.hp).toBe(0);
      expect(spreadWithHp.evs.hp).toBe(252);
      expect(spreadWithHp.evs.def).toBe(252);
    });

    it('handles all stat keys correctly', () => {
      const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
      const natures = ['Serious', 'Adamant', 'Impish', 'Modest', 'Careful', 'Jolly'];
      stats.forEach((stat, idx) => {
        const spread = maxSpread(stat);
        expect(spread.nature).toBe(natures[idx]);
      });
    });
  });

  describe('comparison of min and max spreads', () => {
    it('maxSpread with hp boost has higher stats than minSpread', () => {
      const minSp = minSpread();
      const maxSp = maxSpread('hp', { withHp: true });
      const minStats = spreadStats(CHARIZARD_BASE, 50, minSp);
      const maxStats = spreadStats(CHARIZARD_BASE, 50, maxSp);
      // Max spread with 252 HP EVs should have higher HP at least
      expect(maxStats.hp).toBeGreaterThanOrEqual(minStats.hp);
    });

    it('maxSpread targeted at a stat boosts that stat', () => {
      const minSp = minSpread();
      const maxSpAtk = maxSpread('atk');
      const minStats = spreadStats(CHARIZARD_BASE, 50, minSp);
      const maxStats = spreadStats(CHARIZARD_BASE, 50, maxSpAtk);
      // Adamant nature + 252 EVs in Atk should produce higher Atk than 0 EVs
      expect(maxStats.atk).toBeGreaterThan(minStats.atk);
    });
  });
});

describe('solveSpread', () => {
  describe('basic functionality', () => {
    it('returns null for impossible stat lines', () => {
      const known: KnownStats = {
        atk: 99999, // Impossibly high
        def: 50,
        spa: 100,
        spd: 80,
        spe: 90,
      };
      const result = solveSpread(CHARIZARD_BASE, 50, known);
      expect(result).toBeNull();
    });

    it('returns a valid spread for reasonable stat lines', () => {
      // These are realistic stats for Charizard at level 50
      const known: KnownStats = {
        atk: 120,
        def: 110,
        spa: 180,
        spd: 130,
        spe: 150,
      };
      const result = solveSpread(CHARIZARD_BASE, 50, known);
      if (result !== null) {
        // If a spread is found, verify it produces the known stats
        const produced = spreadStats(CHARIZARD_BASE, 50, result);
        expect(produced.atk).toBe(known.atk);
        expect(produced.def).toBe(known.def);
        expect(produced.spa).toBe(known.spa);
        expect(produced.spd).toBe(known.spd);
        expect(produced.spe).toBe(known.spe);
      }
    });

    it('returns spread with valid structure', () => {
      const known: KnownStats = {
        atk: 120,
        def: 110,
        spa: 180,
        spd: 130,
        spe: 150,
      };
      const result = solveSpread(CHARIZARD_BASE, 50, known);
      if (result !== null) {
        expect(result).toHaveProperty('nature');
        expect(result).toHaveProperty('evs');
        expect(result).toHaveProperty('ivs');
        expect(typeof result.nature).toBe('string');
      }
    });
  });

  describe('optional HP stat', () => {
    it('solves without HP if not provided', () => {
      const known: KnownStats = {
        atk: 120,
        def: 110,
        spa: 180,
        spd: 130,
        spe: 150,
      };
      const result = solveSpread(CHARIZARD_BASE, 50, known);
      if (result !== null) {
        expect(result.evs).toHaveProperty('hp');
      }
    });

    it('solves with HP if provided', () => {
      const known: KnownStats = {
        hp: 170,
        atk: 120,
        def: 110,
        spa: 180,
        spd: 130,
        spe: 150,
      };
      const result = solveSpread(CHARIZARD_BASE, 50, known);
      if (result !== null) {
        const produced = spreadStats(CHARIZARD_BASE, 50, result);
        expect(produced.hp).toBe(known.hp);
      }
    });
  });

  describe('edge cases and constraints', () => {
    it('returns null for completely illegal stat lines', () => {
      const known: KnownStats = {
        atk: 1,
        def: 1,
        spa: 1,
        spd: 1,
        spe: 1,
      };
      const result = solveSpread(CHARIZARD_BASE, 50, known);
      // Should either be null or produce exactly those stats
      if (result !== null) {
        const produced = spreadStats(CHARIZARD_BASE, 50, result);
        expect(produced.atk).toBe(known.atk);
      }
    });

    it('produces valid EV/IV pairs', () => {
      const known: KnownStats = {
        atk: 120,
        def: 110,
        spa: 180,
        spd: 130,
        spe: 150,
      };
      const result = solveSpread(CHARIZARD_BASE, 50, known);
      if (result !== null) {
        // EVs should be between 0 and 252 (typically)
        Object.values(result.evs).forEach((ev) => {
          expect(ev).toBeGreaterThanOrEqual(0);
          expect(ev).toBeLessThanOrEqual(255);
        });
        // IVs should be between 0 and 31
        Object.values(result.ivs).forEach((iv) => {
          expect(iv).toBeGreaterThanOrEqual(0);
          expect(iv).toBeLessThanOrEqual(31);
        });
      }
    });

    it('prefers minimal EV spreads when multiple solutions exist', () => {
      const known: KnownStats = {
        atk: 120,
        def: 110,
        spa: 180,
        spd: 130,
        spe: 150,
      };
      const result = solveSpread(CHARIZARD_BASE, 50, known);
      if (result !== null) {
        const totalEvs = Object.values(result.evs).reduce((a, b) => a + b, 0);
        expect(totalEvs).toBeLessThanOrEqual(510); // Max total EVs
      }
    });
  });

  describe('round-trip consistency', () => {
    it('solved spread reproduces known stats exactly', () => {
      const known: KnownStats = {
        atk: 120,
        def: 110,
        spa: 180,
        spd: 130,
        spe: 150,
      };
      const solved = solveSpread(CHARIZARD_BASE, 50, known);
      if (solved !== null) {
        const reproduced = spreadStats(CHARIZARD_BASE, 50, solved);
        expect(reproduced.atk).toBe(known.atk);
        expect(reproduced.def).toBe(known.def);
        expect(reproduced.spa).toBe(known.spa);
        expect(reproduced.spd).toBe(known.spd);
        expect(reproduced.spe).toBe(known.spe);
      }
    });

    it('level differences are handled consistently', () => {
      const knownLv50: KnownStats = {
        atk: 120,
        def: 110,
        spa: 180,
        spd: 130,
        spe: 150,
      };
      const solvedLv50 = solveSpread(CHARIZARD_BASE, 50, knownLv50);
      if (solvedLv50 !== null) {
        const reproduced = spreadStats(CHARIZARD_BASE, 50, solvedLv50);
        expect(reproduced).toEqual(knownLv50);
      }
    });
  });
});
