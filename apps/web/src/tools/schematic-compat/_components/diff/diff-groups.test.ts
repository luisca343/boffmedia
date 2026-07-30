import { describe, expect, it } from "vitest";
import { GROUP_ORDER, bucketOf, buildBulkGroups, buildGroups, previewRowsFor, remapSuffix } from "./diff-groups";
import type { DiffEntry } from "@/lib/schematic/types";
import type { UnifiedBlock } from "@/lib/schematic/types";

function block(id: string, states?: Record<string, string>): UnifiedBlock {
  const namespace = id.includes(":") ? id.slice(0, id.indexOf(":")) : "minecraft";
  const name = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  return { id, namespace, name, states: states ?? {}, tags: [], source: "vanilla" };
}

function entry(partial: Partial<DiffEntry> & Pick<DiffEntry, "block" | "status">): DiffEntry {
  return { instanceCount: 1, ...partial };
}

const t = (key: string) => key;

describe("bucketOf", () => {
  it("collapses mod-only into missing", () => {
    expect(bucketOf("mod-only")).toBe("missing");
  });

  it("leaves other statuses untouched", () => {
    expect(bucketOf("safe")).toBe("safe");
    expect(bucketOf("renamed")).toBe("renamed");
    expect(bucketOf("state-changed")).toBe("state-changed");
    expect(bucketOf("missing")).toBe("missing");
  });
});

describe("remapSuffix", () => {
  const targetSet = new Set(["minecraft:oak_log", "minecraft:stone"]);

  it("remaps a namespaced id whose suffix exists in the target set", () => {
    expect(remapSuffix("create:oak_log", targetSet, "minecraft")).toBe("minecraft:oak_log");
  });

  it("returns null when the suffix has no match (miss)", () => {
    expect(remapSuffix("create:mystery_block", targetSet, "minecraft")).toBeNull();
  });

  it("returns null when the id carries no namespace", () => {
    expect(remapSuffix("oak_log", targetSet, "minecraft")).toBeNull();
  });
});

describe("previewRowsFor", () => {
  it("shapes status, instance count, then each blockstate as a row", () => {
    const e = entry({ block: block("minecraft:oak_stairs", { facing: "north", half: "bottom" }), status: "renamed", instanceCount: 42 });
    const rows = previewRowsFor(e, t);
    expect(rows).toEqual([
      { label: "diff.statusLabel", value: "diff.renamed" },
      { label: "diff.instancesLabel", value: "42" },
      { label: "facing", value: "north" },
      { label: "half", value: "bottom" },
    ]);
  });

  it("omits blockstate rows when the block has none", () => {
    const e = entry({ block: block("minecraft:stone"), status: "safe", instanceCount: 5 });
    const rows = previewRowsFor(e, t);
    expect(rows).toHaveLength(2);
  });
});

describe("buildGroups", () => {
  const diff = {
    entries: [
      entry({ block: block("minecraft:stone"), status: "safe", instanceCount: 100 }),
      entry({ block: block("minecraft:missing_a"), status: "missing", instanceCount: 5 }),
      entry({ block: block("minecraft:missing_b"), status: "missing", instanceCount: 50 }),
      entry({ block: block("create:mod_block"), status: "mod-only", instanceCount: 3 }),
      entry({ block: block("minecraft:oak_stairs"), status: "renamed", instanceCount: 8 }),
    ],
  };
  const noFilter = { filter: null, showSafe: false };
  const matchAll = () => true;

  it("returns an empty array when diff is undefined", () => {
    expect(buildGroups(undefined, noFilter, matchAll)).toEqual([]);
  });

  it("orders groups by GROUP_ORDER and hides empty buckets", () => {
    const groups = buildGroups(diff, noFilter, matchAll);
    const statuses = groups.map((g) => g.status);
    // safe is hidden by default (showSafe: false); order follows GROUP_ORDER filtered to present buckets.
    expect(statuses).toEqual(["missing", "renamed"]);
    expect(GROUP_ORDER.indexOf("missing")).toBeLessThan(GROUP_ORDER.indexOf("renamed"));
  });

  it("sorts the missing bucket (mod-only included) by instanceCount descending", () => {
    const groups = buildGroups(diff, noFilter, matchAll);
    const missing = groups.find((g) => g.status === "missing")!;
    expect(missing.entries.map((e) => e.block.id)).toEqual(["minecraft:missing_b", "minecraft:missing_a", "create:mod_block"]);
  });

  it("shows the safe bucket when showSafe is true", () => {
    const groups = buildGroups(diff, { filter: null, showSafe: true }, matchAll);
    expect(groups.some((g) => g.status === "safe")).toBe(true);
  });

  it("restricts to a single bucket when filter is set (bypassing showSafe)", () => {
    const groups = buildGroups(diff, { filter: "safe", showSafe: false }, matchAll);
    expect(groups).toEqual([{ status: "safe", entries: [diff.entries[0]] }]);
  });

  it("applies the injected match predicate", () => {
    const groups = buildGroups(diff, { filter: null, showSafe: true }, (e) => e.block.id.includes("stairs"));
    expect(groups).toEqual([{ status: "renamed", entries: [diff.entries[4]] }]);
  });
});

describe("buildBulkGroups", () => {
  const diff = {
    entries: [
      entry({ block: block("create:oak_log"), status: "missing", instanceCount: 5 }),
      entry({ block: block("create:resolved_block"), status: "missing", instanceCount: 2 }),
      entry({ block: block("modb:thing"), status: "mod-only", instanceCount: 1 }),
      entry({ block: block("minecraft:stone"), status: "safe", instanceCount: 10 }),
    ],
  };
  const targetSet = new Set(["minecraft:oak_log"]);

  it("returns an empty array when diff is undefined", () => {
    expect(buildBulkGroups(undefined, {}, targetSet, "minecraft")).toEqual([]);
  });

  it("groups unresolved missing/mod-only entries by namespace, sorted alphabetically", () => {
    const groups = buildBulkGroups(diff, {}, targetSet, "minecraft");
    expect(groups.map((g) => g.namespace)).toEqual(["create", "modb"]);
  });

  it("excludes entries that already have a resolution", () => {
    const groups = buildBulkGroups(diff, { "create:resolved_block": { targetId: "minecraft:stone", applyToAll: true } }, targetSet, "minecraft");
    const create = groups.find((g) => g.namespace === "create")!;
    expect(create.entries.map((e) => e.block.id)).toEqual(["create:oak_log"]);
  });

  it("counts how many entries in the namespace would remap via suffix match", () => {
    const groups = buildBulkGroups(diff, {}, targetSet, "minecraft");
    const create = groups.find((g) => g.namespace === "create")!;
    // create:oak_log -> minecraft:oak_log exists; create:resolved_block -> minecraft:resolved_block does not.
    expect(create.remap).toBe(1);
  });
});
