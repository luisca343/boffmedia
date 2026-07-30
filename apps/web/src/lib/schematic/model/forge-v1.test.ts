/**
 * Pins the documented contract of `resolveForgeV1` (see forge-v1.ts's header doc)
 * against real Forge v1 blockstate JSON pulled verbatim from three 1.12.2 mods:
 * Fureniku's Roads, Cooking for Blockheads. Fixtures are copied byte-for-byte from
 * the extracted JARs unless a comment says otherwise.
 */

import { describe, expect, it } from "vitest";
import { resolveForgeV1 } from "./forge-v1";
import type { ForgeBlockstateJson } from "../registry/forge-blockstate";

// ─── Fixtures (verbatim from the extracted mod JARs) ─────────────────────────

// furenikusroads/blockstates/white_lane.json — meta-keyed block (0..15), each
// entry naming its own model + y + a texture override merged under defaults.
const whiteLane: ForgeBlockstateJson = {
  forge_marker: 1,
  defaults: {
    transform: "forge:default-block",
    textures: {
      "0": "furenikusroads:blocks/paint_white",
      particle: "furenikusroads:blocks/paint_white",
    },
    model: "furenikusroads:tile_full",
  },
  variants: {
    inventory: [
      {
        model: "furenikusroads:tile_full",
        textures: { "0": "furenikusroads:blocks/white_lane" },
        transform: {
          ground: { scale: [0.5, 0.5, 0.5], rotation: [90, 0, 180], translation: [0, 0, -0.2] },
          fixed: { rotation: [90, 0, 180], translation: [0, 0, -0.45] },
          gui: { translation: [0, 0, 0], rotation: [90, 0, 0] },
        },
      },
    ],
    meta: {
      "0": {
        model: "furenikusroads:tile_full",
        textures: { "0": "furenikusroads:blocks/white_lane" },
      },
      "1": {
        model: "furenikusroads:tile_full",
        y: 90,
        textures: { "0": "furenikusroads:blocks/white_lane" },
      },
      "2": {
        model: "furenikusroads:tile_full",
        y: 180,
        textures: { "0": "furenikusroads:blocks/white_lane" },
      },
      "3": {
        model: "furenikusroads:tile_full",
        y: 270,
        textures: { "0": "furenikusroads:blocks/white_lane" },
      },
      "4": { model: "furenikusroads:text_lane_1" },
      "5": { model: "furenikusroads:text_lane_1", y: 90 },
      "6": { model: "furenikusroads:text_lane_1", y: 180 },
      "7": { model: "furenikusroads:text_lane_1", y: 270 },
      "8": { model: "furenikusroads:text_lane_2" },
      "9": { model: "furenikusroads:text_lane_2", y: 90 },
      "10": { model: "furenikusroads:text_lane_2", y: 180 },
      "11": { model: "furenikusroads:text_lane_2", y: 270 },
      "12": { model: "furenikusroads:text_lane_3" },
      "13": { model: "furenikusroads:text_lane_3", y: 90 },
      "14": { model: "furenikusroads:text_lane_3", y: 180 },
      "15": { model: "furenikusroads:text_lane_3", y: 270 },
    },
  },
};

