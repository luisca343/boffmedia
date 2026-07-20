/**
 * Turn a pure {@link CompiledModel} (typed arrays) into a GPU-ready
 * {@link BuiltModel} — a `THREE.BufferGeometry` with material groups and a
 * resolved `THREE.Texture` per group.
 *
 * The geometry + textures are cached by the model key (`version|blockId|states`),
 * so every block type's geometry is built once and its textures cross the network
 * once. Materials are *not* built here — they depend on the per-instance render
 * kind / selection and are assembled per render kind (see ./material).
 */

import * as THREE from "three";
import type { CompiledModel } from "../model/types";
import { getTextureByCandidates } from "./blockTextureCache";

export interface BuiltGroup {
  texture: THREE.Texture | null;
  tint: string | null;
  doubleSided: boolean;
  /** A coplanar overlay face (e.g. grass_block_side_overlay) → needs polygon offset. */
  overlay: boolean;
}

export interface BuiltModel {
  geometry: THREE.BufferGeometry;
  groups: BuiltGroup[];
}

/** Ordered candidate srcs for a texture ref (multiple = version-ref fallback). */
type TextureResolver = (textureRef: string) => string[];

const cache = new Map<string, Promise<BuiltModel | null>>();

async function build(compiled: CompiledModel, candidatesFor: TextureResolver): Promise<BuiltModel | null> {
  if (compiled.empty) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(compiled.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(compiled.normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(compiled.uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(compiled.indices, 1));

  const groups: BuiltGroup[] = await Promise.all(
    compiled.groups.map(async (g, i) => {
      geometry.addGroup(g.start, g.count, i);
      const texture = g.textureRef ? await getTextureByCandidates(candidatesFor(g.textureRef)) : null;
      return { texture, tint: g.tint, doubleSided: g.doubleSided, overlay: !!g.textureRef?.includes("_overlay") };
    }),
  );

  return { geometry, groups };
}

/**
 * Build (or return the cached) {@link BuiltModel} for a compiled block model.
 * Returns `null` for empty models so the caller falls back to a cube.
 */
export function buildBlockModel(
  key: string,
  compiled: CompiledModel,
  candidatesFor: TextureResolver,
): Promise<BuiltModel | null> {
  let pending = cache.get(key);
  if (!pending) {
    pending = build(compiled, candidatesFor).catch(() => null);
    cache.set(key, pending);
  }
  return pending;
}
