import { describe, expect, it } from 'vitest';
import { parseShowdownPaste, isValidPaste } from '../showdown-parse';
import type { PresetSlot } from '../types';

describe('parseShowdownPaste', () => {
  describe('happy path - valid pastes', () => {
    it('parses a basic team with species, items, and moves', () => {
      const paste = `
Charizard @ Choice Specs
Ability: Blaze
Tera Type: Fire
EVs: 252 SpA / 4 Spe
Timid Nature
- Flamethrower
- Psychic
- Focus Blast
- Fireblast

Pikachu @ Assault Vest
Ability: Static
Tera Type: Electric
- Thunderbolt
- Volt Switch
`;
      const result = parseShowdownPaste(paste);
      expect(result).toHaveLength(2);
      expect(result[0].speciesName).toBe('Charizard');
      expect(result[0].item).toBe('Choice Specs');
      expect(result[0].nature).toBe('Timid');
      expect(result[0].ability).toBe('Blaze');
      expect(result[0].teraType).toBe('Fire');
      expect(result[0].moves).toEqual(['Flamethrower', 'Psychic', 'Focus Blast', 'Fireblast']);
      expect(result[0].slotIndex).toBe(0);
    });

    it('parses pokemon with nicknames', () => {
      const paste = `
MrMime (Mr. Mime) @ Life Orb
Ability: Filter
Tera Type: Psychic
- Psychic
- Dazzling Gleam
- Focus Blast
- Shadow Ball
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].nickname).toBe('MrMime');
      expect(result[0].speciesName).toBe('Mr. Mime');
    });

    it('parses pokemon with gender markers', () => {
      const paste = `
Salamence (F) @ Dragon Dance
Ability: Intimidate
Tera Type: Dragon
- Dragon Dance
- Outrage
- Earthquake
- Superpower
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].speciesName).toBe('Salamence');
      expect(result[0].slotIndex).toBe(0);
    });

    it('handles pokemon without tera type', () => {
      const paste = `
Rillaboom @ Assault Vest
Ability: Grassy Surge
- Grassy Glide
- Jungle Healing
- Earthquake
- U-turn
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].teraType).toBeUndefined();
    });

    it('handles pokemon without item', () => {
      const paste = `
Dusknoir
Ability: Pressure
Tera Type: Ghost
- Shadow Punch
- Focus Blast
- Trick Room
- Protect
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].item).toBeUndefined();
    });

    it('handles pokemon without ability specified', () => {
      const paste = `
Togekiss @ Assault Vest
Tera Type: Fairy
- Dazzling Gleam
- Air Slash
- Aura Sphere
- Protect
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].ability).toBeUndefined();
    });

    it('limits to 6 pokemon maximum', () => {
      const paste = `
Pokemon1 @ Choice Specs
- Move1

Pokemon2 @ Choice Scarf
- Move2

Pokemon3 @ Assault Vest
- Move3

Pokemon4 @ Life Orb
- Move4

Pokemon5 @ Expert Belt
- Move5

Pokemon6 @ Leftovers
- Move6

Pokemon7 @ Air Balloon
- Move7

Pokemon8 @ Booster Energy
- Move8
`;
      const result = parseShowdownPaste(paste);
      expect(result).toHaveLength(6);
    });

    it('preserves slot index order', () => {
      const paste = `
Charizard @ Choice Specs
- Flamethrower

Pikachu @ Choice Scarf
- Thunderbolt

Rillaboom @ Assault Vest
- Grassy Glide
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].slotIndex).toBe(0);
      expect(result[1].slotIndex).toBe(1);
      expect(result[2].slotIndex).toBe(2);
    });

    it('handles extra whitespace in paste', () => {
      const paste = `

Charizard @ Choice Specs
  Ability:  Blaze
  Tera Type:  Fire
  - Flamethrower
  - Psychic


Pikachu @ Choice Scarf
Ability:Static
- Thunderbolt
`;
      const result = parseShowdownPaste(paste);
      expect(result).toHaveLength(2);
      expect(result[0].speciesName).toBe('Charizard');
      expect(result[1].speciesName).toBe('Pikachu');
    });

    it('handles moves with special characters and spacing', () => {
      const paste = `
Arcanine @ Choice Scarf
Ability: Intimidate
- Close Combat
- Wild Charge
- Crunch
- Extreme Speed
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].moves).toContain('Wild Charge');
      expect(result[0].moves).toContain('Close Combat');
    });
  });

  describe('edge cases - malformed or unusual input', () => {
    it('returns empty array for empty paste', () => {
      const result = parseShowdownPaste('');
      expect(result).toHaveLength(0);
    });

    it('returns empty array for paste with only whitespace', () => {
      const result = parseShowdownPaste('   \n   \n   ');
      expect(result).toHaveLength(0);
    });

    it('handles pokemon blocks with empty species name (parses as empty string)', () => {
      const paste = `
@ Choice Specs
- Flamethrower

Charizard @ Choice Specs
- Flamethrower
`;
      const result = parseShowdownPaste(paste);
      // The first empty line block is still parsed with empty species
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('handles pokemon with only a species name', () => {
      const paste = `
Charizard
`;
      const result = parseShowdownPaste(paste);
      expect(result).toHaveLength(1);
      expect(result[0].speciesName).toBe('Charizard');
      expect(result[0].item).toBeUndefined();
    });

    it('ignores duplicate move entries and keeps all', () => {
      const paste = `
Charizard @ Choice Specs
- Flamethrower
- Flamethrower
- Psychic
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].moves).toHaveLength(3);
      expect(result[0].moves.filter((m) => m === 'Flamethrower')).toHaveLength(2);
    });

    it('handles incomplete teams (less than 6)', () => {
      const paste = `
Charizard @ Choice Specs
- Flamethrower

Pikachu @ Choice Scarf
- Thunderbolt
`;
      const result = parseShowdownPaste(paste);
      expect(result).toHaveLength(2);
    });

    it('handles nature at the end of line properly', () => {
      const paste = `
Charizard @ Choice Specs
Modest Nature
- Flamethrower
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].nature).toBe('Modest');
    });

    it('ignores lines that do not match known patterns', () => {
      const paste = `
Charizard @ Choice Specs
Ability: Blaze
Random unrecognized line
Level: 50
- Flamethrower
- Psychic
`;
      const result = parseShowdownPaste(paste);
      expect(result).toHaveLength(1);
      expect(result[0].moves).toHaveLength(2);
      expect(result[0].ability).toBe('Blaze');
    });

    it('handles nickname with multiple parentheses', () => {
      const paste = `
MrMime (Psychic Type) @ Choice Specs
- Flamethrower
`;
      const result = parseShowdownPaste(paste);
      // The regex uses non-greedy matching on the nickname part and looks for the last parentheses
      expect(result[0].nickname).toBe('MrMime');
      expect(result[0].speciesName).toBe('Psychic Type');
    });

    it('handles items with special characters in names', () => {
      const paste = `
Charizard @ Choice Specs
- Flamethrower

Pikachu @ Air Balloon
- Thunderbolt
`;
      const result = parseShowdownPaste(paste);
      expect(result[0].item).toBe('Choice Specs');
      expect(result[1].item).toBe('Air Balloon');
    });
  });

  describe('round-trip consistency', () => {
    it('parsed slot indices are sequential and valid', () => {
      const paste = `
Pokemon1 @ Item1
- Move1

Pokemon2 @ Item2
- Move2

Pokemon3 @ Item3
- Move3
`;
      const result = parseShowdownPaste(paste);
      result.forEach((slot, index) => {
        expect(slot.slotIndex).toBe(index);
      });
    });

    it('all parsed pokemon have non-empty speciesId', () => {
      const paste = `
Charizard @ Choice Specs
- Flamethrower

Pikachu @ Choice Scarf
- Thunderbolt
`;
      const result = parseShowdownPaste(paste);
      result.forEach((slot) => {
        expect(slot.speciesId).toBeDefined();
        expect(slot.speciesId.length).toBeGreaterThan(0);
      });
    });

    it('slot structure matches PresetSlot interface', () => {
      const paste = `
Charizard @ Choice Specs
Ability: Blaze
Tera Type: Fire
- Flamethrower
`;
      const result = parseShowdownPaste(paste);
      const slot = result[0];
      expect(slot).toHaveProperty('slotIndex');
      expect(slot).toHaveProperty('speciesId');
      expect(slot).toHaveProperty('speciesName');
      expect(slot).toHaveProperty('item');
      expect(slot).toHaveProperty('ability');
      expect(slot).toHaveProperty('moves');
      expect(slot).toHaveProperty('nature');
      expect(slot).toHaveProperty('teraType');
    });
  });
});

describe('isValidPaste', () => {
  it('returns true for valid pastes', () => {
    const paste = `
Charizard @ Choice Specs
- Flamethrower
`;
    expect(isValidPaste(paste)).toBe(true);
  });

  it('returns false for empty paste', () => {
    expect(isValidPaste('')).toBe(false);
  });

  it('returns true for paste with any text (treated as species name)', () => {
    // The parser treats any text as a valid species name block
    expect(isValidPaste('random text')).toBe(true);
  });

  it('returns false for whitespace-only paste', () => {
    expect(isValidPaste('   \n   \n   ')).toBe(false);
  });
});
