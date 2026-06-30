/**
 * {@link AssetProvider} backed by the jsDelivr mirror of
 * `InventivetalentDev/minecraft-assets` — the same source the 3D viewer already
 * uses for vanilla textures. Reads blockstate + model JSON and resolves texture
 * refs to CDN URLs.
 *
 * The `fetch` here is an external static-asset read (permitted by the repo's
 * web-network policy as a media/asset exception), localized to this module.
 */

import type { AssetProvider, Blockstate, RawModel } from "../types";
import { normalizeTextureVersion, LATEST_TEXTURE_REF } from "../../textures/blockTexture";

const CDN_BASE = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@";

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

export function createCdnProvider(version: string | undefined): AssetProvider {
  const primary = normalizeTextureVersion(version);
  // Try the snapped version first, then the newest ref — so a block missing from
  // the snapped version (renamed/added later, or a bad version string snapping to
  // an old ref) still resolves instead of vanishing. See blockTexture.ts.
  const refs = primary === LATEST_TEXTURE_REF ? [primary] : [primary, LATEST_TEXTURE_REF];

  async function firstJson(kind: string, ns: string, path: string): Promise<unknown | null> {
    for (const ref of refs) {
      const data = await fetchJson(`${CDN_BASE}${ref}/assets/${ns}/${kind}/${path}.json`);
      if (data) return data;
    }
    return null;
  }

  return {
    async getBlockstate(name: string): Promise<Blockstate | null> {
      const [ns, path] = splitRef(name);
      return (await firstJson("blockstates", ns, path)) as Blockstate | null;
    },
    async getModel(modelRef: string): Promise<RawModel | null> {
      const [ns, path] = splitRef(modelRef);
      return (await firstJson("models", ns, path)) as RawModel | null;
    },
    textureCandidates(textureRef: string): string[] {
      const [ns, path] = splitRef(textureRef);
      return refs.map((ref) => `${CDN_BASE}${ref}/assets/${ns}/textures/${path}.png`);
    },
  };
}
