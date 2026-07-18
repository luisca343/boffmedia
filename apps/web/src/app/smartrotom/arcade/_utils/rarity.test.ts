import { describe, expect, it } from "vitest"
import { RARITY, RARITY_ORDER, rarityFromWeight, raritySkin } from "./rarity"

describe("rarityFromWeight", () => {
  it("maps each band's boundaries to its tier — the drop chance IS the rarity", () => {
    expect(rarityFromWeight(1)).toBe("legendary")
    expect(rarityFromWeight(2)).toBe("legendary")
    expect(rarityFromWeight(3)).toBe("epic")
    expect(rarityFromWeight(9)).toBe("epic")
    expect(rarityFromWeight(10)).toBe("rare")
    expect(rarityFromWeight(19)).toBe("rare")
    expect(rarityFromWeight(20)).toBe("uncommon")
    expect(rarityFromWeight(49)).toBe("uncommon")
    expect(rarityFromWeight(50)).toBe("common")
    expect(rarityFromWeight(100)).toBe("common")
  })

  it("is monotonic — a rarer weight is never a commoner tier", () => {
    const rank = (w: number) => RARITY_ORDER.indexOf(rarityFromWeight(w))
    for (let w = 1; w < 100; w++) expect(rank(w)).toBeGreaterThanOrEqual(rank(w + 1))
  })

  // The bands cover 1..100; anything outside is config drift, and a common tier is
  // the safe read (it never over-promises a legendary).
  it("falls back to common outside the configured bands", () => {
    expect(rarityFromWeight(0)).toBe("common")
    expect(rarityFromWeight(101)).toBe("common")
    expect(rarityFromWeight(-5)).toBe("common")
  })

  it("never produces mythic, which no drop table can roll", () => {
    for (let w = -10; w <= 200; w++) expect(rarityFromWeight(w)).not.toBe("mythic")
  })
})

describe("raritySkin", () => {
  it("returns the matching skin for every API tier", () => {
    for (const tier of ["common", "uncommon", "rare", "epic", "legendary"] as const) {
      expect(raritySkin(tier)).toBe(RARITY[tier])
    }
  })

  it("falls back to common for null, undefined and unknown tiers", () => {
    expect(raritySkin(null)).toBe(RARITY.common)
    expect(raritySkin(undefined)).toBe(RARITY.common)
    expect(raritySkin("ultra-mega")).toBe(RARITY.common)
  })

  it("resolves the design-only mythic tier without throwing", () => {
    expect(raritySkin("mythic")).toBe(RARITY.mythic)
  })

  it("gives every tier a complete skin, so no tile renders unstyled", () => {
    for (const tier of RARITY_ORDER) {
      const skin = RARITY[tier]
      expect(skin.name).toBeTruthy()
      expect(skin.fg).toMatch(/^#[0-9a-f]{6}$/i)
      expect(skin.bd).toBeTruthy()
      expect(skin.bg).toBeTruthy()
    }
  })
})

describe("RARITY_ORDER", () => {
  it("runs commonest to rarest and covers the whole ladder", () => {
    expect(RARITY_ORDER).toEqual(["common", "uncommon", "rare", "epic", "legendary", "mythic"])
    expect(RARITY_ORDER).toHaveLength(Object.keys(RARITY).length)
  })
})
