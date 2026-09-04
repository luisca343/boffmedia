import { describe, expect, it } from "vitest";
import { Dex } from "@pkmn/dex";
import { pkmnName, pkmnSearchTerms } from "@boffmedia/pkmn-names";

/**
 * The name table's contract, from the consumer that depends on it.
 *
 * It lives in battlesim's suite rather than the data package's because the
 * thing worth guarding is not "the JSON parsed" but "the id battlesim will ask
 * with is the id the table was built under" — the two are generated from the
 * same `@pkmn` dex, and every past bug in this area was a key-shape mismatch
 * (hyphens, apostrophes, British spellings, Showdown's parentheticals), not a
 * missing translation.
 */
describe("pkmn names", () => {
  it("translates a move the player will actually pick", () => {
    expect(pkmnName("move", "Flamethrower", "es")).toBe("Lanzallamas");
    expect(pkmnName("move", "Close Combat", "es")).toBe("A Bocajarro");
  });

  it("resolves the key shapes that used to miss", () => {
    // Hyphens, an apostrophe, and Showdown's disambiguating parenthetical —
    // each one broke a name-keyed lookup before the table was keyed by id.
    expect(pkmnName("move", "Will-O-Wisp", "es")).toBe("Fuego Fatuo");
    expect(pkmnName("move", "U-turn", "es")).not.toBe("U-turn");
    expect(pkmnName("move", "Forest's Curse", "es")).not.toBe("Forest's Curse");
    expect(pkmnName("ability", "Embody Aspect (Cornerstone)", "es")).toBe("Evocarrecuerdos (Cimiento)");
    expect(pkmnName("ability", "As One (Glastrier)", "es")).toBe("Unidad Ecuestre (Glastrier)");
    // The repo catalogue spells this one the British way (`ability_BattleArmour`).
    expect(pkmnName("ability", "Battle Armor", "es")).not.toBe("Battle Armor");
  });

  it("translates items, which no catalogue in the repo carried before", () => {
    expect(pkmnName("item", "Choice Band", "es")).toBe("Cinta Elección");
    expect(pkmnName("item", "Leftovers", "es")).toBe("Restos");
    expect(pkmnName("item", "Booster Energy", "es")).toBe("Energía Potenciadora");
  });

  it("returns English untouched, so nothing upstream can be corrupted", () => {
    expect(pkmnName("move", "Flamethrower", "en")).toBe("Flamethrower");
    expect(pkmnName("item", "Choice Band", "en")).toBe("Choice Band");
    // An unknown name is legible English, never an id or a blank.
    expect(pkmnName("move", "Paleo Wave", "es")).toBe("Paleo Wave");
    expect(pkmnName("move", "", "es")).toBe("");
  });

  it("offers both languages to a search box", () => {
    expect(pkmnSearchTerms("move", "Earthquake")).toEqual(["Earthquake", "Terremoto"]);
    // Nothing to add when there is no translation: one term, not an empty one.
    expect(pkmnSearchTerms("move", "Paleo Wave")).toEqual(["Paleo Wave"]);
  });

  it("covers what a modern battle can put on screen", () => {
    const gen = Dex.forGen(9);
    const sameInBoth = (kind: "move" | "ability" | "item", names: string[]) =>
      names.filter((name) => pkmnName(kind, name, "es") === name);

    // Standard, legal-in-Gen-9 entries only: the CAP moves and the Gen 2 berries
    // the tables skip cannot appear in a battle this tool can run.
    const moves = gen.moves.all().filter((m) => m.exists && !m.isNonstandard).map((m) => m.name);
    const abilities = gen.abilities.all().filter((a) => a.exists && !a.isNonstandard).map((a) => a.name);
    const items = gen.items.all().filter((i) => i.exists && !i.isNonstandard).map((i) => i.name);

    // Everything is translated EXCEPT the names Spanish shares with English —
    // listed rather than counted, because a name quietly falling back to its
    // English string is exactly the bug this guards (Armor Cannon sat in the
    // repo catalogue as "Armor Cannon" and looked resolved).
    expect(sameInBoth("move", moves)).toEqual(["Amnesia", "Poltergeist", "Surf", "Triple Axel"]);
    expect(sameInBoth("ability", abilities)).toEqual(["Punk Rock", "Simple", "Transistor"]);
    expect(sameInBoth("item", items)).toEqual(["Master Ball", "Poke Ball", "Protector", "Safari Ball", "Ultra Ball"]);
  });
});
