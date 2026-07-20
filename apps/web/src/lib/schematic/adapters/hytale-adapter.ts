import type {
  BlockRegistry,
  SchematicStructure,
  ProgressCb,
  ExportFormat,
  UnifiedBlock,
} from "../types";
import { buildHytaleRegistry } from "../registry/hytale";
import { loadPrefab } from "../loader/prefab";
import type { BuildRegistryOptions, GameAdapter, GameMeta } from "./game-adapter";
import { gameMeta } from "./game-adapter";

const FORMATS = ["prefab"] as const satisfies readonly ExportFormat[];

/**
 * Hytale implementation.
 *
 * - Registry: derived from the install's `Assets.zip` (central directory only —
 *   the 3.4 GB archive is never fully read; see `registry/hytale`).
 * - Schematics: Hytale prefabs (`.prefab.json`).
 *
 * The engine is unchanged — it only sees UnifiedBlock / BlockRegistry /
 * SchematicStructure.
 */
export class HytaleAdapter implements GameAdapter {
  readonly gameId = "hytale" as const;
  readonly meta: GameMeta = gameMeta("hytale");
  readonly namespaceFallback = false;
  readonly formats: readonly ExportFormat[] = FORMATS;
  airBlock(): UnifiedBlock {
    return {
      id: "hytale:air",
      namespace: "hytale",
      name: "air",
      states: {},
      tags: [],
      source: "vanilla",
    };
  }

  canParse(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    return this.meta.extensions.some((ext) => lower.endsWith(ext));
  }

  ownsNamespace(namespace: string): boolean {
    return namespace === "hytale";
  }

  canExport(format: ExportFormat): boolean {
    return this.formats.includes(format);
  }

  buildRegistry(
    files: File[],
    onProgress: ProgressCb,
    options?: BuildRegistryOptions,
  ): Promise<BlockRegistry> {
    return buildHytaleRegistry(files, onProgress, {
      requiredBlockIds: options?.requiredBlockIds,
    });
  }

  async parseSchematic(file: File): Promise<SchematicStructure> {
    const buffer = new Uint8Array(await file.arrayBuffer());
    return loadPrefab(buffer, file.name);
  }
}
