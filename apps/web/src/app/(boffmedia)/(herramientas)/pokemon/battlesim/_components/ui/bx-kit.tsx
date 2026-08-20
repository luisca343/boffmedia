"use client"

// v3 «Bx» battle-HUD kit — the `bx-*` primitives, consuming the real engine's
// BSX shapes (see `_lib/bx-helpers`). Presentational
// only; callers own data + choices. Sprites resolve through the shared
// `spriteUrl` used by every other v3 Pokémon tool.
import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { DkSprite } from "@/components/boffmedia/ui/tools/datakit"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"
import {
  tyColor, tyLabel, CAT_ES, STATUS_ES, STATUS_LONG, BOOST_ES, hpTone, effLabel, effMult, speedOrder,
  type BxMon, type BxMove, type BxTickEv, type BxTeamHP, type OrderSlot,
} from "../../_lib/bx-helpers"

const tyc = (v: string) => ({ ["--tyc"]: v }) as React.CSSProperties
export function BxSprite({ mon, size = 40 }: { mon: BxMon; size?: number }) {
  return <DkSprite src={spriteUrl(mon.name)} alt={mon.name} size={size} onError={handleSpriteError} />
}

/* ── Type / category / status / boost / tera ─────────────────────────────── */
export function BxType({ type, ghost = false, small = false }: { type: string; ghost?: boolean; small?: boolean }) {
  return (
    <span style={{ ...tyc(tyColor(type)) }}
      className={cn("cut cut-edge-slant [--cut:3px]", "inline-flex items-center gap-[5px] font-mono font-semibold uppercase leading-none tracking-[0.06em]",
        small ? "gap-1 px-[5px] py-[3px] text-[8.5px]" : "px-[7px] py-1 text-[10px]",
        ghost
          ? "border border-solid border-[color-mix(in_srgb,var(--tyc)_40%,transparent)] text-[var(--tyc)] [background:color-mix(in_srgb,var(--tyc)_13%,transparent)]"
          : "text-accent-ink [background:var(--tyc)]")}>
      <i aria-hidden className={cn("rounded-full", ghost ? "bg-[var(--tyc)]" : "bg-current opacity-55")} style={{ width: 4, height: 4 }} />{tyLabel(type)}
    </span>
  )
}
export function BxTypeRow({ types, ghost = true, small = false }: { types: string[]; ghost?: boolean; small?: boolean }) {
  return <span className="inline-flex flex-wrap gap-1">{types.map((t) => <BxType key={t} type={t} ghost={ghost} small={small} />)}</span>
}

const CAT_MARK: Record<string, string> = {
  phys: "[clip-path:polygon(50%_0,100%_100%,0_100%)] bg-bad",
  spec: "rounded-full bg-signal",
  status: "bg-txt-dim",
}
export function BxCat({ cat }: { cat: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[8.5px] font-semibold uppercase leading-none tracking-[0.08em] text-txt-muted">
      <i aria-hidden className={cn("h-[7px] w-[7px] flex-none", CAT_MARK[cat] || CAT_MARK.status)} />{CAT_ES[cat] || cat}
    </span>
  )
}

const STATUS_BG: Record<string, string> = {
  brn: "bg-[#ff7a33] text-accent-ink", par: "bg-[#f7d02c] text-accent-ink",
  psn: "bg-[#a33ea1] text-white", tox: "bg-[#a33ea1] text-white",
  slp: "bg-txt-dim text-base", frz: "bg-[#74c6c2] text-accent-ink", fnt: "bg-line-2 text-txt",
}
export function BxStatus({ status, long = false }: { status?: string | null; long?: boolean }) {
  if (!status) return null
  return (
    <span title={STATUS_LONG[status]}
      className={cn("cut [--cut:2px] ", "flex-none px-[5px] py-[3px] font-mono text-[8.5px] font-bold leading-none tracking-[0.08em]", STATUS_BG[status] || "bg-warn text-accent-ink")}>
      {long ? STATUS_LONG[status] : STATUS_ES[status] || status.toUpperCase()}
    </span>
  )
}

