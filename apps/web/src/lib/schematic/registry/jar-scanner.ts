import JSZip from "jszip";
import type { BlockDefinition, ModInfo } from "../types";
import { parseBlockstateJson } from "./blockstate-parser";
import { resolveBlockTexture, resolveVariantTextures, type JarIndex } from "./texture-resolver";

export interface ScannedJar {
  mod?: ModInfo;
  blocks: Map<string, BlockDefinition>;
  /** tag id ("ns:path") -> member block ids */
  tags: Map<string, string[]>;
  /** block id -> representative texture: a `data:` URL from this JAR, or a
   *  CDN URL when the block's model reuses a vanilla texture. */
  textures: Map<string, string>;
  /** block id -> one texture per declared variant, indexed by legacy metadata. */
  variantTextures: Map<string, string[]>;
}

const BLOCKSTATE_RE = /^assets\/([^/]+)\/blockstates\/(.+)\.json$/;
// 1.21 renamed the tag folder `blocks` -> `block`; accept either.
const TAG_RE = /^data\/([^/]+)\/tags\/blocks?\/(.+)\.json$/;

/** Pull the first value of a `key="value"` (or `key='value'`) entry from TOML text. */
function tomlField(text: string, key: string): string | undefined {
  const m = text.match(new RegExp(`${key}\\s*=\\s*["']([^"']+)["']`));
  return m?.[1];
}

async function readModInfo(zip: JSZip, loader: ModInfo["loader"], path: string): Promise<ModInfo | undefined> {
  const entry = zip.file(path);
  if (!entry) return undefined;
  const text = await entry.async("string");

  if (path === "mcmod.info") {
    // Forge ≤ 1.12: a JSON *array* of mod entries (or `{modListVersion, modList}`).
    // Only the first entry identifies the JAR; the rest are bundled sub-mods.
    try {
      const data = JSON.parse(text);
      const list = Array.isArray(data) ? data : data?.modList;
      const first = Array.isArray(list) ? list[0] : undefined;
      const id = first?.modid;
      if (id) {
        return { id, name: first.name ?? id, version: first.version ?? "0", loader };
      }
    } catch {
      /* malformed metadata — fall through */
    }
    return undefined;
  }

  if (path.endsWith(".json")) {
    // fabric.mod.json / quilt.mod.json
    try {
      const data = JSON.parse(text);
      const quilt = data.quilt_loader;
      const id = quilt?.id ?? data.id;
      const name = quilt?.metadata?.name ?? data.name ?? id;
      const version = quilt?.version ?? data.version ?? "0";
      if (id) return { id, name, version, loader };
    } catch {
      /* malformed metadata — fall through */
    }
    return undefined;
  }

  // mods.toml / neoforge.mods.toml
  const id = tomlField(text, "modId");
  if (!id) return undefined;
  return {
    id,
    name: tomlField(text, "displayName") ?? id,
    version: tomlField(text, "version") ?? "0",
    loader,
  };
}

/** Read mod identity from whichever loader-specific metadata file the JAR carries. */
async function detectMod(zip: JSZip): Promise<ModInfo | undefined> {
  return (
    (await readModInfo(zip, "neoforge", "META-INF/neoforge.mods.toml")) ??
    (await readModInfo(zip, "forge", "META-INF/mods.toml")) ??
    (await readModInfo(zip, "fabric", "fabric.mod.json")) ??
    (await readModInfo(zip, "fabric", "quilt.mod.json")) ??
    // Forge ≤ 1.12 predates mods.toml; without this every 1.12 JAR scans as an
    // anonymous mod (its blocks still register — those key off asset paths).
    (await readModInfo(zip, "forge", "mcmod.info"))
  );
}

/**
 * Scan one mod JAR (a ZIP) for its block definitions and block tags.
 *
 * Blocks are keyed `<namespace>:<name>` from the `assets/<ns>/blockstates/*.json`
 * paths, so a JAR that ships assets for several namespaces is handled correctly
 * regardless of its declared mod id.
 *
 * `version` is the instance's game version; it only matters for blocks whose
 * model reuses a vanilla texture, which is sourced per-version from the CDN.
 */
export async function scanJar(file: File, version?: string): Promise<ScannedJar> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const blocks = new Map<string, BlockDefinition>();
  const tags = new Map<string, string[]>();
  const textures = new Map<string, string>();
  const variantTextures = new Map<string, string[]>();
  // texture file path -> data URL; dedupes PNG reads/encodes within this JAR.
  const pngCache = new Map<string, string>();

  const mod = await detectMod(zip);

  // Lowercased path -> real path, for refs whose casing differs from the file's
  // (see JarIndex). Built during the single pass we already make over the ZIP.
  const index: JarIndex = new Map();

  const jobs: Promise<void>[] = [];
  zip.forEach((relPath, entry) => {
    if (entry.dir) return;
    index.set(relPath.toLowerCase(), relPath);

    const bs = relPath.match(BLOCKSTATE_RE);
    if (bs) {
      const id = `${bs[1]}:${bs[2]}`;
      jobs.push(
        entry.async("string").then(async (text) => {
          let json: unknown;
          try {
            json = JSON.parse(text);
            blocks.set(id, parseBlockstateJson(id, json as never));
          } catch {
            // Unparseable blockstate — register the block with no states so it
            // still counts as present in this environment.
            blocks.set(id, { id, validStates: {}, defaultState: {}, tags: [] });
            return;
          }
          // Resolve a representative texture from the model chain (best-effort).
          try {
            const dataUrl = await resolveBlockTexture(zip, json as never, pngCache, version, index);
            if (dataUrl) textures.set(id, dataUrl);
            // Multi-variant blocks additionally keep a per-variant list, so a
            // pre-flattening `id:meta` can pick its own colour instead of
            // everything sharing variant 0's texture.
            const variants = await resolveVariantTextures(zip, json as never, pngCache, version, index);
            if (variants) variantTextures.set(id, variants);
          } catch {
            /* texture resolution is non-essential — skip on any failure */
          }
        })
      );
      return;
    }

    const tag = relPath.match(TAG_RE);
    if (tag) {
      const tagId = `${tag[1]}:${tag[2]}`;
      jobs.push(
        entry.async("string").then((text) => {
          try {
            const data = JSON.parse(text) as { values?: Array<string | { id?: string }> };
            const members = (data.values ?? [])
              .map((v) => (typeof v === "string" ? v : v?.id))
              .filter((v): v is string => typeof v === "string" && !v.startsWith("#"));
            if (members.length) tags.set(tagId, [...(tags.get(tagId) ?? []), ...members]);
          } catch {
            /* skip malformed tag file */
          }
        })
      );
    }
  });

  await Promise.all(jobs);
  return { mod, blocks, tags, textures, variantTextures };
}
