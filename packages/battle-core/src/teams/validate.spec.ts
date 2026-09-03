import { describe, expect, it } from "vitest";
import type { PokemonSet } from "@pkmn/sim";

import { importPaste } from "./paste.js";
import { validateTeam } from "./validate.js";
import { SAMPLE_TEAMS } from "../samples/index.js";
import { CHAMPIONS_SP_PER_STAT, CHAMPIONS_SP_TOTAL } from "../mods/champions/sp.js";
import { initChampionsMod } from "../mods/champions/registry.js";
import { registerBattleMods } from "../mods/register.js";

/**
 * Legality for the CUSTOM formats, which is where it was broken.
 *
 * `VGC 2026 Regulation M-B (Champions)` came back as
 * `Validation error: format should be a 'Format', but was a 'Condition'` for
 * every team, legal or not. The cause was not Champions: `DexFormats`'
 * `rulesetCache` is per-dex, `Dex.formats.extend()` fills only the base Dex's,
 * and `validate.ts` was asking a MODDED dex to name the format. A miss there
 * does not return undefined — it returns a `Format` with `exists: false` whose
 * `effectType` defaults to `'Condition'`, and `TeamValidator`'s constructor
 * rejects that. `gen9teras` was broken in exactly the same way, so all three
 * custom formats are covered below.
 */

type Stats = { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };

const NO_SP: Stats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const MAX_IVS: Stats = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

function set(
  species: string,
  ability: string,
  item: string,
  nature: string,
  moves: string[],
  evs: Partial<Stats>,
  level = 50,
): PokemonSet {
  return {
    name: species,
    species,
    item,
    ability,
    moves,
    nature,
    gender: "",
    evs: { ...NO_SP, ...evs },
    ivs: { ...MAX_IVS },
    level,
  } as PokemonSet;
}

/**
 * A legal Champions squad: six species that exist in the mod's restricted dex,
 * six different items (Flat Rules carries `Item Clause = 1`), and an SP spread
 * that fits 32-per-stat / 66-total.
 */
function championsTeam(spread: Partial<Stats> = { hp: 32, atk: 32, spe: 2 }): PokemonSet[] {
  return [
    set("Venusaur", "Chlorophyll", "Sitrus Berry", "Modest", ["Energy Ball", "Sludge Bomb", "Sleep Powder", "Protect"], spread),
    set("Arcanine", "Intimidate", "Lum Berry", "Adamant", ["Flare Blitz", "Extreme Speed", "Close Combat", "Protect"], spread),
    set("Snorlax", "Thick Fat", "Leftovers", "Careful", ["Body Slam", "Earthquake", "Curse", "Rest"], spread),
    set("Gyarados", "Intimidate", "Mystic Water", "Jolly", ["Waterfall", "Ice Fang", "Dragon Dance", "Protect"], spread),
    set("Clefable", "Unaware", "Focus Sash", "Bold", ["Moonblast", "Follow Me", "Helping Hand", "Protect"], spread),
    set("Dragonite", "Multiscale", "Choice Scarf", "Adamant", ["Outrage", "Extreme Speed", "Earthquake", "Ice Punch"], spread),
  ];
}

const CHAMPIONS_FORMATS = ["gen9championsvgc2026regmb", "gen9championsvgc2026regma"] as const;

