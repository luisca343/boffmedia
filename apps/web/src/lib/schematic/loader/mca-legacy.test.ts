import { describe, expect, it } from "vitest";
import { deflate } from "pako";
import { loadMca } from "./mca";
import { parseLevelDat } from "./level-dat";
import {
  encodeNBT,
  Byte,
  ByteArr,
  Compound,
  Int,
  List,
  Str,
  type Tag,
} from "../parsers/nbt-writer";
import { NBT_TAG } from "../parsers/nbt";

/**
 * Build a one-chunk region whose single section is pre-flattening: a `Blocks`
 * byte array plus `Data`/`Add` nibble arrays and no `Palette`.
 *
 * `cells` are `[index, id, meta]` triples within the 16×16×16 section, where
 * index = (y*16 + z)*16 + x. Everything else stays id 0 (air).
 */
function legacyRegion(cells: Array<[number, number, number]>, dataVersion = 1343): Uint8Array {
  const blocks = new Uint8Array(4096);
  const data = new Uint8Array(2048);
  const add = new Uint8Array(2048);
  let needsAdd = false;

  const setNibble = (arr: Uint8Array, i: number, v: number) => {
    const byte = i >> 1;
    arr[byte] = (i & 1) === 0 ? (arr[byte] & 0xf0) | (v & 0x0f) : (arr[byte] & 0x0f) | (v << 4);
  };

  for (const [index, id, meta] of cells) {
    blocks[index] = id & 0xff;
    setNibble(data, index, meta);
    if (id > 0xff) {
      setNibble(add, index, (id >> 8) & 0x0f);
      needsAdd = true;
    }
  }

  const section: Record<string, Tag> = {
    Y: Byte(0),
    Blocks: ByteArr(blocks),
    Data: ByteArr(data),
    ...(needsAdd ? { Add: ByteArr(add) } : {}),
  };

  const chunk = encodeNBT({
    DataVersion: Int(dataVersion),
    Level: Compound({
      xPos: Int(0),
      zPos: Int(0),
      Sections: List(NBT_TAG.Compound, [Compound(section)]),
    }),
  });

  const compressed = deflate(chunk);
  const sectors = Math.ceil((compressed.length + 5) / 4096);
  const out = new Uint8Array(8192 + sectors * 4096);
  const view = new DataView(out.buffer);

  // Chunk (0,0) lives at sector 2, right after the 8 KB header.
  out[0] = 0;
  out[1] = 0;
  out[2] = 2;
  out[3] = sectors;

  view.setUint32(8192, compressed.length + 1, false);
  out[8196] = 2; // zlib
  out.set(compressed, 8197);
  return out;
}

describe("pre-1.13 .mca regions", () => {
  it("decodes numeric section ids into modern blockstates", async () => {
    // (0,0,0) stone; (1,0,0) red wool (35:14).
    const s = await loadMca(legacyRegion([[0, 1, 0], [1, 35, 14]]), "r.0.0.mca");
    expect(s.metadata.legacy).toBe(true);
    const ids = s.palette.map((b) => b.id);
    expect(ids).toContain("minecraft:stone");
    expect(ids).toContain("minecraft:red_wool");
  });

  it("reads ids above 255 and names them from the world's level.dat", async () => {
    const level = parseLevelDat(
      encodeNBT({
        FML: Compound({
          Registries: Compound({
            "minecraft:blocks": Compound({
              ids: List(NBT_TAG.Compound, [
                Compound({ K: Str("rustic:granite_pillar"), V: Int(2178) }),
              ]),
            }),
          }),
        }),
      }),
    );

    const region = legacyRegion([[0, 2178, 0]]);

    const without = await loadMca(region, "r.0.0.mca");
    expect(without.palette.map((b) => b.id)).toContain("unknown:block_2178");
    expect(without.metadata.unknownLegacyIds).toEqual([2178]);

    const withWorld = await loadMca(region, "r.0.0.mca", { worldIds: level.ids });
    expect(withWorld.palette.map((b) => b.id)).toContain("rustic:granite_pillar");
    expect(withWorld.metadata.unknownLegacyIds).toEqual([]);
  });

  it("leaves 1.13+ regions on the palette path", async () => {
    // Same bytes, but stamped as 1.13: no palette in the section, so nothing is
    // decodable and the region reads as empty rather than being mis-translated.
    const s = await loadMca(legacyRegion([[0, 1, 0]], 1519), "r.0.0.mca");
    expect(s.metadata.legacy).toBeUndefined();
    expect(s.metadata.empty).toBe(true);
  });
});
