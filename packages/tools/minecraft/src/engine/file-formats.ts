/**
 * The schematic/structure file types the loaders actually accept, derived from
 * the registered adapters' declared extensions rather than restated in the UI.
 *
 * Reads only {@link GAMES} (plain data), never an adapter implementation, so a
 * file picker can import this without pulling JSZip + Dexie into the main bundle.
 */
import { GAMES } from "./adapters/game-adapter";

/** Every parseable extension, lowercase and dot-prefixed, in adapter order. */
export function schematicExtensions(): string[] {
  const seen = new Set<string>();
  for (const game of GAMES) {
    for (const ext of game.extensions) seen.add(ext);
  }
  return [...seen];
}

/** `accept` attribute for a schematic `<input type="file">`. */
export function schematicAccept(): string {
  return schematicExtensions().join(",");
}

/**
 * Human-readable hint for the drop zone. `.schematic` is folded away: it is the
 * same WorldEdit family as `.schem` and listing both reads as two formats.
 */
export function schematicHint(): string {
  return schematicExtensions()
    .filter((ext) => ext !== ".schematic" && ext !== ".prefab.json")
    .join(" · ");
}
