import type {
  BlockRegistry,
  SchematicStructure,
  ProgressCb,
} from "../types";
import type { ExportFormat } from "../pipeline/exporter";
import { loadSchematicFile } from "../pipeline/loader";
import { buildScannedRegistry, isInstanceMetaFile } from "../pipeline/registry";
import { exportStructure } from "../pipeline/exporter";
import type { GameAdapter } from "./game-adapter";

/**
 * Minecraft implementation — a thin facade over the existing pipeline. All the
 * real work (NBT parsing, JAR scanning, format writers) already lives in
 * `pipeline/*`; the adapter just names those entry points behind the
 * {@link GameAdapter} seam so the worker is game-agnostic.
 */
export class MinecraftAdapter implements GameAdapter {
  readonly gameId = "minecraft" as const;

  buildRegistry(files: File[], onProgress: ProgressCb): Promise<BlockRegistry> {
    const metaFiles = files.filter((f) => isInstanceMetaFile(f.name));
    const jarFiles = files.filter((f) => f.name.toLowerCase().endsWith(".jar"));
    return buildScannedRegistry(metaFiles, jarFiles, onProgress);
  }

  parseSchematic(file: File): Promise<SchematicStructure> {
    return loadSchematicFile(file);
  }

  export(structure: SchematicStructure, format: ExportFormat): Uint8Array | Blob {
    return exportStructure(structure, format);
  }
}
