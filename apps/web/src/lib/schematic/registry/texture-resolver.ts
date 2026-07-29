import type JSZip from "jszip";
import { forgeRepresentative, forgeVariantEntries, isForgeBlockstate } from "./forge-blockstate";
import { vanillaTextureUrl } from "../textures/blockTexture";

/**
 * Resolve a representative block texture out of a mod JAR.
 *
 * Minecraft renders a block through a chain of JSON: the blockstate picks a
 * *model*, the model (possibly via a `parent` chain) declares a `textures` map,
 * and each entry points at an `assets/<ns>/textures/<path>.png`. There is no
 * single "the block texture", so we resolve the chain far enough to pick one
 * representative face (preferring `side`/`all`/`top`) and pull that PNG out as a
 * data URL. Parent models that live in the vanilla client (not in the mod JAR)
 * are simply skipped — simple blocks carry their real texture refs on the child
 * model, which is what we need.
 *
 * Model lookups are scoped to this JAR's ZIP, but the resolved *texture* may
 * still be a vanilla one (a modded wall of a vanilla material), in which case
 * the PNG is not here to extract and a CDN URL is returned instead.
 */

interface ModelJson {
  parent?: string;
  textures?: Record<string, string>;
}

interface BlockstateJson {
  variants?: Record<string, unknown>;
  multipart?: Array<{ apply?: unknown }>;
}

/**
 * Case-insensitive path index for one JAR (lowercased path -> real path).
 *
 * Forge lowercases resource paths at build time while the JSON that references
 * them keeps its original casing — Mekanism asks for `blocks/OsmiumOre` and
 * ships `blocks/osmiumore.png`. An exact ZIP lookup therefore misses on a whole
 * class of mods, so misses are retried through this index.
 */
export type JarIndex = Map<string, string>;

function fileAt(zip: JSZip, path: string, index?: JarIndex): JSZip.JSZipObject | null {
  return zip.file(path) ?? (index ? (zip.file(index.get(path.toLowerCase()) ?? "") ?? null) : null);
}

/** Split a resource ref ("ns:block/foo" | "block/foo") into [namespace, path]. */
function splitRef(ref: string): [string, string] {
  const i = ref.indexOf(":");
  if (i === -1) return ["minecraft", ref];
  return [ref.slice(0, i), ref.slice(i + 1)];
}

/** Texture keys, in priority order, that best represent a block as a single tile. */
const TEXTURE_KEY_PRIORITY = [
  "side",
  "all",
  "texture",
  "cross",
  "top",
  "up",
  "front",
  "north",
  "0",
  "particle",
  "end",
  "pattern",
  "lantern",
  "torch",
];

async function loadModel(
  zip: JSZip,
  ref: string,
  index?: JarIndex,
): Promise<ModelJson | undefined> {
  const [ns, path] = splitRef(ref);
  // Pre-1.13 blockstates name models relative to `models/block/`, and that ref
  // may itself contain folders: Dawn of Time asks for
  // `dawnoftimebuilder:japanese/grey_roof_tiles` and ships
  // `models/block/japanese/grey_roof_tiles.json`. So the `block/` retry applies
  // to any ref that isn't already rooted at block/ or item/ — restricting it to
  // slash-less refs (as before) missed every mod that groups models in
  // subfolders, which is most of them. The ref as written is still tried first
  // so a modern path can never be shadowed.
  const rooted = path.startsWith("block/") || path.startsWith("item/");
  const file =
    fileAt(zip, `assets/${ns}/models/${path}.json`, index) ??
    (rooted ? null : fileAt(zip, `assets/${ns}/models/block/${path}.json`, index));
  if (!file) return undefined;
  try {
    return JSON.parse(await file.async("string")) as ModelJson;
  } catch {
    return undefined;
  }
}

/** Merge a model's `textures` map with its parents' (child wins). Bounded depth. */
async function collectTextures(
  zip: JSZip,
  modelRef: string,
  index?: JarIndex,
  depth = 0,
): Promise<Record<string, string>> {
  if (depth > 6) return {};
  const model = await loadModel(zip, modelRef, index);
  if (!model) return {};
  const parent = model.parent ? await collectTextures(zip, model.parent, index, depth + 1) : {};
  return { ...parent, ...(model.textures ?? {}) };
}

/** Pick one concrete texture ref from a merged textures map, resolving `#refs`. */
function pickTexture(textures: Record<string, string>): string | undefined {
  const resolve = (value: string | undefined, seen = 0): string | undefined => {
    if (!value) return undefined;
    if (value.startsWith("#")) {
      if (seen > 6) return undefined;
      return resolve(textures[value.slice(1)], seen + 1);
    }
    return value;
  };

  for (const key of TEXTURE_KEY_PRIORITY) {
    if (key in textures) {
      const r = resolve(textures[key]);
      if (r) return r;
    }
  }
  for (const key of Object.keys(textures)) {
    const r = resolve(textures[key]);
    if (r) return r;
  }
  return undefined;
}

