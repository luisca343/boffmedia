import { describe, expect, it } from "vitest";
import { columnsFor, rowOfIndex, visibleRange } from "./grid-window";

describe("columnsFor", () => {
  it("returns 1 column when width cannot fit even one tile", () => {
    expect(columnsFor(0, 260, 8)).toBe(1);
  });

  it("returns exactly 1 at the boundary where a second column would not fit", () => {
    // Second column needs another (260 + 8) = 268px; give just under that.
    expect(columnsFor(260 + 267, 260, 8)).toBe(1);
  });

  it("returns exactly 2 right at the boundary where a second column fits", () => {
    expect(columnsFor(260 + 268, 260, 8)).toBe(2);
  });

  it("scales up with width", () => {
    expect(columnsFor(3 * 260 + 2 * 8, 260, 8)).toBe(3);
  });

  it("floors non-positive width/minCol to 1 column", () => {
    expect(columnsFor(-10, 260, 8)).toBe(1);
    expect(columnsFor(500, 0, 8)).toBe(1);
  });
});

describe("visibleRange", () => {
  it("returns an empty range for zero rows", () => {
    expect(visibleRange(0, 500, 100, 0, 2)).toEqual({ startRow: 0, endRow: -1, topPad: 0, bottomPad: 0 });
  });

  it("clamps overscan at the head of the list", () => {
    // scrollTop 0, so raw start (0/100 - 2 = -2) clamps to 0.
    const r = visibleRange(0, 500, 100, 50, 2);
    expect(r.startRow).toBe(0);
    expect(r.topPad).toBe(0);
  });

  it("clamps overscan at the tail of the list", () => {
    // 50 rows (0..49); scrolled to the very bottom.
    const r = visibleRange(4900, 500, 100, 50, 2);
    expect(r.endRow).toBe(49);
    expect(r.bottomPad).toBe(0);
  });

  it("pads both sides by rowH * overscan in the middle of a long list", () => {
    // raw window is rows [floor(1000/100), floor(1500/100)] = [10, 15]; overscan 2 -> [8, 17].
    const r = visibleRange(1000, 500, 100, 200, 2);
    expect(r.startRow).toBe(8);
    expect(r.endRow).toBe(17);
    expect(r.topPad).toBe(800);
    expect(r.bottomPad).toBe((200 - 1 - 17) * 100);
  });
});

describe("rowOfIndex", () => {
  it("computes the row for a flat index at a given column count", () => {
    expect(rowOfIndex(0, 3)).toBe(0);
    expect(rowOfIndex(2, 3)).toBe(0);
    expect(rowOfIndex(3, 3)).toBe(1);
    expect(rowOfIndex(29, 3)).toBe(9);
  });

  it("treats a non-positive column count as row 0 (guards div-by-zero)", () => {
    expect(rowOfIndex(5, 0)).toBe(0);
  });
});
