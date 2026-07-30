"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { LittleTilesGroup } from "../types";
import type { TextureLoader } from "./assetLoaders";
import { useBlockTexture } from "./useBlockTexture";
import { metaOf, styleParams, surfaceColor } from "./material";
import { buildTransformedArrays } from "./littletile-geometry";

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
  /** Block id whose texture to draw (a render plan's target); defaults to the
   *  group's own material. Selection still keys on the group's id. */
  textureId?: string;
  /** States driving the texture lookup; defaults to the group block's own. */
  states?: Record<string, string>;
  kind?: "normal" | "changed" | "ghost" | "problem";
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

/**
 * Merge every transformable box into one non-indexed mesh. When `bounds` is
 * given (6 floats per box, world space) each box is clipped to its own AABB
 * the way the mod renders it — see littletile-geometry.ts. Corner positions
 * are absolute world coords, so UVs project straight from position and repeat
 * once per block, matching the texture scale of full blocks. The per-box
 * cumulative vertex counts land in `geo.userData.boxVertEnd` for the layer
 * cutoff (vertex counts vary once clipping kicks in).
 */
export function buildTransformedGeometry(
  corners: Float32Array,
  colors: Float32Array | undefined,
  bounds?: Float32Array,
): THREE.BufferGeometry {
  const arrays = buildTransformedArrays(corners, colors, bounds);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arrays.positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(arrays.uvs, 2));
  if (arrays.colors) geo.setAttribute("color", new THREE.BufferAttribute(arrays.colors, 3));
  geo.userData.boxVertEnd = arrays.boxVertEnd;
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
  textureId,
  states,
  kind = "normal",
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
        ? buildTransformedGeometry(group.corners, group.cornerColors, group.cornerBounds)
        : null,
    [group.corners, group.cornerColors, group.cornerBounds, transformedCount],
  );
  useEffect(() => () => transformedGeo?.dispose(), [transformedGeo]);

  useEffect(() => {
    if (!transformedGeo || !group.cornerHostY) return;
    const last = lastWithinLayer(group.cornerHostY, transformedCount, 1, 0, maxLayerY);
    const ends = transformedGeo.userData.boxVertEnd as Uint32Array;
    transformedGeo.setDrawRange(0, last < 0 ? 0 : ends[last]);
  }, [transformedGeo, group.cornerHostY, transformedCount, maxLayerY]);

  const renderId = textureId ?? group.block.id;
  const renderStates = states ?? group.block.states;
  const texture = useBlockTexture(renderId, version, registryId, textureLoader, metaOf(renderStates));
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
  const sp = styleParams(kind, isSelected);
  const color = surfaceColor(renderId, !!texture, null, sp.ghost);
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
