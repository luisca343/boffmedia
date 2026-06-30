import type { BlockRegistry, SchematicStructure, ProgressCb } from "../types";
import type { ExportFormat } from "../pipeline/exporter";
import { buildHytaleRegistry } from "../pipeline/registry/hytale";
import { loadPrefab } from "../pipeline/loader/prefab";
import { exportStructure } from "../pipeline/exporter";
import type { GameAdapter } from "./game-adapter";

/**
 * Hytale implementation.
 *
 * - Registry: derived from the install's `Assets.zip` (central directory only —
 *   the 3.4 GB archive is never fully read; see `pipeline/registry/hytale`).
 * - Schematics: Hytale prefabs (`.prefab.json`).
 * - Export: routes through the shared exporter, which knows the `prefab` format.
 *
 * The engine (diff, rules, state transform) is unchanged — it only sees
 * UnifiedBlock / BlockRegistry / SchematicStructure.
 */
export class HytaleAdapter implements GameAdapter {
  readonly gameId = "hytale" as const;

  buildRegistry(files: File[], onProgress: ProgressCb): Promise<BlockRegistry> {
    return buildHytaleRegistry(files, onProgress);
  }

  async parseSchematic(file: File): Promise<SchematicStructure> {
    const buffer = new Uint8Array(await file.arrayBuffer());
    return loadPrefab(buffer, file.name);
  }

  export(structure: SchematicStructure, format: ExportFormat): Uint8Array {
    return exportStructure(structure, format);
  }
}
