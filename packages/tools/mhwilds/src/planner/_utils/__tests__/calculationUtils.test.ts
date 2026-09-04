import { describe, expect, it } from 'vitest';
import { calculateTotalSkills, calculateStats } from '../calculationUtils';
import type { BuildData, ArmorPiece, SkillRank, Decoration, DecorationAssignment, Weapon } from '../../../types';

// Helper to create a minimal armor piece
function createArmor(overrides: Partial<ArmorPiece> = {}): ArmorPiece {
  return {
    id: 1,
    name: 'Test Armor',
    kind: 'armor',
    rank: 'Low',
    rarity: 1,
    defense: { base: 10, max: 20 },
    resistances: {
      fire: 0,
      water: 0,
      thunder: 0,
      ice: 0,
      dragon: 0,
    },
    slots: [],
    skills: [],
    ...overrides,
  };
}

// Helper to create a minimal weapon
function createWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return {
    id: 100,
    kind: 'great-sword',
    name: 'Test Weapon',
    rarity: 1,
    damage: { display: 100, raw: 100 },
    affinity: 0,
    slots: [],
    ...overrides,
  };
}

// Helper to create a basic build
function createBuild(overrides: Partial<BuildData> = {}): BuildData {
  return {
    name: 'Test Build',
    head: null,
    chest: null,
    arms: null,
    waist: null,
    legs: null,
    weapon: null,
    secondaryWeapon: null,
    charm: null,
    decorations: [],
    ...overrides,
  };
}

