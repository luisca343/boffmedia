import { describe, expect, it } from "vitest"
import { applyTierListAction } from "../core/engine"
import { fixture } from "../testing/fixtures"
import { tierListMovementPreview, type TierListDragItem } from "./actions"

const source: TierListDragItem = { kind: "item", itemId: "one", rowId: null, index: 0 }
describe("transient movement projection", () => {
  it("opens an exact insertion slot without changing the original document", () => {
    const doc = applyTierListAction(fixture(), { type: "assign", itemId: "two", rowId: "s" })
    const before = JSON.stringify(doc)
    const next = tierListMovementPreview(doc, source, { kind: "item", itemId: "two", rowId: "s", index: 0 }, "preview")!
    expect(next.instance.placements.s.map((p) => p.itemId)).toEqual(["one", "two"])
    expect(next.instance.placements.s[0].id).toBe("preview")
    expect(JSON.stringify(doc)).toBe(before)
    expect(applyTierListAction(doc, next.action).instance.placements.s.map((p) => p.itemId)).toEqual(["one", "two"])
  })
  it.each(["exclusive", "multi"] as const)("projects %s cross-row rules and pool removal", (mode) => {
    const doc = applyTierListAction(fixture(mode), { type: "assign", itemId: "one", rowId: "s", placementId: "original" })
    const active: TierListDragItem = { ...source, rowId: "s", placementId: "original" }
    const next = tierListMovementPreview(doc, active, { kind: "row", rowId: "a" }, "preview")!
    expect(next.instance.placements.s).toHaveLength(mode === "multi" ? 1 : 0)
    expect(next.instance.placements.a).toEqual([{ id: "preview", itemId: "one" }])
    expect(tierListMovementPreview(doc, active, { kind: "row", rowId: null }, "preview")!.instance.placements.s).toEqual([])
    expect(doc.instance.placements.s).toHaveLength(1)
  })
  it("shifts existing occurrences and respects disabled sorting and duplicate rules", () => {
    let doc = applyTierListAction(fixture(), { type: "assign", itemId: "one", rowId: "s", placementId: "original" })
    doc = applyTierListAction(doc, { type: "assign", itemId: "two", rowId: "s" })
    const active: TierListDragItem = { ...source, rowId: "s", placementId: "original" }
    const target: TierListDragItem = { kind: "item", itemId: "two", rowId: "s", index: 1 }
    expect(tierListMovementPreview(doc, active, target, "preview")!.instance.placements.s.map((p) => p.itemId)).toEqual(["two", "one"])
    expect(tierListMovementPreview({ ...doc, template: { ...doc.template, settings: { ...doc.template.settings, allowItemReordering: false } } }, active, target, "preview")).toBeNull()
    expect(tierListMovementPreview(doc, source, target, "preview")).toBeNull()
    expect(tierListMovementPreview(doc, source, { kind: "row", rowId: null }, "preview")).toBeNull()
  })
})
