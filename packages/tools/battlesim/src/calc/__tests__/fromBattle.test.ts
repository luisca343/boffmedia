/**
 * The extraction seam, which is one of the two places a silent wrong answer
 * would live (the other is `damageRange.test.ts`).
 *
 * Every case here is one where the panel would still RENDER — a number, a
 * percentage, a KO verdict — while being wrong: a foe's spread quietly filled
 * in from defaults and presented as fact, an item id printed where a name was
 * required so the calculator ignored the item, a snapshot still pointing into
 * the live `Battle` so an edit in the panel reached the engine. None of those
 * throw, and none of them are visible from a type-check.
 */
import { describe, expect, it } from "vitest";
import { Battle } from "@pkmn/client";
import { Generations } from "@pkmn/data";
import { Dex } from "@pkmn/sim";
import { spreadStats } from "@boffmedia/tools-pokemon";
import { snapshotBattle, fieldFor, moveFor } from "../fromBattle";

/** Incineroar's base stats, for checking a solved spread round-trips. */
const INCINEROAR_BASE = { hp: 95, atk: 115, def: 90, spa: 80, spd: 90, spe: 60 };
import type { BattleRequest } from "../../engine/types";

const OPENING = [
  "|player|p1|Alice|1|",
  "|player|p2|Bob|2|",
  "|teamsize|p1|2",
  "|teamsize|p2|2",
  "|gametype|doubles",
  "|gen|9",
  "|tier|[Gen 9] VGC 2024",
  "|start",
  "|switch|p1a: Incineroar|Incineroar, L50, M|202/202",
  "|switch|p2a: Rillaboom|Rillaboom, L50, M|100/100",
  "|turn|1",
];

function feed(lines: string[]): Battle {
  const battle = new Battle(new Generations(Dex as any) as any);
  for (const line of lines) battle.add(line);

  return battle;
}

/**
 * A choice request for Alice's Incineroar with a real 252 HP / 252 Atk Adamant
 * line — the numbers Showdown would actually publish, which is what makes the
 * solver's answer checkable rather than self-confirming.
 */
const REQUEST: BattleRequest = {
  requestType: "move",
  rqid: 1,
  side: {
    name: "Alice",
    id: "p1",
    pokemon: [
      {
        // A request ident carries no active-slot letter; a protocol line does.
        ident: "p1: Incineroar",
        details: "Incineroar, L50, M",
        condition: "202/202",
        active: true,
        // Incineroar, Adamant, 252 HP / 252 Atk, 31 IVs — the stat line those
        // choices really produce at level 50.
        stats: { atk: 183, def: 110, spa: 90, spd: 110, spe: 80 },
        moves: ["knockoff", "flareblitz", "fakeout", "partingshot"],
        baseAbility: "intimidate",
        item: "assaultvest",
        ability: "intimidate",
      },
    ] as never,
  } as never,
};

