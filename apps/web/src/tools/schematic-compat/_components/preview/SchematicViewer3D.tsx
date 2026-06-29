"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useToolStore } from "../../_store/tool.store";
import { placeholderColor } from "../../_lib/textures/blockTexture";
import type { BlockPositionGroup, DiffEntry } from "../../_lib/types";

// ─── Status colour tints ──────────────────────────────────────────────────────

const STATUS_TINT: Record<DiffEntry["status"], string | null> = {
  safe: null,
  renamed: "#f59e0b",
  "state-changed": "#a78bfa",
  missing: "#ef4444",
  "mod-only": "#60a5fa",
};

// ─── Per-block-type instanced mesh ────────────────────────────────────────────

interface BlockInstancesProps {
  group: BlockPositionGroup;
  diffStatus: DiffEntry["status"] | undefined;
  isSelected: boolean;
  maxLayerY: number;
  onSelect: (blockId: string) => void;
}

function BlockInstances({
  group,
  diffStatus,
  isSelected,
  maxLayerY,
  onSelect,
}: BlockInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const maxCount = group.positions.length / 3;

  // Write all translation matrices once when position data changes.
  // Positions from the worker are Y-sorted (yi was the outermost loop),
  // so the Y-layer effect below can use binary search instead of a full scan.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || maxCount === 0) return;
    const mat = mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < maxCount; i++) {
      const x = group.positions[i * 3];
      const y = group.positions[i * 3 + 1];
      const z = group.positions[i * 3 + 2];
      const b = i * 16;
      // Column-major translation matrix (scale=1, no rotation)
      mat[b]    = 1; mat[b+1]  = 0; mat[b+2]  = 0; mat[b+3]  = 0;
      mat[b+4]  = 0; mat[b+5]  = 1; mat[b+6]  = 0; mat[b+7]  = 0;
      mat[b+8]  = 0; mat[b+9]  = 0; mat[b+10] = 1; mat[b+11] = 0;
      mat[b+12] = x; mat[b+13] = y; mat[b+14] = z; mat[b+15] = 1;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = maxCount;
  }, [group.positions, maxCount]);

  // Apply Y-layer cutoff via binary search (positions are Y-sorted).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || maxCount === 0) return;
    let lo = 0, hi = maxCount - 1, last = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (group.positions[mid * 3 + 1] <= maxLayerY) { last = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    mesh.count = last + 1;
  }, [maxLayerY, group.positions, maxCount]);

  if (maxCount === 0) return null;

  const tint = diffStatus ? STATUS_TINT[diffStatus] : null;
  const base = tint ?? placeholderColor(group.block.id);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, maxCount]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(group.block.id);
      }}
    >
      <boxGeometry args={[0.98, 0.98, 0.98]} />
      <meshStandardMaterial
        color={base}
        emissive={isSelected ? base : "#000000"}
        emissiveIntensity={isSelected ? 0.45 : 0}
        roughness={0.75}
        metalness={0}
      />
    </instancedMesh>
  );
}

// ─── Camera initial placement ─────────────────────────────────────────────────

function CameraRig({ dimensions }: { dimensions: { x: number; y: number; z: number } }) {
  const { camera } = useThree();
  useEffect(() => {
    const { x: sx, y: sy, z: sz } = dimensions;
    const span = Math.max(sx, sy, sz);
    const dist = span * 2.2;
    camera.position.set(sx / 2 + dist * 0.55, sy / 2 + dist * 0.45, sz / 2 + dist * 0.85);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = 0.1;
      camera.far = dist * 20;
      camera.updateProjectionMatrix();
    }
    // Only run on first mount / dimension change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.x, dimensions.y, dimensions.z]);
  return null;
}

// ─── Scene — reads from the Zustand store ────────────────────────────────────

function Scene() {
  const blockPositions = useToolStore((s) => s.blockPositions);
  const diff = useToolStore((s) => s.diff);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const layerY = useToolStore((s) => s.layerY);
  const diffOnlyMode = useToolStore((s) => s.diffOnlyMode);
  const schematic = useToolStore((s) => s.schematic);
  const setSelectedBlock = useToolStore((s) => s.setSelectedBlock);

  const diffStatusMap = useMemo(() => {
    const m = new Map<string, DiffEntry["status"]>();
    diff?.entries.forEach((e) => m.set(e.block.id, e.status));
    return m;
  }, [diff]);

  const visibleGroups = useMemo(() => {
    if (!diffOnlyMode) return blockPositions;
    return blockPositions.filter((g) => {
      const s = diffStatusMap.get(g.block.id);
      return s !== undefined && s !== "safe";
    });
  }, [blockPositions, diffOnlyMode, diffStatusMap]);

  const handleSelect = useCallback(
    (id: string) => setSelectedBlock(id === selectedBlockId ? undefined : id),
    [selectedBlockId, setSelectedBlock],
  );

  const dims = schematic?.dimensions ?? { x: 16, y: 16, z: 16 };
  const target = useMemo<[number, number, number]>(
    () => [dims.x / 2, dims.y / 2, dims.z / 2],
    [dims.x, dims.y, dims.z],
  );

  return (
    <>
      <CameraRig dimensions={dims} />
      <OrbitControls makeDefault target={target} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-6, 8, -8]} intensity={0.25} />
      {visibleGroups.map((group) => (
        <BlockInstances
          key={group.paletteIndex}
          group={group}
          diffStatus={diffStatusMap.get(group.block.id)}
          isSelected={group.block.id === selectedBlockId}
          maxLayerY={layerY}
          onSelect={handleSelect}
        />
      ))}
    </>
  );
}

// ─── Public component (rendered inside a no-SSR dynamic import) ───────────────

export function SchematicViewer3D() {
  const blockPositions = useToolStore((s) => s.blockPositions);
  const isFetchingPositions = useToolStore((s) => s.isFetchingPositions);
  const schematic = useToolStore((s) => s.schematic);

  if (!schematic) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-ink-dim">
        Load a schematic to see the 3D preview
      </div>
    );
  }

  if (isFetchingPositions) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-ink-dim">
        Preparing 3D data…
      </div>
    );
  }

  if (blockPositions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-ink-dim">
        Run Analyze to generate the preview
      </div>
    );
  }

  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#0f172a" }}
      className="h-full w-full"
    >
      <Scene />
    </Canvas>
  );
}
