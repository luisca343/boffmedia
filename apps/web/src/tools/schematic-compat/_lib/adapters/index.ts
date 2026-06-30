import type { GameAdapter, GameId } from "./game-adapter";
import { MinecraftAdapter } from "./minecraft-adapter";
import { HytaleAdapter } from "./hytale-adapter";

export type { GameAdapter, GameId, GameMeta } from "./game-adapter";
export { NotImplementedError, GAMES, gameStatus } from "./game-adapter";

const adapters: Record<GameId, GameAdapter> = {
  minecraft: new MinecraftAdapter(),
  hytale: new HytaleAdapter(),
};

/** Resolve the adapter for a game. The returned instances are stateless singletons. */
export function getAdapter(gameId: GameId): GameAdapter {
  return adapters[gameId];
}
