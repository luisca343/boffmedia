"use client";

import { Fragment, useRef, useEffect, useMemo, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls, PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useTranslations } from "next-intl";
import { useToolStore, type NavMode } from "../../_store/tool.store";
import { placeholderColor } from "../../_lib/textures/blockTexture";
import { fluidColor } from "../../_lib/pipeline/fluid";
import { useModTextureLoader, useModelLoader, useConnectionsLoader } from "../../_hooks/modTextureContext";
import { getBlockTexture } from "./blockTextureCache";
import { useBlockModel } from "./useBlockModel";
import type { BuiltModel } from "./blockModelCache";
import { sourcePlan, convertedPlan, resultPlan, type RenderKind } from "./previewPlan";
import {
  buildPickIndex,
  cutoffCount,
  ddaPick,
  maxSliceCount,
  sliceRange,
  type PickIndex,
} from "./picking";
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

/** DOM nodes the fly HUD writes into directly — no React re-render per frame. */
interface FlyHudRefs {
  pos: React.RefObject<HTMLSpanElement | null>;
  look: React.RefObject<HTMLSpanElement | null>;
  speed: React.RefObject<HTMLSpanElement | null>;
}

// Frame-loop scratch vectors (module-level to avoid per-frame allocation).
const V_DIR = new THREE.Vector3();
const V_RIGHT = new THREE.Vector3();
const V_WISH = new THREE.Vector3();

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

function writeTranslation(mat: Float32Array, slot: number, positions: Float32Array, src: number) {
  const b = slot * 16;
  mat[b]      = 1; mat[b + 1]  = 0; mat[b + 2]  = 0; mat[b + 3]  = 0;
  mat[b + 4]  = 0; mat[b + 5]  = 1; mat[b + 6]  = 0; mat[b + 7]  = 0;
  mat[b + 8]  = 0; mat[b + 9]  = 0; mat[b + 10] = 1; mat[b + 11] = 0;
  mat[b + 12] = positions[src];
  mat[b + 13] = positions[src + 1];
  mat[b + 14] = positions[src + 2];
  mat[b + 15] = 1;
}

/**
 * Write per-instance translation matrices and apply the Y-layer visibility rule.
 * Worker positions are Y-sorted, so cutoffs are binary searches, not scans.
 *  - surface (slice=false): matrices written once per mesh identity; the cutoff
 *    effect trims `count` to cells with y ≤ maxLayerY.
 *  - interior (slice=true): only the y === maxLayerY window is ever visible
 *    (that's the moment slicing exposes an enclosed cell), so its matrices are
 *    rewritten on each layer change — at most one Y-plane, so the rewrite is
 *    tiny. `capacity` is the largest such window (see maxSliceCount).
 * Re-runs whenever the mesh is recreated (meshEpoch) — e.g. when a block swaps
 * from the cube fallback to its compiled model.
 */
function useInstanceMatrices(
  meshRef: React.RefObject<THREE.InstancedMesh | null>,
  positions: Float32Array,
  capacity: number,
  maxLayerY: number,
  meshEpoch: unknown,
  slice: boolean,
) {
  useEffect(() => {
    const mesh = meshRef.current;
    if (slice || !mesh || capacity === 0) return;
    const mat = mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < capacity; i++) writeTranslation(mat, i, positions, i * 3);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = capacity;
    // meshEpoch is in deps so matrices are rewritten when the mesh is recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, capacity, slice, meshEpoch]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (slice || !mesh || capacity === 0) return;
    mesh.count = cutoffCount(positions, maxLayerY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxLayerY, positions, capacity, slice, meshEpoch]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!slice || !mesh || capacity === 0) return;
    const [first, len] = sliceRange(positions, maxLayerY);
    const count = Math.min(len, capacity);
    const mat = mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < count; i++) writeTranslation(mat, i, positions, (first + i) * 3);
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxLayerY, positions, capacity, slice, meshEpoch]);
}

// ─── Per-block-type instanced mesh ────────────────────────────────────────────

