import { describe, expect, it } from "vitest"
import { createDocument } from "./core/engine"
import { getTierListTemplates, withTierListStarterImages } from "./templates"
import { parseTierListDocument } from "./serialization/document"
import { FORTUNES_WEAVE_CHARACTERS } from "@/features/fortunes-weave/characters"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

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
