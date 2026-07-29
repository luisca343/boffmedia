import type { BlockRegistry, BlockDefinition, ModInfo, ProgressCb, ScanOverride } from "../types";
import { detectInstance, INSTANCE_META_FILENAMES } from "./loader-detect";
import { scanJar } from "./jar-scanner";
import { fingerprintFiles, cacheGet, cachePut } from "../cache/registry-cache";
import { ERR, codedError } from "../errors";
import { BUNDLED_VERSIONS, isBundledVersion, type BundledVersion } from "../versions";

/** Shape of the bundled `vanilla/<version>.json` files (see generate-vanilla.mjs). */
interface VanillaRegistryFile {
  version: string;
  dataVersion: number;
  blockCount: number;
  blocks: Record<string, { states: Record<string, string[]>; default: Record<string, string> }>;
}

export { BUNDLED_VERSIONS, isBundledVersion, type BundledVersion } from "../versions";
export type { ScanOverride } from "../types";

/** Parse "1.21.1" → [1, 21, 1] for nearest-version matching. */
function parseVersion(v: string): number[] {
  return v.split(".").map((n) => parseInt(n, 10) || 0);
}

/** Compare two parsed versions as a single ordered scalar for distance math. */
function versionScalar(parts: number[]): number {
  const [major = 0, minor = 0, patch = 0] = parts;
  return major * 1_000_000 + minor * 1_000 + patch;
}

/**
 * Map an arbitrary detected version (e.g. "1.20.1", "1.18.2", "1.21") onto the
 * closest bundled vanilla registry:
 *   1. exact match,
 *   2. same major.minor family (prefer the closest patch),
 *   3. globally nearest by version distance.
 */
export function nearestBundledVersion(detected: string): BundledVersion {
  if (isBundledVersion(detected)) return detected;

  const target = parseVersion(detected);
  const [tMajor, tMinor] = target;

  const family = BUNDLED_VERSIONS.filter((v) => {
    const [major, minor] = parseVersion(v);
    return major === tMajor && minor === tMinor;
  });
  const pool = family.length ? family : [...BUNDLED_VERSIONS];

  const targetScalar = versionScalar(target);
  let best = pool[0];
  let bestDist = Infinity;
  for (const v of pool) {
    const dist = Math.abs(versionScalar(parseVersion(v)) - targetScalar);
    if (dist < bestDist) {
      bestDist = dist;
      best = v;
    }
  }
  return best;
}

async function importVanilla(version: BundledVersion): Promise<VanillaRegistryFile> {
  // Static-ish dynamic import — webpack builds a lazy context over ./vanilla/*.json.
  const mod = await import(`./vanilla/${version}.json`);
  return (mod.default ?? mod) as VanillaRegistryFile;
}

/**
 * Load a bundled vanilla registry and normalize it into a {@link BlockRegistry}.
 * Accepts any version string and resolves it to the nearest bundled file via
 * {@link nearestBundledVersion}. The block Map is keyed by full id
 * (e.g. "minecraft:oak_stairs").
 *
 * Used internally as the vanilla base for scanned-instance registries; it is no
 * longer exposed directly on the worker API.
 */
export async function loadBundledRegistry(version: string): Promise<BlockRegistry> {
  const resolved = nearestBundledVersion(version);
  const file = await importVanilla(resolved);
  const blocks = new Map<string, BlockDefinition>();

  for (const [id, entry] of Object.entries(file.blocks)) {
    blocks.set(id, {
      id,
      validStates: entry.states ?? {},
      defaultState: entry.default ?? {},
      tags: [],
    });
  }

  return {
    gameId: "minecraft",
    version: file.version,
    dataVersion: file.dataVersion,
    mods: [],
    blocks,
    tags: new Map(),
    snapshotHash: `vanilla-${resolved}`,
    capturedAt: Date.now(),
  };
}

/** Filenames (lowercased) that carry instance version/loader metadata. */
const META_FILENAMES = new Set<string>(INSTANCE_META_FILENAMES);

export function isInstanceMetaFile(name: string): boolean {
  return META_FILENAMES.has(name.toLowerCase());
}

