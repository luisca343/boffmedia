import type { BSXMon } from "../engine/toBSXMon"

/**
 * One pickable target while a doubles move is being aimed. `code` is
 * Showdown's slot numbering as seen from the chooser: foes are +1/+2, allies
 * −1/−2 (self included for moves that allow it).
 */
export interface TargetOption {
  code: number
  side: "foe" | "ally"
  /** 0-based active slot on that side. */
  slot: number
  mon: BSXMon | null
  label: string
}

/** Published by the dock while a move waits for its target; read by the canvas. */
export interface TargetingState {
  options: TargetOption[]
  onPick: (code: number) => void
  onCancel: () => void
}

/** A ranked action on the end screen. */
export interface EndAction {
  id: string
  label: string
  variant: "pri" | "default" | "ghost"
  onClick: () => void
  icon?: "play" | "sword" | "back" | "refresh"
}