describe("snapshotBattle", () => {
  it("reads both sides of a doubles field and marks who is on which", () => {
    const snap = snapshotBattle(feed(OPENING), 0);
    expect(snap.gameType).toBe("doubles");
    expect(snap.field.format).toBe("Doubles");
    const ally = snap.mons.find((m) => m.side === "ally" && m.active);
    const foe = snap.mons.find((m) => m.side === "foe" && m.active);
    expect(ally?.poke.name).toBe("Incineroar");
    expect(foe?.poke.name).toBe("Rillaboom");
    expect(snap.defaultAttacker).toBe(ally?.key);
    expect(snap.defaultDefender).toBe(foe?.key);
  });

  it("seats the player as p2 when pov says so", () => {
    // A PvP player seated second must not be handed the opponent's team as
    // their own — the bug `useBSXLayout`'s pov argument exists to prevent.
    const snap = snapshotBattle(feed(OPENING), 1);
    expect(snap.mons.find((m) => m.side === "ally" && m.active)?.poke.name).toBe("Rillaboom");
    expect(snap.mons.find((m) => m.side === "foe" && m.active)?.poke.name).toBe("Incineroar");
  });

  it("NEVER claims to know a spread it was not told", () => {
    const snap = snapshotBattle(feed(OPENING), 0);
    // No request at all: even your own side is unknown, because the request is
    // the only place final stats appear.
    for (const mon of snap.mons) expect(mon.spreadKnown).toBe(false);
  });

  it("recovers the real spread for your own side from the request's stats", () => {
    const snap = snapshotBattle(feed(OPENING), 0, { request: REQUEST });
    const ally = snap.mons.find((m) => m.side === "ally" && m.active)!;
    expect(ally.spreadKnown).toBe(true);
    expect(ally.poke.level).toBe(50);
    // The solver is free to return a DIFFERENT spread from the one the trainer
    // typed — several reproduce the same stats, and it prefers the cheapest —
    // so the property to assert is the round trip, not the EV count.
    expect(spreadStats(INCINEROAR_BASE, 50, { nature: ally.poke.nature, evs: ally.poke.evs, ivs: ally.poke.ivs }))
      .toEqual({ hp: 202, atk: 183, def: 110, spa: 90, spd: 110, spe: 80 });
    // The opponent stays unknown regardless: nothing in a request describes them.
    expect(snap.mons.find((m) => m.side === "foe")!.spreadKnown).toBe(false);
  });

  it("gives the calculator NAMES, not the ids the protocol speaks", () => {
    // `assaultvest` is not an item as far as @smogon/calc is concerned: it
    // resolves to nothing and the Special Defence boost is silently dropped,
    // which understates every special hit by a third.
    const snap = snapshotBattle(feed(OPENING), 0, { request: REQUEST });
    const ally = snap.mons.find((m) => m.side === "ally" && m.active)!;
    expect(ally.poke.item).toBe("Assault Vest");
    expect(ally.poke.ability).toBe("Intimidate");
    expect(moveFor("knockoff")?.name).toBe("Knock Off");
    expect(moveFor("knockoff")?.category).toBe("Physical");
  });

  it("leaves a variable-power move at 0 rather than inventing a number", () => {
    // Gyro Ball's base power depends on the two Speeds, so the dex says 0. The
    // panel turns that into "type it in yourself"; a default of 60 or 100 here
    // would be a fabricated answer nobody could tell from a real one.
    expect(moveFor("gyroball")?.bp).toBe(0);
    expect(moveFor("knockoff")?.bp).toBe(65);
  });

  it("carries HP as a percentage for a foe and exactly for your own side", () => {
    const damaged = feed([...OPENING, "|-damage|p2a: Rillaboom|61/100", "|turn|2"]);
    const snap = snapshotBattle(damaged, 0, { request: REQUEST });
    const foe = snap.mons.find((m) => m.side === "foe" && m.active)!;
    expect(Math.round(foe.hpPct)).toBe(61);
    // A foe's bar IS a percentage — there is no exact figure to publish, and
    // pretending otherwise is what makes a KO verdict wrong.
    expect(foe.hpCur).toBeUndefined();
    const ally = snap.mons.find((m) => m.side === "ally" && m.active)!;
    expect(ally.hpCur).toBe(202);
    expect(ally.hpMax).toBe(202);
  });

  it("reads weather, terrain and rooms into the calculator's vocabulary", () => {
    const battle = feed([
      ...OPENING,
      "|-weather|RainDance",
      "|-fieldstart|move: Grassy Terrain",
      "|-fieldstart|move: Trick Room",
      "|turn|2",
    ]);
    const snap = snapshotBattle(battle, 0);
    // The client stores the CONDITION's id (`rain`), not the move's
    // (`raindance`) — the mismatch that once made every field chip render raw.
    expect(snap.field.weather).toBe("Rain");
    expect(snap.field.terrain).toBe("Grassy");
    expect(snap.field.trickRoom).toBe(true);
  });

  it("keeps screens on the side that owns them, whichever way the panel points", () => {
    const battle = feed([...OPENING, "|-sidestart|p2: Bob|Reflect", "|turn|2"]);
    const snap = snapshotBattle(battle, 0);
    expect(snap.foeSide.reflect).toBe(true);
    expect(snap.allySide.reflect).toBe(false);
    // Reflect belongs to the side being HIT. Attacking into it, it is the
    // defender's; attacked by it, it is the attacker's and does nothing.
    expect(fieldFor(snap, "ally").defenderSide.reflect).toBe(true);
    expect(fieldFor(snap, "foe").attackerSide.reflect).toBe(true);
    expect(fieldFor(snap, "foe").defenderSide.reflect).toBe(false);
  });

  it("is inert: the snapshot is frozen and shares nothing with the battle", () => {
    const battle = feed(OPENING);
    const snap = snapshotBattle(battle, 0, { request: REQUEST });
    const ally = snap.mons.find((m) => m.side === "ally" && m.active)!;

    // Frozen all the way down, so a panel that assigned into a snapshot would
    // throw in its own code instead of corrupting what the engine animates.
    expect(Object.isFrozen(snap)).toBe(true);
    expect(Object.isFrozen(ally.poke.boosts)).toBe(true);
    expect(() => { (ally.poke as { level: number }).level = 1; }).toThrow(TypeError);

    // And no shared references: the live Pokémon's boosts are its own.
    const live = battle.p1.active[0]!;
    (live.boosts as Record<string, number>).atk = -1;
    expect(ally.poke.boosts.atk).toBe(0);
  });

  it("does not touch the battle it read", () => {
    const before = feed(OPENING);
    const turn = before.turn;
    const hp = before.p2.active[0]!.hp;
    const request = before.p1.active[0]!.moveSlots.length;
    snapshotBattle(before, 0, { request: REQUEST });
    expect(before.turn).toBe(turn);
    expect(before.p2.active[0]!.hp).toBe(hp);
    expect(before.p1.active[0]!.moveSlots.length).toBe(request);
  });
});
