"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useToolStore } from "../../_store/tool.store";
import { placeholderColor } from "../../_lib/textures/blockTexture";
import { fluidColor } from "../../_lib/pipeline/fluid";
import { useModTextureLoader, useModelLoader, useConnectionsLoader } from "../../_hooks/modTextureContext";
import { getBlockTexture } from "./blockTextureCache";
import { useBlockModel } from "./useBlockModel";
import type { BuiltModel } from "./blockModelCache";
import { sourcePlan, convertedPlan, resultPlan, type RenderKind } from "./previewPlan";
import type { BlockPositionGroup, DiffEntry, BlockDefinition, UnifiedBlock } from "../../_lib/types";
import type { CompiledModel } from "../../_lib/model/types";
import type { GameId } from "../../_lib/adapters/game-adapter";
import { bridgeRotationStates } from "../../_lib/pipeline/rules/cross-game/rotation";

type ModTextureLoader = (registryId: string, blockId: string) => Promise<string | null>;
type ModelLoader = (
  registryId: string,
  blockId: string,
  stateLabel?: string,
) => Promise<CompiledModel | null>;
type ConnectionsLoader = (
  registryId: string,
  blockId: string,
) => Promise<BlockDefinition["connections"] | null>;

const EMPTY_STATES: Record<string, string> = {};

function statesKeyOf(states: Record<string, string>): string {
  return Object.keys(states)
    .sort()
    .map((k) => `${k}=${states[k]}`)
    .join(",");
}

/**
 * For a cross-game converted **connected block** (fence/bars/wall), resolve its
 * concrete shape variant so the preview renders it connected — the same
 * resolution the export path does. Fetches the target block's `connections` map
 * from the worker (cached) and re-runs `bridgeRotationStates` with it, which may
 * re-target the block id (iron bars' corner is a separate block) and set the
 * shape `state` + yaw. Returns `null` for non-connected blocks / same-game /
 * source-mode, leaving the caller's existing (id, states) unchanged.
 */
function useConnectionOverride(
  registryId: string | undefined,
  targetBaseId: string,
  sourceBlock: UnifiedBlock,
  targetGameId: GameId | undefined,
  loader: ConnectionsLoader | null,
): { id: string; states: Record<string, string> } | null {
  const [override, setOverride] = useState<{ id: string; states: Record<string, string> } | null>(null);
  const statesKey = useMemo(() => statesKeyOf(sourceBlock.states), [sourceBlock.states]);
  useEffect(() => {
    setOverride(null);
    if (!registryId || !targetGameId || !loader) return;
    // Only a cross-game conversion re-targets connection shapes.
    if ((sourceBlock.namespace === "hytale") === (targetGameId === "hytale")) return;
    let cancelled = false;
    loader(registryId, targetBaseId).then((conns) => {
      if (cancelled || !conns) return;
      const def: BlockDefinition = { id: targetBaseId, connections: conns, validStates: {}, defaultState: {}, tags: [] };
      const bridged = bridgeRotationStates(sourceBlock, targetGameId, def);
      setOverride({ id: bridged.id, states: bridged.states });
    });
    return () => {
      cancelled = true;
    };
    // sourceBlock is keyed by statesKey + namespace (both stable per palette entry).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryId, targetBaseId, statesKey, sourceBlock.namespace, targetGameId, loader]);
  return override;
}

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
  modelLoader: ModelLoader | null;
  /** True when rendering the converted target block (vs. the source). */
  useTarget: boolean;
  targetGameId: GameId | undefined;
  connectionsLoader: ConnectionsLoader | null;
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

  // Fluids (Minecraft water/lava, Hytale Fluid_*) have no usable cube texture —
  // Minecraft water resolves no `water.png` (it's `water_still`) and would show a
  // stray placeholder tile, Hytale's fluid tile renders white — so draw them as a
  // flat translucent volume in the fluid's colour instead. Ghosted blocks keep
  // the muted look.
  const fluid = sp.ghost ? null : fluidColor(textureId);
  const color = fluid
    ? fluid
    : sp.ghost
      ? (texture ? "#7c8896" : "#3f4754")
      : texture
        ? "#ffffff"
        : placeholderColor(textureId);

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
        key={`${fluid ? "fluid" : texture ? texture.uuid : "flat"}|${kind}|${isSelected ? "sel" : ""}`}
        map={fluid ? undefined : (texture ?? undefined)}
        color={new THREE.Color(color)}
        emissive={new THREE.Color(sp.emissive)}
        emissiveIntensity={sp.emissiveIntensity}
        transparent={fluid ? true : sp.transparent}
        opacity={fluid ? (isSelected ? 0.85 : 0.55) : sp.opacity}
        depthWrite={fluid ? false : sp.depthWrite}
        alphaTest={!fluid && texture && !sp.ghost ? 0.5 : 0}
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
}: { built: BuiltModel } & Omit<BlockInstancesProps, "states" | "version" | "registryId" | "modLoader" | "modelLoader">) {
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
  // A cross-game connected block re-targets to its concrete shape variant (corner
  // may be a different block; T/Cross are states) so it renders connected.
  const override = useConnectionOverride(
    props.useTarget ? props.registryId : undefined,
    props.textureId,
    props.group.block,
    props.targetGameId,
    props.connectionsLoader,
  );
  const textureId = override?.id ?? props.textureId;
  const states = override?.states ?? props.states;
  const built = useBlockModel(textureId, states, props.version, props.registryId, props.modelLoader);
  if (built) {
    const { states: _s, version: _v, registryId: _r, modLoader: _m, modelLoader: _ml, ...rest } = props;
    return <ModelInstances {...rest} textureId={textureId} built={built} />;
  }
  return <CubeInstances {...props} textureId={textureId} />;
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
      // Scale near with the schematic size: a fixed 0.1 near against a far plane
      // sized for a 500-block span crushes depth precision and z-fights the whole
      // surface. Keep near ≥ 0.1 for small builds.
      camera.near = Math.max(0.1, span * 0.02);
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
  targetGameId: GameId | undefined;
  modLoader: ModTextureLoader | null;
  modelLoader: ModelLoader | null;
  connectionsLoader: ConnectionsLoader | null;
}

