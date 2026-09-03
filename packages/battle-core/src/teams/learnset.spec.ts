import { describe, expect, it } from "vitest";
import { Dex } from "@pkmn/sim";

import { legalMovesFor } from "./learnset.js";
import { registerBattleMods } from "../mods/register.js";

registerBattleMods();

/**
 * The move picker asks the sim, not a reimplementation.
 *
 * `dex.species.getMovePool()` is the same helper `TeamValidator` uses: it walks
 * prevos and formes and applies the gen rules, and on a modded dex it reads
 * that mod's own learnsets. Anything the format bans is then subtracted via the
 * rule table. `known: false` means "could not determine" and is not the same
 * answer as "this Pokémon has no legal moves".
 */

describe("legalMovesFor", () => {
  it("returns a real pool for a common Pokémon", () => {
    const { moves, known } = legalMovesFor("gen9ou", "Garchomp");
    expect(known).toBe(true);
    expect(moves.length).toBeGreaterThan(30);
    expect(moves).toContain("earthquake");
    expect(moves).toContain("dragonclaw");
  });

  it("excludes a move the species cannot learn", () => {
    const { moves } = legalMovesFor("gen9ou", "Garchomp");
    expect(moves).not.toContain("recover");
    expect(moves).not.toContain("moonblast");
  });

  it("subtracts moves the format bans", () => {
    // Smeargle Sketches everything, so its raw pool has Baton Pass — which
    // gen9ou bans. If the rule-table filter regressed, this is where it shows.
    const raw = Dex.forFormat(Dex.formats.get("gen9ou")).species.getMovePool(
      Dex.species.get("Smeargle").id,
    );
    expect([...raw]).toContain("batonpass");
    expect(legalMovesFor("gen9ou", "Smeargle").moves).not.toContain("batonpass");
  });

  it("reads the champions mod's own learnsets", () => {
    const champions = legalMovesFor("gen9championsvgc2026regmb", "Venusaur");
    const ou = legalMovesFor("gen9ou", "Venusaur");
    expect(champions.known).toBe(true);
    expect(champions.moves.length).toBeGreaterThan(0);
    // The mod is a different dex with different learnsets, so the two pools
    // must not be the same list.
    expect(champions.moves).not.toEqual(ou.moves);
  });

  it("returns known:false for a bogus species", () => {
    expect(legalMovesFor("gen9ou", "Notapokemon")).toEqual({ moves: [], known: false });
    expect(legalMovesFor("gen9ou", "")).toEqual({ moves: [], known: false });
  });

  it("returns known:false for a bogus format", () => {
    expect(legalMovesFor("gen9notaformat", "Garchomp")).toEqual({ moves: [], known: false });
  });

  it("is sorted and free of duplicates", () => {
    const { moves } = legalMovesFor("gen9ou", "Garchomp");
    expect(moves).toEqual([...moves].sort());
    expect(new Set(moves).size).toBe(moves.length);
  });
});
