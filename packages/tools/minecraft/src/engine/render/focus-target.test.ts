import { describe, expect, it } from "vitest";
import {
  cameraGoalFor,
  cycleIndex,
  instanceCenterAt,
  instanceCenterInGroup,
  instanceCounts,
  navigableCount,
  structureCenterOf,
} from "./focus-target";

describe("cycleIndex", () => {
  it("wraps from the last index to the first", () => {
    expect(cycleIndex(4, 1, 5)).toBe(0);
  });

  it("wraps from the first index to the last", () => {
    expect(cycleIndex(0, -1, 5)).toBe(4);
  });

  it("stays put when count is 1 (RF-04 boundary)", () => {
    expect(cycleIndex(0, 1, 1)).toBe(0);
    expect(cycleIndex(0, -1, 1)).toBe(0);
  });

  it("returns 0 when count is 0", () => {
    expect(cycleIndex(0, 1, 0)).toBe(0);
    expect(cycleIndex(3, -1, 0)).toBe(0);
  });

  it("steps within bounds without wrapping", () => {
    expect(cycleIndex(1, 1, 5)).toBe(2);
    expect(cycleIndex(2, -1, 5)).toBe(1);
  });
});

describe("instanceCenterAt", () => {
  const positions = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  it("indexes a stride-3 triple", () => {
    expect(instanceCenterAt(positions, 0)).toEqual([1, 2, 3]);
    expect(instanceCenterAt(positions, 1)).toEqual([4, 5, 6]);
    expect(instanceCenterAt(positions, 2)).toEqual([7, 8, 9]);
  });

  it("returns null out of range", () => {
    expect(instanceCenterAt(positions, -1)).toBeNull();
    expect(instanceCenterAt(positions, 3)).toBeNull();
  });
});

describe("navigableCount / instanceCenterInGroup", () => {
  const group = {
    positions: new Float32Array([0, 0, 0, 1, 0, 0]), // 2 surface instances
    interiorPositions: new Float32Array([2, 0, 0]), // 1 interior instance
  };

  it("sums surface and interior instances", () => {
    expect(navigableCount(group)).toBe(3);
  });

  it("returns 0 for an undefined group", () => {
    expect(navigableCount(undefined)).toBe(0);
  });

  it("indexes into the surface set first, then the interior set", () => {
    expect(instanceCenterInGroup(group, 0)).toEqual([0, 0, 0]);
    expect(instanceCenterInGroup(group, 1)).toEqual([1, 0, 0]);
    expect(instanceCenterInGroup(group, 2)).toEqual([2, 0, 0]);
  });

  it("returns null past the combined count", () => {
    expect(instanceCenterInGroup(group, 3)).toBeNull();
  });
});

describe("instanceCounts", () => {
  const group = { positions: new Float32Array([0, 0, 0, 1, 0, 0]) }; // 2 navigable

  it("reports culled=false when total matches navigable", () => {
    expect(instanceCounts(group)).toEqual({ navigable: 2, total: 2, culled: false });
    expect(instanceCounts(group, 2)).toEqual({ navigable: 2, total: 2, culled: false });
  });

  it("reports culled=true when the diff total exceeds the navigable count (RF-08)", () => {
    expect(instanceCounts(group, 5)).toEqual({ navigable: 2, total: 5, culled: true });
  });

  it("treats an undefined group as zero navigable", () => {
    expect(instanceCounts(undefined)).toEqual({ navigable: 0, total: 0, culled: false });
  });
});

describe("cameraGoalFor", () => {
  it("frames the center using CameraRig's ratios (dist = span * 2.2)", () => {
    const goal = cameraGoalFor([10, 20, 30], 5);
    const dist = 5 * 2.2;
    expect(goal.target).toEqual([10, 20, 30]);
    expect(goal.position).toEqual([10 + dist * 0.55, 20 + dist * 0.45, 30 + dist * 0.85]);
  });
});

describe("structureCenterOf", () => {
  it("returns null for an empty structure", () => {
    expect(structureCenterOf({ boxes: new Float32Array(0) })).toBeNull();
  });

  it("centers a single full-cell box on its host cell", () => {
    // host cell (2,3,4), box spans the whole cell (0..1 fractions)
    const boxes = new Float32Array([2, 3, 4, 0, 0, 0, 1, 1, 1]);
    expect(structureCenterOf({ boxes })).toEqual([2, 3, 4]);
  });

  it("expands the bounding box across cornerBounds AABBs", () => {
    const boxes = new Float32Array([0, 0, 0, 0, 0, 0, 1, 1, 1]); // centered at [0,0,0]
    const cornerBounds = new Float32Array([-2, -2, -2, 2, 2, 2]); // wider AABB
    expect(structureCenterOf({ boxes, cornerBounds })).toEqual([0, 0, 0]);
  });
});
