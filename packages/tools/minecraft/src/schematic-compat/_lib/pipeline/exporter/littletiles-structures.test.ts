import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { loadSchematicFile } from "../../../../engine/loader";
import type { SchematicStructure, TileEntity } from "../../../../engine/types";
import { convertLittleTilesForExport } from "./littletiles-writer";
import { writeSchem } from "./schem-writer";

const ROOT = "/home/luisca/Programacion/Ficus Labs/boffmedia";

function fileFrom(bytes: Uint8Array, name: string): File {
  return {
    name,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

function fixture(name: string): File {
  const b = readFileSync(`${ROOT}/docs/schem/${name}`);
  return fileFrom(new Uint8Array(b), name);
}

type Pos = { x: number; y: number; z: number };
type ChildEntry = Record<string, unknown> & { tiles: Record<string, Int32Array[]> };

function legacyTE(pos: Pos, children: unknown[], tiles: unknown[] = []): TileEntity {
  return {
    pos,
    id: "minecraft:littletilestileentity",
    data: { content: { grid: 16, tiles, children } },
  };
}

const stone = (box: number[], block = "minecraft:stone") => ({
  block,
  box: new Int32Array(box),
});

function legacyStructure(
  tileEntities: TileEntity[],
  materialMap?: Record<string, string>,
): SchematicStructure {
  const dims = { x: 4, y: 4, z: 4 };
  return {
    format: "mcedit",
    formatVersion: 1,
    dimensions: dims,
    palette: [
      {
        id: "minecraft:stone",
        namespace: "minecraft",
        name: "stone",
        states: {},
        tags: [],
        source: "vanilla",
      },
    ],
    blockData: new Int32Array(dims.x * dims.y * dims.z),
    tileEntities,
    entities: [],
    littleTiles: { blockCount: tileEntities.length, tileCount: 1, groups: [], materialMap },
    metadata: {},
  };
}

function childrenAt(s: SchematicStructure, x: number, y: number, z: number): ChildEntry[] {
  const te = s.tileEntities.find((t) => t.pos.x === x && t.pos.y === y && t.pos.z === z);
  const content = te?.data.content as { children?: ChildEntry[] } | undefined;
  return content?.children ?? [];
}

function warningsOf(s: SchematicStructure): string[] {
  return (s.metadata.littleTilesStructureWarnings as string[] | undefined) ?? [];
}

describe("LittleTiles 1.12 structure conversion", () => {
  it("converts chair, ladder and axis door to modern children entries", async () => {
    const tes = [
      legacyTE({ x: 0, y: 1, z: 0 }, [
        {
          tiles: [stone([0, 0, 0, 16, 1, 16])],
          structure: {
            id: "chair",
            blocks: new Int32Array([0, -1, 0]),
            occupied: 0,
            sit: "someone",
          },
          index: 0,
          type: 0,
        },
      ]),
      legacyTE({ x: 0, y: 0, z: 0 }, [
        {
          tiles: [stone([0, 14, 0, 16, 16, 16])],
          coord: new Int32Array([0, 1, 0]),
          index: 0,
          type: 0,
        },
      ]),
      legacyTE({ x: 1, y: 0, z: 0 }, [
        {
          tiles: [stone([0, 0, 0, 1, 16, 16])],
          structure: { id: "ladder", blocks: new Int32Array([0, 1, 0]) },
          index: 2,
          type: 1,
        },
      ]),
      legacyTE({ x: 1, y: 1, z: 0 }, [
        {
          tiles: [stone([0, 0, 0, 1, 16, 16])],
          coord: new Int32Array([0, -1, 0]),
          index: 2,
          type: 1,
        },
      ]),
      legacyTE({ x: 2, y: 0, z: 0 }, [
        {
          tiles: [stone([5, 0, 0, 10, 16, 16])],
          structure: {
            id: "door",
            axis: 1,
            "rot-type": 1,
            degree: 90,
            duration: 10,
            interpolation: 3,
            axisCenter: new Int32Array([9, -32, 63, 10, -31, 64, 16]),
          },
          index: 0,
          type: 0,
        },
      ]),
    ];

    const out = await convertLittleTilesForExport(legacyStructure(tes));
    expect(warningsOf(out)).toEqual([]);

    const [chairMain] = childrenAt(out, 0, 1, 0);
    expect(chairMain.index).toBe(0);
    expect(chairMain.type).toBe(0);
    expect(chairMain.coord).toBeUndefined();
    const chair = chairMain.structure as Record<string, unknown>;
    expect(chair.id).toBe("chair");
    expect(chair.b).toBeInstanceOf(Int32Array);
    expect([...(chair.b as Int32Array)]).toEqual([0, -1, 0]);
    expect(chair.occupied).toBe(0);
    expect(chair.sit).toBeUndefined();
    const chairTiles = chairMain.tiles["minecraft:stone"];
    // Box arrays carry a computed faceCache at index 0 (littletiles-facecache).
    expect(chairTiles.map((a) => (a.length === 1 ? [...a] : [...a].slice(1)))).toEqual([
      [-1],
      [0, 0, 0, 16, 1, 16],
    ]);
    expect(chairTiles[1][0]).not.toBe(0);

    const [chairMember] = childrenAt(out, 0, 0, 0);
    expect(chairMember.structure).toBeUndefined();
    expect(chairMember.coord).toBeInstanceOf(Int32Array);
    expect([...(chairMember.coord as Int32Array)]).toEqual([0, 1, 0]);
    expect(chairMember.index).toBe(0);

    const [ladderMain] = childrenAt(out, 1, 0, 0);
    expect((ladderMain.structure as Record<string, unknown>).id).toBe("ladder");
    expect(ladderMain.index).toBe(2);
    expect(ladderMain.type).toBe(1);
    const [ladderMember] = childrenAt(out, 1, 1, 0);
    expect(ladderMember.index).toBe(2);
    expect(ladderMember.type).toBe(1);

    const [doorEntry] = childrenAt(out, 2, 0, 0);
    const door = doorEntry.structure as Record<string, unknown>;
    expect(door.id).toBe("axis");
    expect(door.rotation).toEqual({ a: 1, d: 90 });
    expect(door.du).toBe(10);
    expect(door.in).toBe(3);
    expect(door.hand).toBe(1);
    expect(door.sound).toBe(1);
    expect(door.aS).toBe(-1);
    expect(door.cS).toBeUndefined();
    expect([...(door.center as Int32Array)]).toEqual([9, -32, 63, 10, -31, 64, 16]);
    expect(door.s).toEqual([
      { n: "closed", b: 1 },
      { n: "opened", rY: 90, b: 1 },
    ]);
    expect(door.t).toEqual([]);
  });

  it("axis door rot-type 0 writes the clockwise flag and ±90 opened rotation", async () => {
    const te = legacyTE({ x: 0, y: 0, z: 0 }, [
      {
        tiles: [stone([0, 0, 0, 16, 16, 2])],
        structure: { id: "door", axis: 0, "rot-type": 0, clockwise: 0, duration: 4 },
        index: 0,
        type: 0,
      },
    ]);
    const out = await convertLittleTilesForExport(legacyStructure([te]));
    const door = childrenAt(out, 0, 0, 0)[0].structure as Record<string, unknown>;
    expect(door.rotation).toEqual({ a: 0, c: 0 });
    expect(door.s).toEqual([
      { n: "closed", b: 1 },
      { n: "opened", rX: -90, b: 1 },
    ]);
  });

  it("flattens an unknown structure type to free tiles with a warning", async () => {
    const te = legacyTE({ x: 0, y: 0, z: 0 }, [
      {
        tiles: [stone([0, 0, 0, 16, 16, 16])],
        structure: { id: "mystery" },
        index: 0,
        type: 0,
      },
    ]);
    const out = await convertLittleTilesForExport(legacyStructure([te]));

    const converted = out.tileEntities.find((t) => t.id === "littletiles:tiles")!;
    const content = converted.data.content as {
      tiles: Record<string, Int32Array[]>;
      children: unknown[];
    };
    expect(content.children).toEqual([]);
    expect(
      content.tiles["minecraft:stone"].map((a) => (a.length === 1 ? [...a] : [...a].slice(1))),
    ).toEqual([[-1], [0, 0, 0, 16, 16, 16]]);
    const warns = warningsOf(out);
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('"mystery"');
    expect(warns[0]).toContain("(0, 0, 0)");
  });

  it("flattens an orphan member whose main block is outside the selection", async () => {
    const te = legacyTE({ x: 0, y: 0, z: 0 }, [
      {
        tiles: [stone([0, 0, 0, 16, 1, 16])],
        coord: new Int32Array([0, 3, 0]),
        index: 0,
        type: 0,
      },
    ]);
    const out = await convertLittleTilesForExport(legacyStructure([te]));

    const content = out.tileEntities.find((t) => t.id === "littletiles:tiles")!.data.content as {
      tiles: Record<string, Int32Array[]>;
      children: unknown[];
    };
    expect(content.children).toEqual([]);
    expect(Object.keys(content.tiles)).toEqual(["minecraft:stone"]);
    const warns = warningsOf(out);
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain("(0, 3, 0)");
    expect(warns[0]).toContain("main block");
  });

  it("flattens a structure whose blocks index points outside the selection", async () => {
    const te = legacyTE({ x: 0, y: 0, z: 0 }, [
      {
        tiles: [stone([0, 0, 0, 16, 1, 16])],
        structure: { id: "ladder", blocks: new Int32Array([0, -1, 0]) },
        index: 0,
        type: 1,
      },
    ]);
    const out = await convertLittleTilesForExport(legacyStructure([te]));
    const content = out.tileEntities[0].data.content as { children: unknown[] };
    expect(content.children).toEqual([]);
    expect(warningsOf(out)[0]).toContain("cut by the selection");
  });

  it("falls back to attribute type and a deterministic per-block index", async () => {
    const tes = [
      legacyTE({ x: 0, y: 0, z: 0 }, [
        {
          tiles: [stone([0, 0, 0, 1, 16, 16])],
          structure: { id: "ladder", blocks: new Int32Array([0, 1, 0]) },
        },
      ]),
      legacyTE({ x: 0, y: 1, z: 0 }, [
        { tiles: [stone([0, 0, 0, 1, 16, 16])], coord: new Int32Array([0, -1, 0]) },
        { tiles: [stone([2, 0, 2, 14, 1, 14])], structure: { id: "chair" } },
      ]),
    ];
    const out = await convertLittleTilesForExport(legacyStructure(tes));
    expect(warningsOf(out)).toEqual([]);

    const [ladderMain] = childrenAt(out, 0, 0, 0);
    expect(ladderMain.index).toBe(0);
    expect(ladderMain.type).toBe(1); // LT_STRUCTURE_ATTRIBUTES.ladder

    const shared = childrenAt(out, 0, 1, 0);
    expect(shared).toHaveLength(2);
    const ladderMember = shared.find((e) => e.coord)!;
    const chairMain = shared.find((e) => e.structure)!;
    expect(ladderMember.index).toBe(0);
    expect(ladderMember.type).toBe(1);
    // Same block already hosts index 0, so the chair takes the next slot.
    expect(chairMain.index).toBe(1);
    expect(chairMain.type).toBe(0);
  });

  it("keeps an all-air member entry as anchor but drops an all-air structure", async () => {
    const tes = [
      legacyTE({ x: 0, y: 1, z: 0 }, [
        {
          tiles: [stone([0, 0, 0, 16, 1, 16])],
          structure: { id: "chair", blocks: new Int32Array([0, -1, 0]) },
          index: 0,
          type: 0,
        },
      ]),
      legacyTE({ x: 0, y: 0, z: 0 }, [
        {
          tiles: [stone([0, 14, 0, 16, 16, 16], "appliedenergistics2:sky_stone_block")],
          coord: new Int32Array([0, 1, 0]),
          index: 0,
          type: 0,
        },
      ]),
      legacyTE({ x: 2, y: 0, z: 0 }, [
        {
          tiles: [stone([0, 0, 0, 1, 16, 16], "appliedenergistics2:sky_stone_block")],
          structure: { id: "ladder" },
          index: 0,
          type: 1,
        },
      ]),
    ];
    const out = await convertLittleTilesForExport(
      legacyStructure(tes, { "appliedenergistics2:sky_stone_block": "minecraft:air" }),
    );

    // The chair member's tiles are gone, but the entry still anchors the link.
    const [member] = childrenAt(out, 0, 0, 0);
    expect(member.tiles).toEqual({});
    expect([...(member.coord as Int32Array)]).toEqual([0, 1, 0]);
    expect((childrenAt(out, 0, 1, 0)[0].structure as Record<string, unknown>).id).toBe("chair");
    // The member cell survives as a host block.
    const hostIdx = out.palette.findIndex((b) => b.id === "littletiles:tiles");
    expect(out.blockData[0]).toBe(hostIdx); // (0,0,0)

    // The ladder lost every tile: whole structure dropped, cell becomes air.
    expect(out.tileEntities.find((t) => t.pos.x === 2 && t.pos.y === 0)).toBeUndefined();
    const airIdx = out.palette.findIndex((b) => b.name === "air");
    expect(out.blockData[2]).toBe(airIdx); // (2,0,0)
    const warns = warningsOf(out);
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain("resolved to air");
    expect(warns[0]).toContain('"ladder"');
  });

  it("passes modern TEs through untouched (TEST_LITTLETILES.schem)", async () => {
    const modern = await loadSchematicFile(fixture("TEST_LITTLETILES.schem"));
    expect(modern.littleTiles).toBeDefined();

    const converted = await convertLittleTilesForExport(modern);
    expect(converted.tileEntities).toHaveLength(modern.tileEntities.length);
    const key = (t: TileEntity) => `${t.pos.x},${t.pos.y},${t.pos.z}`;
    const original = new Map(modern.tileEntities.map((t) => [key(t), t]));
    for (const te of converted.tileEntities) {
      expect(te.data).toEqual(original.get(key(te))!.data);
    }

    // And the content compounds survive a write + reload byte-faithfully.
    const bytes = writeSchem(converted, 2);
    const back = await loadSchematicFile(fileFrom(bytes, "lt-structs.schem"));
    expect(back.tileEntities).toHaveLength(modern.tileEntities.length);
    for (const te of back.tileEntities) {
      expect(te.data.content).toEqual(original.get(key(te))!.data.content);
    }
  });
});
