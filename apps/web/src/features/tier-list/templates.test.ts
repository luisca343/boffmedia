import { describe, expect, it } from "vitest"
import { applyTierListAction, createDocument, getSourceItems } from "./core/engine"
import { tierListMovementPreview } from "./dnd/actions"
import { getTierListTemplates, withTierListStarterImages } from "./templates"
import { parseTierListDocument } from "./serialization/document"
import { FORTUNES_WEAVE_CHARACTERS } from "@/features/fortunes-weave/characters"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("Fire Emblem route assignments", () => {
  it("copies ordinary characters between routes without allowing duplicates in a route", () => {
    const template = getTierListTemplates((key) => key)[3]
    let doc = createDocument(template, FORTUNES_WEAVE_CHARACTERS)
    doc = applyTierListAction(doc, { type: "assign", itemId: "tialla", rowId: "cai" })
    const placement = doc.instance.placements.cai[1]
    const active = { kind: "item" as const, rowId: "cai", itemId: "tialla", index: 1, placementId: placement.id }
    const preview = tierListMovementPreview(doc, active, { kind: "row", rowId: "dietrich" }, "preview")!
    const copied = applyTierListAction(doc, preview.action)
    expect(copied.instance.placements.cai.map((p) => p.itemId)).toEqual(["cai", "tialla"])
    expect(copied.instance.placements.dietrich.map((p) => p.itemId)).toEqual(["dietrich", "tialla"])
    expect(applyTierListAction(copied, preview.action)).toBe(copied)
    const returned = tierListMovementPreview(copied, active, { kind: "row", rowId: null }, "preview")!
    expect(returned.instance.placements.cai.map((p) => p.itemId)).toEqual(["cai"])
    expect(returned.instance.placements.dietrich.map((p) => p.itemId)).toEqual(["dietrich", "tialla"])
  })

  it.each([false, true])("keeps Lords in their routes even when duplicate permission is %s", (allowDuplicateWithinRow) => {
    const preset = getTierListTemplates((key) => key)[3]
    const doc = createDocument({ ...preset, settings: { ...preset.settings, allowDuplicateWithinRow } }, FORTUNES_WEAVE_CHARACTERS)
    expect(getSourceItems(doc.items, doc.template, doc.instance)).toHaveLength(46)
    for (const row of preset.rows) {
      const placementId = doc.instance.placements[row.id][0].id
      for (const target of preset.rows) expect(applyTierListAction(doc, { type: "assign", itemId: row.id, rowId: target.id })).toBe(doc)
      for (const action of [
        { type: "remove" as const, rowId: row.id, placementId },
        { type: "unassign" as const, itemId: row.id },
        { type: "clearRow" as const, rowId: row.id },
        { type: "deleteRow" as const, rowId: row.id },
      ]) expect(applyTierListAction(doc, action)).toBe(doc)
      expect(tierListMovementPreview(doc, { kind: "item", rowId: row.id, itemId: row.id, placementId, index: 0 }, { kind: "row", rowId: null }, "preview")).toBeNull()
    }
    const populated = applyTierListAction(doc, { type: "assign", itemId: "peter", rowId: "cai" })
    for (const type of ["clear", "reset"] as const) {
      const next = applyTierListAction(populated, { type })
      for (const row of preset.rows) expect(next.instance.placements[row.id].map((p) => p.itemId)).toEqual([row.id])
      expect(parseTierListDocument(JSON.stringify(next))).toEqual(next)
    }
  })
})

