import type { GameId } from "../../../adapters/game-adapter";
import MC_HYTALE from "./minecraft-hytale.json";

interface CrossGameTable {
  minecraftToHytale: Record<string, string>;
  hytaleToMinecraft: Record<string, string>;
}

const TABLE = MC_HYTALE as unknown as CrossGameTable;

/**
 * Direct block-id translation table from one game to another.
 *
 * Returns a `sourceId → targetId` map (full ids on both sides, e.g.
 * `minecraft:stone → hytale:Rock_Stone`) when a curated cross-game mapping
 * exists for the pair, otherwise `null` (same game, or an unsupported pair —
 * the caller falls back to its normal same-game rename heuristics).
 */
export function crossGameMap(
  sourceGame: GameId,
  targetGame: GameId
): Record<string, string> | null {
  if (sourceGame === targetGame) return null;
  if (sourceGame === "minecraft" && targetGame === "hytale") {
    return TABLE.minecraftToHytale;
  }
  if (sourceGame === "hytale" && targetGame === "minecraft") {
    return TABLE.hytaleToMinecraft;
  }
  return null;
}
