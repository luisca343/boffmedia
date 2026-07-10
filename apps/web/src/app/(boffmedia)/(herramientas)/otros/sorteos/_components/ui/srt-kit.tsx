"use client"

import * as React from "react"
import { Icon, IconButton, Avatar, type IconName } from "@/components/boffmedia/primitives"
import { initials, oddsOf, type Entrant } from "../../_lib/useSorteos"

export const SRT_COLORS = [
  "var(--accent)", "#4da3ff", "#7c5cff", "#34d377",
  "#ffb224", "#ff6f9c", "#2dd4bf", "#c084fc",
  "#f0803c", "#5b8def", "#9d7bff", "#3fc79a",
]

const CLIP_4 = "polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)"
const CLIP_8 = "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)"
const CLIP_9 = "polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)"
const CLIP_14 = "polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)"

/* ── weight stepper ───────────────────────────────────────────────────────── */
export function SrtWeight({ value, onChange, min = 1, max = 99, sm }: { value: number; onChange: (v: number) => void; min?: number; max?: number; sm?: boolean }) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)))
  return (
    <div className={"inline-flex items-center border border-line-2 bg-panel-2 " + (sm ? "h-[26px]" : "h-[30px]")}>
      <button
        type="button"
        aria-label="Menos peso"
        disabled={value <= min}
        onClick={() => set(value - 1)}
        className={"grid h-full place-items-center text-txt-muted transition-colors enabled:hover:bg-accent-soft enabled:hover:text-accent disabled:opacity-35 " + (sm ? "w-[22px]" : "w-[26px]")}
      >
        <Icon name="minus" size={13} />
      </button>
      <span className="grid h-full min-w-[26px] place-items-center border-x border-line-2 text-center font-mono text-[12px] font-bold tabular-nums text-txt">{value}</span>
      <button
        type="button"
        aria-label="Más peso"
        disabled={value >= max}
        onClick={() => set(value + 1)}
        className={"grid h-full place-items-center text-txt-muted transition-colors enabled:hover:bg-accent-soft enabled:hover:text-accent disabled:opacity-35 " + (sm ? "w-[22px]" : "w-[26px]")}
      >
        <Icon name="plus" size={13} />
      </button>
    </div>
  )
}

/* ── participant row ──────────────────────────────────────────────────────── */
export function SrtRow({
  index, entrant, weighted, won, removeLabel, onRename, onWeight, onRemove,
}: {
  index: number
  entrant: Entrant
  weighted: boolean
  won: boolean
  removeLabel: string
  onRename: (name: string) => void
  onWeight: (w: number) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(entrant.name)
  React.useEffect(() => setDraft(entrant.name), [entrant.name])
  const commit = () => {
    const v = draft.trim()
    if (v) onRename(v)
    else setDraft(entrant.name)
    setEditing(false)
  }
  return (
    <div className={"grid grid-cols-[30px_1fr_auto_auto] items-center gap-[10px] border-b border-line px-[14px] py-[8px] transition-colors last:border-b-0 hover:bg-panel-2 " + (won ? "opacity-55" : "")}>
      <span className="text-right font-mono text-[11px] font-semibold tabular-nums text-txt-dim">
        {won ? <Icon name="trophy" size={13} className="inline text-accent" /> : index}
      </span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") {
              setDraft(entrant.name)
              setEditing(false)
            }
          }}
          className="min-w-0 border border-accent-line bg-base-2 px-[9px] py-[7px] text-[14px] font-medium text-txt outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          title={entrant.name}
          className={"inline-flex min-w-0 items-center gap-[8px] truncate text-[14px] " + (won ? "text-accent" : "text-txt")}
        >
          <Avatar className="h-[26px] w-[26px] flex-none text-[10px]">{initials(entrant.name)}</Avatar>
          <span className="truncate">{entrant.name}</span>
        </span>
      )}
      {weighted ? <SrtWeight sm value={entrant.weight || 1} onChange={onWeight} /> : <span aria-hidden="true" />}
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="grid h-[28px] w-[28px] flex-none place-items-center border border-transparent bg-transparent text-txt-dim transition-colors hover:border-[color-mix(in_srgb,var(--warn)_40%,transparent)] hover:text-warn"
      >
        <Icon name="x" size={15} />
      </button>
    </div>
  )
}

