import { describe, expect, it } from "vitest"
import { createDocument } from "./core/engine"
import { getTierListTemplates, withTierListStarterImages } from "./templates"
import { parseTierListDocument } from "./serialization/document"

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