export function BxBoost({ stat, value }: { stat: string; value: number }) {
  return (
    <span className={cn("flex-none border px-[5px] py-[3px] font-mono text-[9px] font-bold leading-none tracking-[0.04em]",
      value > 0 ? "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft text-ok" : "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad")}>
      {(value > 0 ? "+" : "") + value} {BOOST_ES[stat] || stat}
    </span>
  )
}

export function BxTera({ type, size = "1em" }: { type: string; size?: string }) {
  const t = useTranslations("battlesim")
  return <span style={{ ...tyc(tyColor(type)), fontSize: size }} title={t("bx.teraTypeTitle", { type: tyLabel(type) })}
    className="flex-none leading-none [color:var(--tyc)] [text-shadow:0_0_8px_color-mix(in_srgb,var(--tyc)_65%,transparent)]">◆</span>
}

/* ── HP bar (with ghost damage preview) ──────────────────────────────────── */
export function BxHp({ pct, ghost = null }: { pct: number; ghost?: { min: number; max: number } | null }) {
  const p = Math.max(0, Math.min(100, pct))
  const gMax = ghost ? Math.min(p, ghost.max) : 0
  const gMin = ghost ? Math.min(p, ghost.min) : 0
  return (
    <div className="relative h-[7px] overflow-hidden border border-solid border-line-2 bg-base">
      <i className="absolute bottom-0 top-0 z-[2] w-px bg-[color-mix(in_srgb,var(--line-2)_80%,transparent)]" style={{ left: "50%" }} />
      <i className="absolute bottom-0 top-0 z-[2] w-px bg-[color-mix(in_srgb,var(--line-2)_80%,transparent)]" style={{ left: "25%" }} />
      <i className="absolute inset-0 right-auto transition-[width,background] duration-[450ms]" style={{ width: p + "%", background: hpTone(p) }} />
      {ghost && gMax > gMin && <i className="absolute bottom-0 top-0 z-[2] bg-[repeating-linear-gradient(45deg,color-mix(in_srgb,var(--warn)_55%,transparent)_0_4px,transparent_4px_8px)]" style={{ left: p - gMax + "%", width: gMax - gMin + "%" }} />}
      {ghost && gMin > 0 && <i className="absolute bottom-0 top-0 z-[3] bg-[color-mix(in_srgb,var(--bad)_75%,transparent)]" style={{ left: Math.max(0, p - gMin) + "%", width: Math.min(gMin, p) + "%" }} />}
    </div>
  )
}

