/**
 * MCEdit / WorldEdit "Alpha" `.schematic` loader (Minecraft ≤ 1.12.2).
 *
 * Pre-flattening format: numeric block IDs in a `Blocks` byte array (plus an
 * optional `AddBlocks` nibble array for IDs > 255) and per-block metadata in
 * `Data`, YZX-ordered like Sponge. Vanilla IDs are translated to modern
 * blockstates via the bundled WorldEdit legacy table.
 *
 * Mod IDs have no portable meaning: the id↔name map lives in the source
 * *world's* `level.dat`, not in the schematic, and the same numeric id means
 * different blocks in different worlds even under the same modpack. They
 * resolve only when the caller supplies that world's map (see `level-dat.ts`)
 * or when the file carries a Schematica `SchematicaMapping` compound; otherwise
 * they surface as `unknown:block_<id>`.
 */
import { asByteArray, asNumber, type NbtCompound, type NbtValue } from "../parsers/nbt";
import { serializeBlockState } from "../normalizer";
import { loadLegacyTables, resolveLegacyBlock } from "./legacy/legacy-mapper";
import type {
  LegacyIdMap,
  SchematicStructure,
  UnifiedBlock,
  TileEntity,
  Entity,
} from "../types";

function isCompound(v: NbtValue | undefined): v is NbtCompound {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !ArrayBuffer.isView(v);
}

/** Some exporters wrap everything in a "Schematic" compound; most name the root instead. */
function unwrap(root: NbtCompound): NbtCompound {
  return isCompound(root.Schematic) ? root.Schematic : root;
}

/**
 * Detect the legacy MCEdit layout: a `Blocks` *byte array* (Sponge v3 also has
 * a `Blocks` key, but there it is a compound) and none of the Sponge palette
 * fields. Used by the dispatcher because both formats ship as `.schematic`.
 */
export function isMceditSchematic(root: NbtCompound): boolean {
  const schem = unwrap(root);
  return (
    ArrayBuffer.isView(schem.Blocks) &&
    schem.Palette === undefined &&
    schem.BlockData === undefined
  );
}

/** Schematica exports carry a name→id compound that lets us resolve mod IDs. */
function readSchematicaMapping(schem: NbtCompound): Map<number, string> | undefined {
  if (!isCompound(schem.SchematicaMapping)) return undefined;
  const out = new Map<number, string>();
  for (const [name, id] of Object.entries(schem.SchematicaMapping)) {
    if (typeof id === "number") out.set(id & 0xffff, name);
  }
  return out.size ? out : undefined;
}

/** Legacy tile entities key position as loose `x`/`y`/`z` ints, not a Pos array. */
function readTileEntities(schem: NbtCompound): TileEntity[] {
  if (!Array.isArray(schem.TileEntities)) return [];
  const out: TileEntity[] = [];
  for (const raw of schem.TileEntities) {
    if (!isCompound(raw)) continue;
    out.push({
      pos: {
        x: typeof raw.x === "number" ? raw.x : 0,
        y: typeof raw.y === "number" ? raw.y : 0,
        z: typeof raw.z === "number" ? raw.z : 0,
      },
      id: typeof raw.id === "string" ? raw.id : "unknown",
      data: { ...raw },
    });
  }
  return out;
}

function readEntities(schem: NbtCompound): Entity[] {
  if (!Array.isArray(schem.Entities)) return [];
  const out: Entity[] = [];
  for (const raw of schem.Entities) {
    if (!isCompound(raw)) continue;
    const pos = Array.isArray(raw.Pos) ? raw.Pos : [];
    out.push({
      pos: [
        typeof pos[0] === "number" ? pos[0] : 0,
        typeof pos[1] === "number" ? pos[1] : 0,
        typeof pos[2] === "number" ? pos[2] : 0,
      ],
      id: typeof raw.id === "string" ? raw.id : "unknown",
      data: { ...raw },
    });
  }
  return out;
}

export interface McEditOptions {
  /** `level.dat` id→name map of the world this schematic was cut from. */
  worldIds?: LegacyIdMap;
}

export async function loadMcedit(
  root: NbtCompound,
  fileName: string,
  options?: McEditOptions,
): Promise<SchematicStructure> {
  const schem = unwrap(root);

  const width = asNumber(schem.Width, "Width") & 0xffff;
  const height = asNumber(schem.Height, "Height") & 0xffff;
  const length = asNumber(schem.Length, "Length") & 0xffff;
  const volume = width * height * length;

  const blocksRaw = asByteArray(schem.Blocks, "Blocks");
  const dataRaw = asByteArray(schem.Data, "Data");
  if (blocksRaw.length < volume || dataRaw.length < volume) {
    throw new Error(
      `Corrupt .schematic: ${width}×${height}×${length} needs ${volume} blocks, ` +
        `file has ${Math.min(blocksRaw.length, dataRaw.length)}`,
    );
  }
  // WorldEdit writes "AddBlocks"; MCEdit itself writes "Add". Same nibble layout.
  const addRaw = ArrayBuffer.isView(schem.AddBlocks)
    ? (schem.AddBlocks as Uint8Array)
    : ArrayBuffer.isView(schem.Add)
      ? (schem.Add as Uint8Array)
      : undefined;

  const tables = await loadLegacyTables();
  const table = tables.blocks;
  const schematicaIds = readSchematicaMapping(schem);
  const worldIds = options?.worldIds;

  const palette: UnifiedBlock[] = [];
  const paletteIndex = new Map<number, number>();
  const statePaletteIndex = new Map<string, number>();
  const blockData = new Int32Array(volume);
  const unknownIds = new Set<number>();

  for (let i = 0; i < volume; i++) {
    let id = blocksRaw[i];
    if (addRaw) {
      // WorldEdit nibble order: even index → low nibble, odd index → high.
      const byte = addRaw[i >> 1] ?? 0;
      id |= ((i & 1) === 0 ? byte & 0x0f : byte >> 4) << 8;
    }
    const meta = dataRaw[i] & 0x0f;

    const key = (id << 4) | meta;
    let pi = paletteIndex.get(key);
    if (pi === undefined) {
      const block = resolveLegacyBlock(id, meta, table, worldIds, schematicaIds, unknownIds);
      // Distinct legacy id:meta pairs (e.g. leaf decay variants) often flatten
      // to the same modern state — share one palette entry when they do.
      const stateKey = serializeBlockState(block);
      pi = statePaletteIndex.get(stateKey);
      if (pi === undefined) {
        pi = palette.length;
        palette.push(block);
        statePaletteIndex.set(stateKey, pi);
      }
      paletteIndex.set(key, pi);
    }
    blockData[i] = pi;
  }

  return {
    format: "mcedit",
    formatVersion: 1,
    dimensions: { x: width, y: height, z: length },
    palette,
    blockData,
    tileEntities: readTileEntities(schem),
    entities: readEntities(schem),
    metadata: {
      fileName,
      materials: typeof schem.Materials === "string" ? schem.Materials : undefined,
      unknownLegacyIds: [...unknownIds].sort((a, b) => a - b),
      worldIdsApplied: worldIds ? worldIds.size : 0,
      offset: {
        x: typeof schem.WEOffsetX === "number" ? schem.WEOffsetX : 0,
        y: typeof schem.WEOffsetY === "number" ? schem.WEOffsetY : 0,
        z: typeof schem.WEOffsetZ === "number" ? schem.WEOffsetZ : 0,
      },
    },
  };
}