describe('calculateTotalSkills', () => {
  describe('single skill sources', () => {
    it('extracts skills from a single armor piece', () => {
      const skillRank: SkillRank = {
        skill: { id: 1, gameId: 1, name: 'Attack Boost', kind: 'passive' },
        level: 1,
        description: 'Boosts attack',
        id: 1,
      };
      const armor = createArmor({
        skills: [skillRank],
      });
      const build = createBuild({ head: armor });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('Attack Boost');
      expect(skills[0].level).toBe(1);
    });

    it('extracts skills from weapon', () => {
      const skillRank: SkillRank = {
        skill: { id: 2, gameId: 2, name: 'Weapon Sharpness', kind: 'passive' },
        level: 2,
        description: 'Improves sharpness',
        id: 2,
      };
      const weapon = createWeapon({
        skills: [skillRank],
      });
      const build = createBuild({
        weapon,
      });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('Weapon Sharpness');
    });

    it('extracts skills from decorations', () => {
      const decoration: Decoration = {
        id: 300,
        name: 'Test Deco',
        slot: 2,
        rarity: 5,
        skills: [
          {
            skill: { id: 4, name: 'Deco Skill' },
            level: 1,
            description: 'Deco boost',
            id: 4,
          },
        ],
      };
      const decoAssignment: DecorationAssignment = {
        decoration,
        equipmentType: 'head',
        slotIndex: 0,
        slotSize: 2,
      };
      const build = createBuild({ decorations: [decoAssignment] });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('Deco Skill');
    });
  });

  describe('multiple skill sources', () => {
    it('combines skills from multiple armor pieces', () => {
      const skill1: SkillRank = {
        skill: { id: 1, gameId: 1, name: 'Attack Boost', kind: 'passive' },
        level: 1,
        description: '',
        id: 1,
      };
      const skill2: SkillRank = {
        skill: { id: 2, gameId: 2, name: 'Defense Boost', kind: 'passive' },
        level: 1,
        description: '',
        id: 2,
      };
      const head = createArmor({ skills: [skill1] });
      const chest = createArmor({ skills: [skill2] });
      const build = createBuild({ head, chest });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(2);
      expect(skills.map((s) => s.name)).toContain('Attack Boost');
      expect(skills.map((s) => s.name)).toContain('Defense Boost');
    });

    it('merges duplicate skills and sums levels', () => {
      const skill: SkillRank = {
        skill: { id: 1, gameId: 1, name: 'Attack Boost', kind: 'passive' },
        level: 1,
        description: '',
        id: 1,
      };
      const head = createArmor({ skills: [skill] });
      const chest = createArmor({ skills: [skill] });
      const build = createBuild({ head, chest });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('Attack Boost');
      expect(skills[0].level).toBe(2);
    });

    it('merges duplicate skills from armor and weapon', () => {
      const skill: SkillRank = {
        skill: { id: 1, gameId: 1, name: 'Shared Skill', kind: 'passive' },
        level: 1,
        description: '',
        id: 1,
      };
      const head = createArmor({ skills: [skill] });
      const weapon = createWeapon({ skills: [skill] });
      const build = createBuild({
        head,
        weapon,
      });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(1);
      expect(skills[0].level).toBe(2);
    });

    it('excludes secondary weapon decorations', () => {
      const decoration: Decoration = {
        id: 300,
        name: 'Deco1',
        slot: 2,
        rarity: 5,
        skills: [
          { skill: { id: 1, name: 'Skill1' }, level: 1, description: '', id: 1 },
        ],
      };
      const primaryDeco: DecorationAssignment = {
        decoration,
        equipmentType: 'head',
        slotIndex: 0,
        slotSize: 2,
      };
      const secondaryDeco: DecorationAssignment = {
        decoration,
        equipmentType: 'secondaryWeapon',
        slotIndex: 0,
        slotSize: 2,
      };
      const build = createBuild({ decorations: [primaryDeco, secondaryDeco] });
      const skills = calculateTotalSkills(build, {});

      // Should only include primary deco skill
      expect(skills.filter((s) => s.name === 'Skill1')).toHaveLength(1);
    });
  });

  describe('edge cases and malformed data', () => {
    it('handles missing skills array gracefully', () => {
      const armor = createArmor({ skills: undefined });
      const build = createBuild({ head: armor });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(0);
    });

    it('handles empty skills array', () => {
      const armor = createArmor({ skills: [] });
      const build = createBuild({ head: armor });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(0);
    });

    it('ignores skills without names', () => {
      const skill: SkillRank = {
        skill: { id: 1, gameId: 1, name: '', kind: 'passive' },
        level: 1,
        description: '',
        id: 1,
      };
      const armor = createArmor({ skills: [skill] });
      const build = createBuild({ head: armor });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(0);
    });

    it('handles decorations with missing decoration object', () => {
      const decoAssignment: DecorationAssignment = {
        decoration: null as any,
        equipmentType: 'head',
        slotIndex: 0,
        slotSize: 2,
      };
      const build = createBuild({ decorations: [decoAssignment] });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(0);
    });

    it('handles non-array decorations', () => {
      const build = createBuild({ decorations: undefined as any });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(0);
    });

    it('handles skills with mixed naming schemes', () => {
      // Some skills have both id and name at skillRank level
      const skill: SkillRank & { name?: string } = {
        skill: { id: 1, gameId: 1, name: 'Official Name', kind: 'passive' },
        level: 1,
        description: '',
        id: 1,
        name: 'Alt Name',
      };
      const armor = createArmor({ skills: [skill] });
      const build = createBuild({ head: armor });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('Official Name');
    });
  });

  describe('complex builds', () => {
    it('handles a complete build with all equipment types', () => {
      const skill1: SkillRank = {
        skill: { id: 1, gameId: 1, name: 'Skill1', kind: 'passive' },
        level: 1,
        description: '',
        id: 1,
      };
      const skill2: SkillRank = {
        skill: { id: 2, gameId: 2, name: 'Skill2', kind: 'passive' },
        level: 1,
        description: '',
        id: 2,
      };
      const build = createBuild({
        head: createArmor({ skills: [skill1] }),
        chest: createArmor({ skills: [skill2] }),
        arms: createArmor({}),
        waist: createArmor({}),
        legs: createArmor({}),
        weapon: createWeapon({ skills: [] }),
      });
      const skills = calculateTotalSkills(build, {});

      expect(skills.length).toBeGreaterThanOrEqual(2);
    });

    it('stacks multiple levels of the same skill correctly', () => {
      const skill: SkillRank = {
        skill: { id: 1, gameId: 1, name: 'Attack Boost', kind: 'passive' },
        level: 1,
        description: '',
        id: 1,
      };
      const head = createArmor({ skills: [skill] });
      const chest = createArmor({ skills: [{ ...skill, level: 2 }] });
      const arms = createArmor({ skills: [{ ...skill, level: 1 }] });
      const build = createBuild({ head, chest, arms });
      const skills = calculateTotalSkills(build, {});

      expect(skills).toHaveLength(1);
      expect(skills[0].level).toBe(4); // 1 + 2 + 1
    });
  });
});

