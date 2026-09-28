import { describe, expect, it } from "vitest"
import { applyTierListAction, createDocument } from "../core/engine"
import { fixture } from "../testing/fixtures"
import { exportTierListDocument, parseTierListDocument, TierListFormatError } from "./document"
import { LIMITS } from "../core/schema"

describe("versioned serialization", () => {
  it("keeps preset defaults portable independently of cleared instance placements", () => {
    const base = fixture("multi")
    const doc = applyTierListAction(createDocument({ ...base.template, initialPlacements: { s: ["one"], a: ["one"] } }, base.items), { type: "clear" })
    const imported = parseTierListDocument(exportTierListDocument(doc))
    expect(imported.instance.placements).toEqual({})
    expect(imported.template.initialPlacements).toEqual({ s: ["one"], a: ["one"] })
    expect(createDocument(imported.template, imported.items).instance.placements.s[0].itemId).toBe("one")
  })
  it("keeps starter instructions out of the visible caption after a private import remix", () => {
    const doc = fixture()
    doc.template.ownership = { type: "system" }
    doc.template.description = "Instructions for the starter catalog"
    const parsed = parseTierListDocument(exportTierListDocument(doc))
    expect(parsed.template.description).toBe(doc.template.description)
    expect(parsed.instance.description).toBe("")
    expect(parseTierListDocument(JSON.stringify(doc)).instance.title).toBeUndefined()
  })
  it("round trips placements and instance rows while stripping account IDs and opaque metadata", () => {
    let doc = applyTierListAction(fixture("multi"), { type: "assign", itemId: "one", rowId: "a" })
    doc = applyTierListAction(doc, { type: "editRow", rowId: "a", patch: { label: "Edited" } })
    doc = applyTierListAction(doc, { type: "editHeading", title: "My list", description: "A personal caption" })
    doc.instance.ownerId = "private-user"
    doc.template.ownership = { type: "user", userId: "private-user" }
    doc.items[0].metadata = { privateNote: "secret" }
    const raw = exportTierListDocument(doc)
    const parsed = parseTierListDocument(raw)
    expect(parsed.instance.placements).toEqual(doc.instance.placements)
    expect(parsed.instance.rows).toEqual(doc.instance.rows)
    expect(parsed.instance).toMatchObject({ title: "My list", description: "A personal caption" })
    expect(raw).not.toContain("private-user")
    expect(raw).not.toContain("secret")
    expect(parsed.template.visibility).toBe("private")
  })
  it("exports resolved reference items as a portable static source", () => {
    const doc = fixture()
    doc.template.source = { type: "reference", key: "site-games" }
    expect(parseTierListDocument(exportTierListDocument(doc)).template.source).toEqual({ type: "static", items: doc.items })
  })
  it("rejects unsupported versions, malformed JSON and oversized documents", () => {
    expect(() => parseTierListDocument('{"schemaVersion":2}')).toThrow(new TierListFormatError("version"))
    expect(() => parseTierListDocument("[broken")).toThrow(new TierListFormatError("invalid"))
    expect(() => parseTierListDocument("a".repeat(LIMITS.jsonBytes + 1))).toThrow(new TierListFormatError("size"))
  })
  it.each(["row", "item", "occurrence", "exclusive", "source", "duplicate", "image", "settings", "id"])("rejects invalid %s references or rules", (caseName) => {
    const doc = fixture()
    doc.instance.placements.s = [{ id: "p", itemId: "one" }]
    if (caseName === "row") doc.instance.placements.unknown = []
    if (caseName === "item") doc.instance.placements.s[0].itemId = "unknown"
    if (caseName === "occurrence") doc.instance.placements.a = [{ id: "p", itemId: "two" }]
    if (caseName === "exclusive") doc.instance.placements.a = [{ id: "q", itemId: "one" }]
    if (caseName === "source") doc.items = doc.items.slice(1)
    if (caseName === "duplicate") doc.instance.placements.s.push({ id: "q", itemId: "one" })
    if (caseName === "image") doc.items[0].image = "data:image/png;base64,huge"
    if (caseName === "settings") Object.assign(doc.template.settings, { placementMode: "wrong" })
    if (caseName === "id") doc.template.rows[0].id = "../escape"
    expect(() => parseTierListDocument(JSON.stringify(doc))).toThrow(TierListFormatError)
  })
  it("rejects prototype pollution, extra fields and deeply nested metadata", () => {
    const raw = JSON.stringify(fixture())
    expect(() => parseTierListDocument(raw.replace('"items":', '"__proto__":{"polluted":true},"items":'))).toThrow(TierListFormatError)
    expect(() => parseTierListDocument(raw.replace('"schemaVersion":1', '"unexpected":true,"schemaVersion":1'))).toThrow(TierListFormatError)
    let nested: unknown = "bottom"
    for (let i = 0; i < 20; i++) nested = { nested }
    const doc = fixture(); doc.items[0].metadata = { nested }
    expect(() => parseTierListDocument(JSON.stringify(doc))).toThrow(TierListFormatError)
  })
  it("rejects repeated row/item IDs and reserved IDs", () => {
    const rows = fixture(); rows.template.rows[1].id = "s"
    const items = fixture(); items.items[1].id = "one"
    const reserved = fixture(); reserved.template.id = "constructor"
    for (const doc of [rows, items, reserved]) expect(() => parseTierListDocument(JSON.stringify(doc))).toThrow(TierListFormatError)
  })
})
