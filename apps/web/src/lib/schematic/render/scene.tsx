"use client";

import { Fragment, useCallback, useMemo, useRef } from "react";
import { Grid, OrbitControls } from "@react-three/drei";
import type { BlockPositionGroup, LittleTilesGroup, UnifiedBlock } from "../types";
import type { NavMode } from "../state/types";
import type { ModelLoader, TextureLoader } from "./assetLoaders";
import { BlockInstances, type BlockVariantResolver } from "./block-instances";
import { LittleTileInstances } from "./littletile-instances";
import { LittleTileHighlight } from "./littletile-highlight";
import { CameraRig, FlyRig } from "./camera-rigs";
import { FocusRig, type FocusGoal } from "./focus-rig";
import { SelectionOverlay } from "./selection-overlay";
import {
  cameraGoalFor,
  instanceCenterInGroup,
  structureCenterOf,
  FOCUS_SPAN,
  type FocusRequest,
} from "./focus-target";
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
  /**
   * LittleTiles geometry to wrap in a translucent accent shell (a selected
   * structure). Same array layouts as {@link LittleTilesGroup}. Optional so
   * hosts without structure selection never mention it.
   */
  structureHighlight?: {
    boxes: Float32Array;
    corners?: Float32Array;
    cornerBounds?: Float32Array;
  } | null;
  dimensions?: { x: number; y: number; z: number };
  layerY: number;
  selectedBlockId?: string;
  navMode: NavMode;
  /** Toggling is handled here; the host just stores what it is told. */
  onSelect: (blockId: string | undefined) => void;
  /**
   * RF-01/02/03 fly-to request: an index into the active selection's combined
   * instance list, resolved here (this component has `groups`/`structureHighlight`)
   * into a world-space goal and handed to {@link FocusRig}. A nonce bump — not a
   * position change — is what retriggers the animation (RF-03 wrap-around).
   */
  focus?: FocusRequest | null;
  /** RF-05: dims every non-selected block group to the existing ghost look. */
  isolate?: boolean;
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
  structureHighlight,
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
  focus = null,
  isolate = false,
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

  // The selected block group, if any — shared by the RF-06 outline and the
  // RF-01/02 focus resolution below.
  const selectedGroup = useMemo(
    () => (selectedBlockId ? groups.find((g) => g.block.id === selectedBlockId) : undefined),
    [groups, selectedBlockId],
  );
  // RF-05: isolate dims every group but the current selection (block or LT
  // structure) to the existing ghost look — no change to material.ts.
  const isolateActive = isolate && (!!selectedBlockId || !!structureHighlight);

  // RF-01/02/03: resolve the {index,nonce} request into a world-space goal.
  // Block selections index the group's combined surface+interior positions;
  // structure selections fly to the merged selection's centroid (structures
  // aren't cycled today, so the index is unused there).
  const focusGoal = useMemo<FocusGoal | null>(() => {
    if (!focus) return null;
    const center = selectedGroup
      ? instanceCenterInGroup(selectedGroup, focus.index)
      : structureHighlight
        ? structureCenterOf(structureHighlight)
        : null;
    if (!center) return null;
    const goal = cameraGoalFor(center, FOCUS_SPAN);
    return { ...goal, nonce: focus.nonce };
  }, [focus, selectedGroup, structureHighlight]);

  return (
    <>
      <CameraRig dimensions={dims} />
      {selectedGroup && (
        <SelectionOverlay
          positions={selectedGroup.positions}
          interiorPositions={selectedGroup.interiorPositions}
          maxLayerY={layerY}
        />
      )}
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
      {/* Must mount AFTER FlyRig: both subscribe useFrame at priority 0 (a
          positive priority would switch R3F to manual rendering and blank the
          canvas), so subscription order is what lets the focus animation win
          over FlyRig's write within a frame. */}
      <FocusRig focus={focusGoal} />
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
          // RF-05: everything but the selection ghosts while isolate is on —
          // the existing dim path (opacity 0.3, depthWrite false), no new one.
          kind: isolateActive && block.id !== selectedBlockId ? "ghost" : plan.kind,
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
      {littleTiles?.map((g) => {
        // Same override contract as the block meshes: a conversion host's plan
        // can re-texture a micro-tile material (resolved/renamed) or ghost it.
        const plan = planFor ? planFor(g.block) : sourcePlan(g.block.id);
        const states = statesFor ? statesFor(g.block, plan) : defaultStates(g.block, plan);
        return (
          <LittleTileInstances
            key={`lt-${g.block.id}`}
            group={g}
            isSelected={g.block.id === selectedBlockId}
            maxLayerY={layerY}
            version={plan.useTarget ? (target?.version ?? source.version) : source.version}
            registryId={plan.useTarget ? (target?.registryId ?? source.registryId) : source.registryId}
            textureLoader={loaders.texture}
            cursorPickingRef={cursorPickingRef}
            onSelect={handleSelect}
            textureId={plan.textureId}
            states={states}
            kind={plan.kind}
          />
        );
      })}
      {structureHighlight && (
        <LittleTileHighlight
          boxes={structureHighlight.boxes}
          corners={structureHighlight.corners}
          cornerBounds={structureHighlight.cornerBounds}
        />
      )}
    </>
  );
}
