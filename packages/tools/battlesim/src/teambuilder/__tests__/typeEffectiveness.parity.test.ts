/**
 * Parity test: effectiveness() from @boffmedia/pokemon-identity must match the
 * damageTaken + CODE_MULT calculation that teamAnalysis.ts used before the
 * migration (audit finding T15).
 *
 * The comparison is deliberately made against the RAW product on both sides.
 * An earlier version of this test clamped the @pkmn/dex side to 0/0.5/1/2 to
 * mirror a clamp inside effectiveness(), which made the two agree by
 * construction and hid the fact that every quad weakness (4x) and double
 * resistance (0.25x) was being reported as neutral. The clamp is gone from
 * both; if it ever comes back, these tests fail.
 */
import { describe, it, expect } from "vitest";
import { Dex } from "@pkmn/dex";
import { effectiveness } from "@boffmedia/pokemon-identity";

const TYPE_LIST = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
] as const;

/** @pkmn/dex damageTaken codes: 0 neutral · 1 weak (x2) · 2 resist (x1/2) · 3 immune. */
const CODE_MULT = [1, 2, 0.5, 0];

/** The exact expression teamAnalysis.ts used before the migration. */
function legacyEffectiveness(atkType: string, defTypes: string[]): number {
  let mult = 1;
  for (const def of defTypes) {
    const table = Dex.types.get(def);
    if (!table.exists) continue;
    mult *= CODE_MULT[table.damageTaken[atkType] ?? 0] ?? 1;
  }
  return mult;
}

describe("Type effectiveness parity (pokemon-identity vs @pkmn/dex)", () => {
  it("agrees on all 18x18 single-type pairs", () => {
    const disagreements: string[] = [];

    for (const atk of TYPE_LIST) {
      for (const def of TYPE_LIST) {
        const identity = effectiveness(atk, [def]);
        const legacy = legacyEffectiveness(atk, [def]);
        if (identity !== legacy) {
          disagreements.push(`  ${atk} vs ${def}: identity=${identity}, @pkmn/dex=${legacy}`);
        }
      }
    }

    expect(disagreements, `Type chart parity failed:\n${disagreements.join("\n")}`).toEqual([]);
  });

  it("agrees on every dual-type defender, quad cases included", () => {
    const disagreements: string[] = [];

    for (const atk of TYPE_LIST) {
      for (let i = 0; i < TYPE_LIST.length; i++) {
        for (let j = i + 1; j < TYPE_LIST.length; j++) {
          const defs = [TYPE_LIST[i], TYPE_LIST[j]];
          const identity = effectiveness(atk, defs);
          const legacy = legacyEffectiveness(atk, defs);
          if (identity !== legacy) {
            disagreements.push(
              `  ${atk} vs [${defs.join(", ")}]: identity=${identity}, @pkmn/dex=${legacy}`,
            );
          }
        }
      }
    }

    expect(disagreements, `Dual-type parity failed:\n${disagreements.join("\n")}`).toEqual([]);
  });

  it("does not collapse quad weaknesses or double resistances to neutral", () => {
    // The regression this whole migration nearly shipped. Each of these is a
    // real Gen 9 type pairing.
    expect(effectiveness("Fire", ["Grass", "Ice"])).toBe(4); // Abomasnow
    expect(effectiveness("Ice", ["Ground", "Flying"])).toBe(4); // Gligar
    expect(effectiveness("Ground", ["Fire", "Rock"])).toBe(4); // Coalossal
    expect(effectiveness("Fire", ["Water", "Dragon"])).toBe(0.25); // Kingdra
    expect(effectiveness("Grass", ["Fire", "Steel"])).toBe(0.25); // Heatran

    // Water/Steel is NOT a double resistance to Fire: Water resists it but
    // Steel is weak to it, so the two cancel to neutral.
    expect(effectiveness("Fire", ["Water", "Steel"])).toBe(1); // Empoleon

    // An immunity on either type still wins outright, even paired with a weakness.
    expect(effectiveness("Ground", ["Fire", "Flying"])).toBe(0); // Charizard
  });

  it("matches the known Gen 9 immunities", () => {
    expect(effectiveness("Normal", ["Ghost"])).toBe(0);
    expect(effectiveness("Fighting", ["Ghost"])).toBe(0);
    expect(effectiveness("Psychic", ["Dark"])).toBe(0);
    expect(effectiveness("Poison", ["Steel"])).toBe(0);
    expect(effectiveness("Ground", ["Flying"])).toBe(0);
    expect(effectiveness("Electric", ["Ground"])).toBe(0);
    expect(effectiveness("Dragon", ["Fairy"])).toBe(0);
  });
});
