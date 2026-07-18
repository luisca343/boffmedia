import { describe, expect, it } from "vitest"
import type { Pokemon } from "@/types/Pokemon"
import type { ExtendedPokemonW, Mon, PokemonFilter, SlotLoc } from "../_types/pc.types"
import type { PcMarkMap } from "./marks"
import { filterMons, hasAnyFilter, matches, sortMons } from "./filters"

function mon(over: Partial<ExtendedPokemonW> = {}, loc: SlotLoc = { kind: "box", box: 0, index: 0 }, key = "k"): Mon {
  return {
    key,
    loc,
    pokemon: {
      dex: 25,
      species: "Pikachu",
      name: "Pikachu",
      nature: "Jolly",
      ability: "Static",
      item: "item.minecraft.air",
      level: 50,
      moves: [],
      ivs: [31, 31, 31, 31, 31, 31],
      evs: [0, 0, 0, 0, 0, 0],
      stats: [100, 100, 100, 100, 100, 100],
      ...over,
    },
  }
}

const NO_MARKS: PcMarkMap = {}
const ctx = (marks: PcMarkMap = NO_MARKS, speciesByDex: Record<number, Pokemon> = {}) => ({
  speciesByDex,
  marks,
})

describe("hasAnyFilter", () => {
  it("is false for an empty filter and blank search", () => {
    expect(hasAnyFilter({}, "")).toBe(false)
    expect(hasAnyFilter({}, "   ")).toBe(false)
  })
  it("is false for switches explicitly turned off", () => {
    expect(hasAnyFilter({ isShiny: false, isLegendary: false }, "")).toBe(false)
  })
  it("is false for empty arrays", () => {
    expect(hasAnyFilter({ types: [] }, "")).toBe(false)
  })
  it("is true as soon as anything narrows", () => {
    expect(hasAnyFilter({ types: ["fire"] }, "")).toBe(true)
    expect(hasAnyFilter({ isShiny: true }, "")).toBe(true)
    expect(hasAnyFilter({}, "pika")).toBe(true)
  })
})

describe("matches — search", () => {
  const f: PokemonFilter = {}

  it("finds a Pokémon by nickname, species or dex number", () => {
    const m = mon({ name: "Chispas", species: "Pikachu", dex: 25 })
    expect(matches(m, f, "chispas", ctx())).toBe(true)
    expect(matches(m, f, "PIKA", ctx())).toBe(true)
    expect(matches(m, f, "25", ctx())).toBe(true)
    expect(matches(m, f, "#25", ctx())).toBe(true)
  })

  it("rejects a term that appears nowhere", () => {
    expect(matches(mon(), f, "charizard", ctx())).toBe(false)
  })

  it("ignores surrounding whitespace instead of failing every match", () => {
    expect(matches(mon(), f, "  pikachu  ", ctx())).toBe(true)
  })
})

describe("matches — level bounds", () => {
  it("treats min and max as inclusive", () => {
    const m = mon({ level: 50 })
    expect(matches(m, { minLevel: 50 }, "", ctx())).toBe(true)
    expect(matches(m, { maxLevel: 50 }, "", ctx())).toBe(true)
    expect(matches(m, { minLevel: 51 }, "", ctx())).toBe(false)
    expect(matches(m, { maxLevel: 49 }, "", ctx())).toBe(false)
  })

  it("does not mistake a level-0 bound for 'no bound'", () => {
    expect(matches(mon({ level: 5 }), { maxLevel: 0 }, "", ctx())).toBe(false)
  })
})

describe("matches — derived flags", () => {
  it("reads shiny from the palette, since the payload has no shiny flag", () => {
    expect(matches(mon({ palette: "shiny" }), { isShiny: true }, "", ctx())).toBe(true)
    expect(matches(mon({ palette: "none" }), { isShiny: true }, "", ctx())).toBe(false)
  })

  it("does not count Pixelmon's empty-hand sentinel as a held item", () => {
    expect(matches(mon({ item: "item.minecraft.air" }), { hasItem: true }, "", ctx())).toBe(false)
    expect(matches(mon({ item: "item.pixelmon.leftovers" }), { hasItem: true }, "", ctx())).toBe(true)
  })

  it("resolves types from the Pokédex when the payload omits them", () => {
    const species: Record<number, Pokemon> = {
      25: {
        name: "Pikachu",
        dex: 25,
        defaultForms: ["base"],
        generation: 1,
        forms: [{ name: "base", index: 0, rank: { ranking: 0, type1: "", type2: "", tier: "" }, types: ["Electric"] }],
      },
    }
    const m = mon({ types: undefined })
    expect(matches(m, { types: ["electric"] }, "", ctx(NO_MARKS, species))).toBe(true)
    expect(matches(m, { types: ["fire"] }, "", ctx(NO_MARKS, species))).toBe(false)
  })

  it("matches a dual-type Pokémon on either of its types", () => {
    const m = mon({ types: ["Grass", "Poison"] })
    expect(matches(m, { types: ["poison"] }, "", ctx())).toBe(true)
    expect(matches(m, { types: ["fire", "grass"] }, "", ctx())).toBe(true)
  })
})