/* ── Field plate (combatant HUD) ─────────────────────────────────────────── */
export type BxGhost = { min: number; max: number; ko?: { t: string; cls: "sure" | "maybe" } | null } | null
export function BxPlate({ mon, slotTag, foe = false, ghost = null, active = false, targetable = false, aimed = false, hit = false, onClick, compact = false }: {
  mon: BxMon | null; slotTag?: string; foe?: boolean; ghost?: BxGhost; active?: boolean; targetable?: boolean; aimed?: boolean; hit?: boolean; onClick?: () => void; compact?: boolean
}) {
  if (!mon) return null
  const pct = mon.fnt ? 0 : mon.hp
  const boosts = Object.entries((mon.boosts || {}) as Record<string, number>).filter(([, v]) => v)
  const types = mon.tera && mon.teraType ? [mon.teraType] : mon.types
  const Tag = (targetable ? "button" : "div") as "button"
  return (
    <Tag
      type={targetable ? "button" : undefined}
      onClick={targetable ? onClick : undefined}
      style={{ ...tyc(tyColor(mon.tera && mon.teraType ? mon.teraType : mon.types[0])) }}
      className={cn("cut-tag cut-tag-edge [--cut-tag:var(--cut,10px)]", "relative flex w-full min-w-0 items-center gap-[9px] border border-solid border-line border-l-[3px] border-l-[var(--tyc)] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] px-[10px] py-[7px] pl-2 text-left backdrop-blur-[4px] transition-[border-color,background,transform]",
        compact ? "gap-[7px] px-2 py-[5px]" : "",
        mon.fnt && "opacity-55 saturate-[0.2]",
        active && "border-accent-line shadow-[0_0_0_1px_var(--accent-line)]",
        (ghost || aimed) && "border-[color-mix(in_srgb,var(--warn)_55%,transparent)]",
        aimed && !ghost && "shadow-[0_0_0_1px_color-mix(in_srgb,var(--warn)_60%,transparent)_inset,0_0_16px_-6px_var(--warn)] animate-[bm-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none",
        hit && "animate-[bm-hitflash_0.5s_ease] motion-reduce:animate-none",
        targetable && "cursor-crosshair hover:-translate-x-[2px] hover:border-accent hover:bg-panel-2 focus-visible:border-accent focus-visible:outline-none",
      )}>
      <span className="relative flex-none">
        <BxSprite mon={mon} size={compact ? 30 : 40} />
        {mon.fnt && <b className="absolute inset-0 grid place-items-center font-display text-[12px] font-extrabold leading-none tracking-[0.06em] text-bad">KO</b>}
      </span>
      <span className="grid min-w-0 flex-1 gap-[5px]">
        <span className="flex min-w-0 items-center gap-[6px]">
          {slotTag && <b className={cn("flex-none border px-[5px] py-[2px] font-mono text-[8px] font-bold not-italic leading-none tracking-[0.1em]", foe ? "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad" : "border-accent-line bg-accent-soft text-accent-bright")}>{slotTag}</b>}
          {mon.tera && mon.teraType && <BxTera type={mon.teraType} size=".78em" />}
          <span className={cn("min-w-0 flex-1 truncate font-display font-bold uppercase leading-none tracking-[0.03em]", compact ? "text-[12px]" : "text-[13.5px]")}>{mon.name}</span>
          <span className="ml-auto flex-none font-mono text-[11.5px] font-bold leading-none text-txt-muted">{mon.fnt ? "KO" : pct + "%"}</span>
        </span>
        <BxHp pct={pct} ghost={ghost} />
        {ghost ? (
          <span className="flex min-h-[16px] items-center gap-[6px] font-mono text-[11px] font-bold leading-none text-warn">
            <Icon name="target" size={11} /><b>−{ghost.min}–{ghost.max}%</b>
            {ghost.ko && <i className={cn("px-[5px] py-[3px] font-mono text-[9px] font-bold not-italic uppercase leading-none tracking-[0.06em] text-accent-ink", ghost.ko.cls === "sure" ? "bg-bad" : "bg-warn")}>{ghost.ko.t}</i>}
          </span>
        ) : (
          <span className="flex min-h-[16px] flex-wrap items-center gap-[5px]">
            <BxTypeRow types={types} small />
            <BxStatus status={mon.status} />
            {mon.protect && <i className="border border-dashed border-[color-mix(in_srgb,var(--info)_50%,transparent)] px-1 py-[2px] font-mono text-[8.5px] font-bold not-italic leading-none tracking-[0.1em] text-signal">PROT</i>}
            {boosts.map(([s, v]) => <BxBoost key={s} stat={s} value={v} />)}
          </span>
        )}
      </span>
    </Tag>
  )
}

