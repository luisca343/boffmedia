import type { CompiledModel } from "./model/types";
import type { VariantRotation } from "./model/rotation-tuple";

export interface UnifiedBlock {
  id: string;
  namespace: string;
  name: string;
  states: Record<string, string>;
  tags: string[];
  source: "vanilla" | "mod";
  modId?: string;
}

/**
 * One resolved connection shape of a Hytale connected block: the concrete block
 * to place plus, when that shape is a `State.Definition` of the base block, its
 * `state` label. Iron bars, for example, model their corner as a *separate*
 * block (`Deco_Iron_Bars_Corner`, no state) while their T/Cross are states of
 * the base block — so both an id swap and a state label have to be expressible.
 */
export interface ConnectionVariant {
  id: string;
  state?: string;
}

export interface BlockDefinition {
  id: string;
  validStates: Record<string, string[]>;
  defaultState: Record<string, string>;
  tags: string[];
  /**
   * Hytale blocks only: the block's `BlockType.VariantRotation` type, which
   * determines its legal placement `rotation` indices. Consumed by the
   * cross-game rotation bridge to normalise a converted orientation into the set
   * this block actually accepts (see `model/rotation-tuple.ts`).
   */
  variantRotation?: VariantRotation;
  /**
   * Hytale connected blocks only (fences / bars / walls whose `BlockType`
   * carries a `WallConnectedBlockTemplate` `ConnectedBlockRuleSet`): the concrete
   * block + state each connection shape resolves to. The cross-game bridge bakes
   * the resolved variant into a converted prefab, because Hytale only recomputes
   * connections on live placement — never on a bulk prefab paste (same reason
   * stair corners are baked in). `corner`/`t`/`cross` are absent when the block
   * doesn't model that shape.
   */
  connections?: {
    straight: ConnectionVariant;
    corner?: ConnectionVariant;
    t?: ConnectionVariant;
    cross?: ConnectionVariant;
  };
}

export type ModLoader = "forge" | "fabric" | "neoforge";

export interface ModInfo {
  id: string;
  name: string;
  version: string;
  loader: ModLoader;
}

/**
 * Explicit version + loader supplied by the user when no launcher layout was
 * recognised. Bypasses detection entirely, which is what lets an arbitrary
 * folder (a server dir, a hand-assembled instance) still be scanned.
 */
export interface ScanOverride {
  version: string;
  modLoader?: ModLoader;
  instanceName?: string;
}

/**
 * A file format a structure can be written back to. Declared here rather than in
 * the exporter so an adapter can advertise which formats it produces without any
 * consumer of that declaration pulling the writers in behind it.
 */
export type ExportFormat = "schem" | "schem3" | "litematic" | "nbt" | "prefab";

export interface BlockRegistry {
  gameId: "minecraft" | "hytale";
  version: string;
  /**
   * Minecraft's numeric save-format version for {@link version}. Stamped onto
   * exported files so a converted schematic declares the format it was converted
   * *to* — writing the source file's DataVersion makes the game run its data
   * fixers over already-converted ids. Sourced from the bundled vanilla registry,
   * so a scanned instance carries its nearest bundled version's number (close
   * enough that no fixer step applies). Undefined for games without the concept.
   */
  dataVersion?: number;
  modLoader?: ModLoader;
  mods: ModInfo[];
  /** Mod JARs that failed to read during the scan; absent on bundled registries. */
  failedJars?: number;
  blocks: Map<string, BlockDefinition>;
  tags: Map<string, string[]>;
  /**
   * Block id -> representative texture as a `data:image/png;base64,…` URL,
   * extracted from mod JARs at scan time. Worker-side only — never crosses the
   * postMessage boundary wholesale; the UI fetches entries lazily by id.
   */
  textures?: Map<string, string>;
  /**
   * Block id -> one texture per declared variant, in declaration order. Legacy
   * `id:meta` materials index it directly (see `forgeVariantEntries`), which is
   * what keeps 16 wool colours or 8 crystals from all rendering as variant 0.
   */
  variantTextures?: Map<string, string[]>;
  /**
   * Lazy per-block texture resolver (worker-side only, never serialized). Used by
   * games whose textures are extracted on demand rather than prebuilt into
   * {@link textures} — e.g. Hytale pulls a block's icon PNG out of Assets.zip the
   * first time it's requested. Returns a `data:image/png;base64,…` URL or null.
   */
  getTexture?: (blockId: string) => Promise<string | null>;
  /**
   * Lazy per-block geometry resolver (worker-side only, never serialized). Games
   * with non-cube blocks compile a block's shaped model on demand — e.g. Hytale
   * reads the block's `.blockymodel` + texture from Assets.zip and bakes them
   * into a {@link CompiledModel} (plain typed arrays, safe to clone to the UI).
   * `stateLabel` selects a state-variant model (the prefab `state` property);
   * `rotation` is the prefab placement index (0–11) baked into the geometry.
   * Returns `null` for cube blocks (the viewer falls back to a textured cube).
   */
  getModel?: (
    blockId: string,
    stateLabel?: string,
    rotation?: number,
  ) => Promise<CompiledModel | null>;
  snapshotHash: string;
  capturedAt: number;
  /** Name of the scanned instance (from launcher metadata), when available. */
  instanceName?: string;
}

