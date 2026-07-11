"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { DataList, type DataListProps } from "@/components/boffmedia/primitives"
import { MewText, MewTile } from "../../MewAtoms"
import { MEW, type MewRec } from "../../mew-util"
import type { NavFn } from "../MewRefs"

// Shared building blocks for the detail fiches. Each category view composes these
// so the per-category files stay focused on their own data shaping (SRP).

/** Every detail view receives the selected record + the codex navigator. */
export type ViewProps = { rec: MewRec; onNav: NavFn }

export type Row = { label: string; value: React.ReactNode; mono?: boolean }
/** Filter falsy conditional rows down to real `Row`s (for `cond && {…}` lists). */
export function rows(list: unknown[]): Row[] {
  return list.filter((r): r is Row => !!r && typeof r === "object")
}
export function num(rec: MewRec, k: string): number | null {
  const v = rec[k]
  return typeof v === "number" ? v : null
}

// DataList defaults to the v3 (light) palette; inside the cream paper panels its
// labels/values must be ink. Override its internals via child selectors.
const MEW_FACTS_CLS = "[&>div]:border-[color:var(--mwp-ink-line)] [&_dt]:text-[color:var(--mwp-ink-soft)] [&_dt_svg]:text-[color:var(--mwp-ink-soft)] [&_dd]:text-[color:var(--mwp-ink)] min-[1600px]:[&_dd]:text-[14.5px] min-[1600px]:[&_dt]:text-[10.5px]"
export function MewFacts({ rows: r, className }: DataListProps) {
  return <DataList rows={r} className={cn(MEW_FACTS_CLS, className)} />
}

export function MewDetail({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid max-w-[min(100%,1980px)] content-start gap-[18px_26px] px-[clamp(18px,2.4vw,44px)] pb-[84px] pt-[26px] [grid-template-columns:minmax(280px,340px)_minmax(0,1fr)] min-[1600px]:gap-[24px_34px] min-[1600px]:pt-9 min-[1600px]:[grid-template-columns:minmax(320px,400px)_minmax(0,1fr)] max-[1240px]:flex max-[1240px]:flex-col max-[1240px]:gap-4 max-[1240px]:px-4 max-[1240px]:pb-[68px] max-[1240px]:pt-5">
      {children}
    </div>
  )
}

export function MewHero({ cat, rec, badges, title, sub, tip }: { cat: string; rec: MewRec; badges?: React.ReactNode; title?: string; sub?: React.ReactNode; tip?: string }) {
  const hue = MEW.catBy[cat] ? MEW.catBy[cat].hue : 230
  const tape = "pointer-events-none absolute -top-[11px] h-[22px] w-[76px] border-l border-r border-dashed border-[rgba(255,255,255,0.35)] bg-[color:var(--mwp-tape)]"
  return (
    <header style={{ "--h": hue } as React.CSSProperties} className="sticky top-3.5 z-[2] mt-1.5 flex flex-col items-center gap-[13px] self-start [grid-column:1] [grid-row:1/span_9] [border-radius:var(--wob-a)] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-5 pb-[22px] pt-7 text-center text-[color:var(--mwp-ink)] [box-shadow:0_6px_0_rgba(0,0,0,0.4)] [transform:rotate(-0.5deg)] max-[1240px]:static max-[1240px]:self-stretch">
      <span aria-hidden className={tape + " left-7 [transform:rotate(-5deg)]"} />
      <span aria-hidden className={tape + " right-8 [transform:rotate(4deg)]"} />
      <MewTile cat={cat} rec={rec} size={112} />
      <div className="flex min-w-0 flex-col items-center gap-[9px]">
        {badges && <div className="flex flex-wrap items-center justify-center gap-1.5">{badges}</div>}
        <div className="m-0 text-[clamp(24px,2vw,42px)]/[0.98] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [text-wrap:balance]">{title || rec.name}</div>
        {sub && <div className="font-mono text-[12px]/[1.3] text-[color:var(--mwp-ink-soft)]">{sub}</div>}
        {tip ? (
          <div className="mt-0.5 border-t-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] pt-[11px] text-[color:var(--mwp-ink-soft)]">
            <MewText>{tip}</MewText>
          </div>
        ) : null}
      </div>
    </header>
  )
}

export function MewDesc({ children }: { children?: string }) {
  if (!children || /^[A-Z_]+$/.test(children)) return null
  return <MewText className="mt-1 max-w-[76ch] text-[15.5px]/[1.55] min-[1600px]:text-[17px] [grid-column:2] max-[1240px]:[grid-column:auto]">{children}</MewText>
}
export function MewFlags({ children }: { children: React.ReactNode }) {
  return <div className="m-0 flex flex-wrap gap-2 [grid-column:2] max-[1240px]:[grid-column:auto]">{children}</div>
}
export function MewGrid2({ children }: { children: React.ReactNode }) {
  return <div className="mt-1.5 grid items-start gap-[20px_18px] [grid-column:2] [grid-template-columns:minmax(0,1.35fr)_minmax(0,1fr)] max-[1240px]:mt-0 max-[1240px]:grid-cols-1 max-[1240px]:[grid-column:auto]">{children}</div>
}
export function MewCol({ children, single }: { children: React.ReactNode; single?: boolean }) {
  return <div className={"flex min-w-0 flex-col gap-5" + (single ? " mt-1.5 [grid-column:2] max-[1240px]:mt-0 max-[1240px]:[grid-column:auto]" : "")}>{children}</div>
}
export function MewSubLabel({ children, n }: { children: React.ReactNode; n?: number }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[11px]/none uppercase tracking-[0.09em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">
      {children}
      {n != null && <span className="border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-[5px] py-0.5 font-mono text-[9.5px]/none font-bold text-[color:var(--mwp-ink)] [border-radius:8px_10px_9px_11px]">{n}</span>}
    </div>
  )
}
export function MewTag({ children }: { children: React.ReactNode }) {
  return <span className="border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2 pb-1 pt-[5px] text-[11.5px]/none font-semibold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]">{children}</span>
}