describe.each(CHAMPIONS_FORMATS)("%s", (format) => {
  it("no longer reports the 'Condition' error", () => {
    const result = validateTeam(format, championsTeam());
    expect(result.problems.join(" | ")).not.toContain("Condition");
    expect(result.problems.join(" | ")).not.toContain("Unknown format");
  });

  it("accepts a legal team", () => {
    const result = validateTeam(format, championsTeam());
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it(`rejects more than ${CHAMPIONS_SP_PER_STAT} SP in one stat, in SP wording`, () => {
    const result = validateTeam(format, championsTeam({ hp: 40, atk: 20 }));
    expect(result.ok).toBe(false);
    expect(result.problems.join(" | ")).toContain(
      `has 40 Stat Points in HP, but the maximum is ${CHAMPIONS_SP_PER_STAT}.`,
    );
  });

  it(`rejects more than ${CHAMPIONS_SP_TOTAL} SP in total, in SP wording`, () => {
    // 32 + 32 + 32 = 96, each stat inside the per-stat cap.
    const result = validateTeam(format, championsTeam({ hp: 32, atk: 32, spe: 32 }));
    expect(result.ok).toBe(false);
    expect(result.problems.join(" | ")).toContain(
      `has 96 Stat Points in total, but the maximum is ${CHAMPIONS_SP_TOTAL}.`,
    );
  });

  it("reports the total ONCE, in SP wording, never in EVs", () => {
    // `EV Limit = 66` stays on the format so `ruleTable.evLimit` is correct for
    // the sim, but its EV-worded complaint is the wrong vocabulary for a format
    // that has no EVs — and showing both is showing one problem twice.
    const result = validateTeam(format, championsTeam({ hp: 32, atk: 32, spe: 20 }));
    const totals = result.problems.filter((p) => p.includes(" total"));
    expect(totals).toHaveLength(6); // one per Pokémon, not two
    for (const problem of totals) {
      expect(problem).toContain("Stat Points in total");
      expect(problem).not.toContain("EVs");
    }
    expect(result.problems.join(" | ")).not.toContain("EVs");
  });

  it("names the stat that is over the cap", () => {
    const result = validateTeam(format, championsTeam({ spa: 33 }));
    expect(result.problems.join(" | ")).toContain(
      `has 33 Stat Points in Special Attack, but the maximum is ${CHAMPIONS_SP_PER_STAT}.`,
    );
  });
});

describe("gen9teras", () => {
  it("resolves and validates rather than throwing", () => {
    const team = importPaste(SAMPLE_TEAMS.gen9ou)!;
    const result = validateTeam("gen9teras", team);
    expect(result.problems.join(" | ")).not.toContain("Condition");
    expect(result.problems.join(" | ")).not.toContain("Format not found");
    // Whether this particular paste is legal in the teras dex is beside the
    // point — what matters is that the format resolved and the validator ran.
    expect(Array.isArray(result.problems)).toBe(true);
  });
});

describe("gen9ou (no regression)", () => {
  const ouTeam = () => importPaste(SAMPLE_TEAMS.gen9ou)!;

  it("accepts the bundled sample", () => {
    expect(validateTeam("gen9ou", ouTeam())).toEqual({ ok: true, problems: [] });
  });

  it("accepts a 252/252/4 spread", () => {
    const team = ouTeam();
    team[0].evs = { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 };
    expect(validateTeam("gen9ou", team)).toEqual({ ok: true, problems: [] });
  });

  it("rejects a spread over 510 total", () => {
    const team = ouTeam();
    // 253 in one stat, 511 overall.
    team[0].evs = { hp: 6, atk: 253, def: 0, spa: 0, spd: 0, spe: 252 };
    const result = validateTeam("gen9ou", team);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" | ")).toContain("511 total EVs");
  });

  it("still talks about EVs, never Stat Points", () => {
    const team = ouTeam();
    team[0].evs = { hp: 6, atk: 253, def: 0, spa: 0, spd: 0, spe: 252 };
    expect(validateTeam("gen9ou", team).problems.join(" | ")).not.toContain("Stat Points");
  });

  it("reports an unknown format instead of throwing", () => {
    expect(validateTeam("gen9notaformat", ouTeam())).toEqual({
      ok: false,
      problems: ["Unknown format: gen9notaformat"],
    });
  });

  it("reports an empty team instead of throwing", () => {
    expect(validateTeam("gen9ou", [])).toEqual({ ok: false, problems: ["Team is empty"] });
  });
});

/**
 * Gen wording vs FORMAT wording.
 *
 * `Basculegion's item Life Orb does not exist in Gen 9.` is what the sim says
 * when a Champions regulation removes an item, because the generation really is
 * 9 and the sim has no concept of "Reg M-A took this away". The validation is
 * right and the sentence is useless — a player reads it as "this item is not in
 * the game". Custom formats therefore get the format named instead; vanilla
 * ones keep "Gen 9", which is both true and the wording the scene already uses.
 */
