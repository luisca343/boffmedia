"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { LittleTilesGroup } from "../types";
import type { TextureLoader } from "./assetLoaders";
import { useBlockTexture } from "./useBlockTexture";
import { metaOf, styleParams, surfaceColor } from "./material";

export interface LittleTileInstancesProps {
  group: LittleTilesGroup;
  isSelected: boolean;
  maxLayerY: number;
  version: string | undefined;
  registryId: string | undefined;
  textureLoader: TextureLoader | null;
  /** Same gate the block meshes use: only orbit-mode cursor picks select. */
  cursorPickingRef: React.RefObject<boolean>;
  onSelect: (blockId: string) => void;
}

/** Last index whose Y (stride `stride`, offset `off`) is ≤ `maxY`, or −1. */
function lastWithinLayer(arr: Float32Array, count: number, stride: number, off: number, maxY: number): number {
  let lo = 0;
  let hi = count - 1;
  let last = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid * stride + off] <= maxY) {
      last = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return last;
}

/*
 * Hexahedron faces over the decoded corner order (EUN, EUS, EDN, EDS, WUN,
 * WUS, WDN, WDS), wound CCW-outward. The last entry picks the UV projection
 * plane: 0 = XZ (up/down), 1 = XY (north/south), 2 = ZY (west/east).
 */
const QUADS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [4, 5, 1, 0, 0], // up
  [6, 2, 3, 7, 0], // down
  [6, 4, 0, 2, 1], // north
  [7, 3, 1, 5, 1], // south
  [6, 7, 5, 4, 2], // west
  [2, 0, 1, 3, 2], // east
];

/**
 * Merge every transformable box (8 explicit corners each) into one non-indexed
 * mesh: 6 quads → 36 vertices per box. A slope is a box with corners pulled
 * onto a face, so its collapsed side becomes zero-area triangles, which THREE
 * simply doesn't rasterize — no special-casing per shape. Corner positions are
 * absolute world coords, so UVs project straight from position and repeat
 * once per block, matching the texture scale of full blocks.
 */
