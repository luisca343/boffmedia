/**
 * End-to-end pipeline test: real Forge v1 blockstate JSON → resolveModelRefs →
 * (per ref) resolveModelInstance, via a hand-written stub AssetProvider serving
 * inlined model JSON copied verbatim from the extracted mod JARs. Pins that a
 * ModelRef's `textures` override actually reaches the resolved ModelInstance.
 */

import { describe, expect, it } from "vitest";
import { resolveModelRefs } from "./blockstate";
import { resolveModelInstance } from "./model-resolver";
import type { AssetProvider, Blockstate, RawModel } from "./types";
import type { ForgeBlockstateJson } from "../registry/forge-blockstate";

// ─── Blockstate fixtures (verbatim, see forge-v1.test.ts for provenance notes) ─

const whiteLane = {
  forge_marker: 1,
  defaults: {
    textures: {
      "0": "furenikusroads:blocks/paint_white",
      particle: "furenikusroads:blocks/paint_white",
    },
    model: "furenikusroads:tile_full",
  },
  variants: {
    meta: {
      "2": {
        model: "furenikusroads:tile_full",
        y: 180,
        textures: { "0": "furenikusroads:blocks/white_lane" },
      },
    },
  },
} as unknown as ForgeBlockstateJson & Blockstate;

const barrierBarsEdge = {
  forge_marker: 1,
  defaults: {
    model: "furenikusroads:barrier_bars_edge",
    uvlock: true,
    textures: { particle: "furenikusroads:blocks/machine_metal" },
  },
  variants: {
    zpost: {
      true: {
        submodel: {
          post_main: { model: "furenikusroads:barrier_bars_edge_post" },
          post_l: { model: "furenikusroads:barrier_bars_edge_post", y: 270 },
        },
      },
    },
  },
} as unknown as ForgeBlockstateJson & Blockstate;

// ─── Model fixtures (verbatim) ────────────────────────────────────────────────

// furenikusroads/models/block/tile_full.json — a paper-thin single-face plane.
const tileFullModel: RawModel = {
  textures: { "0": "furenikusroads:blocks/paint_white" },
  elements: [
    {
      from: [0, 0.1, 0],
      to: [16, 0.1, 16],
      faces: { up: { uv: [0, 0, 16, 16], texture: "#0" } },
    },
  ],
};

// furenikusroads/models/block/barrier_bars_edge.json — 8-element post/rail model.
// Full element list kept verbatim; only elements[0] is asserted on below.
const barrierBarsEdgeModel: RawModel = {
  textures: { "0": "furenikusroads:blocks/machine_metal", particle: "furenikusroads:blocks/machine_metal" },
  elements: [
    {
      from: [2, 19, 0],
      to: [14, 20, 2],
      faces: {
        north: { uv: [2, 3, 14, 4], texture: "#0" },
        east: { uv: [14, 3, 16, 4], texture: "#0" },
        south: { uv: [2, 3, 14, 4], texture: "#0" },
        west: { uv: [0, 3, 2, 4], texture: "#0" },
        up: { uv: [2, 0, 14, 2], texture: "#0" },
        down: { uv: [2, 14, 14, 16], texture: "#0" },
      },
    },
    {
      from: [4.5, 0, 0.5],
      to: [5.5, 16, 1.5],
      faces: {
        north: { uv: [10.5, 0, 11.5, 16], texture: "#0" },
        east: { uv: [14.5, 0, 15.5, 16], texture: "#0" },
        south: { uv: [4.5, 0, 5.5, 16], texture: "#0" },
        west: { uv: [0.5, 0, 1.5, 16], texture: "#0" },
        up: { uv: [4.5, 0.5, 5.5, 1.5], texture: "#0" },
        down: { uv: [4.5, 14.5, 5.5, 15.5], texture: "#0" },
      },
    },
  ],
  // NOTE: trimmed from 8 elements to 2 (the source has 6 more post/rail bars);
  // trimming only drops repeated element blocks, geometry/texture shape unchanged.
};

// furenikusroads/models/block/barrier_bars_edge_post.json — 2-element post model.
const barrierBarsEdgePostModel: RawModel = {
  textures: { "0": "furenikusroads:blocks/machine_metal", particle: "furenikusroads:blocks/machine_metal" },
  elements: [
    {
      from: [7, 0, 0],
      to: [9, 16, 2],
      faces: {
        north: { uv: [7, 0, 9, 16], texture: "#0" },
        east: { uv: [14, 0, 16, 16], texture: "#0" },
        south: { uv: [7, 0, 9, 16], texture: "#0" },
        west: { uv: [0, 0, 2, 16], texture: "#0" },
        up: { uv: [7, 0, 9, 2], texture: "#0" },
        down: { uv: [7, 14, 9, 16], texture: "#0" },
      },
    },
    {
      from: [7, 16, 0],
      to: [9, 19, 2],
      faces: {
        north: { uv: [7, 13, 9, 16], texture: "#0" },
        east: { uv: [14, 13, 16, 16], texture: "#0" },
        south: { uv: [7, 13, 9, 16], texture: "#0" },
        west: { uv: [0, 13, 2, 16], texture: "#0" },
        up: { uv: [7, 0, 9, 2], texture: "#0" },
        down: { uv: [7, 14, 9, 16], texture: "#0" },
      },
    },
  ],
};

