export interface UnifiedBlock {
  id: string;
  namespace: string;
  name: string;
  states: Record<string, string>;
  tags: string[];
  source: "vanilla" | "mod";
  modId?: string;
}

export interface BlockDefinition {
  id: string;
  validStates: Record<string, string[]>;
  defaultState: Record<string, string>;
  tags: string[];
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
  format: "schem" | "litematic" | "nbt" | "mca";
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