// furenikusroads/blockstates/barrier_bars_edge.json — three independent
// connection properties (zpost/left/right), each contributing several submodels
// on top of one shared base model named only by `defaults`.
const barrierBarsEdge: ForgeBlockstateJson = {
  forge_marker: 1,
  defaults: {
    model: "furenikusroads:barrier_bars_edge",
    uvlock: true,
    textures: { particle: "furenikusroads:blocks/machine_metal" },
  },
  variants: {
    inventory: [{ model: "furenikusroads:barrier_bars_edge_inventory" }],
    zpost: {
      true: {
        submodel: {
          post_main: { model: "furenikusroads:barrier_bars_edge_post" },
          post_l: { model: "furenikusroads:barrier_bars_edge_post", y: 270 },
          post_r: { model: "furenikusroads:barrier_bars_edge_post", y: 90 },
        },
      },
      false: {
        submodel: {
          post_main: { model: "furenikusroads:barrier_bars_edge_no_post" },
          post_l: { model: "furenikusroads:barrier_bars_edge_no_post", y: 270 },
          post_r: { model: "furenikusroads:barrier_bars_edge_no_post", y: 90 },
        },
      },
    },
    left: {
      normal: {
        submodel: {
          corner_l: { model: "furenikusroads:barrier_bars_edge_corner" },
          main: { model: "furenikusroads:barrier_bars_edge" },
          side_l: { model: "furenikusroads:nomodel" },
          side_end_l: { model: "furenikusroads:nomodel" },
          post_l: { model: "furenikusroads:nomodel" },
        },
      },
      down: {
        submodel: {
          corner_l: { model: "furenikusroads:barrier_bars_edge_corner" },
          main: { model: "furenikusroads:barrier_bars_edge" },
          side_l: { model: "furenikusroads:barrier_bars_edge", y: 270 },
          side_end_l: { model: "furenikusroads:barrier_bars_edge_corner", y: 270 },
        },
      },
      corner: {
        submodel: {
          corner_l: { model: "furenikusroads:barrier_bars_edge_corner" },
          main: { model: "furenikusroads:nomodel" },
          side_l: { model: "furenikusroads:nomodel" },
          side_end_l: { model: "furenikusroads:nomodel" },
          post_main: { model: "furenikusroads:nomodel" },
          post_l: { model: "furenikusroads:nomodel" },
        },
      },
      none: {
        submodel: {
          corner_l: { model: "furenikusroads:nomodel" },
          main: { model: "furenikusroads:nomodel" },
          side_l: { model: "furenikusroads:nomodel" },
          side_end_l: { model: "furenikusroads:nomodel" },
          post_main: { model: "furenikusroads:nomodel" },
          post_l: { model: "furenikusroads:nomodel" },
        },
      },
    },
    right: {
      normal: {
        submodel: {
          corner_r: { model: "furenikusroads:barrier_bars_edge_corner", y: 90 },
          main: { model: "furenikusroads:barrier_bars_edge" },
          side_r: { model: "furenikusroads:nomodel", y: 90 },
          side_end_r: { model: "furenikusroads:nomodel" },
          post_r: { model: "furenikusroads:nomodel" },
        },
      },
      down: {
        submodel: {
          corner_r: { model: "furenikusroads:barrier_bars_edge_corner", y: 90 },
          main: { model: "furenikusroads:barrier_bars_edge" },
          side_r: { model: "furenikusroads:barrier_bars_edge", y: 90 },
          side_end_r: { model: "furenikusroads:barrier_bars_edge_corner", y: 180 },
        },
      },
      corner: {
        submodel: {
          corner_r: { model: "furenikusroads:barrier_bars_edge_corner", y: 90 },
          main: { model: "furenikusroads:nomodel" },
          side_r: { model: "furenikusroads:nomodel", y: 90 },
          side_end_r: { model: "furenikusroads:nomodel" },
          post_main: { model: "furenikusroads:nomodel" },
          post_r: { model: "furenikusroads:nomodel" },
        },
      },
      none: {
        submodel: {
          corner_l: { model: "furenikusroads:nomodel" },
          main: { model: "furenikusroads:nomodel" },
          side_l: { model: "furenikusroads:nomodel" },
          side_end_l: { model: "furenikusroads:nomodel" },
          post_main: { model: "furenikusroads:nomodel" },
          post_r: { model: "furenikusroads:nomodel" },
        },
      },
    },
    rotation: {
      north: { model: "furenikusroads:nomodel" },
      east: { model: "furenikusroads:nomodel", y: 90 },
      south: { model: "furenikusroads:nomodel", y: 180 },
      west: { model: "furenikusroads:nomodel", y: 270 },
    },
  },
};