describe("matches — marks are ours, not the game's", () => {
  it("only matches favourites present in the mark map", () => {
    const m = mon({}, { kind: "box", box: 0, index: 0 }, "abc")
    expect(matches(m, { isFavorited: true }, "", ctx({ abc: { favorite: true, tags: [] } }))).toBe(true)
    expect(matches(m, { isFavorited: true }, "", ctx({ abc: { favorite: false, tags: [] } }))).toBe(false)
    // A mon with no mark row at all must not match — marks are opt-in.
    expect(matches(m, { isFavorited: true }, "", ctx())).toBe(false)
  })

  it("keys marks by content hash, so another mon's mark never leaks across", () => {
    const mine = mon({}, { kind: "box", box: 0, index: 0 }, "abc")
    const other = mon({}, { kind: "box", box: 0, index: 1 }, "zzz")
    const marks = ctx({ abc: { favorite: true, tags: [] } })
    expect(matches(mine, { isFavorited: true }, "", marks)).toBe(true)
    expect(matches(other, { isFavorited: true }, "", marks)).toBe(false)
  })

  it("matches a tag only on the mon that carries it", () => {
    const m = mon({}, { kind: "box", box: 0, index: 0 }, "abc")
    expect(matches(m, { tag: "competitivo" }, "", ctx({ abc: { favorite: false, tags: ["competitivo"] } }))).toBe(true)
    expect(matches(m, { tag: "competitivo" }, "", ctx({ abc: { favorite: false, tags: ["criador"] } }))).toBe(false)
  })
})

describe("matches — gender", () => {
  it("matches the values the game actually sends, case-insensitively", () => {
    expect(matches(mon({ gender: "Male" }), { gender: "male" }, "", ctx())).toBe(true)
    expect(matches(mon({ gender: "FEMALE" }), { gender: "female" }, "", ctx())).toBe(true)
    expect(matches(mon({ gender: "Male" }), { gender: "female" }, "", ctx())).toBe(false)
  })

  it("treats a genderless Pokémon as genderless however the payload spells it", () => {
    expect(matches(mon({ gender: "None" }), { gender: "genderless" }, "", ctx())).toBe(true)
    expect(matches(mon({ gender: "" }), { gender: "genderless" }, "", ctx())).toBe(true)
    expect(matches(mon({ gender: undefined }), { gender: "genderless" }, "", ctx())).toBe(true)
  })
})

describe("matches — every predicate must hold", () => {
  it("fails the whole match when a single criterion misses", () => {
    const m = mon({ palette: "shiny", level: 50, nature: "Jolly" })
    expect(matches(m, { isShiny: true, minLevel: 40, nature: "Jolly" }, "", ctx())).toBe(true)
    expect(matches(m, { isShiny: true, minLevel: 40, nature: "Adamant" }, "", ctx())).toBe(false)
  })
})

describe("filterMons", () => {
  it("keeps only the matching mons and preserves their relative order", () => {
    const mons = [
      mon({ species: "Pikachu", name: "Pikachu", dex: 25 }, { kind: "box", box: 0, index: 0 }, "a"),
      mon({ species: "Charizard", name: "Charizard", dex: 6 }, { kind: "box", box: 0, index: 1 }, "b"),
      mon({ species: "Pichu", name: "Pichu", dex: 172 }, { kind: "box", box: 0, index: 2 }, "c"),
    ]
    expect(filterMons(mons, {}, "pi", ctx()).map((m) => m.key)).toEqual(["a", "c"])
  })

  it("returns everything when nothing narrows", () => {
    const mons = [mon({}, { kind: "box", box: 0, index: 0 }, "a")]
    expect(filterMons(mons, {}, "", ctx())).toHaveLength(1)
  })
})

describe("sortMons", () => {
  const a = mon({ dex: 25, level: 50, name: "Beta", ivs: [31, 31, 31, 31, 31, 31] }, { kind: "box", box: 1, index: 3 }, "a")
  const b = mon({ dex: 6, level: 80, name: "Alfa", ivs: [0, 0, 0, 0, 0, 0] }, { kind: "box", box: 0, index: 5 }, "b")
  const c = mon({ dex: 150, level: 50, name: "Gamma", ivs: [15, 15, 15, 15, 15, 15] }, { kind: "party", index: 1 }, "c")

  it("does not mutate the input array", () => {
    const input = [a, b, c]
    const order = input.map((m) => m.key)
    sortMons(input, { field: "level", dir: "asc" })
    expect(input.map((m) => m.key)).toEqual(order)
  })

  it("sorts by level in both directions", () => {
    expect(sortMons([a, b, c], { field: "level", dir: "asc" }).map((m) => m.key)).toEqual(["a", "c", "b"])
    expect(sortMons([a, b, c], { field: "level", dir: "desc" }).map((m) => m.key)).toEqual(["b", "a", "c"])
  })

  it("breaks ties by dex ascending regardless of direction", () => {
    // a and c are both level 50; the tiebreak is never reversed, so a (25) precedes c (150).
    expect(sortMons([c, a], { field: "level", dir: "asc" }).map((m) => m.key)).toEqual(["a", "c"])
    expect(sortMons([c, a], { field: "level", dir: "desc" }).map((m) => m.key)).toEqual(["a", "c"])
  })

  it("sorts by total IV, not by the first IV", () => {
    expect(sortMons([a, b, c], { field: "iv", dir: "desc" }).map((m) => m.key)).toEqual(["a", "c", "b"])
  })

  it("sorts by display name, falling back to species when unnamed", () => {
    expect(sortMons([a, b, c], { field: "name", dir: "asc" }).map((m) => m.key)).toEqual(["b", "a", "c"])
  })

  it("puts the party ahead of every box in physical order", () => {
    // The party is box -1 by the game server's own convention.
    expect(sortMons([a, b, c], { field: "box", dir: "asc" }).map((m) => m.key)).toEqual(["c", "b", "a"])
  })
})
