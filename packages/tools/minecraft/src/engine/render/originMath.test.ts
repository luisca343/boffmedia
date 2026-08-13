import { describe, expect, it } from "vitest";
import { localPlayerPos, sourceAnchor } from "./originMath";

describe("sourceAnchor", () => {
  it("derives the player position when both origin and offset are present", () => {
    expect(sourceAnchor({ x: 100, y: 64, z: 200 }, { x: 3, y: -1, z: 5 })).toEqual({
      origin: { x: 100, y: 64, z: 200 },
      offset: { x: 3, y: -1, z: 5 },
      playerPos: { x: 97, y: 65, z: 195 },
    });
  });

  it("keeps origin alone without deriving a player position", () => {
    expect(sourceAnchor({ x: 10, y: 20, z: 30 }, undefined)).toEqual({
      origin: { x: 10, y: 20, z: 30 },
    });
  });

  it("keeps offset alone without deriving a player position", () => {
    expect(sourceAnchor(undefined, { x: 1, y: 2, z: 3 })).toEqual({ offset: { x: 1, y: 2, z: 3 } });
  });

  it("returns an empty anchor when neither is present", () => {
    expect(sourceAnchor(undefined, undefined)).toEqual({});
  });

  it("handles negative world coords", () => {
    expect(sourceAnchor({ x: -500, y: -12, z: -40 }, { x: -2, y: 3, z: -7 }).playerPos).toEqual({
      x: -498,
      y: -15,
      z: -33,
    });
  });
});

describe("localPlayerPos", () => {
  it("negates the offset", () => {
    expect(localPlayerPos({ x: 3, y: -1, z: 5 })).toEqual({ x: -3, y: 1, z: -5 });
  });

  it("is undefined without an offset", () => {
    expect(localPlayerPos(undefined)).toBeUndefined();
  });
});
