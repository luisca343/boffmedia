import type { BlockRegistry, BlockDefinition, ProgressCb } from "../../types";
import { readZipEntries, extractZipEntry, type ZipEntry } from "../../parsers/zip-central";
import crossGameTable from "../rules/cross-game/minecraft-hytale.json";

const ICON_PREFIX = "Common/Icons/ItemsGenerated/";
const TEX_PREFIX = "Common/BlockTextures/";

/** Texture face suffixes to strip so `Rock_Stone_Cobble_Side` → `Rock_Stone_Cobble`. */
const FACE_SUFFIX = /_(Side|Top|Bottom|Front|Back|Inner|Outer|Flip)(_?\d+)?$/;

/** Strip the directory + `.png` from a zip entry path. */
function baseName(path: string, prefix: string): string {
  return path.slice(prefix.length, path.length - 4);
}

/** Hytale ids referenced as cross-game targets — guaranteed present so MC→Hytale resolves. */
function crossGameTargets(): string[] {
  const table = crossGameTable as unknown as { minecraftToHytale: Record<string, string> };
  return Object.values(table.minecraftToHytale)
    .filter((id) => id.startsWith("hytale:") && id !== "hytale:air")
    .map((id) => id.slice("hytale:".length));
}

function findAssetsZip(files: File[]): File | undefined {
  const exact = files.find((f) => f.name.toLowerCase() === "assets.zip");
  if (exact) return exact;
  // Fall back to the largest .zip the picker handed us.
  const zips = files.filter((f) => f.name.toLowerCase().endsWith(".zip"));
  zips.sort((a, b) => b.size - a.size);
  return zips[0];
}

/** Uint8Array → base64 (chunked to avoid call-stack limits on btoa). */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Build a Hytale {@link BlockRegistry} by scanning a real Hytale install's
 * `Assets.zip`. Only the zip's central directory is read up front (via
 * `File.slice`), so a 3.4 GB archive is parsed in well under a second without
 * loading it into memory.
 *
 * The block catalog is derived from generated item-icon names
 * (`Common/Icons/ItemsGenerated/<Name>.png`, which name every block exactly) plus
 * block face textures (`Common/BlockTextures/`). Block definitions are stateless
 * (Hytale placement state is encoded in the prefab block name, not a state map).
 *
 * Textures are resolved lazily through {@link BlockRegistry.getTexture}: the
 * block's icon PNG is extracted + decompressed from the archive the first time
 * it's requested (and cached), so we never bulk-extract thousands of images.
 */
export async function buildHytaleRegistry(
  files: File[],
  onProgress: ProgressCb
): Promise<BlockRegistry> {
  onProgress(2, "Locating Assets.zip…");
  const zip = findAssetsZip(files);
  if (!zip) {
    throw new Error(
      "Could not find Assets.zip. Pick the Hytale install folder (it contains install/release/package/game/latest/Assets.zip) or the Assets.zip file directly."
    );
  }

  onProgress(10, "Reading asset index…");
  const entries = await readZipEntries(zip);

  onProgress(70, "Building block catalog…");
  // name → best texture entry (icons preferred; textures fill gaps).
  const iconEntries = new Map<string, ZipEntry>();
  const texEntries = new Map<string, ZipEntry>();
  for (const entry of entries) {
    const { name } = entry;
    if (name.startsWith(ICON_PREFIX) && name.endsWith(".png")) {
      iconEntries.set(baseName(name, ICON_PREFIX), entry);
    } else if (name.startsWith(TEX_PREFIX) && name.endsWith(".png")) {
      const raw = baseName(name, TEX_PREFIX);
      texEntries.set(raw, entry);
      const stripped = raw.replace(FACE_SUFFIX, "");
      if (stripped && !texEntries.has(stripped)) texEntries.set(stripped, entry);
    }
  }

  const catalog = new Set<string>([...iconEntries.keys(), ...texEntries.keys()]);
  for (const target of crossGameTargets()) catalog.add(target);

  const blocks = new Map<string, BlockDefinition>();
  for (const name of catalog) {
    if (!name) continue;
    const id = `hytale:${name}`;
    blocks.set(id, { id, validStates: {}, defaultState: {}, tags: [] });
  }

  // Lazy, cached texture resolver — extracts a block's icon PNG on first use.
  const textureCache = new Map<string, string | null>();
  const getTexture = async (blockId: string): Promise<string | null> => {
    const name = blockId.startsWith("hytale:") ? blockId.slice("hytale:".length) : blockId;
    const cached = textureCache.get(name);
    if (cached !== undefined) return cached;
    const entry = iconEntries.get(name) ?? texEntries.get(name);
    if (!entry) {
      textureCache.set(name, null);
      return null;
    }
    try {
      const bytes = await extractZipEntry(zip, entry);
      const url = `data:image/png;base64,${toBase64(bytes)}`;
      textureCache.set(name, url);
      return url;
    } catch {
      textureCache.set(name, null);
      return null;
    }
  };

  onProgress(100, "Done");
  return {
    gameId: "hytale",
    version: "alpha",
    mods: [],
    blocks,
    tags: new Map(),
    getTexture,
    snapshotHash: `hytale-${blocks.size}`,
    capturedAt: Date.now(),
    instanceName: "Hytale",
  };
}
