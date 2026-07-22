"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { useTranslations } from "next-intl"
import type { Mon, SlotLoc } from "../_types/pc.types"
import { Sprite, toast } from "../_components/ui"
import { locId, parseLocId, usePcUi } from "../_stores/pcUiStore"

/**
 * Pointer-based drag and drop, replacing the app's `@dnd-kit` setup.
 *
 * dnd-kit was doing very little here that a pointer listener does not: the PC needs a
 * tactile ghost that follows the cursor, hit-testing against ~900 slots, and a
 * multi-drag that carries a whole selection. Hit-testing goes through
 * `elementFromPoint` + a `data-drop` attribute rather than registering 900 droppable
 * refs, which is what made the legacy grid stutter.
 */

export interface DropTarget {
  kind: "box" | "party"
  box?: number
  index: number
  /** True when the target is a whole box (the rail, the overview) rather than a slot. */
  append?: boolean
}

interface DragState {
  items: Mon[]
  from: SlotLoc
  multi: boolean
  x: number
  y: number
  over: DropTarget | null
  active: boolean
}

interface DragCtx {
  drag: DragState | null
  beginDrag: (e: ReactPointerEvent, mon: Mon) => void
}

const Ctx = createContext<DragCtx>({ drag: null, beginDrag: () => {} })
export const useDragLayer = () => useContext(Ctx)

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

function readTarget(el: Element | null): DropTarget | null {
  const host = el?.closest<HTMLElement>("[data-drop]")
  if (!host) return null
  const kind = host.dataset.kind === "party" ? "party" : "box"
  const rawIndex = host.dataset.index ?? ""
  const box = host.dataset.box ? Number(host.dataset.box) : undefined
  if (rawIndex === "") return { kind, box, index: -1, append: true }
  return { kind, box, index: Number(rawIndex) }
}

export interface DragProviderProps {
  children: ReactNode
  /** Resolve a slot to whatever is sitting in it — needed to know if a drop swaps. */
  monAt: (loc: SlotLoc) => Mon | null
  onDropSingle: (from: SlotLoc, to: SlotLoc) => void
  onDropMany: (mons: Mon[], box: number) => void
  /** Return a reason to refuse the drop, or null to allow it. */
  validate: (from: SlotLoc, to: SlotLoc, destinationOccupied: boolean) => string | null
}

/** Below this, a pointer-down is a click, not a drag. */
const DRAG_THRESHOLD_PX = 7

export function DragProvider({ children, monAt, onDropSingle, onDropMany, validate }: DragProviderProps) {
  const t = useTranslations("pc")
  const [drag, setDrag] = useState<DragState | null>(null)
  const state = useRef<DragState & { startX: number; startY: number }>(null)

  const multiMode = usePcUi((s) => s.multiMode)
  const selected = usePcUi((s) => s.selected)
  const setMultiMode = usePcUi((s) => s.setMultiMode)

  // The handlers are held in a ref so they can be added and removed by identity
  // across renders without re-binding the window on every pointer move.
  const handlers = useRef<{ move: (e: PointerEvent) => void; up: () => void }>(null)

  const finish = useCallback(() => {
    const s = state.current
    if (handlers.current) {
      window.removeEventListener("pointermove", handlers.current.move)
      window.removeEventListener("pointerup", handlers.current.up)
    }
    state.current = null
    setDrag(null)
    if (!s?.active || !s.over) return

    const { over, items, from, multi } = s

    // Dropping a whole selection (or a single mon) onto a *box* rather than a slot
    // means "put these in there, wherever they fit".
    if (over.append && over.box != null) {
      onDropMany(items, over.box)
      setMultiMode(false)
      return
    }
    if (multi && items.length > 1) {
      if (over.kind === "box" && over.box != null) {
        onDropMany(items, over.box)
        setMultiMode(false)
      } else {
        toast(t("drag.dropHint"), "info")
      }
      return
    }

    const to: SlotLoc = over.kind === "party" ? { kind: "party", index: over.index } : { kind: "box", box: over.box ?? 0, index: over.index }
    const reason = validate(from, to, monAt(to) !== null)
    if (reason) {
      toast(reason, "error")
      return
    }
    onDropSingle(from, to)
  }, [monAt, onDropMany, onDropSingle, setMultiMode, t, validate])

  const beginDrag = useCallback(
    (e: ReactPointerEvent, mon: Mon) => {
      if (e.button !== 0) return

      // Dragging any member of a multi-selection drags the whole selection.
      const isSelectionDrag = multiMode && selected.has(locId(mon.loc)) && selected.size > 1
      const items = isSelectionDrag
        ? [...selected]
            .map(parseLocId)
            .filter((l): l is SlotLoc => l !== null)
            .map(monAt)
            .filter((m): m is Mon => m !== null)
        : [mon]

      state.current = {
        items,
        from: mon.loc,
        multi: isSelectionDrag,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        over: null,
        active: false,
      }

      const onMove = (ev: PointerEvent) => {
        const s = state.current
        if (!s) return
        if (!s.active && Math.hypot(ev.clientX - s.startX, ev.clientY - s.startY) < DRAG_THRESHOLD_PX) return
        s.active = true
        s.x = ev.clientX
        s.y = ev.clientY
        s.over = readTarget(document.elementFromPoint(ev.clientX, ev.clientY))
        setDrag({ ...s })
      }
      const onUp = () => finish()

      handlers.current = { move: onMove, up: onUp }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [finish, monAt, multiMode, selected],
  )

  useEffect(
    () => () => {
      if (!handlers.current) return
      window.removeEventListener("pointermove", handlers.current.move)
      window.removeEventListener("pointerup", handlers.current.up)
    },
    [],
  )

  return (
    <Ctx.Provider value={{ drag, beginDrag }}>
      {children}
      {drag?.active && drag.items[0] && (
        <div
          className="pointer-events-none fixed z-[9999] h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] scale-105 drop-shadow-[0_12px_14px_rgb(0_0_0_/_.6)]"
          style={{ left: drag.x, top: drag.y }}
        >
          <Sprite
            dex={drag.items[0].pokemon.dex}
            form={drag.items[0].pokemon.form}
            palette={drag.items[0].pokemon.palette}
            className="h-full w-full"
          />
          {drag.multi && drag.items.length > 1 && (
            <span className="absolute -right-2 -top-2 flex h-[22px] min-w-[22px] items-center justify-center rounded-pc-pill bg-pc-cyan px-1 font-pc-mono text-xs font-extrabold text-[#06222a] shadow-[0_4px_10px_rgb(0_0_0_/_.4)]">
              {drag.items.length}
            </span>
          )}
        </div>
      )}
    </Ctx.Provider>
  )
}