function Scene({
  sourceVersion,
  sourceRegistryId,
  targetVersion,
  targetRegistryId,
  targetGameId,
  modLoader,
  modelLoader,
  connectionsLoader,
}: SceneProps) {
  const blockPositions = useToolStore((s) => s.blockPositions);
  const diff = useToolStore((s) => s.diff);
  const resolutions = useToolStore((s) => s.resolutions);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const layerY = useToolStore((s) => s.layerY);
  const hideUnchanged = useToolStore((s) => s.hideUnchanged);
  const previewMode = useToolStore((s) => s.previewMode);
  const schematic = useToolStore((s) => s.schematic);
  const setSelectedBlock = useToolStore((s) => s.setSelectedBlock);

  // Non-source modes only make sense once a diff exists; otherwise fall back to source.
  const converted = previewMode === "converted" && !!diff;
  const result = previewMode === "result" && !!diff;

  const diffEntryMap = useMemo(() => {
    const m = new Map<string, DiffEntry>();
    diff?.entries.forEach((e) => m.set(e.block.id, e));
    return m;
  }, [diff]);

  // "Hide unchanged" only applies in Resultado mode. A block is "changed" when its
  // converted result differs from the source: renamed to an auto candidate,
  // resolved to a different block, or its states get rewritten (state-changed).
  // Everything else — "safe" blocks AND still-unresolved missing/mod-only blocks,
  // which render as their unchanged source — is hidden. Keying on the result plan
  // (not `status === "safe"`) is what makes this work cross-game, where nothing is
  // ever "safe" because the target registry has entirely different block ids.
  const visibleGroups = useMemo(() => {
    if (!hideUnchanged || !result) return blockPositions;
    return blockPositions.filter((g) => {
      const id = g.block.id;
      const entry = diffEntryMap.get(id);
      const plan = resultPlan(id, entry?.status, entry?.autoCandidate?.id, resolutions[id]?.targetId);
      return plan.useTarget || entry?.status === "state-changed";
    });
  }, [blockPositions, hideUnchanged, result, diffEntryMap, resolutions]);

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
          : result
          ? resultPlan(id, entry?.status, entry?.autoCandidate?.id, resolutions[id]?.targetId)
          : sourcePlan(id);
        return (
          <BlockInstances
            key={group.paletteIndex}
            group={group}
            textureId={plan.textureId}
            // Source blocks render with their real states; a converted target
            // block renders with its default model (we don't track its states) —
            // except across a cross-game conversion, where we bridge MC
            // facing/half <-> Hytale rotation so a converted stair/door still
            // points the right way in the preview, matching the export.
            states={
              !plan.useTarget
                ? group.block.states
                : targetGameId && (group.block.namespace === "hytale") !== (targetGameId === "hytale")
                ? bridgeRotationStates(group.block, targetGameId).states
                : EMPTY_STATES
            }
            kind={plan.kind}
            isSelected={id === selectedBlockId}
            maxLayerY={layerY}
            version={plan.useTarget ? (targetVersion ?? sourceVersion) : sourceVersion}
            registryId={plan.useTarget ? (targetRegistryId ?? sourceRegistryId) : sourceRegistryId}
            modLoader={modLoader}
            modelLoader={modelLoader}
            useTarget={plan.useTarget}
            targetGameId={targetGameId}
            connectionsLoader={connectionsLoader}
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
  const modelLoader = useModelLoader();
  const connectionsLoader = useConnectionsLoader();

  if (!schematic) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-txt-dim">
        Load a schematic to see the 3D preview
      </div>
    );
  }

  if (isFetchingPositions) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-txt-dim">
        Preparing 3D data…
      </div>
    );
  }

  if (blockPositions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-txt-dim">
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
        targetGameId={targetReg?.gameId}
        modLoader={modLoader}
        modelLoader={modelLoader}
        connectionsLoader={connectionsLoader}
      />
    </Canvas>
  );
}
