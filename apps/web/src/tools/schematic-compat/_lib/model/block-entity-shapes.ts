/**
 * Curated geometry for block-entity blocks whose vanilla JSON model is empty
 * (their real shape comes from a hardcoded entity renderer, not data). Without
 * this they'd fall back to a plain cube; here we give the common ones an
 * approximate-but-recognisable shape, textured with a sensible block texture
 * (e.g. signs use their species' planks).
 *
 * Returns synthetic {@link ModelInstance}s that compile through the normal path,
 * or `null` for blocks we don't special-case (caller uses the cube fallback).
 */

import type { ModelElement, ModelInstance } from "./types";

type States = Record<string, string>;

/** A 16-way `rotation` (signs/banners/skulls) or 4-way `facing` → y degrees. */
function facingY(states: States): number {
  const facing = states.facing;
  if (facing) {
    const map: Record<string, number> = { south: 0, west: 90, north: 180, east: 270 };
    return map[facing] ?? 0;
  }
  const rot = parseInt(states.rotation ?? "0", 10) || 0;
  return (rot * 360) / 16;
}

function woodSpecies(name: string): string {
  const m = name.match(/^([a-z_]+?)_(?:wall_)?(?:hanging_)?sign$/);
  return m ? m[1] : "oak";
}

function element(from: ModelElement["from"], to: ModelElement["to"], texture: string): ModelElement {
  const face = { texture };
  return {
    from,
    to,
    faces: { down: face, up: face, north: face, south: face, west: face, east: face },
  };
}

function instance(elements: ModelElement[], plankTex: string, y: number): ModelInstance {
  return { model: { elements }, textures: { tex: plankTex }, x: 0, y, uvlock: false };
}

/** Returns curated model instances for a block-entity block, or null. */
export function blockEntityModel(blockId: string, states: States): ModelInstance[] | null {
  const i = blockId.indexOf(":");
  const name = i === -1 ? blockId : blockId.slice(i + 1);

  // Standing & wall signs / hanging signs → a thin board (+ post when standing).
  if (name.endsWith("sign")) {
    const planks = `block/${woodSpecies(name)}_planks`;
    const wall = name.includes("wall_") || name.includes("hanging");
    const board = element([1, 7, 7], [15, 15, 9], "#tex");
    const elements = wall ? [board] : [board, element([7, 0, 7], [9, 7, 9], "#tex")];
    return [instance(elements, planks, facingY(states))];
  }

  // Beds → a low slab the footprint of the block.
  if (name.endsWith("_bed")) {
    const wool = `block/${name.replace(/_bed$/, "")}_wool`;
    return [instance([element([0, 0, 0], [16, 9, 16], "#tex")], wool, facingY(states))];
  }

  return null;
}
