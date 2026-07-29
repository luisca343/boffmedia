import type {
  BlockRegistry,
  SchematicStructure,
  ProgressCb,
  ExportFormat,
  UnifiedBlock,
  SchematicParseOptions,
} from "../types";
import { loadSchematicFile } from "../loader";
import { buildScannedRegistry, isInstanceMetaFile } from "../registry";
import type { BuildRegistryOptions, GameAdapter, GameMeta } from "./game-adapter";
import { gameMeta } from "./game-adapter";

const FORMATS = ["schem", "schem3", "litematic", "nbt"] as const satisfies readonly ExportFormat[];

/**
 * Minecraft implementation — a thin facade over the engine's loader and registry
 * builder. All the real work (NBT parsing, JAR scanning) lives in `loader/*` and
 * `registry/*`; the adapter names those entry points behind the
 * {@link GameAdapter} seam and declares what the game owns, so nothing dispatches
 * by comparing game ids.
 */
export class MinecraftAdapter implements GameAdapter {
  readonly gameId = "minecraft" as const;
  readonly meta: GameMeta = gameMeta("minecraft");
  /** Mod blocks carry arbitrary namespaces, so Minecraft claims the remainder. */
  readonly namespaceFallback = true;
  readonly formats: readonly ExportFormat[] = FORMATS;
  airBlock(): UnifiedBlock {
    return {
      id: "minecraft:air",
      namespace: "minecraft",
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
    return namespace === "minecraft";
  }

  canExport(format: ExportFormat): boolean {
    return this.formats.includes(format);
  }

  buildRegistry(
    files: File[],
    onProgress: ProgressCb,
    options?: BuildRegistryOptions,
  ): Promise<BlockRegistry> {
    const metaFiles = files.filter((f) => isInstanceMetaFile(f.name));
    const jarFiles = files.filter((f) => f.name.toLowerCase().endsWith(".jar"));
    return buildScannedRegistry(metaFiles, jarFiles, onProgress, options?.override);
  }

  parseSchematic(file: File, options?: SchematicParseOptions): Promise<SchematicStructure> {
    return loadSchematicFile(file, options);
  }
}
