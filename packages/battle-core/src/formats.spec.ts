import { describe, expect, it } from "vitest";

import { calcStat, statLimitsFor } from "./formats.js";
import { CHAMPIONS_EVS_PER_SP } from "./mods/champions/sp.js";

/**
 * The two stat systems, side by side.
 *
 * Champions replaces EVs/IVs with Stat Points: always level 50, always 31 IVs,
 * up to 32 SP in a stat and 66 overall, stored in the `evs` field (1 SP = 8
 * EVs). The reason 1 SP is also exactly +1 to the stat is the mainline formula
 * collapsing at level 50 — asserted below rather than asserted in a comment.
 */

// Venusaur.
const V = { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 };
// Garchomp.
const G = { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 };

const OU = "gen9ou";
const CH = "gen9championsvgc2026regmb";

describe("statLimitsFor", () => {
  it("gives the mainline EV budget for a normal format", () => {
    expect(statLimitsFor(OU)).toEqual({
      system: "ev",
      perStat: 252,
      total: 510,
      step: 4,
      lockedIvs: null,
      fixedLevel: null,
    });
  });

  it("gives the Stat Point budget for both champions formats", () => {
    const sp = {
      system: "sp",
      perStat: 32,
      total: 66,
      step: 1,
      lockedIvs: 31,
      fixedLevel: 50,
    };
    expect(statLimitsFor("gen9championsvgc2026regmb")).toEqual(sp);
    expect(statLimitsFor("gen9championsvgc2026regma")).toEqual(sp);
  });

  it("falls back to EVs for an unknown format", () => {
    expect(statLimitsFor("gen9notaformat").system).toBe("ev");
  });
});

describe("calcStat, EV formats", () => {
  it("matches the well-known level-100 maxima", () => {
    // Jolly max-Speed Garchomp is 333; max HP Garchomp is 420.
    expect(calcStat(OU, "spe", G.spe, 31, 252, 100, "Jolly")).toBe(333);
    expect(calcStat(OU, "hp", G.hp, 31, 252, 100, "Jolly")).toBe(420);
  });

  it("applies the nature multiplier", () => {
    expect(calcStat(OU, "atk", G.atk, 31, 252, 100, "Adamant")).toBe(394);
    expect(calcStat(OU, "atk", G.atk, 31, 252, 100, "Modest")).toBe(323);
    expect(calcStat(OU, "atk", G.atk, 31, 252, 100, "Serious")).toBe(359);
  });

  it("ignores a nature that does not exist", () => {
    expect(calcStat(OU, "atk", G.atk, 31, 252, 100, "Nonsense")).toBe(
      calcStat(OU, "atk", G.atk, 31, 252, 100, "Serious"),
    );
  });

  it("keeps Shedinja at 1 HP", () => {
    expect(calcStat(OU, "hp", 1, 31, 252, 100, "Adamant")).toBe(1);
  });
});

describe("calcStat, SP formats", () => {
  it("is base + SP + 75 for HP", () => {
    expect(calcStat(CH, "hp", V.hp, 31, 32, 50, "Modest")).toBe(80 + 32 + 75); // 187
    expect(calcStat(CH, "hp", V.hp, 31, 0, 50, "Modest")).toBe(155);
  });

  it("is nature x (base + SP + 20) for everything else", () => {
    // 100 + 32 + 20 = 152; Modest boosts SpA: trunc(trunc(152*110, 16)/100) = 167.
    expect(calcStat(CH, "spa", V.spa, 31, 32, 50, "Modest")).toBe(167);
    // 82 + 0 + 20 = 102; Modest lowers Atk: trunc(trunc(102*90, 16)/100) = 91.
    expect(calcStat(CH, "atk", V.atk, 31, 0, 50, "Modest")).toBe(91);
    // Neutral stats are untouched.
    expect(calcStat(CH, "def", V.def, 31, 0, 50, "Modest")).toBe(103);
    expect(calcStat(CH, "spe", V.spe, 31, 12, 50, "Modest")).toBe(112);
  });

  it("gives exactly +1 per Stat Point", () => {
    const at = (sp: number) => calcStat(CH, "spa", V.spa, 31, sp, 50, "Serious");
    expect(at(1) - at(0)).toBe(1);
    expect(at(32) - at(0)).toBe(32);
  });

  it("agrees with the mainline formula at 8 EVs per SP", () => {
    // The whole reason 1 SP = 8 EVs: at level 50 the mainline formula reduces
    // to base + EV/8 + 20 (and + 75 for HP). 31 SP is the largest spread the
    // mainline side can express, since 32 SP would be 256 EVs.
    for (const sp of [0, 1, 7, 16, 31]) {
      const evs = sp * CHAMPIONS_EVS_PER_SP;
      expect(calcStat(CH, "spa", V.spa, 31, sp, 50, "Serious")).toBe(
        calcStat(OU, "spa", V.spa, 31, evs, 50, "Serious"),
      );
      expect(calcStat(CH, "hp", V.hp, 31, sp, 50, "Serious")).toBe(
        calcStat(OU, "hp", V.hp, 31, evs, 50, "Serious"),
      );
    }
  });

  it("ignores level and IVs, which Champions fixes at 50 and 31", () => {
    expect(calcStat(CH, "spa", V.spa, 0, 10, 100, "Serious")).toBe(
      calcStat(CH, "spa", V.spa, 31, 10, 50, "Serious"),
    );
  });
});
