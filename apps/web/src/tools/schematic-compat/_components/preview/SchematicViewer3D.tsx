"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useToolStore } from "../../_store/tool.store";
import { placeholderColor } from "../../_lib/textures/blockTexture";
import { useModTextureLoader } from "../../_hooks/modTextureContext";
import { getBlockTexture } from "./blockTextureCache";
import { useBlockModel } from "./useBlockModel";
import type { BuiltModel } from "./blockModelCache";
import { sourcePlan, convertedPlan, type RenderKind } from "./previewPlan";
import type { BlockPositionGroup, DiffEntry } from "../../_lib/types";

type ModTextureLoader = (registryId: string, blockId: string) => Promise<string | null>;

const EMPTY_STATES: Record<string, string> = {};

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

interface StyleParams {
  emissive: string;
  emissiveIntensity: number;
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
  ghost: boolean;
}

/**
 * Render-kind → overlay material params (glow / ghosting), independent of texture.
 *  - normal  : source-mode look — glow only when selected.
 *  - changed : converted target block — green glow so it stands out.
 *  - problem : unresolved block — red glow, it has no valid target yet.
 *  - ghost   : untouched block in converted mode — muted + translucent.
 * A selected block is always forced solid and brightly lit so it's findable.
 */
function styleParams(kind: RenderKind, isSelected: boolean): StyleParams {
  if (isSelected) {
    const emissive = kind === "problem" ? PROBLEM_GLOW : kind === "changed" ? CHANGED_GLOW : "#ffffff";
    return { emissive, emissiveIntensity: 0.65, transparent: false, opacity: 1, depthWrite: true, ghost: false };
  }
  switch (kind) {
    case "ghost":
      return { emissive: "#000000", emissiveIntensity: 0, transparent: true, opacity: 0.3, depthWrite: false, ghost: true };
    case "changed":
      return { emissive: CHANGED_GLOW, emissiveIntensity: 0.35, transparent: false, opacity: 1, depthWrite: true, ghost: false };
    case "problem":
      return { emissive: PROBLEM_GLOW, emissiveIntensity: 0.5, transparent: false, opacity: 1, depthWrite: true, ghost: false };
    default:
      return { emissive: "#000000", emissiveIntensity: 0, transparent: false, opacity: 1, depthWrite: true, ghost: false };
  }
}

/** Build one MeshStandardMaterial for a face group (or the whole cube fallback). */
function makeMaterial(
  texture: THREE.Texture | null,
  tint: string | null,
  doubleSided: boolean,
  overlay: boolean,
  sp: StyleParams,
  blockId: string,
): THREE.MeshStandardMaterial {
  const hasTex = !!texture;
  const color = sp.ghost
    ? hasTex
      ? "#7c8896"
      : "#3f4754"
    : hasTex
      ? (tint ?? "#ffffff")
      : (tint ?? placeholderColor(blockId));
  return new THREE.MeshStandardMaterial({
    map: texture ?? undefined,
    color: new THREE.Color(color),
    emissive: new THREE.Color(sp.emissive),
    emissiveIntensity: sp.emissiveIntensity,
    transparent: sp.transparent,
    opacity: sp.opacity,
    depthWrite: sp.depthWrite,
    // Cut out transparent texels (glass, panes, plants); no-op on opaque textures.
    alphaTest: hasTex && !sp.ghost ? 0.5 : 0,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    // Coplanar overlays (grass side fringe) draw just in front to avoid z-fighting.
    polygonOffset: overlay,
    polygonOffsetFactor: overlay ? -1 : 0,
    polygonOffsetUnits: overlay ? -1 : 0,
    roughness: 0.85,
    metalness: 0,
  });
}

// ─── Shared instance-matrix plumbing ─────────────────────────────────────────

/**
 * Write per-instance translation matrices and apply the Y-layer cutoff. Worker
 * positions are Y-sorted, so the cutoff is a binary search rather than a scan.
 * Re-runs (rewriting matrices) whenever the mesh is recreated — e.g. when a
 * block swaps from the cube fallback to its compiled model.
 */
