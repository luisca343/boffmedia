"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { MhRarity, MhSlotPips } from "@/app/(boffmedia)/(herramientas)/mhwilds/_components/ui/mh-kit"
import { MH_ELEMENTS, MH_RES_ORDER, MH_SKILL_CAT, type MhArmorPiece, type MhArmorProfile, type MhArmorSet, type MhSetBonusData, type MhSkill } from "./mh-db-util"

// Armor-DB atoms: skill chip, stat bar, set card (grid/list), set-bonus ladder and
// the armor piece row. Prefix mh- in mh-db.css. Prop-driven (mock data). [deferred]

export function MhSkillChip({ skill, level, dim }: { skill: MhSkill; level?: number; dim?: boolean }) {
  if (!skill) return null
  return (
    <span
      title={skill.description}
      style={{ "--sk": MH_SKILL_CAT[skill.category] } as React.CSSProperties}
      className={cn("inline-flex items-center gap-[5px] border border-solid border-[color-mix(in_srgb,var(--sk)_34%,transparent)] bg-[color-mix(in_srgb,var(--sk)_12%,transparent)] px-2 py-1 font-mono text-[11px]/none font-semibold tracking-[0.01em] text-txt", dim && "opacity-50")}
    >
      {skill.name}
      {level != null && <b className="font-bold text-[color:var(--sk)]">+{level}</b>}
    </span>
  )
}

export function MhStatBar({ label, value, max, color, suffix, tone }: { label: string; value: number; max: number; color?: string; suffix?: string; tone?: string }) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="grid grid-cols-[92px_1fr_auto] items-center gap-2.5">
      <span className="font-mono text-[11px]/none font-semibold uppercase tracking-[0.05em] text-txt-muted">{label}</span>
      <span className="relative h-2 overflow-hidden border border-solid border-line bg-panel-2">
        <i className="absolute inset-y-0 left-0 transition-[width] duration-[260ms]" style={{ width: pct + "%", background: color || "var(--mh-bright)" }} />
      </span>
      <b className="min-w-[40px] text-right font-display text-[14px]/none font-extrabold italic" style={tone ? { color: tone } : undefined}>
        {value}
        {suffix || ""}
      </b>
    </div>
  )
}

