"use client";

import { Fragment, useCallback, useMemo, useRef } from "react";
import { Grid, OrbitControls } from "@react-three/drei";
import type { BlockPositionGroup, LittleTilesGroup, UnifiedBlock } from "../types";
import type { NavMode } from "../state/types";
import type { ModelLoader, TextureLoader } from "./assetLoaders";
import { BlockInstances, type BlockVariantResolver } from "./block-instances";
import { LittleTileInstances } from "./littletile-instances";
import { CameraRig, FlyRig } from "./camera-rigs";
import type { FlyHudRefs } from "./fly-hud";
import { buildPickIndex } from "./picking";
import { sourcePlan, type RenderPlan } from "./render-plan";

const DEFAULT_DIMS = { x: 16, y: 16, z: 16 };
const EMPTY_STATES: Record<string, string> = {};

/** One side's texture/model resolution context. */
export interface RenderEnvironment {
  version?: string;
  registryId?: string;
}

export interface AssetLoaders {
  texture: TextureLoader | null;
  model: ModelLoader | null;
}

/**
 * Hooks a host can use to render something other than the plain source build.
 * Every one of them is optional: omit all three and the scene renders the
 * schematic exactly as it exists in the source game.
 */
export interface RenderOverrides {
  /** Per-block-type render plan. Defaults to {@link sourcePlan}. */
  planFor?: (block: UnifiedBlock) => RenderPlan;
  /**
   * Blockstates driving a block's model. Defaults to the source block's own
   * states, or none once a plan resolves to a target block (whose states the
   * renderer does not track).
   */
  statesFor?: (block: UnifiedBlock, plan: RenderPlan) => Record<string, string>;
  /** Re-target a converted connected block to its concrete shape variant. */
  resolveVariant?: BlockVariantResolver;
}

export interface SchematicSceneProps extends RenderOverrides {
  /** Block instance data to draw. Filtering is the host's job. */
  groups: BlockPositionGroup[];
  /**
   * LittleTiles micro-box groups. Their host cells are excluded from `groups`
   * worker-side (counted as air), so these meshes are the only render of that
   * content — omitting them hides LittleTiles entirely.
   */
  littleTiles?: LittleTilesGroup[];
  dimensions?: { x: number; y: number; z: number };
  layerY: number;
  selectedBlockId?: string;
  navMode: NavMode;
  /** Toggling is handled here; the host just stores what it is told. */
  onSelect: (blockId: string | undefined) => void;
  source: RenderEnvironment;
  target?: RenderEnvironment;
  loaders: AssetLoaders;
  lockSelector: string;
  hud: FlyHudRefs;
  onLockChange: (locked: boolean) => void;
}

function defaultStates(block: UnifiedBlock, plan: RenderPlan): Record<string, string> {
  return plan.useTarget ? EMPTY_STATES : block.states;
}

/**
 * The R3F scene graph: lights, grid, camera rig and one instanced mesh per
 * block type. Entirely prop-driven — it holds no store and no tool concepts.
 */
export function SchematicScene({
  groups,
  littleTiles,
  dimensions,
  layerY,
  selectedBlockId,
  navMode,
  onSelect,
  source,
  target,
  loaders,
  lockSelector,
  hud,
  onLockChange,
  planFor,
  statesFor,
  resolveVariant,
}: SchematicSceneProps) {
  // Read inside the frame loop and in click handlers, never during render.
  const layerYRef = useRef(layerY);
  layerYRef.current = layerY;
  const cursorPickingRef = useRef(navMode !== "fly");
  cursorPickingRef.current = navMode !== "fly";

  const handleSelect = useCallback(
    (id: string) => onSelect(id === selectedBlockId ? undefined : id),
    [selectedBlockId, onSelect],
  );
  // Crosshair pick result: a block toggles selection, empty space deselects.
  const handlePick = useCallback(
    (id: string | null) => {
      if (id) handleSelect(id);
      else onSelect(undefined);
    },
    [handleSelect, onSelect],
  );

  const dims = dimensions ?? DEFAULT_DIMS;
  const span = Math.max(dims.x, dims.y, dims.z);
  const orbitTarget = useMemo<[number, number, number]>(
    () => [dims.x / 2, dims.y / 2, dims.z / 2],
    [dims.x, dims.y, dims.z],
  );

  const fly = navMode === "fly";
  // Built only for fly mode — spectator targeting walks this instead of
  // raycasting instanced meshes.
  const pickIndex = useMemo(() => (fly ? buildPickIndex(groups, dims) : null), [fly, groups, dims]);

  return (
    <>
      <CameraRig dimensions={dims} />
      {fly ? (
        <FlyRig
          span={span}
          pickIndex={pickIndex}
          lockSelector={lockSelector}
          hud={hud}
          layerYRef={layerYRef}
          onPick={handlePick}
          onLockChange={onLockChange}
        />
      ) : (
        <OrbitControls makeDefault target={orbitTarget} />
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
      {groups.map((group) => {
        const block = group.block;
        const plan = planFor ? planFor(block) : sourcePlan(block.id);
        const states = statesFor ? statesFor(block, plan) : defaultStates(block, plan);
        const shared = {
          group,
          textureId: plan.textureId,
          states,
          kind: plan.kind,
          isSelected: block.id === selectedBlockId,
          maxLayerY: layerY,
          version: plan.useTarget ? (target?.version ?? source.version) : source.version,
          registryId: plan.useTarget ? (target?.registryId ?? source.registryId) : source.registryId,
          textureLoader: loaders.texture,
          modelLoader: loaders.model,
          useTarget: plan.useTarget,
          resolveVariant,
          cursorPickingRef,
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
      {littleTiles?.map((g) => (
        <LittleTileInstances
          key={`lt-${g.block.id}`}
          group={g}
          isSelected={g.block.id === selectedBlockId}
          maxLayerY={layerY}
          version={source.version}
          registryId={source.registryId}
          textureLoader={loaders.texture}
          cursorPickingRef={cursorPickingRef}
          onSelect={handleSelect}
        />
      ))}
    </>
  );
}
