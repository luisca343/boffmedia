import type {
  BlockRegistry,
  SchematicStructure,
  ProgressCb,
  ScanOverride,
  ExportFormat,
  UnifiedBlock,
} from "../types";

export type GameId = "minecraft" | "hytale";

/**
 * Thrown by adapters whose game support is not yet implemented (e.g. Hytale).
 * The UI catches this to render a "coming soon" state rather than a hard error.
 */
export class NotImplementedError extends Error {
  readonly gameId: GameId;
  constructor(gameId: GameId, message?: string) {
    super(message ?? `${gameId} support is not implemented yet`);
    this.name = "NotImplementedError";
    this.gameId = gameId;
  }
}

/** Everything a caller needs to build a game's registry from picked files. */
export interface BuildRegistryOptions {
  /**
   * Version/loader the user entered by hand when no launcher layout was
   * recognised; adapters that don't detect a version from metadata ignore it.
   */
  override?: ScanOverride;
  /**
   * Block ids that must exist in the built registry even when the scanned
   * install never defines them. This is the seam that keeps registry
   * construction (what blocks exist) independent of conversion rules (how blocks
   * map): the conversion layer passes its mapping targets here, and the registry
   * builder never reads a rule table.
   */
  requiredBlockIds?: readonly string[];
}

/**
 * Declarative, dependency-free facts about a game. Kept separate from
 * {@link GameAdapter} so the UI can branch on capability without importing an
 * adapter implementation (which drags JSZip + Dexie into the main bundle).
 */
export interface GameMeta {
  gameId: GameId;
  status: "available" | "coming-soon";
  /**
   * Offline vanilla registries ship with the tool, so this game can offer a
   * "pick a version" environment mode instead of requiring an install scan.
   */
  hasBundledRegistries: boolean;
  /** What the environment picker asks the user to point at. */
  pickerKind: "instance-folder" | "asset-archive";
  /** `accept` for the plain file input used where the FS Access API is missing. */
  fallbackAccept?: string;
  /**
   * Schematic/structure extensions this game's loader dispatches on, lowercase
   * and dot-prefixed. The single source of truth: the adapter's `canParse` reads
   * it, and the UI derives its `accept` list from it without importing an
   * adapter implementation (which would drag JSZip + Dexie into the main bundle).
   */
  extensions: readonly string[];
}

/**
 * The engine (loader, registry, model compiler) only knows {@link UnifiedBlock},
 * {@link BlockRegistry}, and {@link SchematicStructure}. Everything game-specific
 * — how a registry is built, which file formats parse, which namespace and
 * export formats a game owns — lives behind this seam, and is *asked for* rather
 * than branched on. Shipping a new game means implementing one adapter and
 * registering it; no dispatch site changes.
 */
export interface GameAdapter {
  readonly gameId: GameId;

  /** Declarative facts the UI branches on. Same data as {@link gameMeta}. */
  readonly meta: GameMeta;

  /**
   * True when this game's loader recognises the file. Exactly one adapter should
   * claim a given extension; an unclaimed file falls through to the fallback
   * adapter, whose loader raises the "unsupported format" error.
   */
  canParse(fileName: string): boolean;

  /**
   * True when a block id in this namespace unambiguously belongs to this game.
   * Only *exclusive* namespaces count — modded Minecraft blocks carry arbitrary
   * namespaces, which is what {@link namespaceFallback} resolves.
   */
  ownsNamespace(namespace: string): boolean;

  /**
   * Claims every namespace no other adapter owns. At most one adapter sets this;
   * it also receives files no adapter can parse and formats none can export.
   */
  readonly namespaceFallback: boolean;

  /** Export formats this game's writers produce. */
  readonly formats: readonly ExportFormat[];

  /** True when {@link formats} contains the format. */
  canExport(format: ExportFormat): boolean;

  /**
   * This game's empty-space block. Cross-game conversion substitutes it for a
   * palette entry that never got mapped, so a foreign id is dropped rather than
   * written into the target file. Returns a fresh object per call — a palette
   * must never hold the same block instance twice.
   */
  airBlock(): UnifiedBlock;

  /**
   * Build a block registry from the files collected for an environment. What
   * those files are is game-specific (Minecraft: launcher metadata + mod JARs;
   * Hytale: the install's Assets.zip), so each adapter picks what it needs.
   */
  buildRegistry(
    files: File[],
    onProgress: ProgressCb,
    options?: BuildRegistryOptions,
  ): Promise<BlockRegistry>;

  /** Parse a schematic/structure file into the engine's neutral representation. */
  parseSchematic(file: File): Promise<SchematicStructure>;
}

/** Drives the game switcher in the UI. Order is display order. */
export const GAMES: readonly GameMeta[] = [
  {
    gameId: "minecraft",
    status: "available",
    hasBundledRegistries: true,
    pickerKind: "instance-folder",
    extensions: [".schem", ".schematic", ".litematic", ".nbt", ".mca"],
  },
  {
    gameId: "hytale",
    status: "available",
    hasBundledRegistries: false,
    pickerKind: "asset-archive",
    fallbackAccept: ".zip",
    extensions: [".prefab.json", ".prefab"],
  },
] as const;

/** Declarative facts for a game — importable without any adapter implementation. */
export function gameMeta(gameId: GameId): GameMeta {
  return (
    GAMES.find((g) => g.gameId === gameId) ?? {
      gameId,
      status: "coming-soon",
      hasBundledRegistries: false,
      pickerKind: "instance-folder",
      extensions: [],
    }
  );
}

export function gameStatus(gameId: GameId): GameMeta["status"] {
  return gameMeta(gameId).status;
}
