import { describe, expect, it } from "vitest"
import {
  MH_VARS,
  MH_ATTRIBUTE_DEFINITIONS,
  attributeColor,
  attributeIcon,
  attributeKind,
  firstSpecial,
  normalizeAttributeKey,
} from "./mh-helpers"

describe("MH rarity palette", () => {
  it("uses the exact colors extracted from the in-game rarity glyphs", () => {
    expect(
      Array.from({ length: 8 }, (_, index) =>
        (MH_VARS as Record<string, unknown>)[`--rar${index + 1}`],
      ),
    ).toEqual([
      "#969696",
      "#dedede",
      "#a4c43b",
      "#47a33f",
      "#5caebb",
      "#575fd9",
      "#9272e3",
      "#c76d46",
    ])
  })
})

describe("MH attribute definitions", () => {
  it("keeps elements and ailments in one canonical table", () => {
    expect(MH_ATTRIBUTE_DEFINITIONS.map(({ key }) => key)).toEqual([
      "fire",
      "water",
      "thunder",
      "ice",
      "dragon",
      "poison",
      "sleep",
      "paralysis",
      "blast",
      "blastblight",
      "stun",
      "exhaust",
      "fireblight",
      "waterblight",
      "thunderblight",
      "iceblight",
      "dragonblight",
    ])
  })

  it("normalizes game labels and resolves their shared presentation", () => {
    expect(normalizeAttributeKey("Thunder-Blight")).toBe("thunderblight")
    expect(attributeKind("Thunder-Blight")).toBe("ailment")
    expect(attributeColor("water")).toBe("#7090b0")
    expect(attributeIcon("water")).toBe("drop")
  })

  it("classifies every extracted ailment as a status special", () => {
    expect(attributeKind("blastblight")).toBe("ailment")
    expect(firstSpecial([{ type: "blastblight", value: 120 }])).toMatchObject({
      type: "blastblight",
      kind: "status",
    })
  })
})