// furenikusroads/blockstates/tar_distiller.json — bare-string submodels
// (fluid_left/right/top), a map submodel (base_plate), a texture-only override
// with no model or submodel (furnace_active), and a rotation property whose
// entries name their own model + y.
const tarDistiller: ForgeBlockstateJson = {
  forge_marker: 1,
  defaults: {
    transform: "forge:default-block",
    textures: {
      "0": "furenikusroads:blocks/machine_metal",
      "1": "furenikusroads:blocks/machine_piping",
      "2": "furenikusroads:blocks/machine_glass",
      "3": "furenikusroads:blocks/tar_distiller_machine_a",
      "4": "furenikusroads:blocks/tar_distiller_machine_b",
      "5": "furenikusroads:blocks/machine_vent_back_off",
      "6": "furenikusroads:blocks/machine_metal_dark",
      particle: "furenikusroads:blocks/machine_metal",
    },
    model: "furenikusroads:tar_distiller",
  },
  variants: {
    inventory: [
      {
        model: "furenikusroads:tar_distiller",
        transform: {
          ground: { scale: [0.5, 0.5, 0.5] },
          fixed: { rotation: [0, -90, 0], translation: [0, 0, -2.5], scale: [0.5, 0.5, 0.5] },
          gui: { rotation: [15, 45, 0], scale: [0.5, 0.5, 0.5] },
        },
      },
    ],
    fluid_left: {
      true: { submodel: "furenikusroads:tar_distiller_fluid_out_left" },
      false: {},
    },
    fluid_right: {
      true: { submodel: "furenikusroads:tar_distiller_fluid_out_right" },
      false: {},
    },
    fluid_top: {
      true: { submodel: "furenikusroads:tar_distiller_fluid_out_top" },
      false: {},
    },
    base_plate: {
      true: { submodel: { baseplate: { model: "furenikusroads:base_plate" } } },
      false: { submodel: { baseplate: { model: "furenikusroads:base_plate_tar_distiller" } } },
    },
    furnace_active: {
      true: { textures: { "5": "furenikusroads:blocks/machine_vent_back_on" } },
      false: {},
    },
    rotation: {
      north: { model: "furenikusroads:tar_distiller", y: 0 },
      east: { model: "furenikusroads:tar_distiller", y: 90 },
      south: { model: "furenikusroads:tar_distiller", y: 180 },
      west: { model: "furenikusroads:tar_distiller", y: 270 },
    },
  },
};

// furenikusroads/blockstates/road_snow.json — verbatim; this particular file has
// no `forge_marker` key at all (isForgeBlockstate() would reject it upstream),
// but resolveForgeV1() itself doesn't check the marker, so it still pins the
// vanilla-style "key=value" combination-key parsing v1 permits.
const roadSnow: ForgeBlockstateJson = {
  variants: {
    "layers=1": { model: "snow_height2" },
    "layers=2": { model: "snow_height4" },
    "layers=3": { model: "snow_height6" },
    "layers=4": { model: "snow_height8" },
    "layers=5": { model: "snow_height10" },
    "layers=6": { model: "snow_height12" },
    "layers=7": { model: "snow_height14" },
    "layers=8": { model: "snow" },
  },
};

// cookingforblockheads/blockstates/counter.json — trimmed to 3 of 16 `color`
// entries (white/orange/black) and the `pass` property is dropped entirely;
// everything else (defaults, normal, inventory, facing, flipped, color shape)
// is verbatim. This is the real-world "texture/rotation-only variant, no model
// or submodel of its own" shape that exposed the bug documented below.
const counter: ForgeBlockstateJson = {
  forge_marker: 1,
  defaults: {
    textures: {
      countertop: "minecraft:blocks/stone_andesite_smooth",
      texture: "minecraft:blocks/hardened_clay",
      particle: "minecraft:blocks/hardened_clay",
      foot: "minecraft:blocks/hardened_clay_stained_black",
      backsplash: "minecraft:blocks/hardened_clay_stained_black",
      handle: "cookingforblockheads:blocks/handle",
    },
    model: "cookingforblockheads:counter_static",
    transform: "forge:default-block",
  },
  variants: {
    normal: [{}],
    inventory: [{ model: "cookingforblockheads:counter_inventory" }],
    facing: {
      west: { y: -90 },
      east: { y: 90 },
      north: {},
      south: { y: 180 },
    },
    flipped: {
      true: {},
      false: {},
    },
    color: {
      white: {
        textures: {
          texture: "minecraft:blocks/hardened_clay",
          particle: "minecraft:blocks/hardened_clay",
        },
      },
      orange: {
        textures: {
          texture: "minecraft:blocks/hardened_clay_stained_orange",
          particle: "minecraft:blocks/hardened_clay_stained_orange",
        },
      },
      black: {
        textures: {
          texture: "minecraft:blocks/hardened_clay_stained_black",
          particle: "minecraft:blocks/hardened_clay_stained_black",
        },
      },
    },
  },
};

// ─── 1. defaults.model is emitted when the matched entry names no model ──────

describe("defaults.model fallback", () => {
  it("falls back to defaults.model when the selected entry names none", () => {
    const refs = resolveForgeV1(counter, { flipped: "true" });
    expect(refs).toHaveLength(1);
    expect(refs[0].model).toBe("cookingforblockheads:counter_static");
  });
});

// ─── 2. meta-keyed block: own model + own y + textures merged under defaults ──

