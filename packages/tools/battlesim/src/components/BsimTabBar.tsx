"use client"

/**
 * The tool's one tab bar — the Showdown move.
 *
 * Battlesim had three tab controls and none of them were global: a `DkSeg` in
 * the hub's bar (Lobby · Equipos · Repeticiones), a strip of battle tabs inside
 * `BattleHeader` that only existed while you were already in a battle, and the
 * mobile Acciones/Registro/Chat row inside the battle itself. So "open my teams
 * while a battle runs" was not one click, it was a back-navigation that
 * destroyed the battle. This bar is the single control: the three hub sections
 * are PINNED tabs, every open room is a tab beside them, and `+` starts another
 * battle. The two it replaces are gone — a bar of tabs stacked on a second bar
 * of tabs is worse than either.
 *
 * SEMANTICS. A real `role="tablist"`: roving `tabIndex`, Left/Right/Home/End,
 * manual activation (arrows move focus, Enter/Space commits) so a keyboard user
 * can walk past a battle without navigating into it, and a close button that is
 * its own tab stop rather than a click target buried inside the tab. Delete
 * closes the focused room, as a browser does.
 *
 * WHAT THE TABS POINT AT. Nothing here holds screen state: a pinned tab is
 * `nav.replace("hub", { tab })` and a room tab is `activateRoom`, which is a
 * `nav.replace` to that room's own address. The bar renders the address; it
 * does not own it.
 */

import * as React from "react"
import { ConfirmDialog, Icon, cn, type IconName } from "@boffmedia/ui"

import { useToolT, BATTLESIM_NS } from "../i18n"
import { useBsimNav, type BsimScreen } from "../nav"
import { useBsimRooms, type BsimRoom, type BsimRoomTone } from "../rooms/RoomsProvider"
import type { BsimView } from "../lib/bsim-data"
import { BSIM_FOCUS_CUT } from "./bsim-kit"

/* ── Geometry ────────────────────────────────────────────────────────────── */

/**
 * The bar's own height, as a token.
 *
 * `BsimShell` subtracts it from the box the host gave the tool, so every screen
 * below keeps reading `--tool-vh` and keeps fitting. A literal in two places is
 * how the battle ends up one bar taller than its viewport.
 */
export const BSIM_TAB_BAR_H = "40px"

/** 32px tall inside a 40px bar: the contract's minimum hit target, exactly. */
const TAB_BOX =
  "flex h-8 flex-none items-center gap-[6px] border border-solid px-[10px] font-display text-[11.5px]/none font-bold uppercase tracking-[0.04em] transition-[background,border-color,color] duration-[140ms]"

const TAB_ON = "border-line-2 [--cut-line:var(--line-2)] bg-panel text-txt [box-shadow:inset_0_2px_0_var(--accent)]"
const TAB_OFF = "border-line [--cut-line:var(--line)] bg-base text-txt-muted hover:bg-panel-2 hover:text-txt"

const DOT: Record<BsimRoomTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  dim: "bg-line-2",
}

/* ── The pinned three ────────────────────────────────────────────────────── */

/**
 * The hub's sections, promoted out of its `DkSeg` and onto the global bar.
 *
 * `tab` is the value that already lived in the address as `?tab=…`, so nothing
 * about the hub's own routing changes — only where the control is drawn.
 */
const PINS: { tab: BsimView; icon: IconName; key: "home" | "teams" | "replays" }[] = [
  { tab: "lobby", icon: "home", key: "home" },
  { tab: "equipos", icon: "layers", key: "teams" },
  { tab: "repeticiones", icon: "play", key: "replays" },
]

/**
 * The pinned tab that owns a NON-room screen, or null when none does.
 *
 * Exported because `BsimRoot` needs the same answer to wire `aria-controls` on
 * the tab to the layer that is its `tabpanel`: two independent copies of this
 * mapping is two ways for the pair of ids to stop matching.
 */
export function bsimPinKeyFor(screen: BsimScreen, params: Record<string, string>): string | null {
  if (screen === "teams" || screen === "teamEdit") return "pin:equipos"
  if (screen === "hub") return `pin:${PINS.find((p) => p.tab === params.tab)?.tab ?? "lobby"}`
  return null
}

/* ── Entries ─────────────────────────────────────────────────────────────── */

