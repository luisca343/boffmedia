/**
 * Vanilla NBT structure (`.nbt`) loader.
 *
 * Format (saved by Structure Blocks, placed/saved with `/structure`):
 *   Root:
 *     DataVersion: int
 *     size: list[int, int, int]   → [width, height, depth]
 *     palette: list[{Name: string, Properties?: compound}]
 *     blocks: list[{pos: list[int,int,int], state: int, nbt?: compound}]
 *     entities: list (optional)
 *
 * The blocks list is sparse: only non-air blocks are included.
 * We fill a dense YZX blockData array from the explicit positions.
 */
import {
  parseNBT,
  asCompound,
  asNumber,
  asList,
  type NbtCompound,
  type NbtValue,
} from "../parsers/nbt";
import { parsePaletteEntry } from "../normalizer";
import type { SchematicStructure, UnifiedBlock, TileEntity } from "../types";

function entryToBlock(entry: NbtCompound): UnifiedBlock {
  const name = typeof entry.Name === "string" ? entry.Name : "minecraft:air";
  const props = entry.Properties;
  if (
    props !== undefined &&
    typeof props === "object" &&
    !Array.isArray(props) &&
    !(props instanceof Uint8Array) &&
    !(props instanceof Int32Array) &&
    !(props instanceof BigInt64Array)
  ) {
    const strProps: Record<string, string> = {};
    for (const [k, v] of Object.entries(props as NbtCompound)) {
      if (typeof v === "string") strProps[k] = v;
    }
    return parsePaletteEntry(name, strProps);
  }
  return parsePaletteEntry(name);
}

export function loadNbtStruct(data: Uint8Array, fileName: string): SchematicStructure {
  const root = parseNBT(data);

  const dataVersion =
    root.DataVersion !== undefined ? asNumber(root.DataVersion, "DataVersion") : 0;

  // size is stored as a TAG_List of three TAG_Ints
  const sizeList = asList(root.size, "size");
  const width = asNumber(sizeList[0], "size[0]");
  const height = asNumber(sizeList[1], "size[1]");
  const depth = asNumber(sizeList[2], "size[2]");

  // Palette
  const paletteList = asList(root.palette, "palette");
  const palette: UnifiedBlock[] = paletteList.map((entry, i) =>
    entryToBlock(asCompound(entry as NbtValue, `palette[${i}]`))
  );

  // Air index for filling unoccupied positions
  const airIdx = palette.findIndex((b) => b.id === "minecraft:air");
  const fillIdx = airIdx >= 0 ? airIdx : 0;

  // Dense blockData array (YZX order)
  const volume = width * height * depth;
  const blockData = new Int32Array(volume).fill(fillIdx);
  const tileEntities: TileEntity[] = [];

  const blocksList = asList(root.blocks, "blocks");
  for (const raw of blocksList) {
    const blk = asCompound(raw as NbtValue, "blocks[]");
    const posList = asList(blk.pos, "blocks[].pos");
    const x = asNumber(posList[0] as NbtValue, "pos[0]");
    const y = asNumber(posList[1] as NbtValue, "pos[1]");
    const z = asNumber(posList[2] as NbtValue, "pos[2]");
    const state = asNumber(blk.state, "blocks[].state");

    const linearIdx = (y * depth + z) * width + x;
    if (linearIdx >= 0 && linearIdx < volume) {
      blockData[linearIdx] = state;
    }

    if (blk.nbt) {
      const nbtComp = blk.nbt as NbtCompound;
      tileEntities.push({
        pos: { x, y, z },
        id: typeof nbtComp.id === "string" ? nbtComp.id : "unknown",
        data: nbtComp as Record<string, unknown>,
      });
    }
  }

  return {
    format: "nbt",
    formatVersion: dataVersion,
    dimensions: { x: width, y: height, z: depth },
    palette,
    blockData,
    tileEntities,
    entities: [],
    metadata: { fileName, dataVersion },
  };
}