interface BlockInstancesProps {
  group: BlockPositionGroup;
  /** Position triples this mesh renders — the group's surface set or its interior set. */
  positions: Float32Array;
  /** True when rendering the interior set (only the active Y-slice ever shows). */
  slice: boolean;
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
  positions,
  slice,
  capacity,
  textureId,
  kind,
  isSelected,
  maxLayerY,
  version,
  registryId,
  modLoader,
  onSelect,
}: BlockInstancesProps & { capacity: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  useInstanceMatrices(meshRef, positions, capacity, maxLayerY, "cube", slice);

  const texture = useBlockTexture(textureId, version, registryId, modLoader);
  if (capacity === 0) return null;
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
      args={[undefined, undefined, capacity]}
      // Instances are spread across the schematic, but the bounding sphere is
      // origin-centred — leave culling off so a block-type never vanishes when
      // its (tiny, origin-based) sphere leaves the frustum.
      frustumCulled={false}
      onClick={(e) => {
        // Fly mode selects via the crosshair voxel walk; pointer coords are
        // frozen under pointer lock, so cursor-based picking would misfire.
        if (useToolStore.getState().navMode === "fly") return;
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
  positions,
  slice,
  capacity,
  built,
  textureId,
  kind,
  isSelected,
  maxLayerY,
  onSelect,
}: { built: BuiltModel; capacity: number } & Omit<BlockInstancesProps, "states" | "version" | "registryId" | "modLoader" | "modelLoader">) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // Recreate the mesh (and rewrite matrices) when geometry identity changes.
  useInstanceMatrices(meshRef, positions, capacity, maxLayerY, built.geometry, slice);

  const materials = useMemo(() => {
    const sp = styleParams(kind, isSelected);
    return built.groups.map((g) => makeMaterial(g.texture, g.tint, g.doubleSided, g.overlay, sp, textureId));
  }, [built, kind, isSelected, textureId]);

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  if (capacity === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, capacity]}
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
        // See CubeInstances — fly mode picks via the crosshair, not the cursor.
        if (useToolStore.getState().navMode === "fly") return;
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
  // Interior meshes only ever draw one Y-plane, so their GPU buffer is sized to
  // the largest plane, not the whole set.
  const capacity = useMemo(
    () => (props.slice ? maxSliceCount(props.positions) : props.positions.length / 3),
    [props.slice, props.positions],
  );
  if (built) {
    const { states: _s, version: _v, registryId: _r, modLoader: _m, modelLoader: _ml, ...rest } = props;
    return <ModelInstances {...rest} capacity={capacity} textureId={textureId} built={built} />;
  }
  return <CubeInstances {...props} capacity={capacity} textureId={textureId} />;
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

// ─── Spectator flight rig ─────────────────────────────────────────────────────

interface FlyRigProps {
  span: number;
  pickIndex: PickIndex | null;
  lockSelector: string;
  hud: FlyHudRefs;
  onPick: (blockId: string | null) => void;
  onLockChange: (locked: boolean) => void;
}

/**
 * Minecraft-spectator navigation: pointer-lock mouse look, WASD along the view
 * direction (forward follows pitch, like spectator), Space/Shift for world
 * up/down, scroll to scale flight speed, and exponential velocity smoothing for
 * the drifty spectator feel. Esc releases the pointer and the parent drops back
 * to orbit. While locked, a click selects the block under the crosshair via the
 * voxel walk.
 */
