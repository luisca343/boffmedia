/**
 * The damage range, which is the other place a silent wrong answer would live.
 *
 * The failure this guards against is not a crash. It is a panel that prints
 * "84.6%" for an opponent whose EVs nobody can see, a player reading that as a
 * fact, and losing the game to the 12% of spreads it was wrong about. So the
 * assertions below are about the SHAPE of the answer as much as its size: an
 * unknown spread must widen, a known one must not, and the two ends must be
 * derived from the corner that produced them.
 */
import { describe, expect, it } from "vitest";
import { solveSpread, spreadStats, type CalcPokemon } from "@boffmedia/tools-pokemon";
import { damageRange, koVerdictKey } from "../damageRange";
import { moveFor, type BattleCalcSnapshot, type CalcMonSnapshot } from "../fromBattle";

const FIELD: BattleCalcSnapshot["field"] = {
  format: "Doubles", weather: "None", terrain: "None",
  trickRoom: false, gravity: false, magicRoom: false, wonderRoom: false,
  attackerSide: { stealthRock: false, spikes: 0, reflect: false, lightScreen: false, auroraVeil: false, tailwind: false, helpingHand: false },
  defenderSide: { stealthRock: false, spikes: 0, reflect: false, lightScreen: false, auroraVeil: false, tailwind: false, helpingHand: false },
};

function poke(name: string, over: Partial<CalcPokemon> = {}): CalcPokemon {
  return {
    name, level: 50, nature: "Serious", ability: "", item: "None", status: "Healthy",
    teraType: "None",
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    currentHP: -1,
    moves: [
      { name: "", bp: 0, type: "Normal", category: "Physical", crit: false },
      { name: "", bp: 0, type: "Normal", category: "Physical", crit: false },
      { name: "", bp: 0, type: "Normal", category: "Physical", crit: false },
      { name: "", bp: 0, type: "Normal", category: "Physical", crit: false },
    ],
    ...over,
  };
}

function mon(side: "ally" | "foe", spreadKnown: boolean, over: Partial<CalcMonSnapshot> = {}): CalcMonSnapshot {
  return {
    key: `${side}-slot0`, label: side, side, slot: 0, active: true, fainted: false,
    hpPct: 100, spreadKnown, poke: poke("Rillaboom"), moves: [], ...over,
  };
}

const KNOCK_OFF = moveFor("knockoff")!;
const FAKE_OUT = moveFor("fakeout")!;

