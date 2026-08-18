/**
 * Block texture resolution for the diff UI.
 *
 * Vanilla block textures are not part of our bundled registries (those carry only
 * blockstates), so we source them from a per-version mirror of the Minecraft
 * client assets. There is no 1:1 "block id → texture file" mapping in Minecraft
 * (stairs reuse plank/base textures, multi-face blocks have `_top`/`_side`
 * variants, etc.), so {@link blockTextureUrls} returns an *ordered list of
 * candidate URLs*. The UI tries them in order and falls back to a deterministic
 * colored tile (see {@link placeholderColor}) when none resolve — which is also
 * the expected path for modded namespaces, whose textures live inside the JARs.
 *
 * Pure module — no React. Network access happens only via `<img src>` in the UI.
 */

// jsDelivr mirror of InventivetalentDev/minecraft-assets — per-version git tags,
// permissive CORS, immutable + CDN-cached. Plain <img> loads (no pixel reads),
// so this is an external media asset, not a backend API call.
//
// HOST-COUPLED: `apps/launcher` renders these tools inside a webview whose CSP
// (`app.security.csp` in src-tauri/tauri.conf.json) is `default-src 'self'`, so
// this exact origin is named there on BOTH `img-src` (the <img> and
// THREE.TextureLoader paths) and `connect-src` (the blockstate/model JSON fetch
// in ../model/providers/cdn-provider.ts). apps/web ships no CSP, which is why a
// wrong policy shows up as "every texture is a coloured placeholder in the
// desktop app only" — with no error the browser build can ever reproduce.
// Change this host and the launcher CSP has to change with it.
//
// Exported because the model/blockstate provider (../model/providers/cdn-provider.ts)
// reads the same mirror: one origin, one definition, so widening the CSP is a
// single edit rather than a search. Callers append `<ref>/assets/…`.
export const CDN_BASE = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@";

// Refs we have confirmed exist on the mirror. An arbitrary detected version
// (e.g. "1.20.1", "1.19.4") is snapped to the nearest of these; cross-patch
// texture drift is visually negligible.
const SAFE_REFS = ["1.12.2", "1.13.2", "1.14.4", "1.15.2", "1.16.5", "1.18.2", "1.20.1", "1.21.1"] as const;

/** Newest mirror ref — broadest block coverage; used as the fallback everywhere. */
export const LATEST_TEXTURE_REF = SAFE_REFS[SAFE_REFS.length - 1];

/**
 * The flattening also renamed the texture folder: `textures/blocks/` up to
 * 1.12, `textures/block/` from 1.13 on. Verified against the mirror — asking a
 * 1.12.2 ref for `block/stone.png` 404s and vice versa.
 */
export function textureFolder(ref: string): "block" | "blocks" {
  return ref === "1.12.2" ? "blocks" : "block";
}

/**
 * CDN URL for a vanilla texture named by its full in-model path
 * (`blocks/stonebrick`, `block/stone`) at a given game version.
 *
 * Used when a *mod* block's model points at a vanilla texture — extremely
 * common, since a modded wall/stair/slab of a vanilla material just reuses that
 * material's PNG. Those live in the client jar, so they cannot be extracted
 * from the mod JAR and have to be sourced here instead.
 */
export function vanillaTextureUrl(texturePath: string, version: string | undefined): string {
  return `${CDN_BASE}${normalizeTextureVersion(version)}/assets/minecraft/textures/${texturePath}.png`;
}

const WOOD_SPECIES = [
  "oak",
  "spruce",
  "birch",
  "jungle",
  "acacia",
  "dark_oak",
  "mangrove",
  "cherry",
  "pale_oak",
  "bamboo",
  "crimson",
  "warped",
] as const;

// Shape suffixes whose blocks reuse a base material texture. Order matters:
// longer/more-specific suffixes first so `_fence_gate` wins over `_fence`.
const SHAPE_SUFFIXES = [
  "_pressure_plate",
  "_wall_hanging_sign",
  "_hanging_sign",
  "_wall_sign",
  "_fence_gate",
  "_trapdoor",
  "_stairs",
  "_button",
  "_carpet",
  "_fence",
  "_slab",
  "_door",
  "_wall",
  "_sign",
] as const;

