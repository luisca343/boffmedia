import { describe, expect, it } from 'vitest';
import { applySpeedMods, applyItemSpeed, EMPTY_SPEED_MODS, type SpeedMods } from '../speedCalc';

describe('applySpeedMods', () => {
  describe('single modifiers', () => {
    it('applies tailwind correctly (x2)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, tailwind: true });
      expect(result).toBe(200);
    });

    it('applies paralysis correctly (x0.5)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, paralyzed: true });
      expect(result).toBe(50);
    });

    it('applies choice scarf correctly (x1.5)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, scarf: true });
      expect(result).toBe(150);
    });

    it('applies +2 stage correctly (x2)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, plus2: true });
      expect(result).toBe(200);
    });

    it('applies +1 stage correctly (x1.5)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, plus1: true });
      expect(result).toBe(150);
    });

    it('applies -1 stage correctly (x2/3)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, minus1: true });
      expect(result).toBe(66); // Math.floor(100 * 2/3)
    });

    it('applies -2 stage correctly (x0.5)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, minus2: true });
      expect(result).toBe(50);
    });

    it('applies trick room correctly (speed is inverted in calculation, just return as-is)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, trickRoom: true });
      expect(result).toBe(100);
    });
  });

  describe('multiple modifiers stacking', () => {
    it('stacks tailwind + scarf (x2 * x1.5 = x3)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, tailwind: true, scarf: true });
      expect(result).toBe(300);
    });

    it('stacks paralysis + choice scarf (x0.5 * x1.5 = x0.75)', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, paralyzed: true, scarf: true });
      expect(result).toBe(75); // Math.floor(100 * 0.5 * 1.5)
    });

    it('applies stage modifications after item multipliers', () => {
      // scarf first: 100 * 1.5 = 150, then +1 stage: 150 * 1.5 = 225
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, scarf: true, plus1: true });
      expect(result).toBe(225);
    });

    it('applies +2 stage instead of +1 when both set', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, plus1: true, plus2: true });
      expect(result).toBe(200); // +2 takes precedence
    });

    it('applies -2 stage instead of -1 when both set', () => {
      const result = applySpeedMods(100, { ...EMPTY_SPEED_MODS, minus1: true, minus2: true });
      expect(result).toBe(50); // -2 takes precedence
    });

    it('handles all modifiers together correctly', () => {
      // tailwind (x2) * scarf (x1.5) * +2 stage (x2) = 100 * 2 * 1.5 * 2 = 600
      const result = applySpeedMods(100, {
        tailwind: true,
        scarf: true,
        paralyzed: false,
        trickRoom: false,
        plus1: false,
        plus2: true,
        minus1: false,
        minus2: false,
      });
      expect(result).toBe(600);
    });
  });

  describe('floor operations', () => {
    it('floors non-integer results', () => {
      const result = applySpeedMods(75, { ...EMPTY_SPEED_MODS, scarf: true });
      expect(result).toBe(112); // Math.floor(75 * 1.5 = 112.5)
    });

    it('floors -1 stage on odd speeds', () => {
      const result = applySpeedMods(101, { ...EMPTY_SPEED_MODS, minus1: true });
      expect(result).toBe(67); // Math.floor(101 * 2/3 = 67.333...)
    });

    it('preserves integer results exactly', () => {
      const result = applySpeedMods(50, { ...EMPTY_SPEED_MODS, scarf: true });
      expect(result).toBe(75);
    });

    it('handles very small speed values', () => {
      const result = applySpeedMods(1, { ...EMPTY_SPEED_MODS, scarf: true });
      expect(result).toBe(1); // Math.floor(1 * 1.5 = 1.5)
    });
  });

  describe('edge cases', () => {
    it('handles zero speed', () => {
      const result = applySpeedMods(0, { ...EMPTY_SPEED_MODS, tailwind: true });
      expect(result).toBe(0);
    });

    it('handles extremely high speed values', () => {
      const result = applySpeedMods(999, { ...EMPTY_SPEED_MODS, tailwind: true, scarf: true });
      expect(result).toBe(2997); // 999 * 2 * 1.5
    });

    it('with no modifiers, speed remains unchanged', () => {
      const result = applySpeedMods(123, EMPTY_SPEED_MODS);
      expect(result).toBe(123);
    });
  });
});

describe('applyItemSpeed', () => {
  describe('speed-boosting items', () => {
    it('applies Choice Scarf boost (x1.5)', () => {
      const result = applyItemSpeed(100, 'Choice Scarf');
      expect(result).toBe(150);
    });

    it('applies other speed-reducing items', () => {
      expect(applyItemSpeed(100, 'Iron Ball')).toBe(50);
      expect(applyItemSpeed(100, 'Lagging Tail')).toBe(50);
      expect(applyItemSpeed(100, 'Macho Brace')).toBe(50);
    });
  });

  describe('non-speed items', () => {
    it('returns unchanged speed for non-speed items', () => {
      expect(applyItemSpeed(100, 'Assault Vest')).toBe(100);
      expect(applyItemSpeed(100, 'Life Orb')).toBe(100);
      expect(applyItemSpeed(100, 'Leftovers')).toBe(100);
      expect(applyItemSpeed(100, 'Expert Belt')).toBe(100);
    });

    it('returns unchanged speed for empty/None item', () => {
      expect(applyItemSpeed(100, 'None')).toBe(100);
      expect(applyItemSpeed(100, '')).toBe(100);
    });
  });

  describe('floor operations', () => {
    it('floors Choice Scarf multiplier', () => {
      const result = applyItemSpeed(75, 'Choice Scarf');
      expect(result).toBe(112); // Math.floor(75 * 1.5)
    });

    it('floors speed-reduction items', () => {
      const result = applyItemSpeed(75, 'Iron Ball');
      expect(result).toBe(37); // Math.floor(75 * 0.5)
    });
  });

  describe('edge cases', () => {
    it('handles zero speed', () => {
      expect(applyItemSpeed(0, 'Choice Scarf')).toBe(0);
      expect(applyItemSpeed(0, 'Iron Ball')).toBe(0);
    });

    it('handles very high speeds', () => {
      expect(applyItemSpeed(999, 'Choice Scarf')).toBe(1498); // Math.floor(999 * 1.5)
      expect(applyItemSpeed(999, 'Iron Ball')).toBe(499); // Math.floor(999 * 0.5)
    });

    it('is case-sensitive for item names', () => {
      // Assuming the implementation is case-sensitive
      expect(applyItemSpeed(100, 'choice scarf')).toBe(100);
      expect(applyItemSpeed(100, 'CHOICE SCARF')).toBe(100);
    });
  });
});
