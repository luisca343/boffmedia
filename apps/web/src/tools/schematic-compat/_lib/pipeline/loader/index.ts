import { loadSchem } from "./schem";
import { loadLitematic } from "./litematic";
import { loadNbtStruct } from "./nbt-struct";
import type { SchematicStructure } from "../../types";

/**
 * Dispatch a schematic file to the right loader based on its extension.
 *
 * Phase 1: .schem (WorldEdit Sponge v2/v3)
 * Phase 2: .litematic (Litematica), .nbt (vanilla structure)
 * Phase 5: .mca (region file)
 */
export async function loadSchematicFile(file: File): Promise<SchematicStructure> {
  const name = file.name.toLowerCase();
  const buffer = new Uint8Array(await file.arrayBuffer());

  if (name.endsWith(".schem") || name.endsWith(".schematic")) {
    return loadSchem(buffer, file.name);
  }
  if (name.endsWith(".litematic")) {
    return loadLitematic(buffer, file.name);
  }
  if (name.endsWith(".nbt")) {
    return loadNbtStruct(buffer, file.name);
  }
  if (name.endsWith(".mca")) {
    throw new Error("`.mca` region support is coming in Phase 5");
  }
  throw new Error(`Unsupported file type: ${file.name}`);
}
