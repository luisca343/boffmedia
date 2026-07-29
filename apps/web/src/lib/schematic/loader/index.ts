import { loadSchem } from "./schem";
import { isMceditSchematic, loadMcedit } from "./mcedit";
import { loadLitematic } from "./litematic";
import { loadNbtStruct } from "./nbt-struct";
import { loadMca } from "./mca";
import { loadPrefab } from "./prefab";
import { parseNBT } from "../parsers/nbt";
import { isLittleTilesEntity, isModernLittleTilesEntity, parseLittleTiles } from "./littletiles";
import { loadLegacyTables } from "./legacy/legacy-mapper";
import type { SchematicParseOptions, SchematicStructure, UnifiedBlock } from "../types";
import { ERR, codedError } from "../errors";

/**
 * Post-parse step shared by every Minecraft loader: when a structure carries
 * LittleTiles tile entities (either generation), parse them into per-material
 * micro-box groups and re-point their host cells.
 *
 * The re-pointing matters most for pre-1.13 inputs: a cell hosting an LT tile
 * entity is by definition the mod's host block, but its numeric id → name
 * mapping is per-world, so without it the cell reads `unknown:block_<id>`. The
 * TE id is a portable string, which makes it the reliable signal. Only cells
 * hosting a MODERN-format TE keep their palette entry untouched (byte-faithful
 * re-export); a legacy host is re-pointed even when its id resolved to a real
 * name like `littletiles:blocklittletiles` via the world's level.dat — that
 * block no longer exists in modern versions and must not survive as a grid row.
 */
async function attachLittleTiles(structure: SchematicStructure): Promise<SchematicStructure> {
  if (!structure.tileEntities.some(isLittleTilesEntity)) return structure;
  const littleTiles = parseLittleTiles(structure.tileEntities, await loadLegacyTables());
  if (!littleTiles) return structure;

  const { x: width, y: height, z: length } = structure.dimensions;
  let hostIdx = -1;
  for (const te of structure.tileEntities) {
    if (!isLittleTilesEntity(te)) continue;
    const { x, y, z } = te.pos;
    if (x < 0 || y < 0 || z < 0 || x >= width || y >= height || z >= length) continue;
    const cell = (y * length + z) * width + x;
    if (isModernLittleTilesEntity(te)) continue;
    if (hostIdx === -1) {
      hostIdx = structure.palette.length;
      const marker: UnifiedBlock = {
        id: "littletiles:tiles",
        namespace: "littletiles",
        name: "tiles",
        states: {},
        tags: [],
        source: "mod",
        modId: "littletiles",
      };
      structure.palette.push(marker);
    }
    structure.blockData[cell] = hostIdx;
  }
  return { ...structure, littleTiles };
}

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
    return attachLittleTiles(
      await (isMceditSchematic(root)
        ? loadMcedit(root, file.name, { worldIds: options?.worldIds })
        : loadSchem(root, file.name)),
    );
  }
  if (name.endsWith(".litematic")) {
    return attachLittleTiles(loadLitematic(buffer, file.name));
  }
  if (name.endsWith(".nbt")) {
    return loadNbtStruct(buffer, file.name);
  }
  if (name.endsWith(".mca")) {
    return attachLittleTiles(await loadMca(buffer, file.name, { worldIds: options?.worldIds }));
  }
  throw codedError(ERR.schematicUnsupported, `Unsupported file type: ${file.name}`);
}
