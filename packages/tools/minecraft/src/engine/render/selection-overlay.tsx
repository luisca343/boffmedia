"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useInstanceMatrices } from "./instance-matrices";
import { maxSliceCount } from "./picking";

/** Same boffmedia accent as LittleTileHighlight — reads as UI chrome, not a block. */
const OVERLAY_COLOR = "#ff5c0a";
/** Wrap the real cube geometry with a little slack so the overlay never z-fights it. */
const INFLATE = 1.06;

interface OverlayMeshProps {
  positions: Float32Array;
  slice: boolean;
  maxLayerY: number;
  materialRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}

/** One InstancedMesh of inflated unit boxes, reusing the same layer-cutoff rule
 *  (useInstanceMatrices) the real block mesh it outlines uses. */
function OverlayMesh({ positions, slice, maxLayerY, materialRef }: OverlayMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const capacity = useMemo(
    () => (slice ? maxSliceCount(positions) : positions.length / 3),
    [slice, positions],
  );
  useInstanceMatrices(meshRef, positions, capacity, maxLayerY, "selection-overlay", slice);
  if (capacity === 0) return null;
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, capacity]}
      frustumCulled={false}
      raycast={() => null}
    >
      <boxGeometry args={[INFLATE, INFLATE, INFLATE]} />
      <meshStandardMaterial
        ref={materialRef}
        color={new THREE.Color(OVERLAY_COLOR)}
        emissive={new THREE.Color(OVERLAY_COLOR)}
        emissiveIntensity={1}
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export interface SelectionOverlayProps {
  /** Surface-set positions of the selected block group. */
  positions: Float32Array;
  /** Its interior set, when present — same split the base render draws. */
  interiorPositions?: Float32Array;
  maxLayerY: number;
}

/**
 * RF-06 outline + pulse for the selected block group: a translucent inflated
 * shell over its positions (and interior set, cut by the same active Y-slice
 * as the block it wraps), pulsing via a sine wave on emissive intensity and
 * opacity. `raycast={() => null}` on both meshes, mirroring LittleTileHighlight
 * — a pure overlay that never competes with DDA picking or cursor clicks.
 */
export function SelectionOverlay({ positions, interiorPositions, maxLayerY }: SelectionOverlayProps) {
  const surfaceMat = useRef<THREE.MeshStandardMaterial>(null);
  const interiorMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const pulse = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 4);
    const intensity = 0.7 + pulse * 0.9;
    const opacity = 0.25 + pulse * 0.3;
    if (surfaceMat.current) {
      surfaceMat.current.emissiveIntensity = intensity;
      surfaceMat.current.opacity = opacity;
    }
    if (interiorMat.current) {
      interiorMat.current.emissiveIntensity = intensity;
      interiorMat.current.opacity = opacity;
    }
  });

  const hasInterior = !!interiorPositions && interiorPositions.length > 0;
  if (positions.length === 0 && !hasInterior) return null;

  return (
    <group>
      {positions.length > 0 && (
        <OverlayMesh positions={positions} slice={false} maxLayerY={maxLayerY} materialRef={surfaceMat} />
      )}
      {hasInterior && (
        <OverlayMesh
          positions={interiorPositions as Float32Array}
          slice
          maxLayerY={maxLayerY}
          materialRef={interiorMat}
        />
      )}
    </group>
  );
}
