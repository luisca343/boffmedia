import { describe, expect, it } from "vitest"
import { ALL_NAMESPACES } from "./manifest.generated"
import { namespacesFor, SCOPED_NAMESPACES } from "./scopes"

const HEAVY = "smartrotom/pokedex/forms.json"
const scopedSet = new Set(SCOPED_NAMESPACES.flatMap((s) => s.namespaces))

describe("namespacesFor", () => {
  it("loads everything when the pathname is unknown", () => {
    // Middleware is the only source of the URL. Narrowing without it would blank
    // out exactly the scoped pages, so an unknown route must load all of them.
    expect(namespacesFor("", ALL_NAMESPACES)).toEqual([...ALL_NAMESPACES])
  })

  it("omits every scoped namespace on an unrelated route", () => {
    const loaded = namespacesFor("/torneos", ALL_NAMESPACES)
    for (const ns of scopedSet) expect(loaded).not.toContain(ns)
  })

  it("keeps all unscoped namespaces on every route", () => {
    const core = ALL_NAMESPACES.filter((ns) => !scopedSet.has(ns))
    for (const route of ["/", "/torneos", "/smartrotom/pokedex", "/smartrotom/arcade"]) {
      expect(namespacesFor(route, ALL_NAMESPACES)).toEqual(expect.arrayContaining(core))
    }
  })

  it("loads the pokedex data on the pokedex route", () => {
    expect(namespacesFor("/smartrotom/pokedex", ALL_NAMESPACES)).toContain(HEAVY)
  })

  it("loads forms.json on arcade — squirdle resolves species by name", () => {
    expect(namespacesFor("/smartrotom/arcade", ALL_NAMESPACES)).toContain(HEAVY)
  })

  it("matches nested routes under a scoped prefix", () => {
    expect(namespacesFor("/smartrotom/arcade/squirdle", ALL_NAMESPACES)).toContain(HEAVY)
    expect(namespacesFor("/smartrotom/pokedex/entrada/25", ALL_NAMESPACES)).toContain(HEAVY)
  })

  it("does not leak one app's namespace into another", () => {
    const rooker = namespacesFor("/smartrotom/rooker", ALL_NAMESPACES)
    expect(rooker).toContain("smartrotom/rooker.json")
    expect(rooker).not.toContain("smartrotom/wigglypop.json")
    expect(rooker).not.toContain(HEAVY)
  })

  it("preserves manifest order so the merge stays deterministic", () => {
    const loaded = namespacesFor("/smartrotom/pokedex", ALL_NAMESPACES)
    const expected = ALL_NAMESPACES.filter((ns) => loaded.includes(ns))
    expect(loaded).toEqual(expected)
  })

  it("actually reduces the payload on a typical page", () => {
    const all = namespacesFor("", ALL_NAMESPACES).length
    const typical = namespacesFor("/torneos", ALL_NAMESPACES).length
    expect(typical).toBeLessThan(all)
  })
})
