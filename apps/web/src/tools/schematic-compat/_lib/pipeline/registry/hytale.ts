import type { BlockRegistry, BlockDefinition, ProgressCb } from "../../types";
import { readZipEntries, extractZipEntry, type ZipEntry } from "../../parsers/zip-central";
import { compileBlockyModel, pngDimensions, type BlockyModel } from "../../model/blockymodel";
import type { CompiledModel } from "../../model/types";
import crossGameTable from "../rules/cross-game/minecraft-hytale.json";

const ICON_PREFIX = "Common/Icons/ItemsGenerated/";
const TEX_PREFIX = "Common/BlockTextures/";
const ITEM_DEF_PREFIX = "Server/Item/Items/";
/** `.blockymodel` / `.png` paths in item defs are relative to the `Common/` root. */
const COMMON_PREFIX = "Common/";
/** Extract eagerly in batches so the event loop stays responsive. */
const SCAN_CONCURRENCY = 64;
/** Every legal placement `rotation` index (see `blockRotationQuat`) — permissive
 *  on purpose, since legality actually depends on the block's VariantRotation
 *  type, which we don't model here; this just keeps `transformStates` from
 *  dropping the key outright when converting into Hytale. */
const ROTATION_VALUES = Array.from({ length: 12 }, (_, i) => String(i));

/** The `BlockType` block of a Hytale item definition (only the fields we use). */
interface BlockTypeDef {
  DrawType?: string;
  CustomModel?: string;
  CustomModelTexture?: Array<{ Texture?: string; Weight?: number }>;
  State?: { Definitions?: Record<string, { CustomModel?: string; CustomModelTexture?: Array<{ Texture?: string }> }> };
  Textures?: Array<Record<string, unknown>>;
}

/** A Hytale item definition (`Server/Item/Items/**\/*.json`). */
interface ItemDef {
  Icon?: string;
  BlockType?: BlockTypeDef;
}

/** Strip the directory + `.png` from a zip entry path. */
function baseName(path: string, prefix: string): string {
  return path.slice(prefix.length, path.length - 4);
}

