import { describe, expect, it } from "vitest";

import { exportPaste, importPaste, packTeam, unpackTeam } from "./paste";
import { SAMPLE_TEAMS } from "../samples/index";

/**
 * The teambuilder's save/load cycle, at the layer it actually runs on.
 *
 * `TeamEditor` shipped with `// Parse packed team to sets (simplified)` and six
 * empty objects on both branches, so opening a saved team showed it empty and
 * saving packed those empties back over it — the team was destroyed by being
 * looked at. Nothing caught that, because the round trip was never asserted
 * anywhere. It is asserted here now.
 */

describe("team round trip", () => {
  const paste = SAMPLE_TEAMS.gen9ou;

  it("survives paste -> pack -> unpack with every set intact", () => {
    const sets = importPaste(paste);
    expect(sets).not.toBeNull();
    expect(sets!.length).toBe(6);

    const back = unpackTeam(packTeam(sets!));
    expect(back, "unpackTeam could not read what packTeam wrote").not.toBeNull();
    expect(back!.length).toBe(6);

    // Compare by id, not by display string: the packed format stores names as
    // ids, so "Heavy-Duty Boots" legitimately comes back as "Heavy Duty Boots".
    // That is the sim's own normalisation and not something to assert against.
    const id = (value: string | undefined) => (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

    for (const [i, original] of sets!.entries()) {
      const returned = back![i];
      expect(id(returned.species || returned.name)).toBe(id(original.species || original.name));
      expect(id(returned.item)).toBe(id(original.item));
      expect(id(returned.ability)).toBe(id(original.ability));
      // Moves are what an editor indexes into; a short array here is the shape
      // that crashed SetEditor.
      expect(returned.moves.length).toBe(original.moves.length);
      expect(returned.moves.map(id)).toEqual(original.moves.map(id));
    }
  });

  it("survives a full paste -> pack -> unpack -> paste cycle", () => {
    const once = importPaste(paste)!;
    const twice = importPaste(exportPaste(unpackTeam(packTeam(once))!))!;
    expect(twice.length).toBe(once.length);
    const id = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    expect(twice.map((s) => id(s.species || s.name))).toEqual(once.map((s) => id(s.species || s.name)));
  });

  it("packs an empty team to something unpack refuses rather than half-reads", () => {
    // `handleSave` now filters unfilled slots and writes "" for an empty team.
    // What it must never do is write a speciesless set that unpack accepts.
    const packed = packTeam([]);
    const back = unpackTeam(packed);
    expect(back === null || back.length === 0).toBe(true);
  });
});
