"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildTransformedGeometry } from "./littletile-instances";

/** The boffmedia accent (naranja) — the highlight must read as UI chrome, not as a block. */
const HIGHLIGHT_COLOR = "#ff5c0a";
/** Wrap the real geometry with a little slack so the overlay never z-fights it. */
const INFLATE = 1.03;
const BASE_INTENSITY = 1.6;
const BASE_OPACITY = 0.35;

export interface LittleTileHighlightProps {
  /** Stride-9 layout of {@link LittleTilesGroup.boxes}: host cell + box min/max fractions. */
  boxes: Float32Array;
  /** 24 floats per transformable box (8 corners × xyz), absolute world coords. */
  corners?: Float32Array;
  /** 6 floats per transformable box: its clip AABB ({@link LittleTilesStructure.cornerBounds}). */
  cornerBounds?: Float32Array;
}

/**
 * Translucent accent shell over a LittleTiles structure's geometry: an
 * InstancedMesh of unit cubes placed exactly like {@link LittleTileInstances}
 * (inflated slightly so it wraps the textured tiles), plus a merged hexahedron
 * mesh for transformable boxes. Pure overlay — no layer cutoff, no picking.
 */
export function LittleTileHighlight({ boxes, corners, cornerBounds }: LittleTileHighlightProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const boxMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const cornerMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const count = boxes.length / 9;
  const cornerCount = (corners?.length ?? 0) / 24;

  // RF-06: pulse the same way SelectionOverlay pulses a selected block group,
  // so a highlighted structure reads with the same "look here" cue.
  useFrame(({ clock }) => {
    const pulse = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 4);
    const intensity = BASE_INTENSITY - 0.5 + pulse * 1.0;
    const opacity = BASE_OPACITY - 0.1 + pulse * 0.2;
    if (boxMatRef.current) {
      boxMatRef.current.emissiveIntensity = intensity;
      boxMatRef.current.opacity = opacity;
    }
    if (cornerMatRef.current) {
      cornerMatRef.current.emissiveIntensity = intensity;
      cornerMatRef.current.opacity = opacity;
    }
  });

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;
    const mat = mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const o = i * 9;
      const sx = Math.max(boxes[o + 6] - boxes[o + 3], 0.001) * INFLATE;
      const sy = Math.max(boxes[o + 7] - boxes[o + 4], 0.001) * INFLATE;
      const sz = Math.max(boxes[o + 8] - boxes[o + 5], 0.001) * INFLATE;
      const tx = boxes[o] - 0.5 + (boxes[o + 3] + boxes[o + 6]) / 2;
      const ty = boxes[o + 1] - 0.5 + (boxes[o + 4] + boxes[o + 7]) / 2;
      const tz = boxes[o + 2] - 0.5 + (boxes[o + 5] + boxes[o + 8]) / 2;
      const b = i * 16;
      mat[b] = sx;      mat[b + 1] = 0;   mat[b + 2] = 0;   mat[b + 3] = 0;
      mat[b + 4] = 0;   mat[b + 5] = sy;  mat[b + 6] = 0;   mat[b + 7] = 0;
      mat[b + 8] = 0;   mat[b + 9] = 0;   mat[b + 10] = sz; mat[b + 11] = 0;
      mat[b + 12] = tx; mat[b + 13] = ty; mat[b + 14] = tz; mat[b + 15] = 1;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = count;
  }, [boxes, count]);

  const cornerGeo = useMemo(
    () =>
      corners && cornerCount > 0 ? buildTransformedGeometry(corners, undefined, cornerBounds) : null,
    [corners, cornerBounds, cornerCount],
  );
  useEffect(() => () => cornerGeo?.dispose(), [cornerGeo]);

  if (count === 0 && cornerCount === 0) return null;

  const materialProps = {
    color: new THREE.Color(HIGHLIGHT_COLOR),
    emissive: new THREE.Color(HIGHLIGHT_COLOR),
    emissiveIntensity: BASE_INTENSITY,
    transparent: true,
    opacity: BASE_OPACITY,
    depthWrite: false,
  };

  return (
    <group>
      {count > 0 && (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial ref={boxMatRef} {...materialProps} />
        </instancedMesh>
      )}
      {cornerGeo && (
        <mesh geometry={cornerGeo} raycast={() => null}>
          <meshStandardMaterial ref={cornerMatRef} {...materialProps} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
