import { describe, expect, it } from "vitest"
import {
  ADMIN_SECTIONS,
  assembleEntries,
  matchesQuery,
  sortEntries,
  type CommandPaletteEntry,
} from "./command-palette-logic"

const t = (key: string) => key
const routes = [{ route: "/", labelKey: "home" }] as const
const tools = [
  { key: "seeds", title: "Seed Finder", desc: "Find a world seed", href: "/herramientas/seeds" },
  { key: "vgc", title: "VGC Tracker", desc: "Track regulations", href: "/herramientas/vgc" },
] as const

describe("assembleEntries", () => {
  it("takes its tools from the registry it is handed, not a hand-written list", () => {
    const entries = assembleEntries({ routes, tools, isAdmin: false, t })
    const toolEntries = entries.filter((e) => e.category === "tool")
    expect(toolEntries.map((e) => e.href)).toEqual([
      "/herramientas/seeds",
      "/herramientas/vgc",
    ])
  })

  it("hides every admin section from a non-admin", () => {
    const entries = assembleEntries({ routes, tools, isAdmin: false, t })
    expect(entries.some((e) => e.category === "admin")).toBe(false)
    // Not merely absent from the list: the hrefs must not leak either.
    expect(entries.some((e) => e.href.startsWith("/admin"))).toBe(false)
  })

  it("offers every admin section to an admin", () => {
    const entries = assembleEntries({ routes, tools, isAdmin: true, t })
    expect(entries.filter((e) => e.category === "admin")).toHaveLength(
      ADMIN_SECTIONS.length,
    )
  })
})

const entry = (title: string, description?: string): CommandPaletteEntry => ({
  id: title,
  title,
  description,
  href: `/${title}`,
  category: "tool",
})

describe("matchesQuery", () => {
  it("matches on the description, not only the title", () => {
    expect(matchesQuery("regulation", entry("VGC", "Track regulations"))).toBe(true)
  })

  it("requires every word, so a two-word query narrows instead of widening", () => {
    expect(matchesQuery("seed finder", entry("Seed Finder"))).toBe(true)
    expect(matchesQuery("seed calculator", entry("Seed Finder"))).toBe(false)
  })

  it("ignores case", () => {
    expect(matchesQuery("SEED", entry("Seed Finder"))).toBe(true)
  })
})

describe("sortEntries", () => {
  it("puts an exact title match first", () => {
    const sorted = sortEntries("vgc", [entry("VGC Tracker"), entry("VGC")])
    expect(sorted[0].title).toBe("VGC")
  })

  it("prefers a prefix match over a mid-string one", () => {
    const sorted = sortEntries("seed", [entry("World seed tool"), entry("Seed Finder")])
    expect(sorted[0].title).toBe("Seed Finder")
  })

  it("groups by category when there is no query", () => {
    const mixed: CommandPaletteEntry[] = [
      { ...entry("Zed tool"), category: "admin" },
      { ...entry("Alpha tool"), category: "route" },
    ]
    expect(sortEntries("", mixed).map((e) => e.category)).toEqual(["route", "admin"])
  })
})
