"use client";

import { useCallback, useMemo } from "react";
import type { RenderOverrides } from "@/lib/schematic/render";
import type { ConnectionsLoader } from "@/lib/schematic/render";
import type { GameId } from "@/lib/schematic/adapters/game-adapter";
import type { BlockDefinition, BlockPositionGroup, DiffEntry, UnifiedBlock } from "@/lib/schematic/types";
import { bridgeRotationStates } from "../../_lib/pipeline/rules/cross-game/rotation";
import { useToolStore } from "../../_store/tool.store";
import type { ResolutionChoice } from "../../_store/conversion.slice";
import { convertedPlan, resultPlan, sourcePlan } from "./previewPlan";

const EMPTY_STATES: Record<string, string> = {};

/** True when converting between Minecraft and Hytale (either direction). */
function isCrossGame(block: UnifiedBlock, targetGameId: GameId | undefined): boolean {
  return !!targetGameId && (block.namespace === "hytale") !== (targetGameId === "hytale");
}

/**
 * Turns the tool's diff state into the renderer's optional {@link RenderOverrides}
 * plus the group list to draw. The renderer knows none of this; hand it the
 * result and it draws converted blocks, highlights and ghosting.
 *
 * Returns plain source rendering (all overrides inert) whenever there is no
 * diff, which is also exactly what a read-only viewer would pass.
 */
export function useCompatRender(
  targetGameId: GameId | undefined,
  connectionsLoader: ConnectionsLoader | null,
): { groups: BlockPositionGroup[]; overrides: RenderOverrides } {
  const blockPositions = useToolStore((s) => s.blockPositions);
  const diff = useToolStore((s) => s.diff);
  const resolutions = useToolStore((s) => s.resolutions);
  const hideUnchanged = useToolStore((s) => s.hideUnchanged);
  const previewMode = useToolStore((s) => s.previewMode);

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
  const groups = useMemo(() => {
    if (!hideUnchanged || !result) return blockPositions;
    return blockPositions.filter((g) => {
      const id = g.block.id;
      const entry = diffEntryMap.get(id);
      const plan = resultPlan(id, entry?.status, entry?.autoCandidate?.id, resolutions[id]?.targetId);
      return plan.useTarget || entry?.status === "state-changed";
    });
  }, [blockPositions, hideUnchanged, result, diffEntryMap, resolutions]);

  const planFor = useCallback(
    (block: UnifiedBlock) => {
      const id = block.id;
      const entry = diffEntryMap.get(id);
      const target = (resolutions as Record<string, ResolutionChoice>)[id]?.targetId;
      if (converted) return convertedPlan(id, entry?.status, entry?.autoCandidate?.id, target);
      if (result) return resultPlan(id, entry?.status, entry?.autoCandidate?.id, target);
      return sourcePlan(id);
    },
    [converted, result, diffEntryMap, resolutions],
  );

  // Source blocks render with their real states; a converted target block renders
  // with its default model (we don't track its states) — except across a
  // cross-game conversion, where we bridge MC facing/half <-> Hytale rotation so a
  // converted stair/door still points the right way, matching the export.
  const statesFor = useCallback(
    (block: UnifiedBlock, plan: { useTarget: boolean }) => {
      if (!plan.useTarget) return block.states;
      if (!targetGameId || !isCrossGame(block, targetGameId)) return EMPTY_STATES;
      return bridgeRotationStates(block, targetGameId).states;
    },
    [targetGameId],
  );

  /**
   * For a cross-game converted **connected block** (fence/bars/wall), resolve its
   * concrete shape variant so the preview renders it connected — the same
   * resolution the export path does. Re-runs `bridgeRotationStates` with the
   * target block's `connections` map, which may re-target the block id (iron
   * bars' corner is a separate block) and set the shape `state` + yaw.
   */
  const resolveVariant = useCallback(
    async (block: UnifiedBlock, targetBaseId: string, registryId: string) => {
      if (!targetGameId || !connectionsLoader) return null;
      if (!isCrossGame(block, targetGameId)) return null;
      const conns = await connectionsLoader(registryId, targetBaseId);
      if (!conns) return null;
      const def: BlockDefinition = {
        id: targetBaseId,
        connections: conns,
        validStates: {},
        defaultState: {},
        tags: [],
      };
      const bridged = bridgeRotationStates(block, targetGameId, def);
      return { id: bridged.id, states: bridged.states };
    },
    [targetGameId, connectionsLoader],
  );

  const overrides = useMemo<RenderOverrides>(
    () => ({ planFor, statesFor, resolveVariant }),
    [planFor, statesFor, resolveVariant],
  );

  return { groups, overrides };
}