/* ── Move key ────────────────────────────────────────────────────────────── */
export function BxKey({ move, hotkey, target = null, selected = false, disabled = false, tera = false, onClick, onHover, onLeave }: {
  move: BxMove; hotkey?: string | number; target?: BxMon | null; selected?: boolean; disabled?: boolean; tera?: boolean
  onClick?: () => void; onHover?: () => void; onLeave?: () => void
}) {
  const t = useTranslations("battlesim")
  const off = disabled || move.pp <= 0
  const effTag = move.cat !== "status" && target ? effLabel(effMult(move.type, target.tera && target.teraType ? [target.teraType] : target.types)) : null
  return (
    <button type="button" disabled={off} onClick={off ? undefined : onClick}
      onMouseEnter={onHover} onMouseLeave={onLeave} onFocus={onHover} onBlur={onLeave}
      style={{ ...tyc(tyColor(move.type)) }}
      className={cn("cut-tag cut-tag-edge [--cut-tag:var(--cut,10px)]", "relative flex w-full min-w-0 items-center gap-[9px] border border-solid border-line border-l-[3px] border-l-[var(--tyc)] bg-panel px-[10px] py-2 text-left transition-[background,border-color,transform]",
        "hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--tyc)_55%,var(--line))] hover:bg-panel-2 focus-visible:outline-none",
        selected && "border-accent shadow-[0_0_0_1px_var(--accent-line)]",
        off && "cursor-not-allowed opacity-45",
      )}>
      {hotkey != null && <BxKbd>{hotkey}</BxKbd>}
      <span className="grid min-w-0 flex-1 gap-[5px]">
        <span className="flex items-center gap-[6px] font-display text-[13px] font-bold uppercase leading-[1.05] tracking-[0.03em]">
          {move.name}{tera && <b className="border border-[color-mix(in_srgb,var(--accent)_50%,transparent)] px-[3px] py-px font-mono text-[7.5px] not-italic tracking-[0.08em] text-accent-bright">TERA</b>}
        </span>
        <span className="flex flex-wrap items-center gap-[7px]">
          <BxType type={move.type} small /><BxCat cat={move.cat} />
          {move.spread && <i className="border border-dashed border-line-2 px-1 py-[2px] font-mono text-[8.5px] font-semibold not-italic leading-none tracking-[0.08em] text-txt-dim">{move.spread === "all" ? t("bx.spreadAllTag") : t("bx.spreadTag")}</i>}
          {(move.prio ?? 0) > 0 && <i className="border border-dashed border-[color-mix(in_srgb,var(--ok)_45%,transparent)] px-1 py-[2px] font-mono text-[8.5px] font-semibold not-italic leading-none tracking-[0.08em] text-ok">+{move.prio}</i>}
        </span>
      </span>
      <span className="grid flex-none justify-items-end gap-1">
        {effTag && <b className={cn("px-[5px] py-[3px] font-mono text-[8.5px] font-bold uppercase leading-none tracking-[0.06em]",
          effTag.cls === "super" ? "bg-ok text-accent-ink" : effTag.cls === "immune" ? "bg-txt-dim text-accent-ink" : "border border-line-2 bg-panel-2 text-txt-muted")}>{effTag.t}</b>}
        <span className="inline-flex items-center gap-[5px] font-mono text-[9.5px] font-semibold leading-none text-txt-dim">
          <i className="h-1 w-[30px] overflow-hidden border border-solid border-line bg-base"><b className="block h-full bg-accent" style={{ width: (move.pp / Math.max(1, move.maxpp)) * 100 + "%" }} /></i>
          {move.pp}/{move.maxpp}
        </span>
      </span>
    </button>
  )
}

/* ── Bench chip ──────────────────────────────────────────────────────────── */
export function BxBench({ mon, hotkey, disabled = false, reserved = false, onClick }: {
  mon: BxMon; hotkey?: string | number; disabled?: boolean; reserved?: boolean; onClick?: () => void
}) {
  const t = useTranslations("battlesim")
  const pct = mon.fnt ? 0 : mon.hp
  return (
    <button type="button" disabled={disabled || mon.fnt} onClick={onClick}
      className={cn("cut-tag cut-tag-edge [--cut-tag:var(--cut,10px)] ", "flex w-full min-w-0 items-center gap-[9px] border border-solid border-line bg-panel px-[10px] py-[7px] text-left transition-[background,border-color]",
        "hover:border-accent-line hover:bg-panel-2 focus-visible:outline-none disabled:cursor-not-allowed",
        mon.fnt && "opacity-45 saturate-[0.2]", reserved && "border-accent-line bg-accent-soft")}>
      {hotkey != null && <BxKbd>{hotkey}</BxKbd>}
      <BxSprite mon={mon} size={34} />
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="flex items-center gap-[6px] font-display text-[12.5px] font-bold uppercase leading-none tracking-[0.03em]">
          {mon.name}<BxStatus status={mon.status} />
          {reserved && <i className="font-mono text-[8px] font-bold not-italic leading-none tracking-[0.1em] text-accent-bright">{t("bx.chosen")}</i>}
        </span>
        <span className="h-[5px] overflow-hidden border border-solid border-line bg-base"><i className="block h-full transition-[width]" style={{ width: pct + "%", background: hpTone(pct) }} /></span>
        <BxTypeRow types={mon.types} small />
      </span>
    </button>
  )
}