describe("damageRange", () => {
  it("collapses to the 16 damage rolls when both spreads are known", () => {
    const attacker = mon("ally", true, { poke: poke("Incineroar", { evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 0, spe: 0 }, nature: "Adamant" }) });
    const defender = mon("foe", true, { poke: poke("Rillaboom", { evs: { hp: 252, atk: 0, def: 252, spa: 0, spd: 0, spe: 0 }, nature: "Impish" }) });
    const range = damageRange({
      attacker, defender,
      attackerPoke: attacker.poke, defenderPoke: defender.poke,
      move: KNOCK_OFF, field: FIELD,
    })!;
    expect(range.spreadUnknown).toBe(false);
    // Min and max come from the same calculation, so the width is the roll
    // spread alone: @smogon/calc's lowest roll is 85% of its highest, never
    // less. A wider band here would mean a hypothesis leaked in.
    expect(range.minDamage / range.maxDamage).toBeGreaterThan(0.8);
  });

  it("WIDENS when the defender's spread is unknown, and says so", () => {
    const attacker = mon("ally", true, { poke: poke("Incineroar", { evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 0, spe: 0 }, nature: "Adamant" }) });
    const known = mon("foe", true, { poke: poke("Rillaboom") });
    const unknown = mon("foe", false, { poke: poke("Rillaboom") });
    const base = { attacker, attackerPoke: attacker.poke, move: KNOCK_OFF, field: FIELD };

    const tight = damageRange({ ...base, defender: known, defenderPoke: known.poke })!;
    const wide = damageRange({ ...base, defender: unknown, defenderPoke: unknown.poke })!;

    expect(tight.spreadUnknown).toBe(false);
    expect(wide.spreadUnknown).toBe(true);
    // The band has to cover both hypotheses, which means a strictly lower floor
    // in percentage terms: 252 HP / 252+ Def takes less of its bigger bar.
    expect(wide.minPct).toBeLessThan(tight.minPct);
    expect(wide.maxPct).toBeGreaterThanOrEqual(tight.maxPct);
  });

  it("widens for an unknown ATTACKER too, in the other direction", () => {
    const unknown = mon("foe", false, { poke: poke("Incineroar") });
    const defender = mon("ally", true, { poke: poke("Rillaboom") });
    const range = damageRange({
      attacker: unknown, defender,
      attackerPoke: unknown.poke, defenderPoke: defender.poke,
      move: KNOCK_OFF, field: FIELD,
    })!;
    // 0 EV neutral at the floor, 252 Adamant at the ceiling: roughly a third
    // more Attack, so the band must be far wider than the roll spread alone.
    expect(range.spreadUnknown).toBe(true);
    expect(range.minDamage / range.maxDamage).toBeLessThan(0.8);
  });

  it("counts hits to KO from the defender's CURRENT HP, not from full", () => {
    const attacker = mon("ally", true, { poke: poke("Incineroar", { evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 0, spe: 0 }, nature: "Adamant" }) });
    const full = mon("foe", true, { hpPct: 100, poke: poke("Rillaboom") });
    const nearlyDead = mon("foe", true, { hpPct: 8, poke: poke("Rillaboom") });
    const base = { attacker, attackerPoke: attacker.poke, move: KNOCK_OFF, field: FIELD };

    const atFull = damageRange({ ...base, defender: full, defenderPoke: full.poke })!;
    const atDeath = damageRange({ ...base, defender: nearlyDead, defenderPoke: nearlyDead.poke })!;

    // Same damage either way — only the question "does it finish them" changed.
    expect(atDeath.maxDamage).toBe(atFull.maxDamage);
    expect(atDeath.hitsMin).toBe(1);
    expect(atFull.hitsMin!).toBeGreaterThan(1);
    // And the percentages stay percentages OF MAX, so they do not move when the
    // target is chipped — the number a player compares against a calc they know.
    expect(atDeath.maxPct).toBeCloseTo(atFull.maxPct, 5);
  });

  it("refuses to answer for a status move or an unset variable power", () => {
    const attacker = mon("ally", true);
    const defender = mon("foe", true);
    const base = { attacker, defender, attackerPoke: attacker.poke, defenderPoke: defender.poke, field: FIELD };
    expect(damageRange({ ...base, move: moveFor("partingshot")! })).toBeNull();
    expect(damageRange({ ...base, move: moveFor("gyroball")! })).toBeNull();
    // A fixed-power priority move still answers.
    expect(damageRange({ ...base, move: FAKE_OUT })).not.toBeNull();
  });

  it("labels the verdict in the jargon, and as a range when the corners disagree", () => {
    expect(koVerdictKey({ hitsMin: 1, hitsMax: 1 } as never).key).toBe("calc.ko.ohko");
    expect(koVerdictKey({ hitsMin: 2, hitsMax: 2 } as never)).toEqual({ key: "calc.ko.nhko", values: { hits: 2 } });
    expect(koVerdictKey({ hitsMin: 2, hitsMax: 3 } as never)).toEqual({ key: "calc.ko.range", values: { min: 2, max: 3 } });
    expect(koVerdictKey({ hitsMin: null, hitsMax: null } as never).key).toBe("calc.ko.none");
  });
});

describe("solveSpread", () => {
  it("recovers a spread that reproduces the stats exactly", () => {
    // Incineroar, L50, 252 HP / 252 Atk Adamant, 31 IVs.
    const base = { hp: 95, atk: 115, def: 90, spa: 80, spd: 90, spe: 60 };
    const target = { hp: 202, atk: 183, def: 110, spa: 90, spd: 110, spe: 80 };
    const solved = solveSpread(base, 50, target);
    expect(solved).not.toBeNull();
    // The answer need not be the EVs the trainer typed — 132 EVs with a
    // boosting nature and 252 with a neutral one land on the same number, and
    // the damage roll cannot tell them apart. Reproducing the stat line is the
    // whole of the claim, so that is what is checked.
    expect(spreadStats(base, 50, solved!)).toEqual(target);
  });

  it("returns null rather than rounding to the nearest legal spread", () => {
    // A stat no legal (nature, EV, IV) combination reaches. Answering anyway is
    // how a Champions-format set, a mid-battle forme change or a hacked mon
    // would come out looking like a fact.
    const base = { hp: 95, atk: 115, def: 90, spa: 80, spd: 90, spe: 60 };
    expect(solveSpread(base, 50, { atk: 9999, def: 110, spa: 100, spd: 110, spe: 80 })).toBeNull();
  });

  it("will not pick a nature that raises two stats", () => {
    // The joint solve is the whole point: each stat alone is reachable by two
    // or three multipliers, and a per-stat search would happily claim a spread
    // that boosts both Attack and Speed. No nature does.
    const base = { hp: 95, atk: 115, def: 90, spa: 80, spd: 90, spe: 60 };
    // Both stats above what a NEUTRAL nature can reach at 252 EVs (167 Atk,
    // 112 Spe), so each demands a nature that raises it — and no nature raises
    // two. A per-stat search would have answered this happily.
    expect(solveSpread(base, 50, { atk: 183, def: 110, spa: 90, spd: 110, spe: 123 })).toBeNull();
    // Each of them alone is perfectly solvable, which is what makes the pair a
    // test of the JOINT constraint rather than of an unreachable number.
    expect(solveSpread(base, 50, { atk: 183, def: 110, spa: 90, spd: 110, spe: 80 })).not.toBeNull();
    expect(solveSpread(base, 50, { atk: 167, def: 110, spa: 100, spd: 110, spe: 123 })).not.toBeNull();
  });
});