function parseVersion(v: string): number {
  const [major = 0, minor = 0, patch = 0] = v.split(".").map((n) => parseInt(n, 10) || 0);
  return major * 1_000_000 + minor * 1_000 + patch;
}

/** Snap any version string to the nearest mirror ref we know exists. */
export function normalizeTextureVersion(version: string | undefined): string {
  if (!version) return LATEST_TEXTURE_REF;
  if ((SAFE_REFS as readonly string[]).includes(version)) return version;
  const target = parseVersion(version);
  // Unparseable / non-numeric version (e.g. "", "unknown", a loader name) → 0.
  // Snapping by distance would land on the OLDEST ref (1.16.5) and hide every
  // modern block; default to the newest ref instead (widest coverage).
  if (!target) return LATEST_TEXTURE_REF;
  let best = LATEST_TEXTURE_REF as string;
  let bestDist = Infinity;
  for (const ref of SAFE_REFS) {
    const dist = Math.abs(parseVersion(ref) - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = ref;
    }
  }
  return best;
}

/** Split "minecraft:oak_stairs" → ["minecraft", "oak_stairs"]; bare names default to minecraft. */
function splitId(blockId: string): [string, string] {
  const i = blockId.indexOf(":");
  if (i === -1) return ["minecraft", blockId];
  return [blockId.slice(0, i), blockId.slice(i + 1)];
}

function stripShape(name: string): string | null {
  for (const suffix of SHAPE_SUFFIXES) {
    if (name.endsWith(suffix) && name.length > suffix.length) {
      return name.slice(0, -suffix.length);
    }
  }
  return null;
}

function woodSpeciesOf(name: string): string | null {
  for (const w of WOOD_SPECIES) {
    if (name === w || name.startsWith(`${w}_`)) return w;
  }
  return null;
}

/**
 * Ordered texture-file basenames to try for a vanilla block name. Covers the
 * common cases: exact match, shape blocks falling back to their base material
 * (wood → planks), simple pluralization (`stone_brick` → `stone_bricks`), and
 * multi-face `_top` variants.
 */
export function textureNameCandidates(name: string): string[] {
  const out: string[] = [];
  const push = (n: string | null | undefined) => {
    if (n && !out.includes(n)) out.push(n);
  };

  push(name);

  const base = stripShape(name);
  if (base) {
    const species = woodSpeciesOf(base);
    if (species === "bamboo") {
      push("bamboo_planks");
      push("bamboo_mosaic");
    } else if (species) {
      push(`${species}_planks`);
    }
    push(base);
    push(`${base}s`); // brick → bricks, stone_brick → stone_bricks
  }

  // Multi-face blocks (grass_block, podzol, mycelium, …) expose a `_top` texture.
  push(`${name}_top`);
  push(`${name.replace(/_block$/, "")}_top`);

  return out.slice(0, 6);
}

/**
 * Ordered list of candidate texture URLs for a block id at a given version.
 * Returns `[]` for non-vanilla namespaces (modded blocks → colored placeholder).
 */
export function blockTextureUrls(blockId: string, version?: string): string[] {
  const [namespace, name] = splitId(blockId);
  if (namespace !== "minecraft") return [];
  const primary = normalizeTextureVersion(version);
  // Fall back to the newest ref so blocks added/renamed after the snapped version
  // (e.g. short_grass, mud_brick_stairs) still resolve instead of 404-ing.
  const refs = primary === LATEST_TEXTURE_REF ? [primary] : [primary, LATEST_TEXTURE_REF];
  const names = textureNameCandidates(name);
  return refs.flatMap((ref) =>
    names.map(
      (tex) => `${CDN_BASE}${ref}/assets/minecraft/textures/${textureFolder(ref)}/${tex}.png`,
    ),
  );
}

/**
 * Deterministic placeholder color for a block (used for modded/unresolved
 * blocks). Hashes the id to a stable hue so every instance of the same block
 * gets the same tile across renders.
 */
export function placeholderColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 42%, 44%)`;
}

/** Short glyph for a placeholder tile — the block's bare name initial. */
export function placeholderGlyph(blockId: string): string {
  const [, name] = splitId(blockId);
  return (name[0] ?? "?").toUpperCase();
}
