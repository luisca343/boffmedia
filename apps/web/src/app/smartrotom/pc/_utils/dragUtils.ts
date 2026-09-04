import type { SlotLoc, DropTarget } from "../_hooks/useDrag"

/**
 * Drag hit-testing and slot matching utilities.
 * Pure functions used by the drag layer.
 */

/** Is this slot the one currently under the cursor? */
export function isOver(target: DropTarget | null, loc: SlotLoc): boolean {
  if (!target || target.append) return false
  if (target.kind !== loc.kind) return false
  if (loc.kind === "box" && target.box !== loc.box) return false
  return target.index === loc.index
}

/** The DOM contract a drop target must satisfy. Spread onto the slot element. */
export function dropAttrs(loc: SlotLoc): Record<string, string> {
  return {
    "data-drop": "1",
    "data-kind": loc.kind,
    "data-box": loc.kind === "box" ? String(loc.box ?? 0) : "",
    "data-index": String(loc.index),
  }
}

/** A whole box as a drop target — used by the rail and the overview grid. */
export function boxDropAttrs(box: number): Record<string, string> {
  return { "data-drop": "1", "data-kind": "box", "data-box": String(box), "data-index": "" }
}

/** Parse a DOM element to extract its drop target info. */
export function readTarget(el: Element | null): DropTarget | null {
  const host = el?.closest<HTMLElement>("[data-drop]")
  if (!host) return null
  const kind = host.dataset.kind === "party" ? "party" : "box"
  const rawIndex = host.dataset.index ?? ""
  const box = host.dataset.box ? Number(host.dataset.box) : undefined
  if (rawIndex === "") return { kind, box, index: -1, append: true }
  return { kind, box, index: Number(rawIndex) }
}

/**
 * Determines if a pointer movement has exceeded the drag activation threshold.
 * Movements below this threshold are treated as clicks, not drags.
 */
export const DRAG_THRESHOLD_PX = 7

export function hasExceededDragThreshold(startX: number, startY: number, currentX: number, currentY: number): boolean {
  return Math.hypot(currentX - startX, currentY - startY) >= DRAG_THRESHOLD_PX
}

/**
 * Does this pointerdown start a drag?
 *
 * `button` is 0 for the left mouse button AND for a touch contact — the Pointer
 * Events spec assigns touch the primary value rather than leaving it unset — so
 * one comparison covers mouse, touch and pen without a touch-specific branch.
 * A looser check that also accepts `undefined` buys nothing: no browser omits
 * the field, and it would let a synthetic event through that a real one cannot
 * produce.
 */
export function startsDrag(button: number): boolean {
  return button === 0
}