describe("starter artwork", () => {
  it("fills older system snapshots without changing saved state or chosen images", () => {
    const template = getTierListTemplates((key) => key)[0]
    if (template.source.type === "reference") throw new Error("Expected static demo")
    const items = template.source.items.map(({ image: _image, ...item }) => item)
    const doc = createDocument({ ...template, source: { type: "static", items } }, items, "default")
    doc.items[0] = { ...doc.items[0], image: "/uploads/chosen.webp" }
    doc.template.source = { type: "static", items: doc.items }
    const raw = JSON.stringify(doc)
    const displayed = withTierListStarterImages(doc)
    expect(displayed.items.every((item) => item.image?.startsWith("/"))).toBe(true)
    expect(displayed.items[0].image).toBe("/uploads/chosen.webp")
    expect(displayed.instance).toBe(doc.instance)
    expect(JSON.stringify(doc)).toBe(raw)
    expect(parseTierListDocument(JSON.stringify(displayed)).items).toEqual(displayed.items)
  })
  it("leaves user definitions and reference collections untouched", () => {
    const template = getTierListTemplates((key) => key)[0]
    const user = createDocument({ ...template, ownership: { type: "user" } }, [])
    expect(withTierListStarterImages(user)).toBe(user)
    const games = createDocument(getTierListTemplates((key) => key)[2], [])
    expect(withTierListStarterImages(games)).toBe(games)
  })
})

it("uses the complete Fortune’s Weave collection with public portraits and four seeded routes", () => {
  const template = getTierListTemplates((key) => key).find((template) => template.slug === "fire-emblem-fortunes-weave")!
  if (template.source.type === "reference") throw new Error("Expected character collection")
  expect(template.settings).toMatchObject({ placementMode: "multi", keepSourceVisible: true })
  expect(template.rows.map(({ label }) => label)).toEqual(["Cai", "Dietrich", "Theodora", "Leda"])
  expect(template.source.items).toEqual(FORTUNES_WEAVE_CHARACTERS)
  expect(FORTUNES_WEAVE_CHARACTERS).toHaveLength(50)
  expect(new Set(FORTUNES_WEAVE_CHARACTERS.map(({ id }) => id)).size).toBe(50)
  for (const { image } of FORTUNES_WEAVE_CHARACTERS) {
    const asset = readFileSync(resolve(process.cwd(), "../../public", new URL(image, "http://localhost").pathname.slice(1)))
    expect(asset.toString("ascii", 0, 4)).toBe("RIFF")
    expect(asset.toString("ascii", 8, 12)).toBe("WEBP")
  }
  for (const id of ["cai", "dietrich", "theodora", "leda"] as const) {
    expect(FORTUNES_WEAVE_CHARACTERS.find((character) => character.id === id)?.image).toContain(`${id}-pre-timeskip.webp`)
  }
  const doc = createDocument(template, template.source.items, "default")
  expect(parseTierListDocument(JSON.stringify(doc))).toEqual(doc)
  expect(Object.values(doc.instance.placements).flat()).toHaveLength(4)
  for (const id of ["cai", "dietrich", "theodora", "leda"]) expect(doc.instance.placements[id].map(({ itemId }) => itemId)).toEqual([id])
})

it.each(["system", "user"] as const)("refreshes previous %s lord artwork without replacing saved placements or custom images", (ownership) => {
  const template = getTierListTemplates((key) => key).find((template) => template.slug === "fire-emblem-fortunes-weave")!
  if (template.source.type === "reference") throw new Error("Expected character collection")
  const items = template.source.items.map((item) => item.id === "cai" ? { ...item, image: "/boffmedia/img/games/fortunes-weave/portraits/cai.webp" } : item.id === "dietrich" ? { ...item, image: "/uploads/custom.webp" } : item)
  const doc = createDocument({ ...template, ownership: { type: ownership }, source: { type: "static", items } }, items)
  const displayed = withTierListStarterImages(doc)
  expect(displayed.items.find(({ id }) => id === "cai")?.image).toContain("cai-pre-timeskip.webp")
  expect(displayed.items.find(({ id }) => id === "dietrich")?.image).toBe("/uploads/custom.webp")
  expect(displayed.instance).toBe(doc.instance)
  expect(doc.items.find(({ id }) => id === "cai")?.image).toContain("/cai.webp")
  expect(parseTierListDocument(JSON.stringify(displayed)).items).toEqual(displayed.items)
})
