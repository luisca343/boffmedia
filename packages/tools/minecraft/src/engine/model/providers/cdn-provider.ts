/**
 * {@link AssetProvider} backed by the jsDelivr mirror of
 * `InventivetalentDev/minecraft-assets` — the same source the 3D viewer already
 * uses for vanilla textures. Reads blockstate + model JSON and resolves texture
 * refs to CDN URLs.
 *
 * The `fetch` here is an external static-asset read (permitted by the repo's
 * web-network policy as a media/asset exception), localized to this module. It
 * is also the `connect-src` half of the launcher CSP coupling noted at
 * {@link CDN_BASE} — the origin itself is defined there, not here.
 */

import type { AssetProvider, Blockstate, RawModel } from "../types";
import { CDN_BASE, normalizeTextureVersion, LATEST_TEXTURE_REF } from "../../textures/blockTexture";
import { adaptToLegacyAssets } from "../legacy-compat";
import legacyAssets from "./1.12-assets.json";

/** The one mirror ref that predates the flattening; see `1.12-assets.json`. */
const LEGACY_REF: string = legacyAssets.ref;
const LEGACY_ALIASES = legacyAssets.aliases as Record<string, string>;

/** Split "ns:path" → [ns, path]; bare refs default to the minecraft namespace. */
function splitRef(ref: string): [string, string] {
  const i = ref.indexOf(":");
  return i === -1 ? ["minecraft", ref] : [ref.slice(0, i), ref.slice(i + 1)];
}

// Module-level JSON cache (keyed by full URL) — each asset crosses the network once.
const jsonCache = new Map<string, Promise<unknown | null>>();

function fetchJson(url: string): Promise<unknown | null> {
  let pending = jsonCache.get(url);
  if (pending) return pending;
  // External asset read (CDN) — not a backend API call. See web-network policy.
  pending = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  jsonCache.set(url, pending);
  return pending;
}

/**
 * Candidate paths for one asset under one ref, in priority order — the ref as
 * written always comes first, so a modern path can never be shadowed.
 *
 * Pre-1.13 needs two adjustments. Blockstate names: the legacy loader emits
 * *modern* block ids, and while the mirror's 1.12 tree is largely flattened
 * too, some files kept their old name (`grass_block` is `grass.json`) — the
 * generated alias table covers exactly those, and only where the mapping is
 * unambiguous. Model refs: 1.12 blockstates name models relative to
 * `models/block/` ("red_wool") where modern ones spell the folder out
 * ("minecraft:block/red_wool").
 */
function pathsFor(kind: string, ref: string, id: string, path: string): string[] {
  if (ref !== LEGACY_REF) return [path];
  if (kind === "blockstates") {
    const alias = LEGACY_ALIASES[id];
    return alias ? [path, alias] : [path];
  }
  return path.includes("/") ? [path] : [path, `block/${path}`];
}

export function createCdnProvider(version: string | undefined): AssetProvider {
  const primary = normalizeTextureVersion(version);
  // Try the snapped version first, then the newest ref — so a block missing from
  // the snapped version (renamed/added later, or a bad version string snapping to
  // an old ref) still resolves instead of vanishing. See blockTexture.ts.
  const refs = primary === LATEST_TEXTURE_REF ? [primary] : [primary, LATEST_TEXTURE_REF];

  async function firstJson(kind: string, id: string): Promise<unknown | null> {
    const [ns, path] = splitRef(id);
    const qualified = id.includes(":") ? id : `minecraft:${id}`;
    for (const ref of refs) {
      for (const candidate of pathsFor(kind, ref, qualified, path)) {
        const data = await fetchJson(`${CDN_BASE}${ref}/assets/${ns}/${kind}/${candidate}.json`);
        if (data) return data;
      }
    }
    return null;
  }

  return {
    async getBlockstate(name: string): Promise<Blockstate | null> {
      return (await firstJson("blockstates", name)) as Blockstate | null;
    },
    async getModel(modelRef: string): Promise<RawModel | null> {
      return (await firstJson("models", modelRef)) as RawModel | null;
    },
    textureCandidates(textureRef: string): string[] {
      const [ns, path] = splitRef(textureRef);
      return refs.map((ref) => `${CDN_BASE}${ref}/assets/${ns}/textures/${path}.png`);
    },
    // Only the pre-flattening tree disagrees with the loader's modern ids.
    adaptStates: primary === LEGACY_REF ? adaptToLegacyAssets : undefined,
  };
}
