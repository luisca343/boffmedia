"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useToolStore } from "../../_store/tool.store";
import { placeholderColor } from "../../_lib/textures/blockTexture";
import { useModTextureLoader } from "../../_hooks/modTextureContext";
import { getBlockTexture } from "./blockTextureCache";
import { sourcePlan, convertedPlan, type RenderKind } from "./previewPlan";
import type { BlockPositionGroup, DiffEntry } from "../../_lib/types";

type ModTextureLoader = (registryId: string, blockId: string) => Promise<string | null>;

/** Resolves a block's THREE texture (vanilla CDN / mod JAR), or null on a miss. */
function useBlockTexture(
  blockId: string,
  version: string | undefined,
  registryId: string | undefined,
  modLoader: ModTextureLoader | null,
): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    setTex(null);
    getBlockTexture(blockId, version, registryId, modLoader).then((t) => {
      if (!cancelled) setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [blockId, version, registryId, modLoader]);
  return tex;
}

// ─── Per-render-kind material styling ─────────────────────────────────────────

const CHANGED_GLOW = "#22c55e"; // green — this block was converted
const PROBLEM_GLOW = "#ef4444"; // red — unresolved (missing / mod-only)

interface MaterialStyle {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
}

/**
 * Material props for a block given its render kind + texture + selection.
 *  - normal  : source-mode look — texture (or placeholder), glow only when selected.
 *  - changed : converted target block — green glow so it stands out.
 *  - problem : unresolved block — red glow, it has no valid target yet.
 *  - ghost   : untouched block in converted mode — muted + translucent so the
 *              changed blocks dominate the view.
 * A selected block is always forced solid and brightly lit so it's findable.
 */
function materialStyle(kind: RenderKind, isSelected: boolean, hasTexture: boolean, blockId: string): MaterialStyle {
  const lit = hasTexture ? "#ffffff" : placeholderColor(blockId);

  if (isSelected) {
    const emissive = kind === "problem" ? PROBLEM_GLOW : kind === "changed" ? CHANGED_GLOW : "#ffffff";
    return { color: lit, emissive, emissiveIntensity: 0.65, transparent: false, opacity: 1, depthWrite: true };
  }

  switch (kind) {
    case "ghost":
      // Mute the texture (multiplied by slate) and fade it back.
      return {
        color: hasTexture ? "#7c8896" : "#3f4754",
        emissive: "#000000",
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      };
    case "changed":
      return { color: lit, emissive: CHANGED_GLOW, emissiveIntensity: 0.35, transparent: false, opacity: 1, depthWrite: true };
    case "problem":
      return { color: lit, emissive: PROBLEM_GLOW, emissiveIntensity: 0.5, transparent: false, opacity: 1, depthWrite: true };
    default:
      return { color: lit, emissive: "#000000", emissiveIntensity: 0, transparent: false, opacity: 1, depthWrite: true };
  }
}

// ─── Per-block-type instanced mesh ────────────────────────────────────────────

interface BlockInstancesProps {
  group: BlockPositionGroup;
  /** Block id whose texture to render (may differ from the group's source id). */
  textureId: string;
  kind: RenderKind;
  isSelected: boolean;
  maxLayerY: number;
  version: string | undefined;
  registryId: string | undefined;
  modLoader: ModTextureLoader | null;
  onSelect: (blockId: string) => void;
}

function BlockInstances({
  group,
  textureId,
  kind,
  isSelected,
  maxLayerY,
  version,
  registryId,
  modLoader,
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

  const texture = useBlockTexture(textureId, version, registryId, modLoader);

  if (maxCount === 0) return null;

  const style = materialStyle(kind, isSelected, !!texture, textureId);

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
        // Remount the material when the texture arrives or the render kind /
        // selection changes, so map compile + transparency flags apply cleanly.
        key={`${texture ? texture.uuid : "flat"}|${kind}|${isSelected ? "sel" : ""}`}
        map={texture ?? undefined}
        color={style.color}
        emissive={style.emissive}
        emissiveIntensity={style.emissiveIntensity}
        transparent={style.transparent}
        opacity={style.opacity}
        depthWrite={style.depthWrite}
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

interface SceneProps {
  sourceVersion: string | undefined;
  sourceRegistryId: string | undefined;
  targetVersion: string | undefined;
  targetRegistryId: string | undefined;
  modLoader: ModTextureLoader | null;
}

function Scene({
  sourceVersion,
  sourceRegistryId,
  targetVersion,
  targetRegistryId,
  modLoader,
}: SceneProps) {
  const blockPositions = useToolStore((s) => s.blockPositions);
  const diff = useToolStore((s) => s.diff);
  const resolutions = useToolStore((s) => s.resolutions);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const layerY = useToolStore((s) => s.layerY);
  const diffOnlyMode = useToolStore((s) => s.diffOnlyMode);
  const previewMode = useToolStore((s) => s.previewMode);
  const schematic = useToolStore((s) => s.schematic);
  const setSelectedBlock = useToolStore((s) => s.setSelectedBlock);

  // Converted mode only makes sense once a diff exists; otherwise show source.
  const converted = previewMode === "converted" && !!diff;

  const diffEntryMap = useMemo(() => {
    const m = new Map<string, DiffEntry>();
    diff?.entries.forEach((e) => m.set(e.block.id, e));
    return m;
  }, [diff]);

  const visibleGroups = useMemo(() => {
    if (!diffOnlyMode) return blockPositions;
    return blockPositions.filter((g) => {
      const s = diffEntryMap.get(g.block.id)?.status;
      return s !== undefined && s !== "safe";
    });
  }, [blockPositions, diffOnlyMode, diffEntryMap]);

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
      {visibleGroups.map((group) => {
        const id = group.block.id;
        const entry = diffEntryMap.get(id);
        const plan = converted
          ? convertedPlan(id, entry?.status, entry?.autoCandidate?.id, resolutions[id]?.targetId)
          : sourcePlan(id);
        return (
          <BlockInstances
            key={group.paletteIndex}
            group={group}
            textureId={plan.textureId}
            kind={plan.kind}
            isSelected={id === selectedBlockId}
            maxLayerY={layerY}
            version={plan.useTarget ? targetVersion : sourceVersion}
            registryId={plan.useTarget ? targetRegistryId : sourceRegistryId}
            modLoader={modLoader}
            onSelect={handleSelect}
          />
        );
      })}
    </>
  );
}

// ─── Public component (rendered inside a no-SSR dynamic import) ───────────────

export function SchematicViewer3D() {
  const blockPositions = useToolStore((s) => s.blockPositions);
  const isFetchingPositions = useToolStore((s) => s.isFetchingPositions);
  const schematic = useToolStore((s) => s.schematic);
  // Schematic blocks come from the source instance — resolve their textures
  // against the source registry's version (vanilla CDN) and id (mod JARs).
  // In "converted" mode, changed blocks instead resolve against the target
  // registry (the block they're being converted to).
  const sourceReg = useToolStore((s) => s.sourceReg);
  const targetReg = useToolStore((s) => s.targetReg);
  // Grabbed here, outside the R3F <Canvas>: the Canvas runs its own reconciler,
  // so React context from this tree does not reach components rendered inside it.
  // We capture the loader as a value and pass it down as a prop instead.
  const modLoader = useModTextureLoader();

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
      <Scene
        sourceVersion={sourceReg?.version}
        sourceRegistryId={sourceReg?.id}
        targetVersion={targetReg?.version}
        targetRegistryId={targetReg?.id}
        modLoader={modLoader}
      />
    </Canvas>
  );
}