describe("meta-keyed block (white_lane)", () => {
  it("meta=2 selects that entry's own model and y rotation", () => {
    const refs = resolveForgeV1(whiteLane, { meta: "2" });
    expect(refs).toHaveLength(1);
    expect(refs[0].model).toBe("furenikusroads:tile_full");
    expect(refs[0].y).toBe(180);
  });

  it("merges defaults.textures under the entry's own texture override", () => {
    const refs = resolveForgeV1(whiteLane, { meta: "2" });
    // entry overrides "0"; "particle" only exists in defaults and must survive.
    expect(refs[0].textures).toEqual({
      "0": "furenikusroads:blocks/white_lane",
      particle: "furenikusroads:blocks/paint_white",
    });
  });

  it("meta=5 selects the text-lane model with y=90 and no texture override", () => {
    const refs = resolveForgeV1(whiteLane, { meta: "5" });
    expect(refs).toHaveLength(1);
    expect(refs[0].model).toBe("furenikusroads:text_lane_1");
    expect(refs[0].y).toBe(90);
    // No entry-level texture key, so only defaults.textures remain.
    expect(refs[0].textures).toEqual({
      "0": "furenikusroads:blocks/paint_white",
      particle: "furenikusroads:blocks/paint_white",
    });
  });
});

// ─── 3. submodel accumulation across several matched properties ──────────────

describe("submodel accumulation (barrier_bars_edge)", () => {
  it("lets a later property suppress an earlier one's submodel slot", () => {
    // The real file's contract: `zpost=true` fills post_main/post_l/post_r with
    // the post model, then `left=normal` and `right=corner` write `nomodel` into
    // those same slots. Forge keys submodels by slot, so the later write REPLACES
    // the post rather than drawing beside it — that is how an edge piece drops the
    // posts a middle piece has. Appending both is what stacked a post and its own
    // suppressor in the same place.
    const refs = resolveForgeV1(barrierBarsEdge, {
      zpost: "true",
      left: "normal",
      right: "corner",
    });

    // The base is emitted once, with the defaults' rotation, and comes first.
    expect(refs[0].model).toBe("furenikusroads:barrier_bars_edge");
    expect(refs[0].y).toBe(0);
    expect(refs[0].uvlock).toBe(true);

    // Every post slot was overwritten with `nomodel`, so no post survives.
    expect(refs.filter((r) => r.model === "furenikusroads:barrier_bars_edge_post")).toHaveLength(0);
    // And `nomodel` never reaches the model chain.
    expect(refs.some((r) => r.model === "furenikusroads:nomodel")).toBe(false);

    // No slot is ever drawn twice.
    expect(new Set(refs.map((r) => `${r.model}|${r.x}|${r.y}`)).size).toBe(refs.length);
  });
});

// ─── 4. bare-string submodel vs. map-of-parts submodel ───────────────────────

describe("submodel spellings (tar_distiller)", () => {
  it("a bare-string submodel resolves to a single ref with no rotation", () => {
    const refs = resolveForgeV1(tarDistiller, { fluid_left: "true" });
    expect(refs).toHaveLength(2); // base + the one submodel
    const sub = refs.find((r) => r.model === "furenikusroads:tar_distiller_fluid_out_left");
    expect(sub).toBeTruthy();
    expect(sub?.y).toBe(0);
  });

  it("a map-of-parts submodel resolves each part, honoring its own model choice", () => {
    const refsTrue = resolveForgeV1(tarDistiller, { base_plate: "true" });
    expect(refsTrue.some((r) => r.model === "furenikusroads:base_plate")).toBe(true);

    const refsFalse = resolveForgeV1(tarDistiller, { base_plate: "false" });
    expect(refsFalse.some((r) => r.model === "furenikusroads:base_plate_tar_distiller")).toBe(
      true,
    );
  });

  it("rotation entries carry their own model AND y (own-model base selection)", () => {
    const refs = resolveForgeV1(tarDistiller, { rotation: "east" });
    expect(refs).toHaveLength(1);
    expect(refs[0].model).toBe("furenikusroads:tar_distiller");
    expect(refs[0].y).toBe(90);
  });
});

// ─── 5. inventory / normal never leak into the world render ──────────────────

describe("render-case keys are never matched as properties", () => {
  it("a states value coincidentally named 'inventory' never selects the inventory model", () => {
    const refs = resolveForgeV1(counter, { facing: "north", inventory: "true" });
    expect(refs.some((r) => r.model === "cookingforblockheads:counter_inventory")).toBe(false);
  });

  it("'normal' is skipped the same way even though the file declares it", () => {
    const refs = resolveForgeV1(whiteLane, { meta: "0", normal: "true" });
    // Only the meta=0 model should appear; "normal" contributes nothing.
    expect(refs).toHaveLength(1);
    expect(refs[0].model).toBe("furenikusroads:tile_full");
  });
});

