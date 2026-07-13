"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MAX_SCALE, MIN_SCALE, DEFAULT_SCALE } from "../_utils/constants"
import type { Position } from "../_types"

export interface MapView {
  /** World coordinates at the centre of the viewport. */
  cx: number
  cz: number
  /** Screen pixels per world block. */
  s: number
}

/**
 * The map's camera: pan (mouse + touch), zoom (wheel + pinch), and eased flights to a
 * target.
 *
 * The view lives in a ref, not state — a drag updates it on every pointer event, and
 * routing that through `setState` would queue a render per event and make the map feel
 * like it is dragging behind the cursor. Instead the ref is mutated and a render is
 * forced explicitly, which keeps the pan glued to the pointer.
 */
export function useMapView({
  player,
  bottomInset,
  reduceMotion,
}: {
  player: Position
  /** Pixels at the bottom hidden by the mobile sheet — the camera centres above it. */
  bottomInset: number
  reduceMotion: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [vp, setVp] = useState({ w: 800, h: 600 })
  const view = useRef<MapView>({ cx: player.x, cz: player.z, s: DEFAULT_SCALE })
  const [, force] = useState(0)
  const rerender = useCallback(() => force((n) => n + 1), [])

  const anim = useRef<number | undefined>(undefined)
  const drag = useRef<{ x: number; y: number; cx: number; cz: number; moved: boolean } | null>(null)
  const pinch = useRef<{ d: number; s: number } | null>(null)

  /** The vertical anchor: the centre of the *visible* map, above the sheet. */
  const anchorY = (vp.h - bottomInset) / 2

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width > 0) setVp({ w: rect.width, h: rect.height })
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  /** World → screen. */
  const project = useCallback(
    (wx: number, wz: number) => {
      const v = view.current
      return { x: vp.w / 2 + (wx - v.cx) * v.s, y: anchorY + (wz - v.cz) * v.s }
    },
    [vp, anchorY],
  )

  const flyTo = useCallback(
    (tx: number, tz: number, ts: number) => {
      if (reduceMotion) {
        view.current = { cx: tx, cz: tz, s: ts }
        rerender()
        return
      }
      if (anim.current) cancelAnimationFrame(anim.current)
      const start = { ...view.current }
      const t0 = performance.now()
      const DURATION = 520
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / DURATION)
        const e = 1 - (1 - p) ** 3
        view.current = {
          cx: start.cx + (tx - start.cx) * e,
          cz: start.cz + (tz - start.cz) * e,
          s: start.s + (ts - start.s) * e,
        }
        rerender()
        if (p < 1) anim.current = requestAnimationFrame(step)
      }
      anim.current = requestAnimationFrame(step)
    },
    [reduceMotion, rerender],
  )

  useEffect(() => () => void (anim.current && cancelAnimationFrame(anim.current)), [])

  /** Zoom about a screen point, keeping the world under that point fixed. */
  const zoomAt = useCallback(
    (factor: number, px: number, py: number) => {
      const v = view.current
      const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.s * factor))
      const wx = v.cx + (px - vp.w / 2) / v.s
      const wz = v.cz + (py - anchorY) / v.s
      view.current = { s: ns, cx: wx - (px - vp.w / 2) / ns, cz: wz - (py - anchorY) / ns }
      rerender()
    },
    [vp, anchorY, rerender],
  )

  const zoomBy = useCallback((factor: number) => zoomAt(factor, vp.w / 2, vp.h / 2), [zoomAt, vp])

  /** Centre on the player, never zoomed further out than a legible neighbourhood. */
  const recenter = useCallback(() => {
    flyTo(player.x, player.z, Math.max(view.current.s, 0.12))
  }, [flyTo, player])

  /** Frame both the player and a destination, with breathing room around both. */
  const frame = useCallback(
    (target: Position) => {
      if (vp.w < 50) return
      const spanX = Math.abs(player.x - target.x) + 1200
      const spanZ = Math.abs(player.z - target.z) + 1200
      const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(vp.w / spanX, (vp.h - bottomInset) / spanZ)))
      flyTo((player.x + target.x) / 2, (player.z + target.z) / 2, s)
    },
    [player, vp, bottomInset, flyTo],
  )

  // Wheel is bound imperatively: React's onWheel is passive, so it cannot
  // `preventDefault()` and the page would scroll behind the map.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoomAt])

  // Mouse pan continues outside the element, so move/up live on the window.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true
      const v = view.current
      view.current = { ...v, cx: drag.current.cx - dx / v.s, cz: drag.current.cz - dy / v.s }
      rerender()
    }
    const onUp = () => {
      drag.current = null
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [rerender])

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => {
      drag.current = { x: e.clientX, y: e.clientY, cx: view.current.cx, cz: view.current.cz, moved: false }
    },
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinch.current = { d: touchDistance(e.touches), s: view.current.s }
        drag.current = null
      } else if (e.touches.length === 1) {
        const t = e.touches[0]
        drag.current = { x: t.clientX, y: t.clientY, cx: view.current.cx, cz: view.current.cz, moved: false }
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (e.touches.length === 2 && pinch.current) {
        const d = touchDistance(e.touches)
        const mid = touchMidpoint(e.touches, rect)
        zoomAt((d / pinch.current.d) * (pinch.current.s / view.current.s), mid.x, mid.y)
        pinch.current = { d, s: view.current.s }
      } else if (e.touches.length === 1 && drag.current) {
        const t = e.touches[0]
        const dx = t.clientX - drag.current.x
        const dy = t.clientY - drag.current.y
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true
        const v = view.current
        view.current = { ...v, cx: drag.current.cx - dx / v.s, cz: drag.current.cz - dy / v.s }
        rerender()
      }
    },
    onTouchEnd: () => {
      pinch.current = null
      drag.current = null
    },
  }

  return {
    ref,
    vp,
    view: view.current,
    anchorY,
    project,
    zoomBy,
    recenter,
    frame,
    handlers,
    dragging: Boolean(drag.current?.moved),
  }
}

function touchDistance(touches: React.TouchList): number {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
}

function touchMidpoint(touches: React.TouchList, rect: DOMRect) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
    y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
  }
}
