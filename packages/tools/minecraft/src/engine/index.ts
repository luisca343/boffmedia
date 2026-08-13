/**
 * Game-agnostic schematic engine: parse a structure file from any supported
 * game, build a block registry from a real install, resolve a block's texture
 * and geometry, and produce the instance data a 3D view renders.
 *
 * Everything here is conversion-free. Diffing two environments, applying
 * resolutions, rule sets and export writers are *conversion* concerns and stay
 * with the tool that performs them (`tools/schematic-compat/_lib/pipeline`).
 *
 * This barrel pulls in the adapter implementations (and with them JSZip +
 * Dexie), so it belongs in a worker. UI code that only needs a type or a
 * declarative fact should import the specific module instead — notably
 * `@/lib/schematic/types`, `@/lib/schematic/versions` and
 * `@/lib/schematic/adapters/game-adapter`, all of which are dependency-free.
 */

export type {
  UnifiedBlock,
  ConnectionVariant,
  BlockDefinition,
  BlockRegistry,
  ModInfo,
  ModLoader,
  ScanOverride,
  ExportFormat,
  TileEntity,
  Entity,
  SchematicRegion,
  SchematicStructure,
  DiffSummary,
  DiffEntry,
  CompatDiff,
  MappingRule,
  RuleSet,
  RuleSetMeta,
  ResolutionMap,
  ProgressCb,
  BlockPositionGroup,
  RegistryHandle,
  SchematicSummary,
} from "./types";

export type { CompiledModel } from "./model/types";

export { ERR, codedError, errorCode, errorDetail, type ErrCode } from "./errors";
export {
  BUNDLED_VERSIONS,
  DEFAULT_VANILLA_VERSION,
  isBundledVersion,
  type BundledVersion,
} from "./versions";
export { parseBlockState, parsePaletteEntry, serializeBlockState } from "./normalizer";

export type { GameAdapter, GameId, GameMeta, BuildRegistryOptions } from "./adapters";
export {
  GAMES,
  NotImplementedError,
  adapterForFile,
  adapterForFormat,
  adapterForNamespace,
  gameMeta,
  gameOfBlock,
  gameStatus,
  getAdapter,
  listAdapters,
} from "./adapters";

export { loadSchematicFile } from "./loader";
export {
  buildScannedRegistry,
  isInstanceMetaFile,
  loadBundledRegistry,
  nearestBundledVersion,
} from "./registry";
export { buildHytaleRegistry, type HytaleRegistryOptions } from "./registry/hytale";
export { detectInstance, INSTANCE_META_FILENAMES, type InstanceInfo } from "./registry/loader-detect";

export {
  HYTALE_FLUID_BLOCKS,
  hytaleFluidBase,
  isHytaleFluidName,
  parsePrefabFluidName,
  FLUID_BLOCK_PREFIX,
  SOURCE_SUFFIX,
} from "./fluids";
export { fluidColor } from "./render/fluid-color";

export {
  createEngineState,
  getBlockModel,
  getBlockTexture,
  getSchematicBlockPositions,
  loadSchematic,
  loadVanillaRegistry,
  ping,
  registryHandle,
  release,
  scanInstance,
  schematicSummary,
  type SchematicEngineState,
} from "./worker/core-ops";
