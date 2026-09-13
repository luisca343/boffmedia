import { describe, expect, it } from "vitest"
import type { ArmorPiece } from "../types"
import { groupArmor } from "./grouping"

function piece(
  id: number,
  kind: string,
  setId: number,
  setName: string,
  gameId?: number,
): ArmorPiece {
  return {
    id,
    name: `${setName} ${kind}`,
    kind,
    rank: "high",
    rarity: 5,
    defense: { base: 1 },
    resistances: { fire: 0, water: 0, thunder: 0, ice: 0, dragon: 0 },
    slots: [],
    skills: [],
    armorSet: { id: setId, gameId, name: setName },
  }
}

describe("groupArmor", () => {
  it("keeps alpha and beta sets separate even when their numeric ids collide", () => {
    const groups = groupArmor([
      piece(1, "head", 10, "Chatacabra α"),
      piece(2, "chest", 10, "Chatacabra α"),
      piece(3, "head", 10, "Chatacabra β"),
      piece(4, "chest", 10, "Chatacabra β"),
    ])

    expect(groups.map((group) => group.name)).toEqual([
      "Chatacabra α",
      "Chatacabra β",
    ])
    expect(groups.map((group) => group.variant)).toEqual(["α", "β"])
  })

  it("preserves all slots in a normal set", () => {
    const groups = groupArmor([
      piece(1, "legs", 8, "Alloy α"),
      piece(2, "head", 8, "Alloy α"),
      piece(3, "chest", 8, "Alloy α"),
    ])

    expect(groups[0]?.pieces.map((item) => item.kind)).toEqual([
      "head",
      "chest",
      "legs",
    ])
  })

  it("uses the stable game id when the API database id changes", () => {
    const groups = groupArmor([
      piece(1, "head", 153, "Akuma Î±", 3633),
      piece(2, "chest", 999, "Akuma Î±", 3633),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.pieces.map((item) => item.kind)).toEqual(["head", "chest"])
  })
})