/* ── Tera button ─────────────────────────────────────────────────────────── */
export function BxTeraBtn({ type, armed = false, used = false, onToggle, hotkey }: {
  type: string; armed?: boolean; used?: boolean; onToggle?: () => void; hotkey?: string | number
}) {
  const t = useTranslations("battlesim")
  return (
    <button type="button" disabled={used} onClick={onToggle} style={{ ...tyc(tyColor(type)) }}
      title={used ? t("bx.teraUsedTitle") : t("bx.teraArmTitle")}
      className={cn("cut cut-edge-slant [--cut-line:var(--line-2)] [--cut:4px]", "inline-flex items-center gap-2 border border-solid border-line-2 bg-panel px-3 py-2 font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-[border-color,color,box-shadow]",
        "hover:border-[color-mix(in_srgb,var(--tyc)_60%,transparent)] hover:text-txt",
        armed && "border-[var(--tyc)] text-txt [box-shadow:0_0_12px_color-mix(in_srgb,var(--tyc)_35%,transparent),inset_0_0_12px_color-mix(in_srgb,var(--tyc)_12%,transparent)]",
        used && "cursor-not-allowed opacity-45")}>
      {hotkey != null && <BxKbd>{hotkey}</BxKbd>}
      <BxTera type={type} size="1.02em" />
      <span>{used ? t("bx.teraUsedLabel") : armed ? t("bx.teraArmedLabel", { type: tyLabel(type) }) : t("bx.teraLabel", { type: tyLabel(type) })}</span>
    </button>
  )
}

/* ── Turn ring ───────────────────────────────────────────────────────────── */
export function BxRing({ sec, max = 45, size = 50 }: { sec: number; max?: number; size?: number }) {
  const t = useTranslations("battlesim")
  const r = (size - 6) / 2, c = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, sec / max))
  const low = sec <= 10
  return (
    <span role="timer" aria-label={t("bx.timerAria", { sec })} className="relative inline-grid flex-none place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={low ? "var(--bad)" : "var(--accent)"} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }} />
      </svg>
      <b className={cn("font-mono text-[13px] font-bold leading-none", low && "animate-[bm-blink_1s_steps(2)_infinite] text-bad motion-reduce:animate-none")}>{sec}</b>
    </span>
  )
}

/* ── Log tick + region ───────────────────────────────────────────────────── */
export function BxTick({ ev }: { ev: BxTickEv }) {
  const t = useTranslations("battlesim")
  if (ev.turn != null) {
    return (
      <div className="flex items-center gap-[10px] pb-1 pt-[10px]">
        <span className="flex-none font-mono text-[11px] font-extrabold leading-none tracking-[0.14em] text-accent-bright">T{ev.turn}</span>
        <i className="h-px flex-1 bg-[linear-gradient(90deg,var(--accent-line),transparent)]" />
      </div>
    )
  }
  if (ev.kind === "sys") {
    return (
      <div className="border-l-2 border-solid border-line-2 py-[5px] pl-[10px] pr-2">
        <span className="font-body text-[12px] italic leading-[1.45] text-txt-dim" dangerouslySetInnerHTML={{ __html: ev.txt || "" }} />
      </div>
    )
  }
  const c = ev.type ? tyColor(ev.type) : ev.kind === "boost" ? "var(--ok)" : "var(--accent)"
  return (
    <div style={tyc(c)} className={cn("relative flex min-w-0 items-baseline gap-2 border-l-2 border-solid border-l-[var(--tyc)] bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] py-[5px] pl-[10px] pr-2",
      ev.who === "foe" && "border-l-[color-mix(in_srgb,var(--tyc)_70%,var(--bad))]", ev.crit && "bg-[color-mix(in_srgb,var(--warn)_8%,var(--panel))]")}>
      <span className="min-w-0 font-body text-[12px] leading-[1.45] text-txt-muted [&_b]:font-semibold [&_b]:text-txt" dangerouslySetInnerHTML={{ __html: ev.txt || "" }} />
      {(ev.dmg || ev.eff) && (
        <span className="ml-auto inline-flex flex-none gap-1">
          {ev.dmg && <b className="bg-bad-soft px-1 py-[3px] font-mono text-[10px] font-bold leading-none text-bad">{ev.dmg}</b>}
          {ev.eff === "super" && <b className="font-mono text-[8.5px] font-bold leading-[1.2] tracking-[0.06em] text-ok">{t("bx.effective")}</b>}
          {ev.eff === "weak" && <b className="font-mono text-[8.5px] font-semibold leading-[1.2] text-txt-dim">{t("bx.resisted")}</b>}
        </span>
      )}
    </div>
  )
}

