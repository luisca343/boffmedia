"use client"

/**
 * "Is the room I am in the one on screen?"
 *
 * Several battles are mounted at once now (see `BsimRoot`), and the hidden ones
 * are `visibility:hidden` rather than unmounted — which is exactly what keeps
 * them simulating and keeps their canvas measurable. The cost is that anything
 * a battle registers on the WINDOW is registered once per open battle, and a
 * window listener has no idea which room it belongs to.
 *
 * The one that actually bites is the action dock's hotkeys: `1`–`4` pick a
 * move, and with two live battles open pressing `1` submitted a move in BOTH.
 * A hidden room being `inert` does not help — `inert` governs focus and the
 * accessibility tree, not a listener bound to `window`.
 *
 * So the layer publishes whether it is the visible one and the handful of
 * global-scope behaviours read it. The default is `true`, deliberately: the
 * replay player is embedded in a SmartRotom modal with no layer around it, and
 * a component with no room must behave as though it were the one on screen.
 */

import * as React from "react"

const RoomVisibleCtx = React.createContext(true)

export function useRoomVisible(): boolean {
  return React.useContext(RoomVisibleCtx)
}

export const RoomVisibleProvider = RoomVisibleCtx.Provider