function stubProvider(models: Record<string, RawModel>): AssetProvider {
  return {
    async getBlockstate() {
      return null; // unused — this test feeds Blockstate objects straight to resolveModelRefs
    },
    async getModel(ref: string) {
      const key = ref.includes(":") ? ref.split(":")[1] : ref;
      return models[key] ?? models[ref] ?? null;
    },
    textureCandidates() {
      return [];
    },
  };
}

describe("forge v1 pipeline: blockstate -> ModelRef -> ModelInstance (white_lane)", () => {
  it("resolves non-empty elements and flattens the ref's texture override", async () => {
    const provider = stubProvider({ tile_full: tileFullModel });

    const refs = resolveModelRefs(whiteLane as Blockstate, { meta: "2" });
    expect(refs).toHaveLength(1);

    const instance = await resolveModelInstance(provider, refs[0]);
    expect(instance).not.toBeNull();
    expect(instance!.model.elements?.length).toBeGreaterThan(0);

    // Core assertion: the blockstate ref's texture override ("0" -> white_lane)
    // must win over the model's own declared texture ("0" -> paint_white), and
    // land on the resolved instance with no leftover "#" indirection.
    expect(instance!.textures["0"]).toBe("furenikusroads:blocks/white_lane");
    expect(instance!.textures["0"].startsWith("#")).toBe(false);
    expect(instance!.y).toBe(180);
  });
});

describe("forge v1 pipeline: blockstate -> ModelRef -> ModelInstance (barrier_bars_edge, submodel)", () => {
  it("resolves both the base ref and its submodel ref to non-empty geometry", async () => {
    const provider = stubProvider({
      barrier_bars_edge: barrierBarsEdgeModel,
      barrier_bars_edge_post: barrierBarsEdgePostModel,
    });

    const refs = resolveModelRefs(barrierBarsEdge as Blockstate, { zpost: "true" });
    // base (barrier_bars_edge) + post_main + post_l
    expect(refs).toHaveLength(3);

    const instances = await Promise.all(refs.map((r) => resolveModelInstance(provider, r)));
    for (const instance of instances) {
      expect(instance).not.toBeNull();
      expect(instance!.model.elements?.length).toBeGreaterThan(0);
    }

    // The post_l submodel ref carries y=270 and must reach the instance verbatim.
    const postL = refs.find((r) => r.y === 270);
    expect(postL).toBeTruthy();
    const postLInstance = await resolveModelInstance(provider, postL!);
    expect(postLInstance!.y).toBe(270);
    // Inherited texture (no submodel-level override in this fixture): falls
    // through to the model's own declared "0", merged via the ref's empty
    // textures map — still must resolve to a concrete (non-"#") ref.
    expect(postLInstance!.textures["0"]).toBe("furenikusroads:blocks/machine_metal");
  });
});

// ─── #-indirection flattening ─────────────────────────────────────────────────
//
// None of the real Roads/CookingForBlockheads model JSON in the sample set
// actually declares a `#var` -> `#var2` chain (every model's own `textures` map
// points straight at concrete refs) — resolveTextureRefs()'s loop exists for
// vanilla parent-chain models generally, not something these two mods exercise.
// This fixture is therefore a minimal hand-built RawModel (not from a real
// file) built specifically to pin that multi-hop flattening mechanism, since no
// real fixture in the sample set exercises it.
describe("resolveModelInstance flattens #-indirection chains", () => {
  it("follows textures.layer0 = '#0' style aliasing down to the concrete ref", async () => {
    const chained: RawModel = {
      textures: { layer0: "#0", "0": "#base", base: "furenikusroads:blocks/paint_white" },
      elements: [{ from: [0, 0, 0], to: [16, 16, 16], faces: { up: { texture: "#layer0" } } }],
    };
    const provider = stubProvider({ chained });
    const instance = await resolveModelInstance(provider, { model: "ns:chained" });
    expect(instance).not.toBeNull();
    expect(instance!.textures.layer0).toBe("furenikusroads:blocks/paint_white");
    expect(instance!.textures.layer0.startsWith("#")).toBe(false);
  });
});
