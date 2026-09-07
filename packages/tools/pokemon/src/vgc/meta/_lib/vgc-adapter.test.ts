import { describe, expect, it } from "vitest"
import { toDivergenceResult, toPlayerEntry, toPokeData, toTeamSlot } from "./vgc-adapter"

describe("VGC meta adapters", () => {
  it("keeps divergence display names when no usage entry exists for a species", () => {
    const result = toDivergenceResult({
      regulationId: "gen9championsvgc2026regma",
      tournamentId: 1,
      ladderFormat: "gen9championsvgc2026regma",
      ladderMonth: "2026-06",
      ladderCutoff: 1760,
      rowCount: 1,
      rows: [{
        speciesId: "ninetalesalola",
        speciesName: "Ninetales-Alola",
        ladderPercent: 2.8,
        tournamentPercent: 0,
        deltaPercent: 2.8,
        absDeltaPercent: 2.8,
        badge: null,
      }],
    })

    expect(result.rows[0]).toMatchObject({
      id: "ninetalesalola",
      name: "Ninetales-Alola",
    })
  })

  it("preserves an absent Limitless placing as null", () => {
    const player = toPlayerEntry({
      playerSlug: "dropped-player",
      playerName: "Dropped Player",
      placing: null,
      record: "2-2-0",
      hasTeam: true,
    }, new Map())

    expect(player.placing).toBeNull()
  })

  it("normalizes partner route IDs while preserving display names", () => {
    const pokemon = toPokeData({
      speciesId: "garchomp",
      speciesName: "Garchomp",
      rank: 1,
      types: ["Dragon", "Ground"],
      usagePercent: 10,
      rawCount: 100,
      baseStats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
      abilities: [],
      items: [],
      moves: [{ name: "Protect", percent: 80, type: "Normal" }],
      teraTypes: [],
      teammates: [{ name: "Charizard-Mega-Y", percent: 42 }],
      spreads: [],
    })

    expect(pokemon.mates[0]).toEqual({ id: "charizardmegay", pct: 42 })
    expect(pokemon.moves[0]).toEqual({ name: "Protect", pct: 80, type: "Normal" })
  })

  it("keeps move types aligned with moves in team slots", () => {
    const slot = toTeamSlot({
      speciesName: "Garchomp",
      moves: ["Earthquake", "Protect"],
      moveTypes: ["Ground", "Normal"],
    })

    expect(slot.moveTypes).toEqual(["Ground", "Normal"])
  })
})
