import { describe, expect, it } from "vitest"
import { ALL_NAMESPACES } from "./manifest.generated"
import { namespacesFor, narrowNamespaces, SCOPED_NAMESPACES } from "./scopes"

const HEAVY = "smartrotom/pokedex/forms.json"
const scopedSet = new Set(SCOPED_NAMESPACES.flatMap((s) => s.namespaces))

// Scoping is DISABLED (see scopes.ts): `NextIntlClientProvider` lives in the root
// layout, which does not re-render on client-side navigation, so a narrowed message
// set leaks across routes and blanks the destination app. `namespacesFor` is the
// live path; `narrowNamespaces` is the logic kept warm for when the provider moves
// per-route.
describe("namespacesFor — the live path", () => {
  it("loads every namespace on every route while scoping is disabled", () => {
    for (const route of ["", "/", "/torneos", "/smartrotom/rooker", "/smartrotom/pokedex"]) {
      expect(namespacesFor(route, ALL_NAMESPACES)).toEqual([...ALL_NAMESPACES])
    }
  })

  it("never omits a scoped namespace — the bug that broke rooker/pasaporte/gobierno", () => {
    // Entering on /smartrotom and navigating to /smartrotom/rooker must not lose
    // rooker.json, because the provider will not re-render to fetch it.
    const entry = namespacesFor("/smartrotom", ALL_NAMESPACES)
    for (const ns of scopedSet) expect(entry).toContain(ns)
  })
})

describe("narrowNamespaces — logic kept under test for re-enablement", () => {
  it("loads everything when the pathname is unknown", () => {
    // The proxy is the only source of the URL. Narrowing without it would blank
    // out exactly the scoped pages, so an unknown route must load all of them.
    expect(narrowNamespaces("", ALL_NAMESPACES)).toEqual([...ALL_NAMESPACES])
  })

  it("omits every scoped namespace on an unrelated route", () => {
    const loaded = narrowNamespaces("/torneos", ALL_NAMESPACES)
    for (const ns of scopedSet) expect(loaded).not.toContain(ns)
  })

  it("keeps all unscoped namespaces on every route", () => {
    const core = ALL_NAMESPACES.filter((ns) => !scopedSet.has(ns))
    for (const route of ["/", "/torneos", "/smartrotom/pokedex", "/smartrotom/arcade"]) {
      expect(narrowNamespaces(route, ALL_NAMESPACES)).toEqual(expect.arrayContaining(core))
    }
  })

  it("loads the pokedex data on the pokedex route", () => {
    expect(narrowNamespaces("/smartrotom/pokedex", ALL_NAMESPACES)).toContain(HEAVY)
  })

  it("loads forms.json on arcade — squirdle resolves species by name", () => {
    expect(narrowNamespaces("/smartrotom/arcade", ALL_NAMESPACES)).toContain(HEAVY)
  })

  it("matches nested routes under a scoped prefix", () => {
    expect(narrowNamespaces("/smartrotom/arcade/squirdle", ALL_NAMESPACES)).toContain(HEAVY)
    expect(narrowNamespaces("/smartrotom/pokedex/entrada/25", ALL_NAMESPACES)).toContain(HEAVY)
  })

  it("does not leak one app's namespace into another", () => {
    const rooker = narrowNamespaces("/smartrotom/rooker", ALL_NAMESPACES)
    expect(rooker).toContain("smartrotom/rooker.json")
    expect(rooker).not.toContain("smartrotom/wigglypop.json")
    expect(rooker).not.toContain(HEAVY)
  })

  it("preserves manifest order so the merge stays deterministic", () => {
    const loaded = narrowNamespaces("/smartrotom/pokedex", ALL_NAMESPACES)
    const expected = ALL_NAMESPACES.filter((ns) => loaded.includes(ns))
    expect(loaded).toEqual(expected)
  })

  it("actually reduces the payload on a typical page", () => {
    const all = narrowNamespaces("", ALL_NAMESPACES).length
    const typical = narrowNamespaces("/torneos", ALL_NAMESPACES).length
    expect(typical).toBeLessThan(all)
  })
})