type Entry =
  | { key: string; kind: "pin"; tab: BsimView; icon: IconName; label: string }
  | { key: string; kind: "room"; room: BsimRoom; icon: IconName; label: string; sub?: string; tone: BsimRoomTone; state: string }

const ROOM_ICON: Record<BsimRoom["kind"], IconName> = { ai: "target", pvp: "sword", showdown: "globe", replay: "play" }

export function BsimTabBar() {
  const t = useToolT(BATTLESIM_NS)
  const nav = useBsimNav()
  const { rooms, activeRoomId, activateRoom, closeRoom, local, isRoomLive } = useBsimRooms()

  const scroller = React.useRef<HTMLDivElement | null>(null)
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>())
  const [focusKey, setFocusKey] = React.useState<string | null>(null)
  const [closing, setClosing] = React.useState<string | null>(null)

  /**
   * The dot, for a local battle, is the SESSION's state and not a stored field
   * — the engine mutates its sessions in place, so anything cached here would
   * be a turn behind. Non-local rooms carry whatever `setRoomTone` last said.
   */
  const describe = React.useCallback(
    (room: BsimRoom): { tone: BsimRoomTone; state: string; label: string } => {
      const fallback = t(`tabs.room.${room.kind}`)
      if (room.kind !== "ai") return { tone: room.tone, state: t(`tabs.state.${room.tone === "bad" ? "error" : "open"}`), label: room.label || fallback }
      const state = local.getSession(room.id)?.getState()
      if (!state) return { tone: "dim", state: t("tabs.state.loading"), label: room.label || fallback }
      if (state.status === "error") return { tone: "bad", state: t("tabs.state.error"), label: room.label || fallback }
      if (state.status === "connecting") return { tone: "warn", state: t("tabs.state.loading"), label: room.label || fallback }
      if (state.battleComplete || state.status === "finished") return { tone: "dim", state: t("tabs.state.finished"), label: room.label || fallback }
      if (state.isWaitingForChoice) return { tone: "warn", state: t("tabs.state.yourTurn"), label: room.label || fallback }
      return { tone: "ok", state: t("tabs.state.running"), label: room.label || fallback }
    },
    [local, t],
  )

  const entries = React.useMemo<Entry[]>(() => {
    const pins: Entry[] = PINS.map((p) => ({ key: `pin:${p.tab}`, kind: "pin", tab: p.tab, icon: p.icon, label: t(`tabs.${p.key}`) }))
    const open: Entry[] = rooms.map((room) => {
      const d = describe(room)
      return { key: room.id, kind: "room", room, icon: ROOM_ICON[room.kind], label: d.label, sub: room.sub, tone: d.tone, state: d.state }
    })
    return [...pins, ...open]
  }, [rooms, describe, t])

  /**
   * Which tab is on.
   *
   * A room wins whenever the address names one. Otherwise the hub's `?tab=` —
   * and the `teams`/`teamEdit` screens, which are the same section under
   * another name. `play` with no room is the setup screen: no tab is on, and
   * the roving index falls back to the first.
   */
  const selectedKey = React.useMemo(
    () => activeRoomId ?? bsimPinKeyFor(nav.screen, { tab: nav.params.tab }),
    [activeRoomId, nav.screen, nav.params.tab],
  )

  const rovingKey = (focusKey && entries.some((e) => e.key === focusKey) ? focusKey : null) ?? selectedKey ?? entries[0]?.key ?? null

  // The active tab scrolls into view — the whole point of a strip that
  // overflows. `nearest` on both axes so it never scrolls the page behind it.
  React.useEffect(() => {
    if (!selectedKey) return
    tabRefs.current.get(selectedKey)?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [selectedKey, entries.length])

  const activate = React.useCallback(
    (entry: Entry) => {
      if (entry.kind === "pin") nav.replace("hub", { tab: entry.tab })
      else activateRoom(entry.room.id)
    },
    [nav, activateRoom],
  )

  /** A running battle asks first; anything else closes on the spot. */
  const requestClose = React.useCallback(
    (id: string) => {
      if (isRoomLive(id)) setClosing(id)
      else closeRoom(id)
    },
    [isRoomLive, closeRoom],
  )

  /** Wraps at both ends, as the APG tabs pattern does. */
  const move = (to: number) => {
    const next = entries[(to + entries.length) % entries.length]
    if (!next) return
    setFocusKey(next.key)
    tabRefs.current.get(next.key)?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number, entry: Entry) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault()
        move(index + 1)
        break
      case "ArrowLeft":
        event.preventDefault()
        move(index - 1)
        break
      case "Home":
        event.preventDefault()
        move(0)
        break
      case "End":
        event.preventDefault()
        move(entries.length - 1)
        break
      case "Delete":
      case "Backspace":
        if (entry.kind === "room") {
          event.preventDefault()
          requestClose(entry.room.id)
        }
        break
      default:
    }
  }

  return (
    <div
      className="flex shrink-0 items-center gap-1 border-b border-solid border-line bg-base-2 px-2"
      style={{ minHeight: BSIM_TAB_BAR_H }}
    >
      <div ref={scroller} className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overflow-y-hidden py-1">
        <div role="tablist" aria-label={t("tabs.aria")} aria-orientation="horizontal" className="flex min-w-0 items-center gap-1">
          {entries.map((entry, index) => {
            const on = entry.key === selectedKey
            const roving = entry.key === rovingKey
            const open = entry.kind === "room" ? entry : null
            return (
              <span key={entry.key} role="presentation" className="flex flex-none items-center">
                <button
                  type="button"
                  role="tab"
                  id={`bsim-tab-${entry.key}`}
                  aria-selected={on}
                  aria-controls={`bsim-panel-${entry.key}`}
                  tabIndex={roving ? 0 : -1}
                  ref={(node) => {
                    if (node) tabRefs.current.set(entry.key, node)
                    else tabRefs.current.delete(entry.key)
                  }}
                  onFocus={() => setFocusKey(entry.key)}
                  onKeyDown={(event) => onKeyDown(event, index, entry)}
                  onClick={() => activate(entry)}
                  className={cn(
                    "cut-tag cut-tag-edge [--cut-tag:8px]",
                    BSIM_FOCUS_CUT,
                    TAB_BOX,
                    on ? TAB_ON : TAB_OFF,
                    open && "pr-[6px]",
                  )}
                >
                  <Icon name={entry.icon} size={12} className="flex-none opacity-80" />
                  <span className="max-w-[12ch] truncate">{entry.label}</span>
                  {open && (
                    <>
                      {open.sub && <span className="max-w-[8ch] truncate font-mono text-[9.5px]/none font-semibold tracking-[0.06em] text-txt-dim">{open.sub}</span>}
                      {/* The dot is redundant colour: the state is also a word,
                          read out beside it. */}
                      <i aria-hidden className={cn("h-[6px] w-[6px] flex-none [clip-path:circle(50%)]", DOT[open.tone])} />
                      <span className="sr-only">{open.state}</span>
                    </>
                  )}
                </button>
                {open && (
                  <button
                    type="button"
                    tabIndex={roving ? 0 : -1}
                    onFocus={() => setFocusKey(entry.key)}
                    onClick={() => requestClose(open.room.id)}
                    aria-label={t("tabs.close", { label: entry.label })}
                    className={cn(
                      "cut-tag cut-tag-edge [--cut-tag:6px] [--cut-line:var(--line)]",
                      BSIM_FOCUS_CUT,
                      "-ml-px grid h-8 w-8 flex-none place-items-center border border-solid border-line bg-base text-txt-dim transition-[background,color] duration-[140ms] hover:bg-bad-soft hover:text-bad",
                    )}
                  >
                    <Icon name="x" size={11} />
                  </button>
                )}
              </span>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => nav.replace("play", {})}
        aria-label={t("tabs.new")}
        title={t("tabs.new")}
        className={cn(
          "cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--accent-line)]",
          BSIM_FOCUS_CUT,
          "grid h-8 w-8 flex-none place-items-center border border-solid border-accent-line bg-accent-soft text-accent transition-[background,color] duration-[140ms] hover:bg-accent hover:text-accent-ink",
        )}
      >
        <Icon name="plus" size={14} />
      </button>

      <ConfirmDialog
        open={!!closing}
        tone="warning"
        title={t("battle.header.closeLiveTitle")}
        body={t("battle.header.closeLiveBody")}
        confirmLabel={t("battle.header.closeLiveCta")}
        onConfirm={() => {
          if (closing) closeRoom(closing)
          setClosing(null)
        }}
        onClose={() => setClosing(null)}
      />
    </div>
  )
}
