import { describe, it, expect } from "vitest"
import { isOver, dropAttrs, boxDropAttrs, hasExceededDragThreshold, DRAG_THRESHOLD_PX, startsDrag } from "../_utils/dragUtils"
import type { SlotLoc, DropTarget } from "./useDrag"

describe("useDrag — drag helpers", () => {
  describe("isOver", () => {
    it("returns true when target matches slot location exactly", () => {
      const target: DropTarget = { kind: "box", box: 0, index: 0 }
      expect(isOver(target, { kind: "box", box: 0, index: 0 })).toBe(true)
    })

    it("returns false when target kind doesn't match", () => {
      const target: DropTarget = { kind: "box", box: 0, index: 0 }
      expect(isOver(target, { kind: "party", index: 0 })).toBe(false)
    })

    it("returns false when target box doesn't match", () => {
      const target: DropTarget = { kind: "box", box: 0, index: 0 }
      expect(isOver(target, { kind: "box", box: 1, index: 0 })).toBe(false)
    })

    it("returns false when target index doesn't match", () => {
      const target: DropTarget = { kind: "box", box: 0, index: 0 }
      expect(isOver(target, { kind: "box", box: 0, index: 1 })).toBe(false)
    })

    it("returns false when target is null", () => {
      expect(isOver(null, { kind: "box", box: 0, index: 0 })).toBe(false)
    })

    it("returns false when target.append is true (box-level drop)", () => {
      const target: DropTarget = { kind: "box", box: 0, index: -1, append: true }
      expect(isOver(target, { kind: "box", box: 0, index: 0 })).toBe(false)
    })

    it("handles party slot drops correctly", () => {
      const target: DropTarget = { kind: "party", index: 2 }
      expect(isOver(target, { kind: "party", index: 2 })).toBe(true)
      expect(isOver(target, { kind: "party", index: 1 })).toBe(false)
    })
  })

  describe("dropAttrs", () => {
    it("returns correct attributes for box slot", () => {
      const attrs = dropAttrs({ kind: "box", box: 1, index: 5 })
      expect(attrs["data-drop"]).toBe("1")
      expect(attrs["data-kind"]).toBe("box")
      expect(attrs["data-box"]).toBe("1")
      expect(attrs["data-index"]).toBe("5")
    })

    it("returns correct attributes for party slot", () => {
      const attrs = dropAttrs({ kind: "party", index: 2 })
      expect(attrs["data-drop"]).toBe("1")
      expect(attrs["data-kind"]).toBe("party")
      expect(attrs["data-box"]).toBe("")
      expect(attrs["data-index"]).toBe("2")
    })

    it("handles zero indices correctly", () => {
      const attrs = dropAttrs({ kind: "box", box: 0, index: 0 })
      expect(attrs["data-box"]).toBe("0")
      expect(attrs["data-index"]).toBe("0")
    })
  })

  describe("boxDropAttrs", () => {
    it("returns correct attributes for box-level drop target", () => {
      const attrs = boxDropAttrs(3)
      expect(attrs["data-drop"]).toBe("1")
      expect(attrs["data-kind"]).toBe("box")
      expect(attrs["data-box"]).toBe("3")
      expect(attrs["data-index"]).toBe("")
    })

    it("works for box 0", () => {
      const attrs = boxDropAttrs(0)
      expect(attrs["data-box"]).toBe("0")
    })

    it("works for large box numbers", () => {
      const attrs = boxDropAttrs(999)
      expect(attrs["data-box"]).toBe("999")
    })
  })

  describe("drag threshold", () => {
    it("should not activate drag until threshold is exceeded", () => {
      const startX = 0
      const startY = 0

      // Under threshold — movement of 3px should not activate drag
      expect(hasExceededDragThreshold(startX, startY, 3, 3)).toBe(false)

      // At threshold — 7px exactly (diagonal)
      const threshold = Math.sqrt(7 * 7 / 2)
      expect(hasExceededDragThreshold(startX, startY, threshold, threshold)).toBe(true)

      // Over threshold — 10px movement
      expect(hasExceededDragThreshold(startX, startY, 10, 0)).toBe(true)
      expect(hasExceededDragThreshold(startX, startY, 0, 10)).toBe(true)
    })

    it("uses correct threshold constant", () => {
      expect(DRAG_THRESHOLD_PX).toBe(7)
    })

    it("handles negative coordinates correctly", () => {
      // Drag from -10, -10 to -6, -6 (≈5.66px movement, under 7px threshold)
      expect(hasExceededDragThreshold(-10, -10, -6, -6)).toBe(false)

      // Drag from -10, -10 to 0, 0 (≈14.14px movement, over 7px threshold)
      expect(hasExceededDragThreshold(-10, -10, 0, 0)).toBe(true)
    })
  })

  // The finding this file answers claimed useDrag "assumes mouse events". It does
  // not, and never did — it has been pointer-based since dnd-kit was removed, and
  // PokemonSlot already sets touch-action: none. What was genuinely missing was
  // pointercancel, which is a touch-only failure: the browser revokes the gesture
  // when it decides to scroll or zoom, and without the handler the drag state was
  // left standing with no pointerup ever arriving to clear it.
  describe("which pointers start a drag", () => {
    it("accepts a left mouse button and a touch contact alike", () => {
      // Touch pointerdown reports button 0, the same value as a left click, so
      // no touch-specific branch is needed.
      expect(startsDrag(0)).toBe(true)
    })

    it("rejects middle and right buttons", () => {
      expect(startsDrag(1)).toBe(false)
      expect(startsDrag(2)).toBe(false)
    })

    it("rejects a pointerdown with no button value", () => {
      // Guards the looser `button && button !== 0` form, which passes for
      // undefined and accepts an event no real browser emits.
      expect(startsDrag(undefined as unknown as number)).toBe(false)
    })
  })
})