export interface TileEntity {
  pos: { x: number; y: number; z: number };
  id: string;
  data: Record<string, unknown>;
}

export interface Entity {
  pos: [number, number, number];
  id: string;
  data: Record<string, unknown>;
}

/**
 * Numeric block id → `namespace:name`, as recorded by one specific pre-1.13
 * world's `level.dat`. Modded ids are assigned per world, so a map from a
 * different save names blocks wrongly rather than not at all.
 */
export type LegacyIdMap = Map<number, string>;

/** Extra inputs a loader may need beyond the file itself. */
export interface SchematicParseOptions {
  /** Source world's id table; consumed only by pre-1.13 loaders. */
  worldIds?: LegacyIdMap;
}

/** What the UI shows after a `level.dat` is attached — the map itself stays in the worker. */
export interface WorldIdSummary {
  /** Number of block ids the world assigned. */
  idCount: number;
  /** Ids above the vanilla range, i.e. the modded ones this map exists for. */
  moddedCount: number;
  worldName?: string;
  modCount?: number;
  source: "registries" | "itemdata";
}

/**
 * Micro-tile boxes of one LittleTiles material, extracted from LT tile
 * entities (either generation — see loader/littletiles.ts). `boxes` is a flat
 * Float32Array with stride 9: [bx, by, bz, x0, y0, z0, x1, y1, z1] per box —
 * the host block cell plus the box min/max as 0..1 fractions within that cell.
 * Sorted by host `by` so the preview's Y-layer cutoff can binary-search.
 * `colors` (same box order, stride 3, RGB 0..1) is present only when at least
 * one tile carries a colour tint.
 */
export interface LittleTilesGroup {
  block: UnifiedBlock;
  tileCount: number;
  boxes: Float32Array;
  colors?: Float32Array;
  /**
   * Transformable boxes (slopes/wedges), separate from `boxes` because they
   * can't be drawn as scaled unit cubes: 8 corners × xyz per box, absolute
   * world coords, host-Y sorted like `boxes`. `cornerHostY` (one Y per box)
   * feeds the layer-cutoff binary search; `cornerColors` mirrors `colors`.
   */
  corners?: Float32Array;
  cornerHostY?: Float32Array;
  cornerColors?: Float32Array;
}

export interface LittleTilesData {
  /** Number of host LittleTiles blocks (tile entities). */
  blockCount: number;
  /** Total micro-tiles across all hosts (a tile can span several boxes). */
  tileCount: number;
  groups: LittleTilesGroup[];
  /**
   * Material id → replacement blockstate string, filled from the user's
   * resolutions when the worker applies them. Consumed by the modern-format
   * export writer (convertLittleTilesForExport), which re-parses the original
   * TEs and swaps materials by their original id.
   */
  materialMap?: Record<string, string>;
}

export interface SchematicRegion {
  name: string;
  dimensions: { x: number; y: number; z: number };
  palette: UnifiedBlock[];
  blockData: Int32Array;
}

export interface SchematicStructure {
  format: "schem" | "mcedit" | "litematic" | "nbt" | "mca" | "prefab";
  formatVersion: number;
  dimensions: { x: number; y: number; z: number };
  palette: UnifiedBlock[];
  blockData: Int32Array;
  tileEntities: TileEntity[];
  entities: Entity[];
  regions?: SchematicRegion[];
  /** Parsed LittleTiles content, when the file carries LT tile entities. */
  littleTiles?: LittleTilesData;
  metadata: Record<string, unknown>;
}

