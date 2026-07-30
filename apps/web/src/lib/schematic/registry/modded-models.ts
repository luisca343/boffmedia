/**
 * Lazy geometry resolver for MODDED Minecraft blocks, read straight out of the
 * instance's mod JARs.
 *
 * Modded blocks used to render as a flat cube with one representative texture:
 * the full asset chain (blockstate → model + parents → per-face textures) was
 * only implemented for vanilla ids, against the CDN mirror. That chain is
 * game-agnostic, so all that is missing for a mod is an {@link AssetProvider}
 * over its JAR — this module supplies one per namespace and drives the same
 * `resolveBlockModel` the vanilla path uses.
 *
 * Two constraints shape everything here:
 *
 *  - **Memory.** A real instance is ~70 mod JARs. None may be loaded into
 *    memory to answer "which mods are in here": only ZIP *central directories*
 *    are read (a few KB per JAR, via `File.slice()`), and a JAR's entry index is
 *    built only once one of its blocks is actually rendered.
 *  - **Textures.** `AssetProvider.textureCandidates` is synchronous, but pulling
 *    a PNG out of a ZIP is not. So textures are not resolved during compilation
 *    at all; the compiled model's texture refs are rewritten afterwards into
 *    already-loadable srcs (data URL from the JAR, or a vanilla CDN URL). This is
 *    exactly what the Hytale resolver does, and it is why the render hook can
 *    treat a worker-compiled model's refs as srcs verbatim.
 */

import { readZipEntries, extractZipEntry, type ZipEntry } from "../parsers/zip-central";
import { resolveBlockModel } from "../model/resolve";
import { createJarProvider, type JarAssetReader } from "../model/providers/jar-provider";
import { vanillaTextureUrl } from "../textures/blockTexture";
import type { CompiledGroup, CompiledModel } from "../model/types";

const BLOCKSTATE_NS_RE = /^assets\/([^/]+)\/blockstates\/.+\.json$/i;

/**
 * Namespaces a JAR declares blocks for, derived from its `assets/<ns>/blockstates/`
 * entries. A JAR's mod id is not a reliable namespace (a mod can ship several,
 * and the file name is not the id at all), so the asset tree is the source.
 */
export function namespacesFromEntryNames(names: string[]): string[] {
  const out = new Set<string>();
  for (const name of names) {
    const m = BLOCKSTATE_NS_RE.exec(name);
    // `minecraft` is served far better by the CDN provider (a mod overriding a
    // vanilla blockstate must not capture every vanilla block in the schematic).
    if (m && m[1].toLowerCase() !== "minecraft") out.add(m[1].toLowerCase());
  }
  return [...out];
}

/** Split "ns:path" → [ns, path]; bare refs default to the minecraft namespace. */
function splitRef(ref: string): [string, string] {
  const i = ref.indexOf(":");
  return i === -1 ? ["minecraft", ref] : [ref.slice(0, i), ref.slice(i + 1)];
}