function buildTransformedGeometry(
  corners: Float32Array,
  colors: Float32Array | undefined,
): THREE.BufferGeometry {
  const count = corners.length / 24;
  const pos = new Float32Array(count * 36 * 3);
  const uv = new Float32Array(count * 36 * 2);
  const col = colors ? new Float32Array(count * 36 * 3) : null;
  let p = 0;
  let u = 0;
  let c = 0;

  for (let i = 0; i < count; i++) {
    const r = colors ? colors[i * 3] : 1;
    const g = colors ? colors[i * 3 + 1] : 1;
    const b = colors ? colors[i * 3 + 2] : 1;
    const vert = (ci: number, uvMode: number) => {
      const o = i * 24 + ci * 3;
      const x = corners[o];
      const y = corners[o + 1];
      const z = corners[o + 2];
      pos[p++] = x;
      pos[p++] = y;
      pos[p++] = z;
      if (uvMode === 0) {
        uv[u++] = x;
        uv[u++] = z;
      } else if (uvMode === 1) {
        uv[u++] = x;
        uv[u++] = y;
      } else {
        uv[u++] = z;
        uv[u++] = y;
      }
      if (col) {
        col[c++] = r;
        col[c++] = g;
        col[c++] = b;
      }
    };
    for (const [a, b2, c2, d, m] of QUADS) {
      vert(a, m);
      vert(b2, m);
      vert(c2, m);
      vert(a, m);
      vert(c2, m);
      vert(d, m);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  if (col) geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * One InstancedMesh per LittleTiles material: each instance is a unit cube
 * scaled to a micro-box and placed inside its host block cell. Block cells are
 * centred on integer coords (the 0.98 boxGeometry convention of the block
 * meshes), so a box spanning fractions [x0,x1] of cell bx translates to
 * bx − 0.5 + (x0+x1)/2. Boxes arrive host-Y sorted (worker-side) so the layer
 * cutoff can binary-search instead of rebuilding matrices.
 *
 * Transformable boxes (slopes/wedges) can't be expressed as scaled cubes, so
 * groups that carry `corners` additionally render a merged hexahedron mesh —
 * same material, same layer cutoff (via drawRange on host-Y-sorted boxes).
 */
export function LittleTileInstances({
  group,
  isSelected,
  maxLayerY,
  version,
  registryId,
  textureLoader,
  cursorPickingRef,
  onSelect,
}: LittleTileInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const boxes = group.boxes;
  const maxCount = boxes.length / 9;
  const transformedCount = (group.corners?.length ?? 0) / 24;

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || maxCount === 0) return;
    const mat = mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < maxCount; i++) {
      const o = i * 9;
      const sx = Math.max(boxes[o + 6] - boxes[o + 3], 0.001);
      const sy = Math.max(boxes[o + 7] - boxes[o + 4], 0.001);
      const sz = Math.max(boxes[o + 8] - boxes[o + 5], 0.001);
      const tx = boxes[o] - 0.5 + (boxes[o + 3] + boxes[o + 6]) / 2;
      const ty = boxes[o + 1] - 0.5 + (boxes[o + 4] + boxes[o + 7]) / 2;
      const tz = boxes[o + 2] - 0.5 + (boxes[o + 5] + boxes[o + 8]) / 2;
      const b = i * 16;
      mat[b] = sx;      mat[b + 1] = 0;   mat[b + 2] = 0;   mat[b + 3] = 0;
      mat[b + 4] = 0;   mat[b + 5] = sy;  mat[b + 6] = 0;   mat[b + 7] = 0;
      mat[b + 8] = 0;   mat[b + 9] = 0;   mat[b + 10] = sz; mat[b + 11] = 0;
      mat[b + 12] = tx; mat[b + 13] = ty; mat[b + 14] = tz; mat[b + 15] = 1;
    }
    if (group.colors) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(group.colors, 3);
      mesh.instanceColor.needsUpdate = true;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = maxCount;
  }, [boxes, maxCount, group.colors]);

  // Layer cutoff on the host block's Y (offset 1 in the stride-9 layout).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || maxCount === 0) return;
    mesh.count = lastWithinLayer(boxes, maxCount, 9, 1, maxLayerY) + 1;
  }, [boxes, maxCount, maxLayerY]);

  const transformedGeo = useMemo(
    () =>
      group.corners && transformedCount > 0
        ? buildTransformedGeometry(group.corners, group.cornerColors)
        : null,
    [group.corners, group.cornerColors, transformedCount],
  );
  useEffect(() => () => transformedGeo?.dispose(), [transformedGeo]);

  useEffect(() => {
    if (!transformedGeo || !group.cornerHostY) return;
    const last = lastWithinLayer(group.cornerHostY, transformedCount, 1, 0, maxLayerY);
    transformedGeo.setDrawRange(0, (last + 1) * 36);
  }, [transformedGeo, group.cornerHostY, transformedCount, maxLayerY]);

  const texture = useBlockTexture(
    group.block.id,
    version,
    registryId,
    textureLoader,
    metaOf(group.block.states),
  );
  // World-coordinate UVs on the slope mesh run past [0,1]; the shared texture
  // must wrap for them (harmless for the cube path, whose UVs stay in range).
  useEffect(() => {
    if (!texture || transformedCount === 0) return;
    if (texture.wrapS !== THREE.RepeatWrapping || texture.wrapT !== THREE.RepeatWrapping) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
    }
  }, [texture, transformedCount]);

  if (maxCount === 0 && transformedCount === 0) return null;
  const sp = styleParams("normal", isSelected);
  const color = surfaceColor(group.block.id, !!texture, null, sp.ghost);
  const handleClick = (e: { stopPropagation: () => void }) => {
    if (!cursorPickingRef.current) return;
    e.stopPropagation();
    onSelect(group.block.id);
  };
  const materialProps = {
    map: texture ?? undefined,
    color: new THREE.Color(color),
    emissive: new THREE.Color(sp.emissive),
    emissiveIntensity: sp.emissiveIntensity,
    transparent: sp.transparent,
    opacity: sp.opacity,
    depthWrite: sp.depthWrite,
  };

  return (
    <group>
      {maxCount > 0 && (
        <instancedMesh
          ref={meshRef}
          args={[undefined, undefined, maxCount]}
          // Same rationale as the block meshes: instances are spread across the
          // schematic but the bounding sphere is origin-centred — culling off.
          frustumCulled={false}
          onClick={handleClick}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            key={`${texture ? texture.uuid : "flat"}|${isSelected ? "sel" : ""}`}
            {...materialProps}
          />
        </instancedMesh>
      )}
      {transformedGeo && (
        <mesh geometry={transformedGeo} onClick={handleClick}>
          <meshStandardMaterial
            key={`${texture ? texture.uuid : "flat"}|${isSelected ? "sel" : ""}|t`}
            {...materialProps}
            vertexColors={!!group.cornerColors}
            // Slopes are single-sheet where a face collapses; render both sides
            // so a wedge viewed from its cut side doesn't vanish.
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