export interface DiffSummary {
  total: number;
  safe: number;
  renamed: number;
  stateChanged: number;
  missing: number;
  modOnly: number;
}

export interface DiffEntry {
  block: UnifiedBlock;
  status: "safe" | "renamed" | "state-changed" | "missing" | "mod-only";
  instanceCount: number;
  autoCandidate?: UnifiedBlock;
  incompatibleStates?: string[];
  /**
   * Set when the block is not in the schematic's block grid but referenced as a
   * LittleTiles micro-tile material. Informational: resolutions rewrite the
   * palette, so they cannot apply to these entries (`instanceCount` = tiles).
   */
  context?: "littletiles";
}

export interface CompatDiff {
  summary: DiffSummary;
  entries: DiffEntry[];
}

export type MappingRule =
  | { type: "exact"; source: string; target: string; stateMap?: Record<string, string>; preserveStates?: string[] }
  | { type: "namespace"; sourceNs: string; targetNs: string }
  | { type: "tag"; tag: string; target: string; priority?: "high" | "low" }
  | { type: "fallback"; target: string };

export interface RuleSetMeta {
  id: string;
  name: string;
  gameId: "minecraft" | "hytale";
  fromVersion: string;
  toVersion: string;
}

export interface RuleSet extends RuleSetMeta {
  formatVersion: 1;
  rules: MappingRule[];
}

export type ResolutionMap = Record<
  string,
  {
    target: UnifiedBlock;
    stateMap?: Record<string, string>;
    applyToAll: boolean;
  }
>;

export type ProgressCb = (pct: number, msg: string) => void;

/**
 * Per-block-type position data for the 3D preview, built worker-side and
 * transferred to the UI thread after analysis.  `positions` is a flat
 * Float32Array of [x, y, z] triplets — one triplet per block instance.
 */
export interface BlockPositionGroup {
  paletteIndex: number;
  block: UnifiedBlock;
  /**
   * Flat Float32Array: [x0,y0,z0, x1,y1,z1, …]. Length = instanceCount × 3.
   * Surface cells only (≥1 open neighbour or on the volume edge), Y-sorted.
   */
  positions: Float32Array;
  /**
   * Fully-enclosed cells (all six neighbours solid), Y-sorted. Invisible from
   * outside, so the viewer only draws the single Y-slice the layer cutoff sits
   * on — that's when slicing exposes their top face. Absent when the schematic
   * is so large the worker drops interiors entirely (see CULL_THRESHOLD).
   */
  interiorPositions?: Float32Array;
}

/**
 * Lightweight reference to a registry loaded inside the worker.
 * The full block Map stays in the worker; the UI only needs metadata.
 */
export interface RegistryHandle {
  id: string;
  gameId: "minecraft" | "hytale";
  version: string;
  /** See {@link BlockRegistry.dataVersion} — the UI passes it back on export. */
  dataVersion?: number;
  modLoader?: ModLoader;
  mods: ModInfo[];
  blockCount: number;
  /**
   * Blocks with a resolved representative texture. The one number that says
   * whether mod blocks will render as textures or as placeholder cubes — a
   * scanned 1.12 pack should be in the hundreds-to-thousands; 0 after a scan
   * means the scan silently produced a texture-less registry (stale worker
   * code, failed jar reads) and the UI must say so instead of hiding it.
   */
  textureCount: number;
  /** Mod JARs that could not be read during the scan (corrupt file, OOM…). */
  failedJars?: number;
  source: "bundled" | "scanned";
  /** Name of the scanned instance (from launcher metadata), when available. */
  instanceName?: string;
}

/**
 * Lightweight reference to a schematic loaded inside the worker.
 * The block data stays in the worker; the UI only needs metadata.
 */
export interface SchematicSummary {
  id: string;
  format: SchematicStructure["format"];
  formatVersion: number;
  dimensions: { x: number; y: number; z: number };
  paletteSize: number;
  blockCount: number;
  fileName: string;
  fileSize: number;
  /** Pre-flattening source (MCEdit `.schematic`, pre-1.13 `.mca`). */
  legacy?: boolean;
  /**
   * Numeric ids no table could name — mod blocks whose world was not attached.
   * Only meaningful on a legacy document; drives the "attach a level.dat" hint.
   */
  unknownIdCount?: number;
  /** Present when the schematic contains LittleTiles blocks. */
  littleTiles?: { blockCount: number; tileCount: number };
}
