import type { UnifiedBlock, ExportFormat } from "../types";
import type { GameAdapter, GameId } from "./game-adapter";
import { MinecraftAdapter } from "./minecraft-adapter";
import { HytaleAdapter } from "./hytale-adapter";

export type { GameAdapter, GameId, GameMeta, BuildRegistryOptions } from "./game-adapter";
export { NotImplementedError, GAMES, gameMeta, gameStatus } from "./game-adapter";

/**
 * Every registered adapter, in resolution order. This array is the *only* place
 * that knows which games exist: all dispatch below asks the adapters rather than
 * comparing game ids, so adding a game means adding a row here.
 */
const ADAPTERS: readonly GameAdapter[] = [new MinecraftAdapter(), new HytaleAdapter()];

const BY_ID = new Map<GameId, GameAdapter>(ADAPTERS.map((a) => [a.gameId, a]));

/** The adapter that claims whatever no other adapter does. */
const FALLBACK: GameAdapter =
  ADAPTERS.find((a) => a.namespaceFallback) ?? ADAPTERS[0];

/** Resolve the adapter for a game. The returned instances are stateless singletons. */
export function getAdapter(gameId: GameId): GameAdapter {
  return BY_ID.get(gameId) ?? FALLBACK;
}

/** All registered adapters, in display/resolution order. */
export function listAdapters(): readonly GameAdapter[] {
  return ADAPTERS;
}

/**
 * The adapter whose loader handles this file. An unrecognised extension resolves
 * to the fallback adapter, whose loader raises the "unsupported format" error —
 * the same outcome as before, but reached without naming a game.
 */
export function adapterForFile(fileName: string): GameAdapter {
  return ADAPTERS.find((a) => a.canParse(fileName)) ?? FALLBACK;
}

/** The adapter whose writers produce this export format. */
export function adapterForFormat(format: ExportFormat): GameAdapter {
  return ADAPTERS.find((a) => a.canExport(format)) ?? FALLBACK;
}

/**
 * The adapter that owns a block's namespace. Namespaces no adapter claims
 * exclusively (modded Minecraft ids) go to the fallback adapter.
 */
export function adapterForNamespace(namespace: string): GameAdapter {
  return ADAPTERS.find((a) => a.ownsNamespace(namespace)) ?? FALLBACK;
}

/** Which game a block belongs to, asked of the adapters rather than branched on. */
export function gameOfBlock(block: UnifiedBlock): GameId {
  return adapterForNamespace(block.namespace).gameId;
}
