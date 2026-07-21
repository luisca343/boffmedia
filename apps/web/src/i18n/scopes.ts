import type { Namespace } from "./manifest.generated"

/**
 * The header carrying the request pathname. NOTHING SETS IT TODAY — a Next 16
 * `middleware.ts` was tried and 404'd every route (Next 16 renamed the hook to
 * `proxy.ts`; see docs/I18N_PLAN.md §0). Until a proxy sets it, `namespacesFor`
 * sees no pathname and loads every namespace, which is the pre-2026-07-18
 * behaviour — correct, just not yet optimised.
 */
export const PATHNAME_HEADER = "x-pathname"

/**
 * Namespaces loaded only under a matching URL prefix. Everything not listed here is
 * CORE — loaded on every request. That default is deliberate: a new locale file joins
 * CORE automatically, so forgetting to scope it costs bytes, never missing keys.
 *
 * `pnpm check:i18n` verifies that every namespace a route actually uses is reachable
 * from that route, so a bad entry here fails CI instead of blanking the UI.
 *
 * Route-group segments in parentheses are NOT part of the URL — match real pathnames.
 */
export const SCOPED_NAMESPACES: ReadonlyArray<{
  prefix: string
  namespaces: readonly Namespace[]
}> = [
  {
    // 425 KB of Pokémon data — 69% of what every page used to ship.
    prefix: "/smartrotom/pokedex",
    namespaces: [
      "smartrotom/pokedex/abilities.json",
      "smartrotom/pokedex/forms.json",
      "smartrotom/pokedex/moves.json",
      "smartrotom/pokedex/spawns.json",
    ],
  },
  {
    // Squirdle guesses species by name — `pixelmon_*`/`form_*` live in forms.json,
    // not in the CORE pokedex/common.json that only carries `type_*`.
    prefix: "/smartrotom/arcade",
    namespaces: ["smartrotom/pokedex/forms.json"],
  },
  { prefix: "/smartrotom/rooker", namespaces: ["smartrotom/rooker.json"] },
  { prefix: "/smartrotom/wigglypop", namespaces: ["smartrotom/wigglypop.json"] },
  { prefix: "/smartrotom/pasaporte", namespaces: ["smartrotom/pasaporte.json"] },
  { prefix: "/otros/mewgenics", namespaces: ["smartrotom/mewgenics.json"] },
]

/**
 * Namespaces to load for a pathname: CORE plus anything scoped to it.
 *
 * An empty pathname means middleware did not run (it is the only source of the
 * URL here). That must load EVERYTHING — narrowing on an unknown route would
 * blank out exactly the scoped pages. Heavier, never broken.
 */
export function namespacesFor(
  pathname: string,
  all: readonly Namespace[],
): Namespace[] {
  if (!pathname) return [...all]

  const scoped = new Set(SCOPED_NAMESPACES.flatMap((s) => s.namespaces))
  const active = SCOPED_NAMESPACES.filter((s) => pathname.startsWith(s.prefix)).flatMap(
    (s) => s.namespaces,
  )
  return all.filter((ns) => !scoped.has(ns) || active.includes(ns))
}