/** Reverse a tag → members map onto each block definition's `tags` array. */
function applyTags(blocks: Map<string, BlockDefinition>, tags: Map<string, string[]>) {
  for (const [tagId, members] of tags) {
    for (const member of members) {
      const def = blocks.get(member);
      if (def && !def.tags.includes(tagId)) def.tags.push(tagId);
    }
  }
}

/**
 * Build a {@link BlockRegistry} for a real Minecraft instance: detect its version
 * + loader from launcher metadata, take the matching bundled vanilla registry as
 * the base, then merge every mod JAR's blocks and tags on top.
 *
 * `metaFiles` are the launcher metadata files (minecraftinstance.json /
 * manifest.json); `jarFiles` are the `mods/*.jar` files. Both come pre-filtered
 * from the UI so only relevant files cross into the worker.
 */
export async function buildScannedRegistry(
  metaFiles: File[],
  jarFiles: File[],
  onProgress: ProgressCb,
  override?: ScanOverride,
): Promise<BlockRegistry> {
  // ── Cache check ──────────────────────────────────────────────────────────────
  // The override participates in the key: the same folder scanned as 1.16.5 and
  // as 1.21.1 are different registries.
  const fp = fingerprintFiles(metaFiles, jarFiles, override);
  onProgress(1, "Checking cache…");
  const cached = await cacheGet(fp);
  if (cached) {
    onProgress(100, "Loaded from cache");
    return cached;
  }

  onProgress(2, "Reading instance metadata…");
  const metas = new Map<string, string>();
  for (const f of metaFiles) metas.set(f.name.toLowerCase(), await f.text());

  const info = override ?? detectInstance(metas);
  if (!info) {
    // No launcher layout matched. The UI turns this code into a prompt for the
    // version + loader and re-scans with an override, so an unrecognised folder
    // is a question rather than a dead end.
    if (metaFiles.length === 0 && jarFiles.length === 0) {
      throw codedError(
        ERR.instanceEmpty,
        "That folder has no launcher metadata and no mods/*.jar files.",
      );
    }
    throw codedError(
      ERR.instanceUndetected,
      "Could not detect the Minecraft version of this folder.",
    );
  }

  onProgress(6, `Loading vanilla ${info.version}…`);
  const registry = await loadBundledRegistry(info.version);
  const tags = new Map<string, string[]>();
  const textures = new Map<string, string>();
  const variantTextures = new Map<string, string[]>();
  const mods: ModInfo[] = [];

  const total = jarFiles.length;
  let failedJars = 0;
  for (let i = 0; i < total; i++) {
    const jar = jarFiles[i];
    const pct = total ? 8 + Math.round(((i + 1) / total) * 88) : 96;
    onProgress(pct, `Scanning ${jar.name}… ${i + 1}/${total}`);
    try {
      const scanned = await scanJar(jar, info.version);
      if (scanned.mod) mods.push(scanned.mod);
      for (const [id, def] of scanned.blocks) registry.blocks.set(id, def);
      for (const [tagId, members] of scanned.tags) {
        tags.set(tagId, [...(tags.get(tagId) ?? []), ...members]);
      }
      for (const [id, dataUrl] of scanned.textures) textures.set(id, dataUrl);
      for (const [id, list] of scanned.variantTextures) variantTextures.set(id, list);
    } catch {
      // A corrupt/unreadable JAR shouldn't abort the whole scan — but it must
      // not be invisible either: every skipped jar is a mod whose blocks will
      // render as placeholders, so the count surfaces in the registry handle.
      failedJars++;
    }
  }

  applyTags(registry.blocks, tags);

  onProgress(99, "Saving to cache…");
  const result: BlockRegistry = {
    ...registry,
    version: info.version, // surface the real detected version, not the bundled base
    modLoader: info.modLoader,
    mods,
    ...(failedJars ? { failedJars } : {}),
    tags,
    textures,
    variantTextures,
    snapshotHash: `scan-${info.version}-${mods.length}-${registry.blocks.size}`,
    capturedAt: Date.now(),
    instanceName: info.instanceName,
  };

  // Store in cache asynchronously — don't block the return.
  cachePut(fp, result).catch(() => void 0);

  onProgress(100, "Done");
  return result;
}