export function BxLog({ log, className }: { log: BxTickEv[]; className?: string }) {
  const t = useTranslations("battlesim")
  const ref = React.useRef<HTMLDivElement>(null)
  const pinned = React.useRef(true)
  React.useEffect(() => {
    const el = ref.current
    if (el && pinned.current) el.scrollTop = el.scrollHeight
  }, [log.length])
  const onScroll = () => {
    const el = ref.current
    if (el) pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }
  return (
    <div ref={ref} role="log" aria-label={t("bx.logAria")} onScroll={onScroll}
      className={cn("grid content-start gap-[2px] overflow-y-auto pr-1", className)}>
      {log.map((ev, i) => <BxTick key={i} ev={ev} />)}
    </div>
  )
}

/* ── Scoreboard plate ────────────────────────────────────────────────────── */
export function BxScore({ name, handle, rating, av, team = [], right = false, tag }: {
  name: string; handle?: string; rating?: string | number; av: string; team?: BxTeamHP[]; right?: boolean; tag?: string
}) {
  const t = useTranslations("battlesim")
  return (
    <div className={cn("flex min-w-0 items-center gap-[10px]", right && "flex-row-reverse text-right")}>
      <span
        className={cn("cut-tag cut-tag-edge [--cut-tag:8px] ", "grid h-9 w-9 flex-none place-items-center border border-solid font-display text-[13px] font-extrabold leading-none tracking-[0.04em]",
          right ? "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad" : "border-accent-line bg-accent-soft text-accent-bright")}>{av}</span>
      <span className="grid min-w-0 gap-[2px]">
        <b className={cn("flex items-center gap-[6px] truncate font-display text-[14.5px] font-bold uppercase leading-none tracking-[0.04em]", right && "flex-row-reverse")}>
          {name}{tag && <i className="bg-accent px-[5px] py-[2px] font-mono text-[8px] font-bold not-italic uppercase leading-none tracking-[0.12em] text-accent-ink">{tag}</i>}
        </b>
        <small className="truncate font-mono text-[10px] font-medium leading-[1.2] tracking-[0.04em] text-txt-dim">{handle ? handle + " · " : ""}{rating}</small>
      </span>
      <span aria-label={t("bx.teamStatusAria")} className={cn("flex gap-1", right ? "ml-0 mr-1" : "ml-1")}>
        {team.map((m, i) => <i key={i} title={m.name} className={cn("h-2 w-2 [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]", m.fnt ? "bg-line-2" : (m.hp ?? 100) < 35 ? "bg-warn" : "bg-ok")} />)}
      </span>
    </div>
  )
}

