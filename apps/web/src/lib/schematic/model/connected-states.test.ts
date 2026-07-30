/**
 * Pins the neighbour-derived state rules against the mod's own `getActualState`
 * behaviour (transcribed from bytecode), and then feeds the result through the
 * real blockstate JSON so the assertions are about what actually gets *drawn*.
 */

import { describe, expect, it } from "vitest";
import { deriveConnectedStates, hasConnectedStates, type BlockAt } from "./connected-states";
import { resolveModelRefs } from "./blockstate";
import type { Blockstate } from "./types";
import type { ForgeBlockstateJson } from "../registry/forge-blockstate";

const LINE = "furenikusroads:line_white_straight_full";
const BARRIER = "furenikusroads:barrier_tall_mid";

/** A world from a sparse map of "x,y,z" → block id. */
function world(cells: Record<string, string>): BlockAt {
  return (x, y, z) => cells[`${x},${y},${z}`] ?? null;
}

/** furenikusroads/blockstates/line_white_straight_full.json, item entries trimmed. */
const lineState: ForgeBlockstateJson = {
  forge_marker: 1,
  defaults: {
    textures: {
      "0": "furenikusroads:blocks/paint_white",
      particle: "furenikusroads:blocks/paint_white",
    },
    model: "furenikusroads:single_middle",
  },
  variants: {
    zz_default_stuff: { true: {}, false: {} },
    east: { true: { submodel: { paint_east: { model: "furenikusroads:single_line_n", y: 90 } } }, false: {} },
    facing: {
      east_west: {
        submodel: {
          paint_east: { model: "furenikusroads:single_line_n", y: 90 },
          paint_west: { model: "furenikusroads:single_line_n", y: 270 },
        },
      },
      north_south: {
        submodel: {
          paint_north: { model: "furenikusroads:single_line_n" },
          paint_south: { model: "furenikusroads:single_line_n", y: 180 },
        },
      },
      connect: {},
    },
    north: { true: { submodel: { paint_north: { model: "furenikusroads:single_line_n" } } }, false: {} },
    south: { true: { submodel: { paint_south: { model: "furenikusroads:single_line_n", y: 180 } } }, false: {} },
    west: { true: { submodel: { paint_west: { model: "furenikusroads:single_line_n", y: 270 } } }, false: {} },
  },
};

/** Which line arms the resolved refs draw, by their y rotation. */
function arms(states: Record<string, string>): number[] {
  return resolveModelRefs(lineState as unknown as Blockstate, states)
    .filter((r) => r.model === "furenikusroads:single_line_n")
    .map((r) => r.y ?? 0)
    .sort((a, b) => a - b);
}

describe("hasConnectedStates", () => {
  it("covers the line and barrier families", () => {
    expect(hasConnectedStates(LINE)).toBe(true);
    expect(hasConnectedStates(BARRIER)).toBe(true);
    expect(hasConnectedStates("furenikusroads:barrier_standard_mid")).toBe(true);
    expect(hasConnectedStates("furenikusroads:white_arrow_line")).toBe(true);
  });

  it("excludes the line_* blocks that are a different class", () => {
    // These share the prefix but do not satisfy the mod's canConnectTo.
    expect(hasConnectedStates("furenikusroads:line_white_middle_short")).toBe(false);
    expect(hasConnectedStates("furenikusroads:line_white_crossing_1")).toBe(false);
  });

  it("excludes vanilla and other mods", () => {
    expect(hasConnectedStates("minecraft:stone")).toBe(false);
    expect(hasConnectedStates("cfm:chair_oak")).toBe(false);
  });
});