/** First string-valued field in a texture-variant object (`All`, or a per-face key). */
function firstTextureValue(variant: Record<string, unknown> | undefined): string | undefined {
  if (!variant) return undefined;
  for (const v of Object.values(variant)) {
    if (typeof v === "string") return v;
  }
  return undefined;
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
 * `File.slice`), so a 3.4 GB archive is indexed in well under a second without
 * loading it into memory.
 *
 * The block catalog is derived from `Server/Item/Items/**\/*.json` item
 * definitions that carry a `BlockType` component — the **file's own basename
 * is the block's real id**, matching how the game server resolves a prefab's
 * `blocks[].name` (`BlockType.getAssetMap()` keyed by asset filename). This is
 * eagerly extracted + parsed for every item def (a few thousand small JSON
 * entries), since a block's id is not reliably recoverable from its texture or
 * icon filename: many blocks (particularly color/material variants built off a
 * `Parent` template, e.g. dyed wool) point `Icon`/`Textures` at a shared,
 * differently-named asset — deriving the catalog from those filenames instead
 * produces both wrong ids for such blocks (previously e.g. `hytale:Cloth_Black`
 * for what the game actually calls `hytale:Cloth_Block_Wool_Black`, which
 * fails to resolve in-game and silently becomes an "unknown block") and
 * thousands of spurious non-block entries (armor, tools, … also live under
 * `Common/Icons/ItemsGenerated/`).
 *
 * Each block's own `Icon` / `BlockType.Textures[0]` reference is recorded
 * during the scan, so {@link BlockRegistry.getTexture} resolves the *correct*
 * PNG for that block rather than guessing from the id.
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

  onProgress(20, "Indexing assets…");
  const iconEntries = new Map<string, ZipEntry>();
  const texEntries = new Map<string, ZipEntry>();
  const itemDefEntries = new Map<string, ZipEntry>();
  const entryByName = new Map<string, ZipEntry>();
  for (const entry of entries) {
    const { name } = entry;
    entryByName.set(name, entry);
    if (name.startsWith(ICON_PREFIX) && name.endsWith(".png")) {
      iconEntries.set(baseName(name, ICON_PREFIX), entry);
    } else if (name.startsWith(TEX_PREFIX) && name.endsWith(".png")) {
      texEntries.set(baseName(name, TEX_PREFIX), entry);
    } else if (name.startsWith(ITEM_DEF_PREFIX) && name.endsWith(".json")) {
      // Basename (sans dir + ".json") is the block's real, game-recognised id.
      const base = name.slice(name.lastIndexOf("/") + 1, name.length - 5);
      itemDefEntries.set(base, entry);
    }
  }

  // Parsed item-def cache (block name → def, or null if extraction/parse failed).
  const defCache = new Map<string, ItemDef | null>();
  const loadDef = async (name: string): Promise<ItemDef | null> => {
    const cached = defCache.get(name);
    if (cached !== undefined) return cached;
    const entry = itemDefEntries.get(name);
    let def: ItemDef | null = null;
    if (entry) {
      try {
        def = JSON.parse(new TextDecoder().decode(await extractZipEntry(zip, entry))) as ItemDef;
      } catch {
        def = null;
      }
    }
    defCache.set(name, def);
    return def;
  };

  onProgress(25, "Scanning block catalog…");
  const blocks = new Map<string, BlockDefinition>();
  // Each block's own icon/texture basename (only set when it differs from the
  // block's id, e.g. shared color-variant textures) — resolved once here so
  // getTexture never has to guess.
  const ownIcon = new Map<string, string>();
  const ownTexture = new Map<string, string>();

  const names = [...itemDefEntries.keys()];
  let scanned = 0;
  for (let i = 0; i < names.length; i += SCAN_CONCURRENCY) {
    const batch = names.slice(i, i + SCAN_CONCURRENCY);
    await Promise.all(
      batch.map(async (name) => {
        const def = await loadDef(name);
        if (def?.BlockType) {
          const id = `hytale:${name}`;
          const stateLabels = def.BlockType.State?.Definitions ? Object.keys(def.BlockType.State.Definitions) : [];
          const validStates: Record<string, string[]> = { rotation: ROTATION_VALUES };
          const defaultState: Record<string, string> = {};
          if (stateLabels.length > 0) {
            validStates.state = stateLabels;
            // No source `state` maps to the base model (no `_State_Definitions_`
            // suffix) — never the arbitrary first label (transformStates' generic
            // "no default → use validValues[0]" fallback would otherwise stamp
            // e.g. every straight stair with a "Corner_Left" state).
            defaultState.state = "";
          }
          blocks.set(id, { id, validStates, defaultState, tags: [] });
          if (def.Icon) ownIcon.set(name, baseName(def.Icon, "Icons/ItemsGenerated/"));
          const texVal = firstTextureValue(def.BlockType.Textures?.[0]);
          if (texVal) ownTexture.set(name, baseName(texVal, "BlockTextures/"));
        }
      })
    );
    scanned += batch.length;
    onProgress(25 + Math.round((scanned / names.length) * 45), `Scanning block catalog… ${scanned}/${names.length}`);
  }

  for (const target of crossGameTargets()) {
    const id = `hytale:${target}`;
    if (!blocks.has(id)) blocks.set(id, { id, validStates: { rotation: ROTATION_VALUES }, defaultState: {}, tags: [] });
  }

  onProgress(72, "Building block catalog…");

  // Lazy, cached texture resolver — extracts a block's icon/texture PNG on
  // first use, using the reference captured during the scan above (falling
  // back to the block's own name for blocks whose def couldn't be read, e.g.
  // force-injected cross-game targets that aren't in this install).
  const textureCache = new Map<string, string | null>();
  const getTexture = async (blockId: string): Promise<string | null> => {
    const name = blockId.startsWith("hytale:") ? blockId.slice("hytale:".length) : blockId;
    const cached = textureCache.get(name);
    if (cached !== undefined) return cached;
    // Block face textures render better as cube faces than inventory icon renders.
    const entry =
      texEntries.get(ownTexture.get(name) ?? name) ??
      iconEntries.get(ownIcon.get(name) ?? name) ??
      texEntries.get(name) ??
      iconEntries.get(name);
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

  // Lazy, cached geometry resolver — compiles a block's `.blockymodel` (+ its
  // texture sheet) on first use. Returns null for cube blocks (no CustomModel)
  // so the viewer falls back to a textured cube.
  const modelCache = new Map<string, CompiledModel | null>();
  const getModel = async (
    blockId: string,
    stateLabel?: string,
    rotation?: number,
  ): Promise<CompiledModel | null> => {
    const name = blockId.startsWith("hytale:") ? blockId.slice("hytale:".length) : blockId;
    const rot = rotation ?? 0;
    const key = `${name} ${stateLabel ?? ""} ${rot}`;
    const cached = modelCache.get(key);
    if (cached !== undefined) return cached;

    const compile = async (): Promise<CompiledModel | null> => {
      const def = await loadDef(name);
      if (!def?.BlockType) return null;
      // A state variant may override the model; fall back to the base block model.
      const stateDef = stateLabel ? def.BlockType.State?.Definitions?.[stateLabel] : undefined;
      const modelPath = stateDef?.CustomModel ?? def.BlockType.CustomModel;
      if (!modelPath) return null;
      const texPath = stateDef?.CustomModelTexture?.[0]?.Texture ?? def.BlockType.CustomModelTexture?.[0]?.Texture;
      if (!texPath) return null;

      const modelEntry = entryByName.get(COMMON_PREFIX + modelPath);
      const texEntry = entryByName.get(COMMON_PREFIX + texPath);
      if (!modelEntry || !texEntry) return null;

      const [modelBytes, texBytes] = await Promise.all([
        extractZipEntry(zip, modelEntry),
        extractZipEntry(zip, texEntry),
      ]);
      const model = JSON.parse(new TextDecoder().decode(modelBytes)) as BlockyModel;
      const { width, height } = pngDimensions(texBytes);
      const textureRef = `data:image/png;base64,${toBase64(texBytes)}`;
      const compiled = compileBlockyModel(model, textureRef, width, height, rot);
      return compiled.empty ? null : compiled;
    };

    let result: CompiledModel | null;
    try {
      result = await compile();
    } catch {
      result = null;
    }
    modelCache.set(key, result);
    return result;
  };

  onProgress(100, "Done");
  return {
    gameId: "hytale",
    version: "alpha",
    mods: [],
    blocks,
    tags: new Map(),
    getTexture,
    getModel,
    snapshotHash: `hytale-${blocks.size}`,
    capturedAt: Date.now(),
    instanceName: "Hytale",
  };
}
