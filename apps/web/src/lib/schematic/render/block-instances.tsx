"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BlockPositionGroup, UnifiedBlock } from "../types";
import { fluidColor } from "./fluid-color";
import type { ModelLoader, TextureLoader } from "./assetLoaders";
import type { BuiltModel } from "./blockModelCache";
import { useInstanceMatrices } from "./instance-matrices";
import { makeMaterial, styleParams, surfaceColor } from "./material";
import { maxSliceCount } from "./picking";
import type { RenderKind } from "./render-plan";
import { useBlockModel } from "./useBlockModel";
import { useBlockTexture } from "./useBlockTexture";

/** A concrete block id + states to draw in place of the planned ones. */
export interface BlockVariant {
  id: string;
  states: Record<string, string>;
}

/**
 * Re-targets a block being rendered as its converted counterpart to a concrete
 * shape variant — a fence/bars/wall whose corner form may be a different block
 * id entirely. Only called for target-resolved blocks; a viewer that renders
 * source blocks never supplies one.
 */
export type BlockVariantResolver = (
  block: UnifiedBlock,
  targetBaseId: string,
  registryId: string,
) => Promise<BlockVariant | null>;

function statesKeyOf(states: Record<string, string>): string {
  return Object.keys(states)
    .sort()
    .map((k) => `${k}=${states[k]}`)
    .join(",");
}

function useBlockVariant(
  registryId: string | undefined,
  targetBaseId: string,
  block: UnifiedBlock,
  resolve: BlockVariantResolver | undefined,
): BlockVariant | null {
  const [variant, setVariant] = useState<BlockVariant | null>(null);
  const statesKey = useMemo(() => statesKeyOf(block.states), [block.states]);
  useEffect(() => {
    setVariant(null);
    if (!registryId || !resolve) return;
    let cancelled = false;
    void resolve(block, targetBaseId, registryId).then((v) => {
      if (!cancelled && v) setVariant(v);
    });
    return () => {
      cancelled = true;
    };
    // `block` is keyed by statesKey + namespace, both stable per palette entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryId, targetBaseId, statesKey, block.namespace, resolve]);
  return variant;
}

export interface BlockInstancesProps {
  group: BlockPositionGroup;
  /** Position triples this mesh renders — the group's surface set or its interior set. */
  positions: Float32Array;
  /** True when rendering the interior set (only the active Y-slice ever shows). */
  slice: boolean;
  /** Block id whose model/texture to render (may differ from the group's source id). */
  textureId: string;
  /** Blockstate properties driving the model. */
  states: Record<string, string>;
  kind: RenderKind;
  isSelected: boolean;
  maxLayerY: number;
  version: string | undefined;
  registryId: string | undefined;
  textureLoader: TextureLoader | null;
  modelLoader: ModelLoader | null;
  /** True when rendering a converted target block (vs. the source block). */
  useTarget: boolean;
  resolveVariant?: BlockVariantResolver;
  /**
   * Read at click time, never rendered on: under pointer lock the cursor coords
   * are frozen, so cursor picking must yield to the crosshair voxel walk.
   */
  cursorPickingRef: React.RefObject<boolean>;
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
  textureLoader,
  cursorPickingRef,
  onSelect,
}: BlockInstancesProps & { capacity: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  useInstanceMatrices(meshRef, positions, capacity, maxLayerY, "cube", slice);

  const texture = useBlockTexture(textureId, version, registryId, textureLoader);
  if (capacity === 0) return null;
  const sp = styleParams(kind, isSelected);

  // Fluids (Minecraft water/lava, Hytale Fluid_*) have no usable cube texture —
  // Minecraft water resolves no `water.png` (it's `water_still`) and would show a
  // stray placeholder tile, Hytale's fluid tile renders white — so draw them as a
  // flat translucent volume in the fluid's colour instead. Ghosted blocks keep
  // the muted look.
  const fluid = sp.ghost ? null : fluidColor(textureId);
  const color = fluid ?? surfaceColor(textureId, !!texture, null, sp.ghost);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, capacity]}
      // Instances are spread across the schematic, but the bounding sphere is
      // origin-centred — leave culling off so a block-type never vanishes when
      // its (tiny, origin-based) sphere leaves the frustum.
      frustumCulled={false}
      onClick={(e) => {
        if (!cursorPickingRef.current) return;
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

/** Real game geometry: compiled model geometry + one material per face group. */
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
  cursorPickingRef,
  onSelect,
}: BlockInstancesProps & { built: BuiltModel; capacity: number }) {
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
        if (!cursorPickingRef.current) return;
        e.stopPropagation();
        onSelect(group.block.id);
      }}
    />
  );
}

/** Picks the compiled-model renderer when available, else the cube fallback. */
export function BlockInstances(props: BlockInstancesProps) {
  const variant = useBlockVariant(
    props.useTarget ? props.registryId : undefined,
    props.textureId,
    props.group.block,
    props.resolveVariant,
  );
  const textureId = variant?.id ?? props.textureId;
  const states = variant?.states ?? props.states;
  const built = useBlockModel(textureId, states, props.version, props.registryId, props.modelLoader);
  // Interior meshes only ever draw one Y-plane, so their GPU buffer is sized to
  // the largest plane, not the whole set.
  const capacity = useMemo(
    () => (props.slice ? maxSliceCount(props.positions) : props.positions.length / 3),
    [props.slice, props.positions],
  );
  if (built) {
    return <ModelInstances {...props} capacity={capacity} textureId={textureId} built={built} />;
  }
  return <CubeInstances {...props} capacity={capacity} textureId={textureId} />;
}