/* ── Projected speed order rail ──────────────────────────────────────────── */
export function BxOrder({ slots }: { slots: OrderSlot[] }) {
  const t = useTranslations("battlesim")
  const order = speedOrder(slots)
  if (!order.length) return null
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-[10px] py-[7px]">
      <span className="inline-flex flex-none items-center gap-[5px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim">
        <Icon name="trending" size={12} />{t("bx.orderProjected")}
      </span>
      <span className="flex min-w-0 flex-wrap gap-[6px]">
        {order.map((s, i) => (
          <span key={s.side + s.idx}
            className={cn("cut cut-edge-slant [--cut:4px] ", "inline-flex items-center gap-[6px] border border-solid bg-panel py-[3px] pl-1 pr-2", s.side === "foe" ? "border-[color-mix(in_srgb,var(--bad)_30%,var(--line))]" : "border-line")}>
            <b className={cn("font-mono text-[9.5px] font-extrabold leading-none", s.side === "foe" ? "text-bad" : "text-accent-bright")}>{i + 1}</b>
            <BxSprite mon={s.mon} size={22} />
            <span className="whitespace-nowrap font-body text-[10.5px] font-semibold leading-none text-txt-muted">{s.mon.name}</span>
            <span className="font-mono text-[9.5px] font-semibold leading-none text-txt-dim">{s.spe}</span>
          </span>
        ))}
      </span>
      <span className="ml-auto flex-none font-mono text-[9.5px] leading-none text-txt-dim">{t("bx.priorityNote")}</span>
    </div>
  )
}

/* ── Field condition chip ────────────────────────────────────────────────── */
export function BxField({ icon = "sun", name, turns, tone }: { icon?: Parameters<typeof Icon>[0]["name"]; name: string; turns?: number; tone?: string }) {
  return (
    <span style={tone ? tyc(tone) : undefined}
      className="inline-flex items-center gap-[5px] border border-solid border-[color-mix(in_srgb,var(--tyc,var(--line-2))_45%,transparent)] bg-[color-mix(in_srgb,var(--tyc,var(--panel))_10%,transparent)] px-2 py-1 font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.06em] text-[var(--tyc,var(--txt-muted))]">
      <Icon name={icon} size={13} />{name}{turns != null && <b className="font-mono text-[9px] font-bold leading-none opacity-75">{turns}</b>}
    </span>
  )
}

