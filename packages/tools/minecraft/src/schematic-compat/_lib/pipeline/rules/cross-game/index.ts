import type { GameId } from "../../../../../engine/adapters/game-adapter";
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

/**
 * Block ids this table maps *to* for a game, so a scanned registry can be asked
 * to guarantee them. A cross-game target that the picked install doesn't define
 * would otherwise resolve to nothing and the mapping would silently drop.
 *
 * The registry builder takes these as an argument rather than reading this
 * table: what blocks exist is registry construction, what blocks map to is
 * conversion policy, and only this direction of the dependency is sound.
 * `air` is excluded — every game supplies its own via the adapter.
 */
export function crossGameTargetIds(targetGame: GameId): string[] {
  const prefix = `${targetGame}:`;
  const targets = new Set<string>();
  for (const map of [TABLE.minecraftToHytale, TABLE.hytaleToMinecraft]) {
    for (const id of Object.values(map)) {
      if (id.startsWith(prefix) && id !== `${prefix}air`) targets.add(id);
    }
  }
  return [...targets];
}
