import { loadSchem } from "./schem";
import { loadLitematic } from "./litematic";
import { loadNbtStruct } from "./nbt-struct";
import { loadMca } from "./mca";
import { loadPrefab } from "./prefab";
import { parseNBT, type NbtCompound } from "../../parsers/nbt";
import type { SchematicStructure } from "../../types";
import { ERR, codedError } from "../../errors";

/**
 * A pre-1.13 MCEdit `.schematic` carries `Blocks`/`Data` byte arrays of numeric
 * block ids instead of a `Palette` — and those ids are per-world for modded
 * saves, so translating them needs the world's id table, not just the file.
 * Detect it up front: the Sponge loader would otherwise die on a missing
 * "Palette" with no hint about why.
 *
 * The tag TYPE is what separates the formats, not its presence: Sponge v3 also
 * has a `Blocks` key, but as a *compound* nesting `Palette` + `Data`, whereas
 * legacy stores a flat byte array there. Testing presence alone misreads every
 * modern v3 file as legacy.
 */
function isLegacySchematic(buffer: Uint8Array): boolean {
  try {
    const root = parseNBT(buffer);
    const schem = (root.Schematic ?? root) as NbtCompound;
    return ArrayBuffer.isView(schem.Blocks) && schem.Palette === undefined;
  } catch {
    return false;
  }
}

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
    if (isLegacySchematic(buffer)) {
      throw codedError(
        ERR.schematicLegacy,
        "This is a pre-1.13 MCEdit schematic (numeric block ids), which this tool cannot read yet.",
      );
    }
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
  throw codedError(ERR.schematicUnsupported, `Unsupported file type: ${file.name}`);
}
