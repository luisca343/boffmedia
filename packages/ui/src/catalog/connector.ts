import { bestFile, getCatalog } from "./client"
import type { CatalogLoader, ModFile, ModSearchHit } from "./types"

// Sinytra Connector runs Fabric mods on NeoForge (on Forge for 1.20.1), which
// is what lets a NeoForge pack browse and install Fabric-only mods. Everything
// here is the Modrinth half of that: which packs qualify, which hits arrived
// via Connector, and which projects must be swapped for a forgified twin.
//
// CurseForge is deliberately out of scope. Its search has no loader facet that
// ORs, and the launcher only ever speaks to Modrinth anyway — a CurseForge
// browse simply never turns this on.

/** Verified against the live Modrinth API, not guessed: these three ids are
 *  load-bearing and a typo would fail as "no results" rather than as an error. */
export const CONNECTOR_PROJECT_ID = "u58R1TMW"
export const FABRIC_API_PROJECT_ID = "P7dR8mSH"
export const FORGIFIED_FABRIC_API_PROJECT_ID = "Aqlf1Shp"

/** Loaders Connector can host Fabric mods ON. Not a version table — which of
 *  these applies to a given Minecraft version is asked of Modrinth, because
 *  Connector is Forge on 1.20.1 and NeoForge from 1.21 up, and hard-coding
 *  that split is how the 1.20.1 case silently stops working. */
const HOST_LOADERS: readonly CatalogLoader[] = ["neoforge", "forge"]

/** Modrinth files loaders as ordinary categories, so a search hit's
 *  `categories` already carries them — no extra round trip to learn that
 *  `sodium` is dual-loader and `modmenu` is not. */
const LOADER_CATEGORIES = new Set<string>(["forge", "neoforge", "fabric", "quilt"])

/** Fabric projects with a NeoForge-native twin that MUST be used instead. Adding
 *  the Fabric original to a Connector pack is not a degraded experience, it is a
 *  pack that does not boot — Connector explicitly refuses to load Fabric API and
 *  expects the forgified build to provide those hooks.
 *
 *  Seeded with the one substitution confirmed against Modrinth. Most other common
 *  Fabric libraries (Architectury, Cloth Config…) publish their own NeoForge
 *  builds and so need no entry: the OR'd search returns their native jar and the
 *  loader match below picks it. Add here only what is verified, never guessed —
 *  a wrong mapping installs the wrong jar with full confidence. */
const SUBSTITUTIONS: Record<string, string> = {
  [FABRIC_API_PROJECT_ID]: FORGIFIED_FABRIC_API_PROJECT_ID,
}

/** The loaders a hit actually publishes for, read off the categories Modrinth
 *  already sent. Empty for a CurseForge hit, whose categories are real
 *  categories — which is fine, because Connector mode never turns on there. */
export function hitLoaders(hit: Pick<ModSearchHit, "categories">): CatalogLoader[] {
  return (hit.categories ?? []).filter((c): c is CatalogLoader => LOADER_CATEGORIES.has(c))
}

export function supportsLoader(
  hit: Pick<ModSearchHit, "categories">,
  loader: CatalogLoader,
): boolean {
  return hitLoaders(hit).includes(loader)
}

/** True when this hit is only reachable because Connector is on: it does not
 *  publish the pack's own loader, but it does publish Fabric.
 *
 *  Derived from the project's loaders rather than from "the search had Fabric
 *  enabled", because most popular mods are dual-loader — sodium, iris, lithium
 *  and cloth-config all list fabric AND neoforge. Badging every result of a
 *  Connector-enabled search as Fabric would mislabel the majority of them. */
export function isViaConnector(
  hit: Pick<ModSearchHit, "categories" | "platform">,
  packLoader: CatalogLoader | undefined,
  connectorEnabled: boolean,
): boolean {
  if (!connectorEnabled || hit.platform !== "modrinth" || !packLoader) return false
  return !supportsLoader(hit, packLoader) && supportsLoader(hit, "fabric")
}

