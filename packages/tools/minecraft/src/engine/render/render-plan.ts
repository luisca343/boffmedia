/**
 * What the renderer needs to know about one block type before drawing it.
 *
 * A plain viewer only ever produces {@link sourcePlan}. A conversion tool
 * supplies its own planner (see the tool's `previewPlan`) to render target
 * blocks, highlights and ghosting — the renderer itself knows nothing about
 * diffs.
 */

export type RenderKind = "normal" | "changed" | "ghost" | "problem";

export interface RenderPlan {
  /** Block id whose texture to render. */
  textureId: string;
  /** When true, resolve the texture against the target environment (vs. source). */
  useTarget: boolean;
  kind: RenderKind;
}

/** Render every block exactly as it is in the source game. */
export function sourcePlan(sourceId: string): RenderPlan {
  return { textureId: sourceId, useTarget: false, kind: "normal" };
}

/**
 * RF-05 isolate: the kind a mesh must actually draw with. Every non-selection
 * mesh collapses to `ghost` (the existing dim look) while isolate is on; the
 * selection keeps whatever its plan said, so a converted/problem block stays
 * colour-coded while isolated.
 *
 * Shared by the block and the LittleTiles branches of the scene precisely
 * because it must be the *same* rule: LT geometry lives in sibling meshes, and
 * having only the block branch apply it made LT blocks and LT structures ignore
 * isolation entirely.
 */
export function isolatedKind(kind: RenderKind, isolateActive: boolean, isSelection: boolean): RenderKind {
  return isolateActive && !isSelection ? "ghost" : kind;
}
