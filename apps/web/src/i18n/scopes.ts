import type { Namespace } from "./manifest.generated"

/**
 * The header carrying the request pathname. Set by `src/proxy.ts` — Next 16 renamed
 * the hook, so a `middleware.ts` here does NOT run and 404s every route (see
 * docs/I18N_PLAN.md §0). It stays absent on requests the proxy skips (static files,
 * `_next`), and `namespacesFor` then loads every namespace rather than guessing.
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
  // 50 KB, the largest single app namespace — 28 routes, self-contained.
  { prefix: "/smartrotom/gobierno", namespaces: ["smartrotom/gobierno.json"] },
  { prefix: "/smartrotom/furrettoday", namespaces: ["smartrotom/furrettoday.json"] },
  // misiones stays CORE: the styles showcase chapters (MsPrimitivasChapter,
  // MsTableroChapter) render its STATUS_LABEL_KEY copy from /smartrotom/styles,
  // so scoping it to /smartrotom/misiones blanks them. check:i18n catches this.
  // Entirely off /smartrotom, so no other route can reach it.
  { prefix: "/wingull", namespaces: ["wingull.json"] },
  // Only the download page uses it, and nothing links its copy from elsewhere.
  { prefix: "/launcher", namespaces: ["launcher.json"] },
  // bidkea (0.9 KB), liga (0.2 KB) and guias (65 B) stay CORE on purpose: an entry
  // here is only worth its config cost when the file is big enough to matter.
  // mewgenics is used from shared components (components/boffmedia/ui/mewgenics/) so it must be CORE
]

/**
 * DISABLED 2026-07-28 — narrowing is unsound while the provider lives in the root layout.
 *
 * `NextIntlClientProvider` is mounted in `app/layout.tsx` with `await getMessages()`.
 * The root layout is shared by every route and does NOT re-render on client-side
 * navigation, so the message set is frozen at whatever the ENTRY pathname resolved to.
 * Enter on `/smartrotom` (CORE only), then click through to `/smartrotom/rooker`, and
 * every `rooker.*` key is missing at once — the whole app renders MISSING_MESSAGE.
 * A direct load of the same URL works, which is why curl probes all looked green.
 *
 * Re-enabling requires the provider to re-render per route — move it into a
 * per-segment layout (or pass messages per route) FIRST, then flip this to true and
 * verify by CLIENT-SIDE NAVIGATION, not by loading the URL directly.
 *
 * Until then every namespace loads on every request: the pre-2026-07-27 behaviour.
 * Costs bytes (~630 KB vs 169 KB on a typical page), never correctness.
 */
const SCOPING_ENABLED = false

/**
 * Namespaces to load for a pathname: CORE plus anything scoped to it.
 *
 * An empty pathname means the proxy did not run (it is the only source of the
 * URL here). That must load EVERYTHING — narrowing on an unknown route would
 * blank out exactly the scoped pages. Heavier, never broken.
 */
export function namespacesFor(
  pathname: string,
  all: readonly Namespace[],
): Namespace[] {
  if (!SCOPING_ENABLED) return [...all]
  return narrowNamespaces(pathname, all)
}

/**
 * The narrowing itself, independent of {@link SCOPING_ENABLED}. Exported so the
 * behaviour stays under test while scoping is off — the logic is correct, it is the
 * root-layout provider that cannot deliver it. Do not call this directly.
 */
export function narrowNamespaces(
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
