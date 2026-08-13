import { describe, expect, it } from "vitest";
import { buildBlockAt, partitionConnected } from "./connected-groups";
import type { BlockPositionGroup, UnifiedBlock } from "../types";

const LINE = "furenikusroads:line_white_straight_full";

function block(id: string): UnifiedBlock {
  const [namespace, name] = id.split(":");
  return { id, namespace, name, states: { meta: "1" }, tags: [], source: "mod" };
}

function group(id: string, positions: number[], interior?: number[]): BlockPositionGroup {
  return {
    paletteIndex: 0,
    block: block(id),
    positions: new Float32Array(positions),
    ...(interior ? { interiorPositions: new Float32Array(interior) } : {}),
  };
}

describe("buildBlockAt", () => {
  it("indexes surface and interior cells alike", () => {
    // An enclosed neighbour is still a neighbour — omitting interiors would break
    // a run exactly where it is most solid.
    const at = buildBlockAt([group(LINE, [0, 0, 0], [1, 0, 0])]);
    expect(at(0, 0, 0)).toBe(LINE);
    expect(at(1, 0, 0)).toBe(LINE);
    expect(at(2, 0, 0)).toBeNull();
  });

  it("returns null outside the volume rather than aliasing another cell", () => {
    const at = buildBlockAt([group(LINE, [0, 0, 0])]);
    expect(at(-1, 0, 0)).toBeNull();
    expect(at(0, -1, 0)).toBeNull();
    expect(at(9999, 0, 0)).toBeNull();
  });
});

describe("partitionConnected", () => {
  it("returns null for a block with no neighbour rule, keeping the single-draw path", () => {
    expect(partitionConnected(group("minecraft:stone", [0, 0, 0]), {}, buildBlockAt([]))).toBeNull();
  });

  it("splits one group into a sub-group per distinct derived state", () => {
    // A 3-long east-west run is three distinct shapes, not two: the west end
    // connects east only, the east end connects west only, and those are mirror
    // images rather than the same model.
    const g = group(LINE, [0, 0, 0, 1, 0, 0, 2, 0, 0]);
    const parts = partitionConnected(g, { meta: "1" }, buildBlockAt([g]))!;

    expect(parts).toHaveLength(3);
    const total = parts.reduce((n, p) => n + p.positions.length / 3, 0);
    expect(total).toBe(3); // every instance is drawn exactly once
    const middle = parts.find((p) => p.states.east === "true" && p.states.west === "true")!;
    expect(middle.positions.length / 3).toBe(1);
  });

  it("keeps every instance in exactly one bucket and preserves interiors", () => {
    const g = group(LINE, [0, 0, 0], [1, 0, 0]);
    const parts = partitionConnected(g, { meta: "1" }, buildBlockAt([g]))!;
    const surface = parts.reduce((n, p) => n + p.positions.length / 3, 0);
    const interior = parts.reduce((n, p) => n + (p.interiorPositions?.length ?? 0) / 3, 0);
    expect(surface + interior).toBe(2);
    expect(interior).toBe(1);
  });

  it("gives each sub-group a distinct key", () => {
    const g = group(LINE, [0, 0, 0, 1, 0, 0, 2, 0, 0]);
    const parts = partitionConnected(g, { meta: "1" }, buildBlockAt([g]))!;
    expect(new Set(parts.map((p) => p.key)).size).toBe(parts.length);
  });
});