describe('calculateStats', () => {
  describe('weapon stats', () => {
    it('extracts basic weapon stats', () => {
      const weapon = createWeapon({
        attack: 250,
        damage: { display: 250, raw: 250 },
        affinity: 10,
      });
      const build = createBuild({
        weapon,
      });
      const stats = calculateStats(build);

      expect(stats.weapon).toBeDefined();
      expect(stats.attack).toBe(250);
      expect(stats.affinity).toBe(10);
    });

    it('handles weapons without attack/affinity', () => {
      const weapon = createWeapon({
        damage: undefined as any,
        affinity: undefined as any,
      });
      const build = createBuild({
        weapon,
      });
      const stats = calculateStats(build);

      expect(stats.attack).toBe(0);
      // Affinity can be undefined if not specified in weapon
      expect(stats.affinity === undefined || typeof stats.affinity === 'number').toBe(true);
    });

    it('handles missing weapon', () => {
      const build = createBuild();
      const stats = calculateStats(build);

      expect(stats.weapon).toBeNull();
      expect(stats.attack).toBe(0);
    });
  });

  describe('armor defense stats', () => {
    it('sums defense from multiple armor pieces', () => {
      const head = createArmor({ defense: { base: 10, max: 15 } });
      const chest = createArmor({ defense: { base: 20, max: 25 } });
      const arms = createArmor({ defense: { base: 15, max: 20 } });
      const build = createBuild({ head, chest, arms });
      const stats = calculateStats(build);

      expect(stats.defenseMin).toBe(45); // 10 + 20 + 15
      expect(stats.defenseMax).toBe(60); // 15 + 25 + 20
    });

    it('handles armor without max defense', () => {
      const armor = createArmor({ defense: { base: 10 } });
      const build = createBuild({ head: armor });
      const stats = calculateStats(build);

      expect(stats.defenseMin).toBe(10);
      expect(stats.defenseMax).toBe(0); // No max defense provided
    });

    it('handles null armor pieces', () => {
      const head = createArmor({ defense: { base: 10, max: 15 } });
      const build = createBuild({ head, chest: null });
      const stats = calculateStats(build);

      expect(stats.defenseMin).toBe(10);
    });
  });

  describe('armor resistances', () => {
    it('sums resistances from multiple armor pieces', () => {
      const head = createArmor({
        resistances: { fire: 5, water: 2, thunder: 0, ice: 3, dragon: 1 },
      });
      const chest = createArmor({
        resistances: { fire: 3, water: 4, thunder: 2, ice: 0, dragon: 2 },
      });
      const build = createBuild({ head, chest });
      const stats = calculateStats(build);

      expect(stats.fireRes).toBe(8);
      expect(stats.waterRes).toBe(6);
      expect(stats.thunderRes).toBe(2);
      expect(stats.iceRes).toBe(3);
      expect(stats.dragonRes).toBe(3);
    });

    it('handles negative resistances', () => {
      const armor = createArmor({
        resistances: { fire: -5, water: 0, thunder: 0, ice: 0, dragon: 0 },
      });
      const build = createBuild({ head: armor });
      const stats = calculateStats(build);

      expect(stats.fireRes).toBe(-5);
    });

    it('handles missing resistances object', () => {
      const armor = createArmor({
        resistances: undefined as any,
      });
      const build = createBuild({ head: armor });
      expect(() => calculateStats(build)).not.toThrow();
    });
  });

  describe('sharpness stats', () => {
    it('initializes sharpness with all zero values', () => {
      const build = createBuild();
      const stats = calculateStats(build);

      expect(stats.sharpness).toBeDefined();
      expect(stats.sharpness.red).toBe(0);
      expect(stats.sharpness.orange).toBe(0);
      expect(stats.sharpness.yellow).toBe(0);
      expect(stats.sharpness.green).toBe(0);
      expect(stats.sharpness.blue).toBe(0);
      expect(stats.sharpness.white).toBe(0);
      expect(stats.sharpness.purple).toBe(0);
    });
  });

  describe('complete stats structure', () => {
    it('returns complete stats object with all properties', () => {
      const weapon = createWeapon({
        damage: { display: 100, raw: 100 },
        affinity: 5,
      });
      const build = createBuild({
        weapon,
      });
      const stats = calculateStats(build);

      expect(stats).toHaveProperty('weapon');
      expect(stats).toHaveProperty('defenseMin');
      expect(stats).toHaveProperty('defenseMax');
      expect(stats).toHaveProperty('fireRes');
      expect(stats).toHaveProperty('waterRes');
      expect(stats).toHaveProperty('thunderRes');
      expect(stats).toHaveProperty('iceRes');
      expect(stats).toHaveProperty('dragonRes');
      expect(stats).toHaveProperty('attack');
      expect(stats).toHaveProperty('affinity');
      expect(stats).toHaveProperty('element');
      expect(stats).toHaveProperty('status');
      expect(stats).toHaveProperty('sharpness');
    });

    it('handles empty build', () => {
      const build = createBuild();
      const stats = calculateStats(build);

      expect(stats.defenseMin).toBe(0);
      expect(stats.fireRes).toBe(0);
      expect(stats.attack).toBe(0);
    });
  });
});