// ─── 6. an undeclared property invents nothing ────────────────────────────────

describe("undeclared properties select nothing", () => {
  it("a property the block's states omit contributes no submodels", () => {
    // barrierBarsEdge declares zpost/left/right/rotation; supply only zpost.
    const refs = resolveForgeV1(barrierBarsEdge, { zpost: "true" });
    // 1 base + 3 zpost submodels only — nothing from left/right/rotation.
    expect(refs).toHaveLength(4);
  });

  it("a property name absent from the file entirely is silently ignored", () => {
    const refs = resolveForgeV1(barrierBarsEdge, { zpost: "true", made_up: "whatever" });
    expect(refs).toHaveLength(4);
  });
});

// ─── 7. vanilla-style combination keys inside a v1 file ──────────────────────

describe("vanilla-style 'key=value' combination keys (road_snow)", () => {
  it("matches a bare 'layers=N' key the same way multipart 'when' would", () => {
    const refs = resolveForgeV1(roadSnow, { layers: "3" });
    expect(refs).toHaveLength(1);
    expect(refs[0].model).toBe("snow_height6");
  });

  it("falls back to the representative shape when no key matches", () => {
    // road_snow declares no `defaults.model`, so an unmatched `layers` used to
    // yield nothing at all and the block reverted to a flat cube. Drawing the
    // first declared shape is deliberately preferred: a snow layer of the wrong
    // depth still reads as a snow layer. Only the base model is taken this way —
    // submodels are never invented (see the `undeclared properties` suite).
    const refs = resolveForgeV1(roadSnow, { layers: "9" });
    expect(refs).toHaveLength(1);
    expect(refs[0].model).toBe("snow_height2");
  });
});

// ─── 8. texture override precedence: defaults < entry < submodel ─────────────
//
// No single real v1 file in the sample set exercises all three levels at once
// (entry-level `textures` generally either stands alone — counter.json's
// `color` — or coexists with a `submodel` whose own parts add texture overrides
// — see barrier_bars_edge_concrete_1.json's `zpost` — but never both an
// entry-level AND a submodel-level override in the same file). This fixture is
// therefore hand-assembled from that real shape (entry `textures` + `submodel`
// map with per-part `textures`) to isolate the precedence rule in one place.
describe("texture override precedence", () => {
  const precedence: ForgeBlockstateJson = {
    forge_marker: 1,
    defaults: { model: "ns:base", textures: { "0": "ns:tex_default", "1": "ns:tex_default_1" } },
    variants: {
      covered: {
        true: {
          textures: { "0": "ns:tex_entry" },
          submodel: { part: { model: "ns:sub", textures: { "0": "ns:tex_sub" } } },
        },
      },
    },
  };

  it("entry-level textures win over defaults on the base ref", () => {
    const refs = resolveForgeV1(precedence, { covered: "true" });
    const base = refs.find((r) => r.model === "ns:base");
    expect(base?.textures).toEqual({ "0": "ns:tex_entry", "1": "ns:tex_default_1" });
  });

  it("submodel-level textures win over the parent entry's on the submodel ref", () => {
    const refs = resolveForgeV1(precedence, { covered: "true" });
    const sub = refs.find((r) => r.model === "ns:sub");
    // sub overrides "0"; "1" isn't touched by entry or sub, so defaults carries it.
    expect(sub?.textures).toEqual({ "0": "ns:tex_sub", "1": "ns:tex_default_1" });
  });
});

// ─── 9. Cooking for Blockheads: facing picks rotation, color only remaps textures

describe("facing + color compose independently (counter)", () => {
  it("facing selects the y rotation and color remaps textures, both on one ref", () => {
    const refs = resolveForgeV1(counter, { facing: "west", color: "orange", flipped: "false" });
    expect(refs).toHaveLength(1);
    expect(refs[0].y).toBe(-90);
    expect(refs[0].textures!.texture).toBe("minecraft:blocks/hardened_clay_stained_orange");
    expect(refs[0].textures!.particle).toBe("minecraft:blocks/hardened_clay_stained_orange");
    // Untouched-by-color defaults must still be present.
    expect(refs[0].textures!.countertop).toBe("minecraft:blocks/stone_andesite_smooth");
  });

  it("north facing has no y override of its own; the ref falls back to 0", () => {
    const refs = resolveForgeV1(counter, { facing: "north", color: "white" });
    expect(refs[0].y).toBe(0);
  });
});
