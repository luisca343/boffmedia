import { describe, expect, it } from "vitest"
import { LootboxItemConfig, type OpenLootBoxResponseDto } from "@boffmedia/shared"
import type { ResolvedBox } from "../../_utils/inventory"
import { buildReel } from "./reel"

const item = (id: string, weight: number, rarity: LootboxItemConfig.rarity): LootboxItemConfig => ({
  id,
  weight,
  rarity,
  type: "pokemon",
  data: `spec:${id}`,
  amount: 1,
})

const box: ResolvedBox = {
  id: "battle_box",
  name: "Caja de combate",
  image: "/box.png",
  description: "",
  theme: "blue",
  items: [
    item("masterball", 1, LootboxItemConfig.rarity.LEGENDARY),
    item("potion", 60, LootboxItemConfig.rarity.COMMON),
  ],
  odds: [],
}

const result = (over: Partial<OpenLootBoxResponseDto> = {}): OpenLootBoxResponseDto => ({
  spinnerItems: [
    { id: "potion", weight: 60, isWinningItem: false },
    { id: "masterball", weight: 1, isWinningItem: true },
    { id: "potion", weight: 60, isWinningItem: false },
  ],
  winningPosition: 1,
  ...over,
})

describe("buildReel", () => {
  it("joins each spinner face back to the box's own drop table", () => {
    const { tiles } = buildReel(result(), box)
    expect(tiles.map((t) => t.rarity)).toEqual(["common", "legendary", "common"])
    expect(tiles[1]).toMatchObject({ id: "masterball", type: "pokemon", data: "spec:masterball", amount: 1 })
  })

  it("gives repeated faces distinct keys so React does not collapse them", () => {
    const { tiles } = buildReel(result(), box)
    expect(new Set(tiles.map((t) => t.key)).size).toBe(tiles.length)
  })

  it("trusts the server's declared winning position", () => {
    expect(buildReel(result(), box).winningPosition).toBe(1)
  })

  it("falls back to the flagged face when the server declares no position", () => {
    expect(buildReel(result({ winningPosition: undefined }), box).winningPosition).toBe(1)
  })

  it("rejects an out-of-range position instead of pointing past the reel", () => {
    expect(buildReel(result({ winningPosition: 99 }), box).winningPosition).toBe(1)
    expect(buildReel(result({ winningPosition: -3 }), box).winningPosition).toBe(1)
  })

  it("reports −1 when neither a position nor a flagged face is present", () => {
    const spinnerItems = [{ id: "potion", weight: 60, isWinningItem: false }]
    expect(buildReel({ spinnerItems, winningPosition: undefined }, box).winningPosition).toBe(-1)
  })

  it("accepts position 0 — the first face can win", () => {
    const r = result({ winningPosition: 0 })
    expect(buildReel(r, box).winningPosition).toBe(0)
  })

  // Without the box config the reel still has to render, so rarity is inferred
  // from the drop weight the wire does carry.
  it("derives rarity from weight when the box config is unavailable", () => {
    const { tiles } = buildReel(result(), undefined)
    expect(tiles.map((t) => t.rarity)).toEqual(["common", "legendary", "common"])
    expect(tiles[0].type).toBeUndefined()
  })

  it("survives a response with no spinner at all", () => {
    const reel = buildReel({}, box)
    expect(reel.tiles).toEqual([])
    expect(reel.winningPosition).toBe(-1)
  })

  it("falls back to common for a face missing from the drop table", () => {
    const r = result({ spinnerItems: [{ id: "ghost-item", weight: 75, isWinningItem: true }], winningPosition: 0 })
    expect(buildReel(r, box).tiles[0].rarity).toBe("common")
  })
})