describe("gen wording is replaced by the format name on custom formats", () => {
  const REG_MA = "gen9championsvgc2026regma";
  const REG_MA_LABEL = "VGC 2026 Reg M-A (Champions)";

  it("names the regulation for an item the regulation removed", () => {
    // `mods/champions/regma/items.ts` marks `lifeorb` as `isNonstandard: "Past"`.
    const team = championsTeam();
    team[0].item = "Life Orb";
    const { problems } = validateTeam(REG_MA, team);
    expect(problems).toContain(`Venusaur's item Life Orb is not available in ${REG_MA_LABEL}.`);
    expect(problems.join(" | ")).not.toContain("Gen 9");
  });

  it("names the regulation for a species the regulation removed", () => {
    // `mods/champions/formats-data.ts` marks `lapras` as `isNonstandard: "Past"`.
    const team = championsTeam();
    team[0] = set("Lapras", "Water Absorb", "Sitrus Berry", "Modest", ["Surf", "Ice Beam", "Freeze-Dry", "Protect"], { hp: 32, atk: 32, spe: 2 });
    const { problems } = validateTeam(REG_MA, team);
    expect(problems).toContain(`Lapras is not available in ${REG_MA_LABEL}.`);
    expect(problems.join(" | ")).not.toContain("Gen 9");
  });

  it("names the regulation for a move the mod removed", () => {
    // `mods/champions/moves.ts` marks `absorb` as `isNonstandard: "Past"`.
    const team = championsTeam();
    team[0].moves = ["Absorb", "Sludge Bomb", "Sleep Powder", "Protect"];
    const { problems } = validateTeam(REG_MA, team);
    expect(problems).toContain(`Venusaur's move Absorb is not available in ${REG_MA_LABEL}.`);
    expect(problems.join(" | ")).not.toContain("Gen 9");
  });

  it("leaves a problem it does not recognise byte-for-byte alone", () => {
    // Two Sitrus Berries: Item Clause, which carries no generation wording.
    const team = championsTeam();
    team[1].item = "Sitrus Berry";
    const { problems } = validateTeam(REG_MA, team);
    expect(problems).toContain("You are limited to 1 of each item by Item Clause.");
    expect(problems).toContain("(You have more than 1 Sitrus Berry)");
  });

  it("leaves the SP wording alone", () => {
    const { problems } = validateTeam(REG_MA, championsTeam({ hp: 40, atk: 20 }));
    expect(problems).toContain(
      `Venusaur has 40 Stat Points in HP, but the maximum is ${CHAMPIONS_SP_PER_STAT}.`,
    );
  });

  describe("gen9teras", () => {
    const terasTeam = () => importPaste(SAMPLE_TEAMS.gen9ou)!;

    it("names the format for a Past item", () => {
      const team = terasTeam();
      team[0].item = "Berserk Gene";
      const { problems } = validateTeam("gen9teras", team);
      expect(problems).toContain("Great Tusk's item Berserk Gene is not available in Gen 9 Teras.");
      expect(problems.join(" | ")).not.toContain("does not exist in Gen");
    });

    it("names the format for an Unobtainable move", () => {
      // The other gen-worded template: `... is not obtainable without hacking
      // or glitches in Gen 9.`, whose gen suffix only appears from Gen 9 on.
      const team = terasTeam();
      team[0].moves = ["V-create", ...team[0].moves.slice(1)];
      const { problems } = validateTeam("gen9teras", team);
      expect(problems).toContain("V-create is not available in Gen 9 Teras.");
      expect(problems.join(" | ")).not.toContain("hacking or glitches");
    });
  });

  describe("vanilla formats keep the sim's own wording", () => {
    const ouTeam = () => importPaste(SAMPLE_TEAMS.gen9ou)!;

    it("leaves the item template untouched on gen9ou", () => {
      const team = ouTeam();
      team[0].item = "Berserk Gene";
      expect(validateTeam("gen9ou", team).problems).toEqual([
        "Great Tusk's item Berserk Gene does not exist in Gen 9.",
      ]);
    });

    it("leaves the Unobtainable-move template untouched on gen9ou", () => {
      const team = ouTeam();
      team[0].moves = ["V-create", ...team[0].moves.slice(1)];
      expect(validateTeam("gen9ou", team).problems).toEqual([
        "V-create is not obtainable without hacking or glitches in Gen 9.",
        "Great Tusk can't learn V-create.",
      ]);
    });
  });
});

describe("mod registration", () => {
  it("survives both entry points in one process", () => {
    // `registerBattleMods()` and `initChampionsMod()` used to be two separate
    // registrations of the same formats, and `DexFormats.extend()` throws
    // `Format #N has a duplicate ID` on the second one. They share a flag now.
    expect(() => {
      registerBattleMods();
      initChampionsMod();
      registerBattleMods();
    }).not.toThrow();
    expect(validateTeam("gen9championsvgc2026regmb", championsTeam()).ok).toBe(true);
  });
});
