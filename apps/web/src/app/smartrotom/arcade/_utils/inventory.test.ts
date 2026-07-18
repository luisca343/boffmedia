import { describe, expect, it } from "vitest"
import {
  ArcadeInventoryItem,
  LootboxItemConfig,
  type ArcadeInventoryResponse,
  type LootboxBoxConfig,
  type LootboxConfigEntity,
} from "@boffmedia/shared"
import { boxAccent, collectionItems, ownedBoxes, remaining, resolveBoxes, totalBoxesOwned } from "./inventory"

let id = 0
function invItem(over: Partial<ArcadeInventoryItem> = {}): ArcadeInventoryItem {
  id += 1
  return {
    id,
    uuid: "u",
    itemId: "potion",
    itemData: "",
    itemType: "item",
    amount: 1,
    rarity: ArcadeInventoryItem.rarity.COMMON,
    sourceType: "lootbox",
    used: 0,
    createdAt: "2026-07-12T12:00:00.000Z",
    ...over,
  }
}

const inventory = (items: ArcadeInventoryItem[]): ArcadeInventoryResponse => ({
  items,
  groupedItems: {} as ArcadeInventoryResponse["groupedItems"],
  rawItems: items,
})

const boxConfig = (id: string, theme = "blue"): LootboxBoxConfig => ({
  id,
  name: id,
  image: "",
  description: "",
  theme,
  items: [],
})

describe("remaining", () => {
  // `used` is an int count here, not a boolean flag — the arcade spends items partially.
  it("subtracts the used count from the amount", () => {
    expect(remaining(invItem({ amount: 5, used: 2 }))).toBe(3)
  })

  it("treats a missing used count as zero", () => {
    expect(remaining(invItem({ amount: 5, used: 0 }))).toBe(5)
  })

  it("is zero when fully spent", () => {
    expect(remaining(invItem({ amount: 3, used: 3 }))).toBe(0)
  })

  it("can go negative if the server over-counted, which callers must clamp", () => {
    expect(remaining(invItem({ amount: 1, used: 4 }))).toBe(-3)
  })
})

describe("ownedBoxes", () => {
  const boxes = [boxConfig("battle_box"), boxConfig("starter_box")]

  it("keys on the box ids the config declares, not a hardcoded name map", () => {
    const inv = inventory([invItem({ itemId: "battle_box", amount: 2 })])
    expect(ownedBoxes(inv, boxes)).toEqual({ battle_box: 2 })
  })

  it("sums duplicate rows of the same box", () => {
    const inv = inventory([
      invItem({ itemId: "battle_box", amount: 2 }),
      invItem({ itemId: "battle_box", amount: 3, used: 1 }),
    ])
    expect(ownedBoxes(inv, boxes)).toEqual({ battle_box: 4 })
  })

  it("clamps an over-spent row to zero instead of subtracting from the total", () => {
    const inv = inventory([
      invItem({ itemId: "battle_box", amount: 2 }),
      invItem({ itemId: "battle_box", amount: 1, used: 4 }),
    ])
    expect(ownedBoxes(inv, boxes)).toEqual({ battle_box: 2 })
  })

  it("ignores inventory rows that are not boxes", () => {
    const inv = inventory([invItem({ itemId: "potion", amount: 9 })])
    expect(ownedBoxes(inv, boxes)).toEqual({})
  })

  it("is empty rather than throwing on a missing inventory", () => {
    expect(ownedBoxes(undefined, boxes)).toEqual({})
  })
})

describe("totalBoxesOwned", () => {
  it("sums every box count", () => {
    expect(totalBoxesOwned({ battle_box: 2, starter_box: 3 })).toBe(5)
  })
  it("is zero when nothing is owned", () => {
    expect(totalBoxesOwned({})).toBe(0)
  })
})

describe("collectionItems", () => {
  const boxes = [boxConfig("battle_box")]

  it("excludes unopened boxes — they belong on the Cajas screen", () => {
    const inv = inventory([invItem({ itemId: "battle_box", amount: 1 }), invItem({ itemId: "potion", amount: 1 })])
    expect(collectionItems(inv, boxes).map((i) => i.itemId)).toEqual(["potion"])
  })

  it("excludes fully spent items", () => {
    const inv = inventory([invItem({ itemId: "potion", amount: 2, used: 2 })])
    expect(collectionItems(inv, boxes)).toEqual([])
  })

  it("keeps a partially spent item", () => {
    const inv = inventory([invItem({ itemId: "potion", amount: 2, used: 1 })])
    expect(collectionItems(inv, boxes)).toHaveLength(1)
  })

  it("is empty rather than throwing on a missing inventory", () => {
    expect(collectionItems(undefined, boxes)).toEqual([])
  })
})

describe("resolveBoxes", () => {
  const config = (items: LootboxItemConfig[]): LootboxConfigEntity => ({
    rarityRanges: {},
    lootboxConfig: { boxes: [{ ...boxConfig("battle_box"), items }] },
  })

  const item = (id: string, weight: number, rarity?: LootboxItemConfig.rarity): LootboxItemConfig =>
    ({ id, weight, type: "item", data: "", amount: 1, ...(rarity ? { rarity } : {}) }) as LootboxItemConfig

  it("turns weights into percentages over the box's own total", () => {
    const [box] = resolveBoxes(config([item("a", 25), item("b", 75)]))
    const pct = Object.fromEntries(box.odds.map((o) => [o.rarity, o.pct]))
    expect(pct.uncommon).toBe(25)
    expect(pct.common).toBe(75)
  })

  it("sums the odds to 100 across every tier", () => {
    const [box] = resolveBoxes(config([item("a", 1), item("b", 9), item("c", 15), item("d", 75)]))
    expect(box.odds.reduce((s, o) => s + o.pct, 0)).toBeCloseTo(100)
  })

  it("groups items sharing a tier into one slice, sorted by likelihood", () => {
    const [box] = resolveBoxes(config([item("a", 60), item("b", 20), item("c", 20)]))
    expect(box.odds).toEqual([
      { rarity: "common", pct: 60 },
      { rarity: "uncommon", pct: 40 },
    ])
  })

  it("does not divide by zero when every weight is zero", () => {
    const [box] = resolveBoxes(config([item("a", 0), item("b", 0)]))
    expect(box.odds.every((o) => o.pct === 0)).toBe(true)
  })

  it("prefers an explicit rarity over the weight band", () => {
    const [box] = resolveBoxes(config([item("a", 90, LootboxItemConfig.rarity.LEGENDARY)]))
    expect(box.items[0].rarity).toBe("legendary")
    expect(box.odds[0].rarity).toBe("legendary")
  })

  it("backfills rarity from the weight when the config omits it", () => {
    const [box] = resolveBoxes(config([item("a", 1)]))
    expect(box.items[0].rarity).toBe("legendary")
  })

  it("is empty rather than throwing on a missing config", () => {
    expect(resolveBoxes(undefined)).toEqual([])
  })
})

describe("boxAccent", () => {
  it("maps the config's theme names onto arcade neons", () => {
    expect(boxAccent("blue")).toBe("cyan")
    expect(boxAccent("green")).toBe("lime")
    expect(boxAccent("red")).toBe("magenta")
  })

  it("falls back to violet for an unknown or missing theme", () => {
    expect(boxAccent(undefined)).toBe("violet")
    expect(boxAccent("chartreuse")).toBe("violet")
  })
})
