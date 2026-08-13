/**
 * Diff-aware render planning — the conversion half of the renderer's
 * {@link RenderPlan} contract. Plain source rendering lives in
 * `@/lib/schematic/render` (`sourcePlan`); everything here needs a diff, so it
 * stays with the tool that produces one.
 *
 * Mirrors the export resolution logic (`buildExportResolutionMap`) so the
 * preview shows exactly what the exported file will be:
 *
 *  - explicit per-row override  → render the chosen target texture, highlighted
 *  - renamed (auto candidate)   → render the candidate's texture, highlighted
 *  - state-changed              → same block id (texture unchanged) but highlighted,
 *                                 because the export rewrites its invalid states
 *  - missing / mod-only (unresolved) → render the source texture, flagged as a
 *                                 problem (it has no valid target yet)
 *  - safe / untouched           → render the source texture, ghosted so the
 *                                 changed blocks stand out
 */

import type { RenderPlan } from "../../../engine/render";
import type { DiffEntry } from "../../../engine/types";

export type { RenderKind, RenderPlan } from "../../../engine/render";
export { sourcePlan } from "../../../engine/render";

/**
 * Result mode: resolve textures exactly like converted mode (target ids for
 * renamed/resolved blocks) but strip all diff overlays so you see what the
 * converted build will actually look like.
 */
export function resultPlan(
  sourceId: string,
  status: DiffEntry["status"] | undefined,
  autoCandidateId: string | undefined,
  resolutionTargetId: string | undefined,
): RenderPlan {
  if (resolutionTargetId) {
    const useTarget = resolutionTargetId !== sourceId;
    return { textureId: useTarget ? resolutionTargetId : sourceId, useTarget, kind: "normal" };
  }
  if (status === "renamed" && autoCandidateId) {
    return { textureId: autoCandidateId, useTarget: true, kind: "normal" };
  }
  return { textureId: sourceId, useTarget: false, kind: "normal" };
}

/** Converted mode: see module doc for the mapping. */
export function convertedPlan(
  sourceId: string,
  status: DiffEntry["status"] | undefined,
  autoCandidateId: string | undefined,
  resolutionTargetId: string | undefined,
): RenderPlan {
  if (resolutionTargetId) {
    const useTarget = resolutionTargetId !== sourceId;
    return { textureId: useTarget ? resolutionTargetId : sourceId, useTarget, kind: "changed" };
  }
  if (status === "renamed" && autoCandidateId) {
    return { textureId: autoCandidateId, useTarget: true, kind: "changed" };
  }
  if (status === "state-changed") {
    return { textureId: sourceId, useTarget: false, kind: "changed" };
  }
  if (status === "missing" || status === "mod-only") {
    return { textureId: sourceId, useTarget: false, kind: "problem" };
  }
  return { textureId: sourceId, useTarget: false, kind: "ghost" };
}