function useInstanceMatrices(
  meshRef: React.RefObject<THREE.InstancedMesh | null>,
  positions: Float32Array,
  maxCount: number,
  maxLayerY: number,
  meshEpoch: unknown,
) {
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || maxCount === 0) return;
    const mat = mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < maxCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const b = i * 16;
      mat[b]    = 1; mat[b+1]  = 0; mat[b+2]  = 0; mat[b+3]  = 0;
      mat[b+4]  = 0; mat[b+5]  = 1; mat[b+6]  = 0; mat[b+7]  = 0;
      mat[b+8]  = 0; mat[b+9]  = 0; mat[b+10] = 1; mat[b+11] = 0;
      mat[b+12] = x; mat[b+13] = y; mat[b+14] = z; mat[b+15] = 1;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = maxCount;
    // meshEpoch is in deps so matrices are rewritten when the mesh is recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, maxCount, meshEpoch]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || maxCount === 0) return;
    let lo = 0, hi = maxCount - 1, last = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (positions[mid * 3 + 1] <= maxLayerY) { last = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    mesh.count = last + 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxLayerY, positions, maxCount, meshEpoch]);
}

// ─── Per-block-type instanced mesh ────────────────────────────────────────────

interface BlockInstancesProps {
  group: BlockPositionGroup;
  /** Block id whose model/texture to render (may differ from the group's source id). */
  textureId: string;
  /** Blockstate properties driving the model (empty for converted target blocks). */
  states: Record<string, string>;
  kind: RenderKind;
  isSelected: boolean;
  maxLayerY: number;
  version: string | undefined;
  registryId: string | undefined;
  modLoader: ModTextureLoader | null;
  onSelect: (blockId: string) => void;
}

/** Fallback: a single-texture cube (modded blocks, or while a model loads). */
function CubeInstances({
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
  useInstanceMatrices(meshRef, group.positions, maxCount, maxLayerY, "cube");

  const texture = useBlockTexture(textureId, version, registryId, modLoader);
  if (maxCount === 0) return null;
  const sp = styleParams(kind, isSelected);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, maxCount]}
      // Instances are spread across the schematic, but the bounding sphere is
      // origin-centred — leave culling off so a block-type never vanishes when
      // its (tiny, origin-based) sphere leaves the frustum.
      frustumCulled={false}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(group.block.id);
      }}
    >
      <boxGeometry args={[0.98, 0.98, 0.98]} />
      <meshStandardMaterial
        key={`${texture ? texture.uuid : "flat"}|${kind}|${isSelected ? "sel" : ""}`}
        map={texture ?? undefined}
        color={new THREE.Color(sp.ghost ? (texture ? "#7c8896" : "#3f4754") : texture ? "#ffffff" : placeholderColor(textureId))}
        emissive={new THREE.Color(sp.emissive)}
        emissiveIntensity={sp.emissiveIntensity}
        transparent={sp.transparent}
        opacity={sp.opacity}
        depthWrite={sp.depthWrite}
        alphaTest={texture && !sp.ghost ? 0.5 : 0}
        roughness={0.8}
        metalness={0}
      />
    </instancedMesh>
  );
}

/** Real Minecraft geometry: compiled model geometry + one material per face group. */
function ModelInstances({
  group,
  built,
  textureId,
  kind,
  isSelected,
  maxLayerY,
  onSelect,
}: { built: BuiltModel } & Omit<BlockInstancesProps, "states" | "version" | "registryId" | "modLoader">) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const maxCount = group.positions.length / 3;
  // Recreate the mesh (and rewrite matrices) when geometry identity changes.
  useInstanceMatrices(meshRef, group.positions, maxCount, maxLayerY, built.geometry);

  const materials = useMemo(() => {
    const sp = styleParams(kind, isSelected);
    return built.groups.map((g) => makeMaterial(g.texture, g.tint, g.doubleSided, g.overlay, sp, textureId));
  }, [built, kind, isSelected, textureId]);

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  if (maxCount === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, maxCount]}
      geometry={built.geometry}
      material={materials}
      // Origin-centred bounding sphere ignores instance spread — keep culling off
      // so a block-type never disappears as the camera moves (see CubeInstances).
      frustumCulled={false}
      // Geometry is cache-owned + shared across remounts; materials we dispose
      // ourselves (effect above). Opt out of R3F's auto-dispose so unmounting one
      // instance never disposes the shared cached geometry.
      dispose={null}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(group.block.id);
      }}
    />
  );
}

/** Picks the compiled-model renderer when available, else the cube fallback. */
function BlockInstances(props: BlockInstancesProps) {
  const built = useBlockModel(props.textureId, props.states, props.version);
  if (built) {
    const { states: _s, version: _v, registryId: _r, modLoader: _m, ...rest } = props;
    return <ModelInstances {...rest} built={built} />;
  }
  return <CubeInstances {...props} />;
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
            // Source blocks render with their real states; a converted target
            // block renders with its default model (we don't track its states).
            states={plan.useTarget ? EMPTY_STATES : group.block.states}
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
