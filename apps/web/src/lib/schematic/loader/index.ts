import { loadSchem } from "./schem";
import { isMceditSchematic, loadMcedit } from "./mcedit";
import { loadLitematic } from "./litematic";
import { loadNbtStruct } from "./nbt-struct";
import { loadMca } from "./mca";
import { loadPrefab } from "./prefab";
import { parseNBT } from "../parsers/nbt";
import type { SchematicParseOptions, SchematicStructure } from "../types";
import { ERR, codedError } from "../errors";

/**
 * Dispatch a schematic file to the right loader based on its extension.
 *
 * .schem       — WorldEdit Sponge v2/v3
 * .schematic   — Sponge (some exporters) or legacy MCEdit (≤ 1.12.2); the two
 *                share an extension, so the parsed NBT is sniffed to tell them
 *                apart. The tag TYPE is what separates them, not its presence:
 *                Sponge v3 also has a `Blocks` key, but as a *compound* nesting
 *                `Palette` + `Data`, whereas legacy stores a flat byte array
 *                there. Testing presence alone misreads every v3 file as legacy.
 * .litematic   — Litematica
 * .nbt         — Vanilla structure block
 * .mca         — Anvil region file (1.13+ palette sections, or pre-1.13 ids)
 * .prefab.json — Hytale prefab
 */
export async function loadSchematicFile(
  file: File,
  options?: SchematicParseOptions,
): Promise<SchematicStructure> {
  const name = file.name.toLowerCase();
  const buffer = new Uint8Array(await file.arrayBuffer());

  if (name.endsWith(".prefab.json") || name.endsWith(".prefab")) {
    return loadPrefab(buffer, file.name);
  }
  if (name.endsWith(".schem") || name.endsWith(".schematic")) {
    const root = parseNBT(buffer);
    return isMceditSchematic(root)
      ? loadMcedit(root, file.name, { worldIds: options?.worldIds })
      : loadSchem(root, file.name);
  }
  if (name.endsWith(".litematic")) {
    return loadLitematic(buffer, file.name);
  }
  if (name.endsWith(".nbt")) {
    return loadNbtStruct(buffer, file.name);
  }
  if (name.endsWith(".mca")) {
    return loadMca(buffer, file.name, { worldIds: options?.worldIds });
  }
  throw codedError(ERR.schematicUnsupported, `Unsupported file type: ${file.name}`);
}
