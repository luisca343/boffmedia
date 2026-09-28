import type { TierListAction } from "../core/engine"
import { applyTierListAction } from "../core/engine"
import type { TierListDocument, TierListInstance } from "../core/schema"

export interface TierListDragItem { kind: "item"; itemId: string; rowId: string | null; index: number; placementId?: string }
export type TierListDropTarget = TierListDragItem | { kind: "row"; rowId: string | null; count?: number }

export interface TierListMovementPreview {
  active: TierListDragItem
  target: TierListDropTarget
  action: TierListAction
  instance: TierListInstance
  placeholderId: string
}

/** Project through the same rules as a drop. The host never saves this instance.
 * A stable temporary occurrence keeps the insertion slot mounted while hovering. */
export function tierListMovementPreview(doc: TierListDocument, active: TierListDragItem, target: TierListDropTarget, placeholderId: string): TierListMovementPreview | null {
  const action = tierListDropAction(active, target, doc.template.settings.placementMode)
  if (!action) return null
  const next = applyTierListAction(doc, action.type === "assign" ? { ...action, placementId: placeholderId } : action)
  return next === doc ? null : { active, target, action, instance: next.instance, placeholderId }
}

/** Translate UI drop coordinates into a single core commit. Cross-row multi drops copy. */
export function tierListDropAction(active: TierListDragItem, target: TierListDropTarget, mode: "exclusive" | "multi"): TierListAction | null {
  if (target.rowId === null) {
    if (active.rowId === null) return null
    return mode === "exclusive" ? { type: "unassign", itemId: active.itemId } : { type: "remove", rowId: active.rowId, placementId: active.placementId }
  }
  if (active.rowId === target.rowId) {
    const to = target.kind === "item" ? target.index : (target.count ?? 0) - 1
    if (to < 0) return null
    return { type: "reorderItem", rowId: target.rowId, from: active.index, to }
  }
  return { type: "assign", itemId: active.itemId, rowId: target.rowId, index: target.kind === "item" ? target.index : undefined }
}