/* ── Win-probability spark ───────────────────────────────────────────────── */
export function BxSpark({ data, w = 220, h = 40 }: { data: number[]; w?: number; h?: number }) {
  const pts = data.length > 1 ? data : [50, ...data]
  const step = w / (pts.length - 1)
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (v / 100) * h).toFixed(1)}`).join(" ")
  const last = pts[pts.length - 1]
  return (
    <span className="flex w-full min-w-0 items-center gap-2">
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="min-w-0 flex-1">
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="var(--line)" strokeDasharray="3 4" />
        <path d={`${path} L${w},${h} L0,${h} Z`} fill="var(--accent-soft)" stroke="none" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />
      </svg>
      <b className="flex-none font-mono text-[13px] font-bold leading-none" style={{ color: last >= 50 ? "var(--ok)" : "var(--bad)" }}>{last}%</b>
    </span>
  )
}

/* ── Keyboard hint chip ──────────────────────────────────────────────────── */
export function BxKbd({ children }: { children: React.ReactNode }) {
  return <kbd className="grid h-[18px] min-w-[18px] flex-none place-items-center border border-solid border-line-2 bg-base px-1 font-mono text-[10px] font-semibold not-italic leading-none text-txt-muted">{children}</kbd>
}
export function BxKbdHint({ k, label }: { k: React.ReactNode; label: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[5px] font-mono text-[9.5px] font-medium leading-none tracking-[0.04em] text-txt-dim">
      <BxKbd>{k}</BxKbd>{label}
    </span>
  )
}

/* ── Plan chip (queued order) ────────────────────────────────────────────── */
const SLOTTAG = "flex-none border border-solid border-accent-line bg-accent-soft px-[5px] py-[3px] font-mono text-[9px] font-bold not-italic leading-none tracking-[0.08em] text-accent-bright"
type BxPlanAction =
  | { kind: "move"; move: { name: string; type?: string }; target?: { spread?: string } | null; targetName?: string; tera?: boolean }
  | { kind: "switch"; toName: string }
  | null
export function BxPlan({ tag, action, onClear, hint }: { tag: string; action: BxPlanAction; onClear?: () => void; hint?: string }) {
  const t = useTranslations("battlesim")
  if (!action) {
    return (
      <div
        className="cut cut-edge-slant [--cut-line:var(--line-2)] [--cut:4px] inline-flex min-w-0 items-center gap-[7px] border border-dashed border-line-2 bg-panel px-[9px] py-[6px]">
        <b className={SLOTTAG}>{tag}</b>
        <span className="font-mono text-[10px] font-medium leading-none tracking-[0.04em] text-txt-dim">{hint || t("bx.noOrder")}</span>
      </div>
    )
  }
  const isMove = action.kind === "move"
  const tgt = !isMove ? null : action.target && action.target.spread ? (action.target.spread === "all" ? t("bx.targetAll") : t("bx.targetBoth")) : action.targetName || ""
  return (
    <div style={{ ...tyc(isMove ? tyColor(action.move.type) : "var(--accent)") }}
      className="cut cut-edge-slant [--cut:4px] inline-flex min-w-0 items-center gap-[7px] border border-solid border-[color-mix(in_srgb,var(--tyc)_45%,var(--line))] bg-panel px-[9px] py-[6px]">
      <b className={SLOTTAG}>{tag}</b>
      <span className="min-w-0 truncate font-body text-[11.5px] leading-[1.2] text-txt-muted [&_b]:font-semibold [&_b]:text-txt">
        {isMove ? (
          <>{action.tera && <i className="mr-1 border border-[color-mix(in_srgb,var(--accent)_50%,transparent)] px-[3px] py-px font-mono text-[7.5px] not-italic tracking-[0.08em] text-accent-bright">TERA</i>}<b>{action.move.name}</b>{tgt ? " → " + tgt : ""}</>
        ) : (
          <>{t("bx.switchTo", { name: action.toName })}</>
        )}
      </span>
      {onClear && (
        <button type="button" onClick={onClear} aria-label={t("bx.clearOrderAria")} className="grid flex-none place-items-center border-0 bg-transparent p-[2px] text-txt-dim hover:text-bad">
          <Icon name="x" size={12} />
        </button>
      )}
    </div>
  )
}

/* ── Team-builder slot ───────────────────────────────────────────────────── */
export type BxSlotMon = { name: string; types: string[]; item?: string }
export function BxSlot({ mon, order, selected = false, dim = false, onClick, aside }: {
  mon: (BxMon & { item?: string }) | BxSlotMon | null; order?: number; selected?: boolean; dim?: boolean; onClick?: () => void; aside?: React.ReactNode
}) {
  const t = useTranslations("battlesim")
  if (!mon) {
    return (
      <button type="button" onClick={onClick}
        className="cut-tag cut-tag-edge hover:[--cut-line:var(--accent-line)] [--cut-tag:var(--cut,10px)] flex min-h-[58px] w-full items-center justify-center gap-2 border border-dashed border-line bg-panel px-[10px] py-2 font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.08em] text-txt-dim transition-[border-color,color] hover:border-accent-line hover:text-txt focus-visible:outline-none">
        <Icon name="plus" size={16} /><span>{t("bx.add")}</span>
      </button>
    )
  }
  return (
    <button type="button" onClick={onClick}
      className={cn("cut-tag cut-tag-edge hover:[--cut-line:var(--accent-line)] [--cut-tag:var(--cut,10px)] ", "flex w-full min-w-0 items-center gap-[10px] border border-solid border-line bg-panel px-[10px] py-2 text-left transition-[border-color,background] hover:border-accent-line hover:bg-panel-2 focus-visible:outline-none",
        selected && "border-accent shadow-[0_0_0_1px_var(--accent-line)]", dim && "opacity-55")}>
      {order != null && <b className="flex-none font-mono text-[11px] font-extrabold leading-none text-accent-bright">{order}</b>}
      <BxSprite mon={mon as BxMon} size={40} />
      <span className="grid min-w-0 flex-1 gap-[3px]">
        <b className="truncate font-display text-[13px] font-bold uppercase leading-none tracking-[0.03em]">{mon.name}</b>
        <BxTypeRow types={mon.types} small />
        {mon.item && <small className="font-mono text-[9.5px] leading-[1.2] text-txt-dim">{mon.item}</small>}
      </span>
      {aside}
    </button>
  )
}
