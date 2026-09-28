import { describe, expect, it } from "vitest"
import { applyTierListAction, cloneTemplate, createInstance, getRows, getSourceItems, getTierListTitle, getTierListDescription, reconcileTemplate } from "./engine"
import { createHistory, tierListHistoryReducer } from "./history"
import { LIMITS, tierListDocumentSchema, tierListSettingsSchema, type TierListDocument } from "./schema"
import { tierListDropAction } from "../dnd/actions"
import { fixture } from "../testing/fixtures"
const assign = (doc: TierListDocument, itemId: string, rowId: string) => applyTierListAction(doc, { type: "assign", itemId, rowId })
const ids = (doc: TierListDocument, rowId: string) => (doc.instance.placements[rowId] ?? []).map((p) => p.itemId)

describe("exclusive placement", () => {
  it("edits list-owned headings with undo, validation and unchanged template/placements", () => {
    const doc = assign(fixture(), "one", "s")
    const history = tierListHistoryReducer(createHistory(doc), { type: "editHeading", title: " My ranking ", description: " Friends' picks " })
    expect(history.present.instance).toMatchObject({ title: "My ranking", description: "Friends' picks", placements: doc.instance.placements })
    expect(history.present.template).toBe(doc.template)
    expect(getTierListTitle(doc.template, doc.instance)).toBe(doc.template.title)
    expect(getTierListDescription(history.present.template, history.present.instance)).toBe("Friends' picks")
    expect(tierListHistoryReducer(history, { type: "undo" }).present).toBe(doc)
    expect(applyTierListAction(doc, { type: "editHeading", title: " ", description: "" })).toBe(doc)
    expect(applyTierListAction(doc, { type: "editHeading", title: "a".repeat(201), description: "" })).toBe(doc)
    expect(applyTierListAction(history.present, { type: "reset" }).instance.title).toBe("My ranking")
  })
  it("adds and moves an item, removing its previous row", () => {
    const first = assign(fixture(), "one", "b")
    const moved = assign(first, "one", "s")
    expect(ids(first, "b")).toEqual(["one"])
    expect(ids(moved, "b")).toEqual([])
    expect(ids(moved, "s")).toEqual(["one"])
    expect(getSourceItems(moved.items, moved.template, moved.instance).map((i) => i.id)).toEqual(["two", "three"])
  })
  it("reorders without deleting another item and returns items to the pool", () => {
    const doc = assign(assign(fixture(), "one", "s"), "two", "s")
    const next = applyTierListAction(doc, { type: "reorderItem", rowId: "s", from: 0, to: 1 })
    expect(ids(next, "s")).toEqual(["two", "one"])
    const returned = applyTierListAction(next, { type: "unassign", itemId: "one" })
    expect(getSourceItems(returned.items, returned.template, returned.instance).map((i) => i.id)).toContain("one")
  })
  it("rejects accidental duplicates, unknown references and invalid reorder indexes", () => {
    const doc = assign(fixture(), "one", "s")
    expect(assign(doc, "one", "s")).toBe(doc)
    expect(assign(doc, "missing", "s")).toBe(doc)
    expect(assign(doc, "two", "missing")).toBe(doc)
    expect(applyTierListAction(doc, { type: "reorderItem", rowId: "s", from: -1, to: 0 })).toBe(doc)
  })
})
describe("multi placement and pool settings", () => {
  it("assigns to multiple rows without duplicates and clears only the chosen row", () => {
    const doc = assign(assign(fixture("multi", { keepSourceVisible: true }), "one", "s"), "one", "a")
    expect(ids(doc, "s")).toEqual(["one"])
    expect(ids(doc, "a")).toEqual(["one"])
    expect(assign(doc, "one", "s")).toBe(doc)
    expect(getSourceItems(doc.items, doc.template, doc.instance)).toEqual(doc.items)
    const cleared = applyTierListAction(doc, { type: "clearRow", rowId: "s" })
    expect(ids(cleared, "s")).toEqual([])
    expect(ids(cleared, "a")).toEqual(["one"])
  })
  it.each(["exclusive", "multi"] as const)("%s obeys keepSourceVisible independently", (mode) => {
    for (const keepSourceVisible of [false, true]) {
      const doc = assign(fixture(mode, { keepSourceVisible }), "one", "a")
      expect(getSourceItems(doc.items, doc.template, doc.instance).some((i) => i.id === "one")).toBe(keepSourceVisible)
    }
  })
  it("explicit duplicates have independent occurrence IDs and removal", () => {
    const doc = assign(assign(fixture("multi", { allowDuplicateWithinRow: true }), "one", "s"), "one", "s")
    expect(ids(doc, "s")).toEqual(["one", "one"])
    const [first, second] = doc.instance.placements.s
    expect(first.id).not.toBe(second.id)
    const removed = applyTierListAction(doc, { type: "remove", rowId: "s", placementId: first.id })
    expect(removed.instance.placements.s).toEqual([second])
  })
})
describe("row permissions, template separation and history", () => {
  it("edits, reorders, adds and removes instance rows without changing a template", () => {
    const base = fixture()
    let doc = applyTierListAction(base, { type: "editRow", rowId: "s", patch: { label: "Priority" } })
    doc = applyTierListAction(doc, { type: "addRow", row: { id: "extra", label: "Extra" } })
    doc = applyTierListAction(doc, { type: "reorderRow", from: 4, to: 0 })
    expect(getRows(doc.template, doc.instance)[0].id).toBe("extra")
    doc = applyTierListAction(doc, { type: "deleteRow", rowId: "extra" })
    expect(getRows(doc.template, doc.instance)[0].label).toBe("Priority")
    expect(base.template.rows[0].label).toBe("S")
    expect(base.instance.rows).toBeUndefined()
  })
  it("enforces each editing permission and refuses invalid row labels", () => {
    const doc = fixture("exclusive", { allowRowEditing: false, allowRowCreation: false, allowRowDeletion: false, allowRowReordering: false, allowItemReordering: false })
    for (const action of [
      { type: "editRow" as const, rowId: "s", patch: { label: "Changed" } },
      { type: "addRow" as const, row: { id: "new", label: "New" } },
      { type: "deleteRow" as const, rowId: "s" }, { type: "reorderRow" as const, from: 0, to: 1 },
      { type: "reorderItem" as const, rowId: "s", from: 0, to: 1 },
    ]) expect(applyTierListAction(doc, action)).toBe(doc)
    expect(applyTierListAction(fixture(), { type: "editRow", rowId: "s", patch: { label: "" } }).instance.rows).toBeUndefined()
  })
  it("undoes placement, row edits, row/item order and clear; new commits discard redo", () => {
    let history = createHistory(fixture())
    for (const action of [
      { type: "assign" as const, itemId: "one", rowId: "s" },
      { type: "assign" as const, itemId: "two", rowId: "s" },
      { type: "reorderItem" as const, rowId: "s", from: 0, to: 1 },
      { type: "editRow" as const, rowId: "s", patch: { label: "Top" } },
      { type: "reorderRow" as const, from: 0, to: 1 }, { type: "clear" as const },
    ]) history = tierListHistoryReducer(history, action)
    const undo = tierListHistoryReducer(history, { type: "undo" })
    expect(ids(undo.present, "s")).toEqual(["two", "one"])
    expect(getRows(undo.present.template, undo.present.instance)[1].label).toBe("Top")
    expect(tierListHistoryReducer(undo, { type: "redo" }).present).toEqual(history.present)
    expect(tierListHistoryReducer(undo, { type: "clearRow", rowId: "s" }).future).toEqual([])
  })
  it("reconciles references when switching from multi to exclusive or removing items", () => {
    const doc = assign(assign(assign(fixture("multi"), "one", "a"), "one", "s"), "two", "b")
    const template = { ...doc.template, settings: tierListSettingsSchema.parse({}) }
    const items = doc.items.filter((i) => i.id !== "two")
    template.source = { type: "static", items }
    const next = reconcileTemplate(doc, template, items)
    expect(ids(next, "s")).toEqual(["one"])
    expect(ids(next, "a")).toEqual([])
    expect(ids(next, "b")).toEqual([])
    expect(tierListDocumentSchema.safeParse(next).success).toBe(true)
  })
  it("clones privately without inherited account IDs", () => {
    const template = { ...fixture().template, ownership: { type: "user" as const, userId: "private-user" } }
    const cloned = cloneTemplate(template)
    expect(cloned.id).not.toBe(template.id)
    expect(cloned.sourceTemplateId).toBe(template.id)
    expect(cloned.ownership).toEqual({ type: "user" })
    expect(cloned.visibility).toBe("private")
    expect(createInstance(cloned).templateId).toBe(cloned.id)
  })
})
describe("isolated drag adapter", () => {
  const active = { kind: "item" as const, rowId: "s", itemId: "one", index: 0, placementId: "occurrence" }
  it("translates cross-row drops into assignments and pool drops into scoped removals", () => {
    expect(tierListDropAction(active, { kind: "row", rowId: "a" }, "multi")).toMatchObject({ type: "assign", rowId: "a", itemId: "one" })
    expect(tierListDropAction(active, { kind: "row", rowId: null }, "multi")).toEqual({ type: "remove", rowId: "s", placementId: "occurrence" })
    expect(tierListDropAction(active, { kind: "row", rowId: null }, "exclusive")).toEqual({ type: "unassign", itemId: "one" })
  })
  it("translates a wrapped row insertion into an item reorder", () => {
    expect(tierListDropAction(active, { ...active, itemId: "two", index: 1 }, "exclusive")).toEqual({ type: "reorderItem", rowId: "s", from: 0, to: 1 })
  })
})
describe("large collections", () => {
  it("permits exclusive moves at the placement limit while rejecting extra copies", () => {
    const exclusive = fixture("exclusive", { allowDuplicateWithinRow: true })
    exclusive.instance.placements.s = Array.from({ length: LIMITS.placements }, (_, index) => ({ id: `p-${index}`, itemId: "one" }))
    expect(ids(assign(exclusive, "one", "a"), "s")).toEqual([])
    expect(ids(assign(exclusive, "one", "a"), "a")).toEqual(["one"])
    const multi = { ...exclusive, template: { ...exclusive.template, settings: { ...exclusive.template.settings, placementMode: "multi" as const } } }
    expect(assign(multi, "one", "a")).toBe(multi)
  })
  it("handles hundreds of stable items without losing placements on reorder", () => {
    let doc = fixture()
    const items = Array.from({ length: 600 }, (_, index) => ({ id: `item-${index}`, name: `Item ${index}` }))
    doc = { ...doc, items, template: { ...doc.template, source: { type: "static", items } } }
    for (let i = 0; i < 600; i++) doc = assign(doc, `item-${i}`, ["s", "a", "b", "c"][i % 4])
    doc = applyTierListAction(doc, { type: "reorderItem", rowId: "s", from: 0, to: 149 })
    expect(ids(doc, "s")).toHaveLength(150)
    expect(ids(doc, "s")[149]).toBe("item-0")
    expect(Object.values(doc.instance.placements).flat()).toHaveLength(600)
    expect(tierListDocumentSchema.safeParse(doc).success).toBe(true)
    expect(getSourceItems(items, doc.template, doc.instance)).toEqual([])
  })
})
