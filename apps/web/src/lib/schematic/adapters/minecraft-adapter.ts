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
import { createModdedModelResolver } from "../registry/modded-models";
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

  async buildRegistry(
    files: File[],
    onProgress: ProgressCb,
    options?: BuildRegistryOptions,
  ): Promise<BlockRegistry> {
    const metaFiles = files.filter((f) => isInstanceMetaFile(f.name));
    const jarFiles = files.filter((f) => f.name.toLowerCase().endsWith(".jar"));
    const registry = await buildScannedRegistry(metaFiles, jarFiles, onProgress, options?.override);
    // Attached here, not inside the registry builder: that one short-circuits on
    // an IndexedDB cache hit without ever opening a JAR, while `files` is present
    // on every scan. The resolver holds the `File` handles (a lazy read, not a
    // load) and is never part of the serialized registry.
    registry.getModelForStates = createModdedModelResolver(jarFiles, registry.version);
    return registry;
  }

  parseSchematic(file: File, options?: SchematicParseOptions): Promise<SchematicStructure> {
    return loadSchematicFile(file, options);
  }
}
