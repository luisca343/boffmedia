import type {
  BlockRegistry,
  SchematicStructure,
  ProgressCb,
} from "../types";
import type { ExportFormat } from "../pipeline/exporter";

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

/**
 * The engine (loader, diff, rules, exporter) only knows {@link UnifiedBlock},
 * {@link BlockRegistry}, and {@link SchematicStructure}. Everything game-specific
 * — how a registry is built, which file formats parse, how a structure is
 * serialised — lives behind this seam. Shipping a new game means implementing
 * one adapter; the engine doesn't change.
 */
export interface GameAdapter {
  readonly gameId: GameId;

  /**
   * Build a block registry from the files collected for an environment. What
   * those files are is game-specific (Minecraft: launcher metadata + mod JARs;
   * Hytale: the install's Assets.zip), so each adapter picks what it needs.
   */
  buildRegistry(files: File[], onProgress: ProgressCb): Promise<BlockRegistry>;

  /** Parse a schematic/structure file into the engine's neutral representation. */
  parseSchematic(file: File): Promise<SchematicStructure>;

  /** Serialise a (already version-converted) structure back to bytes. */
  export(structure: SchematicStructure, format: ExportFormat): Uint8Array;
}

/** UI-facing metadata for a game: label + whether the adapter is usable yet. */
export interface GameMeta {
  gameId: GameId;
  status: "available" | "coming-soon";
}

/** Drives the game switcher in the UI. Order is display order. */
export const GAMES: readonly GameMeta[] = [
  { gameId: "minecraft", status: "available" },
  { gameId: "hytale", status: "available" },
] as const;

export function gameStatus(gameId: GameId): GameMeta["status"] {
  return GAMES.find((g) => g.gameId === gameId)?.status ?? "coming-soon";
}