/** Pull the first model ref a blockstate references (first variant / first apply). */
function modelFromBlockstate(bs: BlockstateJson): string | undefined {
  if (bs.variants) {
    const firstKey = Object.keys(bs.variants)[0];
    let variant = bs.variants[firstKey] as unknown;
    if (Array.isArray(variant)) variant = variant[0];
    const model = (variant as { model?: string } | undefined)?.model;
    if (model) return model;
  }
  if (Array.isArray(bs.multipart)) {
    for (const part of bs.multipart) {
      let apply = part.apply as unknown;
      if (Array.isArray(apply)) apply = apply[0];
      const model = (apply as { model?: string } | undefined)?.model;
      if (model) return model;
    }
  }
  return undefined;
}

/**
 * Resolve a block's representative texture, given its already-parsed blockstate
 * JSON: a `data:image/png;base64,…` URL when the PNG is in this JAR, a CDN URL
 * when the model points at a vanilla texture, `undefined` when neither the model
 * chain nor a texture ref resolves.
 *
 * `pngCache` (texture path → data URL) dedupes PNG reads across the many blocks
 * in a JAR that share a texture — and because JS strings are shared by reference,
 * blocks pointing at the same texture cost no extra memory.
 */
async function textureFor(
  zip: JSZip,
  modelRef: string | undefined,
  overrides: Record<string, string>,
  pngCache: Map<string, string>,
  version: string | undefined,
  index: JarIndex | undefined,
): Promise<string | undefined> {
  if (!modelRef && !Object.keys(overrides).length) return undefined;

  const inherited = modelRef ? await collectTextures(zip, modelRef, index) : {};
  const textures = { ...inherited, ...overrides };
  const textureRef = pickTexture(textures);
  if (!textureRef) return undefined;

  const [ns, path] = splitRef(textureRef);
  const pngPath = `assets/${ns}/textures/${path}.png`;

  const cached = pngCache.get(pngPath);
  if (cached) return cached;

  const file = fileAt(zip, pngPath, index);
  if (!file) {
    // A mod block whose model points at a VANILLA texture — a modded wall or
    // stair of a vanilla material reuses that material's PNG, which ships in the
    // client jar, not in this JAR. Common enough that treating it as
    // "no texture" leaves whole categories of mod blocks as blank placeholders.
    return ns === "minecraft" ? vanillaTextureUrl(path, version) : undefined;
  }
  const dataUrl = `data:image/png;base64,${await file.async("base64")}`;
  pngCache.set(pngPath, dataUrl);
  return dataUrl;
}

/**
 * One texture per declared variant, in order, for a Forge v1 blockstate —
 * indexed by pre-flattening metadata at render time. Returns `undefined` when
 * the block has fewer than two variants (nothing to disambiguate).
 */
export async function resolveVariantTextures(
  zip: JSZip,
  blockstate: BlockstateJson,
  pngCache: Map<string, string>,
  version?: string,
  index?: JarIndex,
): Promise<string[] | undefined> {
  if (!isForgeBlockstate(blockstate)) return undefined;
  const entries = forgeVariantEntries(blockstate);
  if (entries.length < 2) return undefined;

  const out: string[] = [];
  let resolved = 0;
  for (const entry of entries) {
    const url = await textureFor(zip, entry.model, entry.textures ?? {}, pngCache, version, index);
    out.push(url ?? "");
    if (url) resolved++;
  }
  return resolved > 0 ? out : undefined;
}

export async function resolveBlockTexture(
  zip: JSZip,
  blockstate: BlockstateJson,
  pngCache: Map<string, string>,
  version?: string,
  index?: JarIndex,
): Promise<string | undefined> {
  // Forge v1 usually points every variant at a shared vanilla parent
  // (`cube_all`) and declares the block's real textures beside it, so the
  // blockstate's own texture map has to override the model chain's.
  const forge = isForgeBlockstate(blockstate) ? forgeRepresentative(blockstate) : undefined;
  const modelRef = forge ? forge.model : modelFromBlockstate(blockstate);
  const overrides = forge?.textures ?? {};
  if (!modelRef && !Object.keys(overrides).length) return undefined;

  const inherited = modelRef ? await collectTextures(zip, modelRef, index) : {};
  const textures = { ...inherited, ...overrides };
  const textureRef = pickTexture(textures);
  if (!textureRef) return undefined;

  const [ns, path] = splitRef(textureRef);
  const pngPath = `assets/${ns}/textures/${path}.png`;

  const cached = pngCache.get(pngPath);
  if (cached) return cached;

  const file = fileAt(zip, pngPath, index);
  if (!file) {
    // A mod block whose model points at a VANILLA texture — a modded wall or
    // stair of a vanilla material reuses that material's PNG, which ships in the
    // client jar, not in this JAR. Common enough that treating it as
    // "no texture" leaves whole categories of mod blocks as blank placeholders.
    return ns === "minecraft" ? vanillaTextureUrl(path, version) : undefined;
  }
  const dataUrl = `data:image/png;base64,${await file.async("base64")}`;
  pngCache.set(pngPath, dataUrl);
  return dataUrl;
}
