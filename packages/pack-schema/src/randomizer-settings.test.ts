import { describe, expect, it } from "vitest"
import type { z } from "zod"

import { RandomizerSettings } from "./index.js"
import sample from "./__fixtures__/randomizer-settings.sample.json"

describe("RandomizerSettings", () => {
  it("parses the FVX shim's real roundtrip output without throwing", () => {
    expect(() => RandomizerSettings.parse(sample)).not.toThrow()
  })

  it("accepts a valid settings document with all 187 fields", () => {
    const parsed = RandomizerSettings.parse(sample)
    expect(parsed.romName).toBe("Pokemon Blue (U)")
    expect(parsed.currentRestrictions).toEqual({
      gens: [1, 2, 3, 4, 5, 6, 7],
      allowEvolutionaryRelatives: true,
    })
    expect(parsed.settingBattleStyle).toEqual({
      modification: "UNCHANGED",
      style: "SINGLE_BATTLE",
    })
  })

  it("has exactly 187 fields in the schema", () => {
    expect(Object.keys(RandomizerSettings.shape).length).toBe(187)
  })

  it("rejects unknown fields (strict mode)", () => {
    expect(() =>
      RandomizerSettings.parse({ ...sample, bogusField: 1 })
    ).toThrow(/unrecognized_key/)
  })

  it("rejects a wrong enum value", () => {
    const invalid = { ...sample, bstMod: "INVALID_ENUM" }
    expect(() => RandomizerSettings.parse(invalid)).toThrow()
  })

  it("rejects currentRestrictions with wrong gens type", () => {
    const invalid = {
      ...sample,
      currentRestrictions: { gens: ["1", "2"], allowEvolutionaryRelatives: true },
    }
    expect(() => RandomizerSettings.parse(invalid)).toThrow()
  })

  it("rejects settingBattleStyle with unknown style", () => {
    const invalid = {
      ...sample,
      settingBattleStyle: { modification: "UNCHANGED", style: "QUAD_BATTLE" },
    }
    expect(() => RandomizerSettings.parse(invalid)).toThrow()
  })

  it("accepts null for nullable fields like startersSingleType", () => {
    const parsed = RandomizerSettings.parse(sample)
    expect(parsed.startersSingleType).toBeNull()
  })

  it("accepts a valid enum value for startersSingleType", () => {
    const valid = { ...sample, startersSingleType: "FIRE" }
    expect(() => RandomizerSettings.parse(valid)).not.toThrow()
    const parsed = RandomizerSettings.parse(valid)
    expect(parsed.startersSingleType).toBe("FIRE")
  })

  it("rejects an invalid enum value for startersSingleType", () => {
    const invalid = { ...sample, startersSingleType: "LAVA" }
    expect(() => RandomizerSettings.parse(invalid)).toThrow()
  })

  it("accepts array fields like customStarters", () => {
    const parsed = RandomizerSettings.parse(sample)
    expect(parsed.customStarters).toEqual([4, 7, 1])
  })

  it("rejects non-integer values in customStarters", () => {
    const invalid = { ...sample, customStarters: [4.5, 7.8, 1] }
    expect(() => RandomizerSettings.parse(invalid)).toThrow()
  })
})
