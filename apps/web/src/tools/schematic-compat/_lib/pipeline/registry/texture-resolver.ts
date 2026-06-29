import type JSZip from "jszip";

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
 * All lookups are scoped to a single JAR's ZIP; cross-JAR/vanilla parents resolve
 * to nothing, which is fine (those blocks fall back to a colored placeholder).
 */

interface ModelJson {
  parent?: string;
  textures?: Record<string, string>;
}

interface BlockstateJson {
  variants?: Record<string, unknown>;
  multipart?: Array<{ apply?: unknown }>;
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

async function loadModel(zip: JSZip, ref: string): Promise<ModelJson | undefined> {
  const [ns, path] = splitRef(ref);
  const file = zip.file(`assets/${ns}/models/${path}.json`);
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
  depth = 0,
): Promise<Record<string, string>> {
  if (depth > 6) return {};
  const model = await loadModel(zip, modelRef);
  if (!model) return {};
  const parent = model.parent ? await collectTextures(zip, model.parent, depth + 1) : {};
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
 * Resolve a block's representative texture to a `data:image/png;base64,…` URL,
 * given its already-parsed blockstate JSON. Returns `undefined` when the model
 * chain, texture ref, or PNG can't be resolved inside this JAR.
 *
 * `pngCache` (texture path → data URL) dedupes PNG reads across the many blocks
 * in a JAR that share a texture — and because JS strings are shared by reference,
 * blocks pointing at the same texture cost no extra memory.
 */
export async function resolveBlockTexture(
  zip: JSZip,
  blockstate: BlockstateJson,
  pngCache: Map<string, string>,
): Promise<string | undefined> {
  const modelRef = modelFromBlockstate(blockstate);
  if (!modelRef) return undefined;

  const textures = await collectTextures(zip, modelRef);
  const textureRef = pickTexture(textures);
  if (!textureRef) return undefined;

  const [ns, path] = splitRef(textureRef);
  const pngPath = `assets/${ns}/textures/${path}.png`;

  const cached = pngCache.get(pngPath);
  if (cached) return cached;

  const file = zip.file(pngPath);
  if (!file) return undefined;
  const dataUrl = `data:image/png;base64,${await file.async("base64")}`;
  pngCache.set(pngPath, dataUrl);
  return dataUrl;
}