function FlyRig({ span, pickIndex, lockSelector, hud, onPick, onLockChange }: FlyRigProps) {
  const { camera, gl } = useThree();
  const lockedRef = useRef(false);
  const keys = useRef({ f: false, b: false, l: false, r: false, up: false, down: false });
  const vel = useRef(new THREE.Vector3());
  const speedMul = useRef(1);
  const hudClock = useRef(0);
  const baseSpeed = Math.max(8, span / 5);

  // Fly-range clipping: orbit scales `near` with the schematic (depth precision
  // at orbit distance), which would clip walls you hover next to. Restore the
  // orbit planes on exit.
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const prevNear = camera.near;
    const prevFar = camera.far;
    camera.near = 0.1;
    camera.far = Math.max(200, span * 6);
    camera.updateProjectionMatrix();
    return () => {
      camera.near = prevNear;
      camera.far = prevFar;
      camera.updateProjectionMatrix();
    };
  }, [camera, span]);

  // Movement keys — Minecraft defaults, by physical key (layout-independent).
  useEffect(() => {
    const apply = (code: string, v: boolean): boolean => {
      const k = keys.current;
      switch (code) {
        case "KeyW": k.f = v; return true;
        case "KeyS": k.b = v; return true;
        case "KeyA": k.l = v; return true;
        case "KeyD": k.r = v; return true;
        case "Space": k.up = v; return true;
        case "ShiftLeft":
        case "ShiftRight": k.down = v; return true;
        default: return false;
      }
    };
    const down = (e: KeyboardEvent) => {
      if (lockedRef.current && apply(e.code, true)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      apply(e.code, false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Scroll scales flight speed (spectator's scroll-to-change-speed).
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      if (!lockedRef.current) return;
      e.preventDefault();
      speedMul.current = Math.min(10, Math.max(0.25, speedMul.current * Math.pow(1.15, -e.deltaY / 100)));
      if (hud.speed.current) hud.speed.current.textContent = `×${speedMul.current.toFixed(2)}`;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl, hud]);

  // Crosshair click-to-select while locked.
  useEffect(() => {
    const el = gl.domElement;
    const onClick = () => {
      if (!lockedRef.current || !pickIndex) return;
      camera.getWorldDirection(V_DIR);
      onPick(ddaPick(camera.position, V_DIR, pickIndex, useToolStore.getState().layerY, span * 4));
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [gl, camera, pickIndex, onPick, span]);

  // Release the pointer when fly mode unmounts — drei disconnects its listeners
  // but does not exit an active lock.
  useEffect(() => {
    const el = gl.domElement;
    return () => {
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1); // no teleporting after a tab switch
    const k = keys.current;
    camera.getWorldDirection(V_DIR);
    // Strafe stays horizontal (Minecraft-style): camera right, flattened.
    V_RIGHT.setFromMatrixColumn(camera.matrixWorld, 0);
    V_RIGHT.y = 0;
    if (V_RIGHT.lengthSq() > 1e-6) V_RIGHT.normalize();
    V_WISH.set(0, 0, 0);
    if (lockedRef.current) {
      if (k.f) V_WISH.add(V_DIR);
      if (k.b) V_WISH.sub(V_DIR);
      if (k.r) V_WISH.add(V_RIGHT);
      if (k.l) V_WISH.sub(V_RIGHT);
      if (k.up) V_WISH.y += 1;
      if (k.down) V_WISH.y -= 1;
      if (V_WISH.lengthSq() > 0) V_WISH.normalize().multiplyScalar(baseSpeed * speedMul.current);
    }
    vel.current.lerp(V_WISH, 1 - Math.exp(-10 * delta));
    if (vel.current.lengthSq() > 1e-7) camera.position.addScaledVector(vel.current, delta);

    hudClock.current += delta;
    if (hudClock.current >= 0.12) {
      hudClock.current = 0;
      const p = camera.position;
      if (hud.pos.current) {
        hud.pos.current.textContent = `${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}`;
      }
      if (hud.look.current) {
        const id = pickIndex
          ? ddaPick(p, V_DIR, pickIndex, useToolStore.getState().layerY, span * 4)
          : null;
        hud.look.current.textContent = id ?? "—";
      }
    }
  });

  return (
    <PointerLockControls
      makeDefault
      selector={lockSelector}
      onLock={() => {
        lockedRef.current = true;
        onLockChange(true);
      }}
      onUnlock={() => {
        lockedRef.current = false;
        keys.current = { f: false, b: false, l: false, r: false, up: false, down: false };
        vel.current.set(0, 0, 0);
        onLockChange(false);
      }}
    />
  );
}

// ─── Scene — reads from the Zustand store ────────────────────────────────────

const DEFAULT_DIMS = { x: 16, y: 16, z: 16 };

interface SceneProps {
  sourceVersion: string | undefined;
  sourceRegistryId: string | undefined;
  targetVersion: string | undefined;
  targetRegistryId: string | undefined;
  targetGameId: GameId | undefined;
  modLoader: ModTextureLoader | null;
  modelLoader: ModelLoader | null;
  connectionsLoader: ConnectionsLoader | null;
  navMode: NavMode;
  lockSelector: string;
  hud: FlyHudRefs;
  onLockChange: (locked: boolean) => void;
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
  navMode,
  lockSelector,
  hud,
  onLockChange,
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
  // Crosshair pick result: a block toggles selection, empty space deselects.
  const handlePick = useCallback(
    (id: string | null) => {
      if (id) handleSelect(id);
      else setSelectedBlock(undefined);
    },
    [handleSelect, setSelectedBlock],
  );

  const dims = schematic?.dimensions ?? DEFAULT_DIMS;
  const span = Math.max(dims.x, dims.y, dims.z);
  const target = useMemo<[number, number, number]>(
    () => [dims.x / 2, dims.y / 2, dims.z / 2],
    [dims.x, dims.y, dims.z],
  );

  const fly = navMode === "fly";
  // Built only for fly mode — spectator targeting walks this instead of
  // raycasting instanced meshes.
  const pickIndex = useMemo(
    () => (fly ? buildPickIndex(visibleGroups, dims) : null),
    [fly, visibleGroups, dims],
  );

  return (
    <>
      <CameraRig dimensions={dims} />
      {fly ? (
        <FlyRig
          span={span}
          pickIndex={pickIndex}
          lockSelector={lockSelector}
          hud={hud}
          onPick={handlePick}
          onLockChange={onLockChange}
        />
      ) : (
        <OrbitControls makeDefault target={target} />
      )}
      {/* Distance fog is a fly-only horizon cue: at orbit distance (≈2.2×span)
          it would wash out the whole build. */}
      {fly && <fog attach="fog" args={["#0f172a", span * 1.6, span * 5.5]} />}
      <Grid
        position={[dims.x / 2 - 0.5, -0.55, dims.z / 2 - 0.5]}
        cellSize={1}
        sectionSize={16}
        cellColor="#1c2a45"
        sectionColor="#2f4370"
        fadeDistance={span * 5}
        fadeStrength={1.5}
        infiniteGrid
        frustumCulled={false}
      />
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
        // Source blocks render with their real states; a converted target
        // block renders with its default model (we don't track its states) —
        // except across a cross-game conversion, where we bridge MC
        // facing/half <-> Hytale rotation so a converted stair/door still
        // points the right way in the preview, matching the export.
        const states = !plan.useTarget
          ? group.block.states
          : targetGameId && (group.block.namespace === "hytale") !== (targetGameId === "hytale")
          ? bridgeRotationStates(group.block, targetGameId).states
          : EMPTY_STATES;
        const shared = {
          group,
          textureId: plan.textureId,
          states,
          kind: plan.kind,
          isSelected: id === selectedBlockId,
          maxLayerY: layerY,
          version: plan.useTarget ? (targetVersion ?? sourceVersion) : sourceVersion,
          registryId: plan.useTarget ? (targetRegistryId ?? sourceRegistryId) : sourceRegistryId,
          modLoader,
          modelLoader,
          useTarget: plan.useTarget,
          targetGameId,
          connectionsLoader,
          onSelect: handleSelect,
        };
        return (
          <Fragment key={group.paletteIndex}>
            <BlockInstances {...shared} positions={group.positions} slice={false} />
            {group.interiorPositions && group.interiorPositions.length > 0 && (
              <BlockInstances {...shared} positions={group.interiorPositions} slice />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

// ─── Public component (rendered inside a no-SSR dynamic import) ───────────────

export function SchematicViewer3D() {
  const t = useTranslations("games.minecraft.schematicCompat");
  const blockPositions = useToolStore((s) => s.blockPositions);
  const isFetchingPositions = useToolStore((s) => s.isFetchingPositions);
  const schematic = useToolStore((s) => s.schematic);
  const navMode = useToolStore((s) => s.navMode);
  const setNavMode = useToolStore((s) => s.setNavMode);
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

  const [flyLocked, setFlyLocked] = useState(false);
  const hudPos = useRef<HTMLSpanElement>(null);
  const hudLook = useRef<HTMLSpanElement>(null);
  const hudSpeed = useRef<HTMLSpanElement>(null);
  const hud = useMemo<FlyHudRefs>(() => ({ pos: hudPos, look: hudLook, speed: hudSpeed }), []);
  const handleLockChange = useCallback(
    (locked: boolean) => {
      setFlyLocked(locked);
      // Esc (or any pointer-lock loss) drops back to orbit navigation.
      if (!locked) setNavMode("orbit");
    },
    [setNavMode],
  );

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

  const fly = navMode === "fly";

  return (
    // The id doubles as the pointer-lock click target (drei's `selector`).
    <div id="sch3d-stage" className="relative h-full w-full">
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
          navMode={navMode}
          lockSelector="#sch3d-stage"
          hud={hud}
          onLockChange={handleLockChange}
        />
      </Canvas>
      {fly && (
        <>
          {/* crosshair */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-[1.5px] h-3 bg-white/70" />
            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-[1.5px] bg-white/70" />
          </div>
          {/* F3-style HUD: position / crosshair target / flight speed */}
          <div className="pointer-events-none absolute left-2.5 top-2.5 grid gap-[3px] max-w-[280px] py-1.5 px-2.5 bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] border border-line font-mono text-[10px] leading-tight">
            <span ref={hudPos} className="text-txt">
              0.0 / 0.0 / 0.0
            </span>
            <span ref={hudLook} className="text-txt-dim break-all">
              —
            </span>
            <span ref={hudSpeed} className="text-accent-bright">
              ×1.00
            </span>
          </div>
          {!flyLocked && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="grid gap-1 text-center py-3 px-4 bg-[color-mix(in_srgb,var(--panel)_85%,transparent)] border border-line">
                <span className="font-mono text-[12px] text-txt">{t("preview.flyClickToStart")}</span>
                <span className="font-mono text-[10px] text-txt-dim">{t("preview.flyControlsHint")}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
