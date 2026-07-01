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
   * this block actually accepts (see `_lib/model/rotation-tuple.ts`).
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

export interface ModInfo {
  id: string;
  name: string;
  version: string;
  loader: "forge" | "fabric" | "neoforge";
}

export interface BlockRegistry {
  gameId: "minecraft" | "hytale";
  version: string;
  modLoader?: "forge" | "fabric" | "neoforge";
  mods: ModInfo[];
  blocks: Map<string, BlockDefinition>;
  tags: Map<string, string[]>;
  /**
   * Block id -> representative texture as a `data:image/png;base64,…` URL,
   * extracted from mod JARs at scan time. Worker-side only — never crosses the
   * postMessage boundary wholesale; the UI fetches entries lazily by id.
   */
  textures?: Map<string, string>;
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

export interface SchematicRegion {
  name: string;
  dimensions: { x: number; y: number; z: number };
  palette: UnifiedBlock[];
  blockData: Int32Array;
}

export interface SchematicStructure {
  format: "schem" | "litematic" | "nbt" | "mca" | "prefab";
  formatVersion: number;
  dimensions: { x: number; y: number; z: number };
  palette: UnifiedBlock[];
  blockData: Int32Array;
  tileEntities: TileEntity[];
  entities: Entity[];
  regions?: SchematicRegion[];
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
  /** Flat Float32Array: [x0,y0,z0, x1,y1,z1, …]. Length = instanceCount × 3. */
  positions: Float32Array;
}

/**
 * Lightweight reference to a registry loaded inside the worker.
 * The full block Map stays in the worker; the UI only needs metadata.
 */
export interface RegistryHandle {
  id: string;
  gameId: "minecraft" | "hytale";
  version: string;
  modLoader?: "forge" | "fabric" | "neoforge";
  mods: ModInfo[];
  blockCount: number;
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
}