/** Which loader's file to actually install. The pack's own loader wins whenever
 *  the project offers it, so a dual-loader mod gets its native jar and Connector
 *  is never involved; Fabric is the fallback, not the preference. */
export function effectiveLoader(
  hit: Pick<ModSearchHit, "categories" | "platform">,
  packLoader: CatalogLoader | undefined,
  connectorEnabled: boolean,
): CatalogLoader | undefined {
  return isViaConnector(hit, packLoader, connectorEnabled) ? "fabric" : packLoader
}

/** The forgified replacement for a Fabric-only project, if one is required.
 *
 *  Applies to a direct pick as much as to a walked dependency: Fabric API ranks
 *  first in a Connector-enabled search for almost any query, so the likeliest
 *  way to break a pack is for someone to simply click it. */
export function connectorSubstitute(projectId: string): string | undefined {
  return SUBSTITUTIONS[projectId]
}

export interface ConnectorSupport {
  /** Whether this Minecraft/loader pair can run Connector at all. */
  available: boolean
  /** The Connector build for this pair, ready to add to the pack. */
  file?: ModFile
}

// One probe per Minecraft/loader pair for the life of the module. The promise
// itself is cached rather than its value, so the browser mounting and the host
// checking auto-add at the same moment share a single request instead of racing
// two.
const supportCache = new Map<string, Promise<ConnectorSupport>>()

/** Does Connector exist for this pack's Minecraft/loader pair?
 *
 *  Asked of Modrinth instead of answered from a table. Connector publishes a
 *  `forge` build for 1.20.1 and `neoforge` builds from 1.21 up; querying the
 *  real version list gets that right today and stays right when the next
 *  Minecraft version lands, with nothing to maintain here. */
export function connectorSupport(
  gameVersion: string,
  packLoader: CatalogLoader | undefined,
): Promise<ConnectorSupport> {
  const unsupported: ConnectorSupport = { available: false }
  if (!gameVersion || !packLoader || !HOST_LOADERS.includes(packLoader)) {
    return Promise.resolve(unsupported)
  }

  const key = `${gameVersion}:${packLoader}`
  const cached = supportCache.get(key)
  if (cached) return cached

  const probe = getCatalog()
    .files("modrinth", CONNECTOR_PROJECT_ID, { gameVersion, pageSize: 50 })
    .then((files) => {
      // Deliberately NOT filtered by loader in the request: we need to see which
      // loaders this Minecraft version offers in order to answer the question,
      // and a server-side filter would return an empty list indistinguishable
      // from "Connector does not cover this version".
      const match = files.find((f) => f.loaders.includes(packLoader) && f.downloadable)
      return match ? { available: true, file: match } : unsupported
    })
    // A catalog that is down is not a pack that cannot use Connector, so the
    // failure is answered with "no" but NOT kept: caching it would turn one
    // momentary outage into a toggle that stays missing for the rest of the
    // session, with no way for the player to retry short of restarting.
    .catch(() => {
      supportCache.delete(key)
      return unsupported
    })

  supportCache.set(key, probe)
  return probe
}

/** Connector plus Forgified Fabric API — everything a pack needs before its
 *  first Fabric mod will load, resolved as installable files.
 *
 *  Both, not just Connector: Connector alone boots, then every Fabric mod that
 *  touches Fabric API crashes on a missing class. Shipping the pair is what makes
 *  "add a Fabric mod" actually work. */
export async function connectorCompanions(
  gameVersion: string,
  packLoader: CatalogLoader | undefined,
): Promise<{ projectId: string; file: ModFile }[]> {
  const support = await connectorSupport(gameVersion, packLoader)
  if (!support.available || !support.file) return []

  const ffapi = await getCatalog()
    .files("modrinth", FORGIFIED_FABRIC_API_PROJECT_ID, {
      gameVersion,
      loader: packLoader,
      pageSize: 20,
    })
    .then((files) => bestFile(files))
    .catch(() => undefined)

  const out = [{ projectId: CONNECTOR_PROJECT_ID, file: support.file }]
  if (ffapi) out.push({ projectId: FORGIFIED_FABRIC_API_PROJECT_ID, file: ffapi })
  return out
}
