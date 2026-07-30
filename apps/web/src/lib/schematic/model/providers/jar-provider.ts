/**
 * {@link AssetProvider} backed by ONE mod JAR, with the vanilla CDN as fallback.
 *
 * A modded block's asset chain is rarely self-contained: the blockstate and the
 * child model live in the mod's JAR, but the `parent` is usually vanilla
 * (`block/cube_all`, `block/stairs`), and the textures a modded stair reuses may
 * be vanilla too. So every lookup tries the JAR first and delegates the miss to
 * a CDN provider — that fallback is what makes the chain resolvable at all, not
 * a nicety.
 *
 * Blockstate JSON is returned exactly as it sits in the JAR: `resolveModelRefs`
 * dispatches Forge v1 (`forge_marker`/`defaults`/`variants`-by-property) before
 * the vanilla shapes, so there is nothing to convert here.
 */

import type { AssetProvider, Blockstate, RawModel } from "../types";
import { createCdnProvider } from "./cdn-provider";

/**
 * Case-insensitive reader over one JAR. Forge lowercases resource paths at build
 * time while the JSON referencing them keeps its original casing, so the
 * implementation is expected to retry lowercased (see `JarIndex` in
 * `registry/texture-resolver.ts`).
 */
export interface JarAssetReader {
  /** Parsed JSON at `path`, or null when the JAR has no such entry / it is unparsable. */
  readJson(path: string): Promise<unknown | null>;
}

/** Split "ns:path" → [ns, path]; bare refs default to the minecraft namespace. */
function splitRef(ref: string): [string, string] {
  const i = ref.indexOf(":");
  return i === -1 ? ["minecraft", ref] : [ref.slice(0, i), ref.slice(i + 1)];
}

/**
 * Model paths to try for one ref, in order. Pre-1.13 blockstates name models
 * relative to `models/block/`, and that ref may itself contain folders
 * (`dawnoftimebuilder:japanese/grey_roof_tiles` ships as
 * `models/block/japanese/grey_roof_tiles.json`). The ref as written is always
 * tried first so a modern path can never be shadowed by the retry.
 */
function modelPaths(ns: string, path: string): string[] {
  const rooted = path.startsWith("block/") || path.startsWith("item/");
  const direct = `assets/${ns}/models/${path}.json`;
  return rooted ? [direct] : [direct, `assets/${ns}/models/block/${path}.json`];
}

export function createJarProvider(reader: JarAssetReader, version: string | undefined): AssetProvider {
  const cdn = createCdnProvider(version);

  return {
    async getBlockstate(name: string): Promise<Blockstate | null> {
      const [ns, path] = splitRef(name);
      const json = await reader.readJson(`assets/${ns}/blockstates/${path}.json`);
      // A mod may re-declare a vanilla block (an override pack); the JAR still wins.
      return (json as Blockstate | null) ?? cdn.getBlockstate(name);
    },

    async getModel(ref: string): Promise<RawModel | null> {
      const [ns, path] = splitRef(ref);
      for (const candidate of modelPaths(ns, path)) {
        const json = await reader.readJson(candidate);
        if (json) return json as RawModel;
      }
      // Modded models legitimately parent to vanilla ones — without this the
      // chain stops at the child and no geometry is ever produced.
      return cdn.getModel(ref);
    },

    // Reading a PNG out of a ZIP is async and this hook is not, so JAR textures
    // cannot be resolved here. The caller rewrites the compiled model's texture
    // refs into loadable srcs instead (see `registry/modded-models.ts`); what is
    // left for this hook is the vanilla refs, which are plain CDN URLs.
    textureCandidates(ref: string): string[] {
      return cdn.textureCandidates(ref);
    },

    // No `adaptStates`: a mod's assets are keyed by the very ids the loader
    // emits for its blocks. Only the pre-flattening vanilla tree disagrees.
  };
}
