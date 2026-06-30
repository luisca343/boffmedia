import { loadSchem } from "./schem";
import { loadLitematic } from "./litematic";
import { loadNbtStruct } from "./nbt-struct";
import { loadMca } from "./mca";
import { loadPrefab } from "./prefab";
import type { SchematicStructure } from "../../types";

/**
 * Dispatch a schematic file to the right loader based on its extension.
 *
 * .schem       — WorldEdit Sponge v2/v3
 * .litematic   — Litematica
 * .nbt         — Vanilla structure block
 * .mca         — Anvil region file (1.13+)
 * .prefab.json — Hytale prefab
 */
export async function loadSchematicFile(file: File): Promise<SchematicStructure> {
  const name = file.name.toLowerCase();
  const buffer = new Uint8Array(await file.arrayBuffer());

  if (name.endsWith(".prefab.json") || name.endsWith(".prefab")) {
    return loadPrefab(buffer, file.name);
  }
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
    return loadMca(buffer, file.name);
  }
  throw new Error(`Unsupported file type: ${file.name}`);
}