function toBase64(bytes: Uint8Array): string {
  // Chunked: `String.fromCharCode(...bytes)` blows the argument limit on a
  // texture of any real size.
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/**
 * Replace every group's `textureRef` with a src the UI can load directly, using
 * `resolveSrc`. A group whose texture resolves to nothing keeps a null ref — the
 * renderer draws it untextured rather than dropping the geometry, so a block with
 * one missing face still shows its real shape.
 *
 * Exported for tests: this is the whole indirection that lets an async texture
 * source feed a synchronous provider interface.
 */
export async function rewriteCompiledTextures(
  compiled: CompiledModel,
  resolveSrc: (ref: string) => Promise<string | null>,
): Promise<CompiledModel> {
  const groups: CompiledGroup[] = [];
  for (const group of compiled.groups) {
    const ref = group.textureRef;
    groups.push({ ...group, textureRef: ref ? await resolveSrc(ref) : null });
  }
  return { ...compiled, groups };
}

/** Resolver signature matching `BlockRegistry.getModelForStates`. */
export type ModdedModelResolver = (
  blockId: string,
  states: Record<string, string>,
) => Promise<CompiledModel | null>;

interface JarSource {
  file: File;
  /** Lowercased entry path -> central-directory record. Built on first use. */
  index?: Map<string, ZipEntry>;
}

/**
 * Build the on-demand modded-model resolver for a scanned instance. Never
 * throws and never rejects: any failure returns `null` so the caller keeps the
 * textured-cube fallback.
 */
export function createModdedModelResolver(
  jarFiles: File[],
  version: string | undefined,
): ModdedModelResolver {
  /** namespace -> the JAR declaring it. Discovered once, on the first request. */
  let discovery: Promise<Map<string, JarSource>> | null = null;
  const providers = new Map<string, JarAssetReader | null>();
  const pngCache = new Map<string, Promise<string | null>>();

  function discover(): Promise<Map<string, JarSource>> {
    if (!discovery) {
      discovery = (async () => {
        const map = new Map<string, JarSource>();
        for (const file of jarFiles) {
          try {
            const names = (await readZipEntries(file)).map((e) => e.name);
            // First JAR to declare a namespace owns it; a duplicate is a
            // shaded/duplicated mod, not a second half of the same asset tree.
            for (const ns of namespacesFromEntryNames(names)) {
              if (!map.has(ns)) map.set(ns, { file });
            }
          } catch {
            // Corrupt JAR — its blocks keep the cube fallback, the rest still work.
          }
        }
        return map;
      })();
    }
    return discovery;
  }

  async function indexOf(source: JarSource): Promise<Map<string, ZipEntry>> {
    if (!source.index) {
      const index = new Map<string, ZipEntry>();
      for (const entry of await readZipEntries(source.file)) {
        index.set(entry.name.toLowerCase(), entry);
      }
      source.index = index;
    }
    return source.index;
  }

  /** The per-namespace reader, kept for the resolver's lifetime once opened. */
  async function readerFor(ns: string): Promise<JarAssetReader | null> {
    const cached = providers.get(ns);
    if (cached !== undefined) return cached;

    const source = (await discover()).get(ns);
    let reader: JarAssetReader | null = null;
    if (source) {
      try {
        const index = await indexOf(source);
        reader = {
          async readJson(path: string): Promise<unknown | null> {
            const entry = index.get(path.toLowerCase());
            if (!entry) return null;
            try {
              const bytes = await extractZipEntry(source.file, entry);
              return JSON.parse(new TextDecoder().decode(bytes));
            } catch {
              return null;
            }
          },
        };
      } catch {
        reader = null;
      }
    }
    providers.set(ns, reader);
    return reader;
  }

  async function textureSrc(ns: string, ref: string): Promise<string | null> {
    const [texNs, texPath] = splitRef(ref);
    const path = `assets/${texNs}/textures/${texPath}.png`;
    const cached = pngCache.get(path);
    if (cached) return cached;

    const pending = (async (): Promise<string | null> => {
      // The texture may live in a different mod's JAR than the block (a mod
      // reusing another's material), so look it up by the ref's own namespace
      // and only then in the block's JAR.
      const owner = (await readerFor(texNs)) ? texNs : ns;
      const source = (await discover()).get(owner);
      const entry = source ? (await indexOf(source)).get(path.toLowerCase()) : undefined;
      if (!entry || !source) {
        // A modded block whose model points at a VANILLA texture (a modded stair
        // of a vanilla material). That PNG ships in the client jar, not here.
        return texNs === "minecraft" ? vanillaTextureUrl(texPath, version) : null;
      }
      try {
        const bytes = await extractZipEntry(source.file, entry);
        return `data:image/png;base64,${toBase64(bytes)}`;
      } catch {
        return null;
      }
    })();
    // Memoized per texture path: many blocks in a JAR share a texture, and JS
    // strings are shared by reference, so the dedupe costs nothing to hold.
    pngCache.set(path, pending);
    return pending;
  }

  return async function getModelForStates(blockId, states) {
    try {
      const [ns] = splitRef(blockId);
      const reader = await readerFor(ns);
      if (!reader) return null;
      const provider = createJarProvider(reader, version);
      // `resolveBlockModel` keys its cache on `version|blockId|states`, and a
      // modded block id is namespace-unique, so sharing that cache across JARs
      // is safe.
      const compiled = await resolveBlockModel(blockId, states, version, provider);
      if (compiled.empty) return null;
      return await rewriteCompiledTextures(compiled, (ref) => textureSrc(ns, ref));
    } catch {
      return null;
    }
  };
}
