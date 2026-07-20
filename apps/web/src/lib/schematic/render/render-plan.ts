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