/* ── multi-winner reveal ──────────────────────────────────────────────────── */
export function SrtWinnerList({ winners, pool, weighted }: { winners: Entrant[]; pool: Entrant[]; weighted: boolean }) {
  return (
    <div className="relative z-[1] grid gap-[8px]">
      {winners.map((w, i) => (
        <div key={w.id} className="flex items-center gap-[14px] border border-line border-l-[3px] border-l-accent bg-panel-2 px-[16px] py-[12px]">
          <span className="min-w-[30px] font-display text-[20px] font-extrabold italic tabular-nums text-accent">{i + 1}</span>
          <Avatar accent className="h-[36px] w-[36px] flex-none text-[14px]">{initials(w.name)}</Avatar>
          <span className="min-w-0 flex-1 truncate font-display text-[18px] font-bold text-txt">{w.name}</span>
          <span className="flex-none font-mono text-[11px] font-medium tracking-[0.04em] text-txt-dim">{oddsOf(pool, w, weighted).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

/* ── verifiable seed tag ──────────────────────────────────────────────────── */
export function SrtSeedTag({ seed, copyLabel, copiedLabel, seedLabel }: { seed: string; copyLabel: string; copiedLabel: string; seedLabel: string }) {
  const [ok, setOk] = React.useState(false)
  const copy = () => {
    try {
      navigator.clipboard?.writeText(seed).catch(() => {})
    } catch {
      /* noop */
    }
    setOk(true)
    setTimeout(() => setOk(false), 1400)
  }
  return (
    <span className="inline-flex items-center gap-[9px] border border-line-2 bg-panel-2 px-[11px] py-[7px] font-mono text-[11px] font-medium tracking-[0.04em] text-txt-muted">
      <Icon name="lock" size={13} className="flex-none text-signal" />
      {seedLabel} <code className="font-semibold text-accent">#{seed}</code>
      <button type="button" onClick={copy} aria-label={copyLabel} className="ml-1 inline-flex items-center gap-[5px] border-0 bg-transparent p-0 text-txt-dim transition-colors hover:text-accent">
        <Icon name={ok ? "check" : "copy"} size={12} />
        {ok ? copiedLabel : copyLabel}
      </button>
    </span>
  )
}

/* ── confetti ─────────────────────────────────────────────────────────────── */
export function SrtConfetti({ n = 54 }: { n?: number }) {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: n }).map((_, i) => ({
        left: (i * 97) % 100,
        delay: (((i * 53) % 100) / 100) * 0.6,
        dur: 2.4 + (((i * 31) % 100) / 100) * 1.8,
        color: SRT_COLORS[i % SRT_COLORS.length],
        w: 6 + (i % 3) * 2,
      })),
    [n],
  )
  return (
    <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute -top-3 animate-[bm-srt-conf_linear_forwards]"
          style={{ left: p.left + "%", width: p.w, height: p.w * 1.5, background: p.color, animationDuration: p.dur + "s", animationDelay: p.delay + "s" }}
        />
      ))}
    </div>
  )
}

/* small panel + head helpers (srt-panel) reused across the view */
export function SrtPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)" }} className={"border border-line bg-panel " + (className ?? "")}>
      {children}
    </div>
  )
}
export function SrtPanelHead({ icon, title, right }: { icon: IconName; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[12px] border-b border-line px-[20px] py-[15px]">
      <h3 className="flex items-center gap-[10px] font-display text-[16px] font-bold not-italic uppercase tracking-[0.04em] text-txt">
        <Icon name={icon} size={17} className="text-accent" />
        {title}
      </h3>
      {right != null && <span className="ml-auto flex items-center gap-2">{right}</span>}
    </div>
  )
}

export { IconButton, Avatar, Icon, CLIP_4, CLIP_8, CLIP_9, CLIP_14 }
