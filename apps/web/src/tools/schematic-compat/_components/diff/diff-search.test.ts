import { describe, expect, it } from "vitest";
import { entryMatches } from "./diff-search";
import type { DiffEntry, UnifiedBlock } from "@/lib/schematic/types";

function block(id: string, states?: Record<string, string>): UnifiedBlock {
  const namespace = id.includes(":") ? id.slice(0, id.indexOf(":")) : "minecraft";
  const name = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  return { id, namespace, name, states: states ?? {}, tags: [], source: "vanilla" };
}

function entry(partial: Partial<DiffEntry> & Pick<DiffEntry, "block" | "status">): DiffEntry {
  return { instanceCount: 1, ...partial };
}

describe("entryMatches", () => {
  it("matches everything when the query is empty", () => {
    const e = entry({ block: block("minecraft:oak_stairs"), status: "renamed" });
    expect(entryMatches(e, "")).toBe(true);
    expect(entryMatches(e, "   ")).toBe(true);
  });

  it("matches on the full block id, case-insensitively", () => {
    const e = entry({ block: block("minecraft:oak_stairs"), status: "renamed" });
    expect(entryMatches(e, "OAK_STAIRS")).toBe(true);
    expect(entryMatches(e, "minecraft:oak")).toBe(true);
  });

  it("matches on the namespace segment alone (RF-11)", () => {
    const e = entry({ block: block("create:cogwheel"), status: "missing" });
    expect(entryMatches(e, "create")).toBe(true);
    expect(entryMatches(e, "modb")).toBe(false);
  });

  it("matches on a blockstate key (RF-11)", () => {
    const e = entry({ block: block("minecraft:oak_stairs", { facing: "north", waterlogged: "false" }), status: "safe" });
    expect(entryMatches(e, "facing")).toBe(true);
  });

  it("matches on a blockstate value (RF-11)", () => {
    const e = entry({ block: block("minecraft:oak_stairs", { facing: "north" }), status: "safe" });
    expect(entryMatches(e, "north")).toBe(true);
  });

  it("matches on the resolved replacement target passed in by the caller (RF-11)", () => {
    const e = entry({ block: block("create:cogwheel"), status: "missing" });
    expect(entryMatches(e, "oak_log", "minecraft:oak_log")).toBe(true);
  });

  it("does not match the resolved target when none is passed", () => {
    const e = entry({ block: block("create:cogwheel"), status: "missing" });
    expect(entryMatches(e, "oak_log")).toBe(false);
  });

  it("returns false when nothing matches", () => {
    const e = entry({ block: block("minecraft:oak_stairs", { facing: "north" }), status: "safe" });
    expect(entryMatches(e, "nonexistent", "minecraft:stone")).toBe(false);
  });
});