function topRes(profile: MhArmorProfile) {
  return MH_RES_ORDER.map((k) => ({ k, v: profile.resistances[k] || 0 }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
}

export function MhSetCard({ set, active, onOpen, view }: { set: MhArmorSet; active?: boolean; onOpen?: () => void; view?: "grid" | "list" }) {
  const p = set.profile
  const bonus = set.bonus || set.group
  const style = { "--sh": set.hue } as React.CSSProperties
  if (view === "list") {
    return (
      <button type="button" onClick={onOpen} style={style} className={cn("grid w-full grid-cols-[34px_1fr_auto] items-center gap-2.5 border border-solid border-line border-l-[3px] border-l-[hsl(var(--sh)_45%_55%)] bg-panel px-2.5 py-2 text-left transition-[border-color,background] duration-[140ms] hover:border-line-2 hover:bg-panel-2", active && "border-[color:var(--mh)] [box-shadow:inset_0_0_0_1px_var(--mh)]")}>
        <span className="grid h-[34px] w-[34px] place-items-center border border-solid border-line bg-[hsl(var(--sh)_40%_32%_/_0.28)] text-[hsl(var(--sh)_46%_74%)]">
          <Icon name="shield" size={17} />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[13px]/[1.1] font-bold uppercase not-italic tracking-[0.01em]">{set.name}</span>
          <span className="block truncate font-mono text-[10px]/[1.2] font-medium text-txt-dim">
            {p.pieces} pzs · DEF {p.defense.base}
            {bonus ? " · " + bonus.name : ""}
          </span>
        </span>
        <MhRarity rarity={set.rarity} />
      </button>
    )
  }
  return (
    <button type="button" onClick={onOpen} style={style} className={cn("flex flex-col overflow-hidden border border-solid border-line bg-panel text-left transition-[border-color,transform,box-shadow] duration-[140ms] [clip-path:polygon(0_0,calc(100%_-_10px)_0,100%_10px,100%_100%,0_100%)] hover:-translate-y-[2px] hover:border-line-2 hover:[box-shadow:0_12px_26px_-16px_#000]", active && "border-[color:var(--mh)] [box-shadow:0_0_0_1px_var(--mh)]")}>
      <span className="relative grid h-[76px] place-items-center overflow-hidden [background:radial-gradient(120%_90%_at_70%_15%,hsl(var(--sh)_48%_32%_/_0.5),transparent_60%),repeating-linear-gradient(135deg,var(--bg-2)_0_8px,var(--panel-2)_8px_16px)]">
        <Icon name="shield" size={40} className={cn("[filter:drop-shadow(0_3px_6px_rgba(0,0,0,0.4))]", active ? "text-[hsl(var(--sh)_56%_74%)]" : "text-[hsl(var(--sh)_42%_70%_/_0.6)]")} />
        <span className="absolute left-[7px] top-[7px]">
          <MhRarity rarity={set.rarity} />
        </span>
      </span>
      <span className="flex flex-col gap-[3px] px-[11px] pb-[11px] pt-[9px]">
        <span className="font-display text-[15px]/[1.05] font-bold uppercase not-italic tracking-[0.01em]">{set.name}</span>
        <span className="font-mono text-[10px]/none font-medium text-txt-muted">Serie · {set.series}</span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-[12px]/none font-bold text-[color:var(--info)]">
            <Icon name="shield" size={11} />
            {p.defense.base}
          </span>
          <span className="inline-flex gap-[3px]">
            {topRes(p).length ? (
              topRes(p).map((r) => <i key={r.k} title={MH_ELEMENTS[r.k]?.label} className="h-[9px] w-[9px] rounded-full [box-shadow:inset_0_0_0_1px_rgba(0,0,0,0.3)]" style={{ background: MH_ELEMENTS[r.k]?.color }} />)
            ) : (
              <span className="font-mono text-[9px]/none font-medium text-txt-dim">sin res.</span>
            )}
          </span>
        </span>
        {bonus && (
          <span className="mt-1.5 inline-flex items-center gap-[5px] font-mono text-[10px]/[1.2] font-semibold uppercase tracking-[0.04em] text-[hsl(var(--sh)_45%_74%)]">
            <Icon name="layers" size={10} />
            {bonus.name}
          </span>
        )}
      </span>
    </button>
  )
}

export function MhSetBonusDetail({ bonus, kind, activePieces }: { bonus: MhSetBonusData; kind?: "set" | "group"; activePieces?: number }) {
  const group = kind === "group"
  return (
    <div className={cn("border border-solid border-line border-l-[3px] bg-base-2", group ? "border-l-[color:var(--info)]" : "border-l-[color:var(--mh)]")}>
      <div className="flex items-baseline justify-between gap-2.5 border-b border-solid border-line px-3 py-[9px]">
        <span className="font-mono text-[9px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim">{group ? "Bonus de grupo" : "Bonus de conjunto"}</span>
        <span className="font-display text-[13px]/none font-bold uppercase not-italic tracking-[0.02em] text-txt">{bonus.name}</span>
      </div>
      <div className="flex flex-col">
        {bonus.ranks.map((r, i) => {
          const on = activePieces != null && activePieces >= r.pieces
          return (
            <div key={i} className={cn("grid grid-cols-[56px_1fr] items-baseline gap-2.5 px-3 py-2 [&+&]:border-t [&+&]:border-dashed [&+&]:border-line", on ? "opacity-100" : "opacity-50")}>
              <span className={cn("font-mono text-[11px]/none font-bold", group ? "text-[color:var(--info)]" : "text-[color:var(--mh-bright)]")}>{r.pieces} pzs</span>
              <span className="font-body text-[12px]/[1.2] font-semibold text-txt">
                {r.skillName}
                {r.level > 1 ? " " + r.level : ""}
              </span>
              {r.desc && <span className="col-start-2 font-mono text-[10px]/[1.4] font-medium text-txt-muted">{r.desc}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MhPieceRow({ piece }: { piece: MhArmorPiece }) {
  return (
    <div className="grid grid-cols-[96px_1fr_auto] items-center gap-3 border border-solid border-line bg-panel px-3 py-2.5 [&+&]:border-t-0">
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px]/none font-semibold uppercase tracking-[0.05em] text-txt-dim">
        <Icon name="shield" size={13} />
        {piece.kindLabel}
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="font-body text-[13px]/[1.2] font-semibold text-txt">{piece.name}</span>
        <span className="flex flex-wrap items-center gap-[5px]">
          {piece.skills.map((s) => (
            <MhSkillChip key={s.skill.id} skill={s.skill} level={s.level} />
          ))}
          {piece.slots && piece.slots.some((x) => x > 0) && <MhSlotPips slots={piece.slots} />}
        </span>
      </span>
      <span className="text-right">
        <b className="block font-display text-[17px]/none font-extrabold italic text-[color:var(--info)]">{piece.defense}</b>
        <span className="font-mono text-[9px]/none font-semibold uppercase tracking-[0.06em] text-txt-dim">DEF</span>
      </span>
    </div>
  )
}
