/**
 * Regression cover for the "every slab renders bottom" bug.
 *
 * The blockstate JSON in each case is the real content of the mirror's 1.12.2
 * tree (fetched and pasted verbatim), because the whole defect was a mismatch
 * between what that tree keys on and what the legacy loader emits.
 */

import { describe, expect, it } from "vitest";
import { resolveModelRefs } from "./blockstate";
import { adaptToLegacyAssets } from "./legacy-compat";
import type { Blockstate } from "./types";

/** assets/minecraft/blockstates/stone_slab.json @ 1.12.2 */
const STONE_SLAB: Blockstate = {
  variants: {
    "half=bottom": { model: "half_slab_stone" },
    "half=top": { model: "upper_slab_stone" },
  },
};

/** assets/minecraft/blockstates/purpur_slab.json @ 1.12.2 — carries a vestigial `variant`. */
const PURPUR_SLAB: Blockstate = {
  variants: {
    "half=bottom,variant=default": { model: "half_slab_purpur" },
    "half=top,variant=default": { model: "upper_slab_purpur" },
  },
};

/** assets/minecraft/blockstates/stone_double_slab.json @ 1.12.2 — render-case keys, no properties. */
const STONE_DOUBLE_SLAB: Blockstate = {
  variants: {
    normal: { model: "double_stone" },
    all: { model: "double_stone_top" },
  },
};

/** assets/minecraft/blockstates/oak_slab.json @ 1.21.1 — the modern shape, for the no-op case. */
const MODERN_OAK_SLAB: Blockstate = {
  variants: {
    "type=bottom": { model: "minecraft:block/oak_slab" },
    "type=double": { model: "minecraft:block/oak_planks" },
    "type=top": { model: "minecraft:block/oak_slab_top" },
  },
};

/** What the legacy loader hands the resolver, then what the 1.12 tree needs. */
function resolveLegacy(blockstate: Blockstate, id: string, states: Record<string, string>) {
  const adapted = adaptToLegacyAssets(id, states);
  return { ...adapted, refs: resolveModelRefs(blockstate, adapted.states) };
}

describe("adaptToLegacyAssets", () => {
  it("renames the flattened `type` to the 1.12 `half`", () => {
    expect(adaptToLegacyAssets("minecraft:stone_slab", { type: "top" })).toEqual({
      blockId: "minecraft:stone_slab",
      states: { half: "top" },
    });
  });

  it("redirects a double slab to the separate 1.12 block and drops the half", () => {
    expect(adaptToLegacyAssets("minecraft:stone_slab", { type: "double" })).toEqual({
      blockId: "minecraft:stone_double_slab",
      states: {},
    });
  });

  it("renames petrified oak, whose 1.12 file is wood_old_slab", () => {
    expect(adaptToLegacyAssets("minecraft:petrified_oak_slab", { type: "top" })).toEqual({
      blockId: "minecraft:wood_old_slab",
      states: { half: "top" },
    });
    expect(adaptToLegacyAssets("minecraft:petrified_oak_slab", { type: "double" }).blockId).toBe(
      "minecraft:wood_old_double_slab",
    );
  });

  it("leaves non-slabs alone", () => {
    const states = { facing: "east", half: "top", shape: "straight" };
    expect(adaptToLegacyAssets("minecraft:oak_stairs", states)).toEqual({
      blockId: "minecraft:oak_stairs",
      states,
    });
  });
});

describe("1.12 slab geometry", () => {
  it("picks the upper model for a top slab (was: always the bottom one)", () => {
    expect(resolveLegacy(STONE_SLAB, "minecraft:stone_slab", { type: "top" }).refs).toEqual([
      { model: "upper_slab_stone" },
    ]);
  });

  it("still picks the lower model for a bottom slab", () => {
    expect(resolveLegacy(STONE_SLAB, "minecraft:stone_slab", { type: "bottom" }).refs).toEqual([
      { model: "half_slab_stone" },
    ]);
  });

  it("ignores a vestigial property the modern states have no equivalent for", () => {
    expect(resolveLegacy(PURPUR_SLAB, "minecraft:purpur_slab", { type: "top" }).refs).toEqual([
      { model: "upper_slab_purpur" },
    ]);
  });

  it("resolves a double slab to the full-cube model via its own block", () => {
    const out = resolveLegacy(STONE_DOUBLE_SLAB, "minecraft:stone_slab", { type: "double" });
    expect(out.blockId).toBe("minecraft:stone_double_slab");
    expect(out.refs).toEqual([{ model: "double_stone" }]);
  });
});

describe("modern blockstates are unaffected", () => {
  it.each([
    ["top", "minecraft:block/oak_slab_top"],
    ["bottom", "minecraft:block/oak_slab"],
    ["double", "minecraft:block/oak_planks"],
  ])("type=%s resolves exactly", (type, model) => {
    expect(resolveModelRefs(MODERN_OAK_SLAB, { type })).toEqual([{ model }]);
  });
});

describe("variant scoring", () => {
  it("prefers the variant that matches more declared properties", () => {
    const bs: Blockstate = {
      variants: {
        "facing=north": { model: "loose" },
        "facing=north,half=top": { model: "exact" },
      },
    };
    expect(resolveModelRefs(bs, { facing: "north", half: "top" })).toEqual([{ model: "exact" }]);
  });

  it("never picks a variant the states contradict", () => {
    const bs: Blockstate = {
      variants: {
        "facing=south,half=top": { model: "wrong" },
        "facing=north": { model: "right" },
      },
    };
    expect(resolveModelRefs(bs, { facing: "north", half: "top" })).toEqual([{ model: "right" }]);
  });

  it("keeps multipart strict — an absent property must not enable a part", () => {
    const bs: Blockstate = {
      multipart: [
        { apply: { model: "post" } },
        { when: { north: "true" }, apply: { model: "arm_north" } },
      ],
    };
    expect(resolveModelRefs(bs, {})).toEqual([{ model: "post" }]);
  });
});