describe("line facing comes from metadata", () => {
  it.each([
    ["0", "north_south"],
    ["1", "east_west"],
    ["2", "connect"],
    ["7", "connect"],
  ])("meta %s → facing %s", (meta, facing) => {
    const s = deriveConnectedStates(LINE, { meta }, 0, 0, 0, world({}));
    expect(s.facing).toBe(facing);
    expect(s.zz_default_stuff).toBe("true");
  });

  it("an isolated north_south lane draws a full N-S line", () => {
    const s = deriveConnectedStates(LINE, { meta: "0" }, 0, 0, 0, world({}));
    expect(s).toMatchObject({ north: "false", south: "false", east: "false", west: "false" });
    // paint_north (y=0) + paint_south (y=180).
    expect(arms(s)).toEqual([0, 180]);
  });

  it("an isolated `connect` lane draws nothing — the mod's real behaviour", () => {
    const s = deriveConnectedStates(LINE, { meta: "2" }, 0, 0, 0, world({}));
    expect(arms(s)).toEqual([]);
  });
});

describe("line connections", () => {
  const at = world({
    "0,0,0": LINE,
    "1,0,0": LINE, // east, same level
    "-1,0,0": "furenikusroads:white_arrow_line", // west, an arrow line still counts
    "0,0,-1": "minecraft:stone", // north, not a line
    "0,1,1": LINE, // south, one step UP
  });

  it("connects east/west/south and not north", () => {
    const s = deriveConnectedStates(LINE, { meta: "2" }, 0, 0, 0, at);
    expect(s).toMatchObject({ east: "true", west: "true", south: "true", north: "false" });
  });

  it("a straight east-west run draws one continuous line, not two stacked copies", () => {
    const run = world({ "0,0,0": LINE, "1,0,0": LINE, "-1,0,0": LINE });
    const s = deriveConnectedStates(LINE, { meta: "1" }, 0, 0, 0, run);
    // `facing=east_west` and `east`/`west` name the SAME submodel slots, so the
    // arms must appear once each — this is the slot-keyed merge in forge-v1.ts.
    expect(arms(s)).toEqual([90, 270]);
  });

  it("connections apply on top of facing, so a T really is a T", () => {
    const tee = world({ "0,0,0": LINE, "1,0,0": LINE });
    const s = deriveConnectedStates(LINE, { meta: "0" }, 0, 0, 0, tee);
    // north_south facing (0, 180) plus the east arm (90).
    expect(arms(s)).toEqual([0, 90, 180]);
  });
});

describe("barrier post orientation", () => {
  const derive = (meta: string, cells: Record<string, string>) =>
    deriveConnectedStates(BARRIER, { meta }, 0, 0, 0, world({ "0,0,0": BARRIER, ...cells }));

  it("has no post when metadata bit 0 is clear", () => {
    expect(derive("0", { "1,0,0": BARRIER, "-1,0,0": BARRIER }).post).toBe("none");
  });

  it("an east-west run selects the `north_south` post model", () => {
    // Counter-intuitive but transcribed literally: east+west → north_south.
    expect(derive("1", { "1,0,0": BARRIER, "-1,0,0": BARRIER }).post).toBe("north_south");
  });

  it("a north-south run selects `east_west`", () => {
    expect(derive("1", { "0,0,-1": BARRIER, "0,0,1": BARRIER }).post).toBe("east_west");
  });

  it("a four-way junction has no post", () => {
    const s = derive("1", {
      "1,0,0": BARRIER,
      "-1,0,0": BARRIER,
      "0,0,1": BARRIER,
      "0,0,-1": BARRIER,
    });
    expect(s.post).toBe("none");
  });

  it("connects to a solid cube at the same level but not one above or below", () => {
    expect(derive("1", { "1,0,0": "minecraft:stone" }).east).toBe("true");
    // A solid block one step down is NOT an IConnectable, so no connection.
    expect(derive("1", { "1,-1,0": "minecraft:stone" }).east).toBe("false");
    // Another barrier one step down does connect.
    expect(derive("1", { "1,-1,0": BARRIER }).east).toBe("true");
  });

  it("does not treat a slab or fence as a wall to connect into", () => {
    expect(derive("1", { "1,0,0": "minecraft:stone_slab" }).east).toBe("false");
    expect(derive("1", { "1,0,0": "minecraft:oak_fence" }).east).toBe("false");
  });
});
