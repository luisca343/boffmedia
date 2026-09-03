"use client"

/**
 * The battle's two measurements, shared through context.
 *
 *  - LAYOUT: 'desktop' | 'tablet' | 'mobile', measured on the battle SHELL,
 *    not the window. The tool lives in a pane on the launcher and beside a
 *    sidebar on the web, so `window.innerWidth` is the wrong box in both hosts
 *    and the old CSS `lg:` / JS `1024` pair disagreed by a pixel besides.
 *  - SCALE: the canvas' measured `{width, height, scale}`. Sprites, avatars,
 *    hazards and the engine all lay out in 960-unit field space multiplied by
 *    this one number; publishing it from the element that owns the box is
 *    what makes fullscreen and a resized window agree with the animations.
 */

import * as React from "react"
import { ASPECT_RATIO, SCALE_WIDTH, setCanvasWidth } from "../engine/viewUtils"
import { useRoomVisible } from "./room-visibility"

export type BattleLayoutKind = "desktop" | "tablet" | "mobile"

export const LAYOUT_DESKTOP_MIN = 1180
export const LAYOUT_TABLET_MIN = 768

const LayoutCtx = React.createContext<BattleLayoutKind>("desktop")

export function useBattleLayout(): BattleLayoutKind {
  return React.useContext(LayoutCtx)
}

export const BattleLayoutProvider = LayoutCtx.Provider

export function layoutFor(width: number): BattleLayoutKind {
  if (width >= LAYOUT_DESKTOP_MIN) return "desktop"
  if (width >= LAYOUT_TABLET_MIN) return "tablet"
  return "mobile"
}

export interface ElementSize { width: number; height: number }

/**
 * Measures an element with a ResizeObserver. `{0,0}` until mounted, and then
 * NEVER `{0,0}` again — it keeps the last positive reading instead.
 *
 * That stickiness is the second half of how several battles stay open at once.
 * Every open room renders simultaneously and the inactive ones are hidden, so
 * this hook is asked to measure boxes nobody is looking at. `BsimRoot` hides
 * them with `visibility:hidden` precisely so they keep a real box — but a
 * measurement of 0 can still arrive from an ancestor the tool does not own (a
 * host that collapses the tool's pane, a browser tab going to the background
 * mid-layout, the frame between unmount and teardown), and a 0 here does not
 * stay here: `BattleCanvas` publishes the width it derives to
 * `engine/viewUtils`, a MODULE-LEVEL store every room's sprite maths reads. One
 * zero would put every open battle's field at zero scale, and the room that
 * caused it would not be the room that broke.
 *
 * So a non-positive reading is discarded rather than stored. It carries no
 * information — an element with no box has no size to report, it merely has
 * nowhere to report it from — and the last real one is still the right answer
 * when the box comes back.
 */
export function useElementSize<T extends HTMLElement>(ref: React.RefObject<T | null>): ElementSize {
  const [size, setSize] = React.useState<ElementSize>({ width: 0, height: 0 })
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      const next = { width: Math.round(r.width), height: Math.round(r.height) }
      if (!(next.width > 0) || !(next.height > 0)) return
      setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
    }
    read()
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", read)
      return () => window.removeEventListener("resize", read)
    }
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/** The layout kind of the element `ref` points at. */
export function useMeasuredLayout<T extends HTMLElement>(ref: React.RefObject<T | null>): BattleLayoutKind {
  const { width } = useElementSize(ref)
  // Before the first measurement assume desktop: a flash of the mobile
  // sheet on a wide screen is worse than the reverse.
  return width === 0 ? "desktop" : layoutFor(width)
}

export interface BattleScale { width: number; height: number; scale: number }

const ScaleCtx = React.createContext<BattleScale>({ width: SCALE_WIDTH, height: SCALE_WIDTH * ASPECT_RATIO, scale: 1 })

export function useBattleScale(): BattleScale {
  return React.useContext(ScaleCtx)
}

/**
 * Publishes a canvas width to React (context) AND to the engine (module
 * store) in the same layout pass, so a sprite placed by an animation and a
 * plate placed by React never disagree about where the field is.
 *
 * THE REACT HALF IS PER ROOM; THE ENGINE HALF IS THE VISIBLE ROOM'S.
 *
 * `ScaleCtx` is a context, so each open battle's canvas already has its own
 * scale and nothing another room does can reach it. `setCanvasWidth` writes a
 * module SINGLETON, and several battles are open at once now, so it needs an
 * owner. Threading a room id through the whole scene compositor is not it —
 * `getScaleMultiplier()` is called from plain animation functions with no room
 * in scope, and a signature change there touches 39k lines of move animations.
 *
 * The owner is the room on screen. Only the visible layer publishes, and it
 * republishes when it BECOMES visible, so the engine's width is always the
 * width of the field a sprite is actually being animated across. The rooms are
 * near-identical boxes (same absolutely-positioned container) but not identical
 * ones: a battle whose dock needs an extra row of moves gives its stage a few
 * pixels less height, and with `fit="contain"` that is a few pixels of width.
 * Publishing from a hidden room would animate the visible one at the hidden
 * one's scale.
 *
 * Three guards sit under that: hidden layers keep their layout
 * (`visibility:hidden`, never `display:none`), `useElementSize` above refuses a
 * zero measurement, and `setCanvasWidth` ignores a non-positive width.
 */
export function BattleScaleProvider({ width, children }: { width: number; children: React.ReactNode }) {
  const visible = useRoomVisible()
  const value = React.useMemo<BattleScale>(
    () => ({ width, height: Math.round(width * ASPECT_RATIO), scale: width / SCALE_WIDTH }),
    [width],
  )
  React.useLayoutEffect(() => {
    if (visible) setCanvasWidth(width)
  }, [width, visible])
  return <ScaleCtx.Provider value={value}>{children}</ScaleCtx.Provider>
}
