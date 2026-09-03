"use client"

import * as React from "react"
import { Icon, type IconName } from "@boffmedia/ui"
import { MewHoverCard, MewRefLink } from "../MewPop"
import { MewRef as MewRefAtom } from "../MewAtoms"
import { select } from "../mew-store"
import { mewHuman, mewIsRawToken, type MewRec } from "../mew-util"

// Codex-scoped linking references: resolve an id via the store, render a paper
// pill that navigates inside the codex (onNav) and previews a hover card. Falls
// back to the non-linking atom when the id has no fiche.

export type NavFn = (cat: string, id: string) => void

export function MewRef({ id, cat, label, icon, onNav, count }: { id: string; cat?: string; label?: string; icon?: IconName; onNav?: NavFn; count?: number }) {
  const target = cat || select.catOf(id) || undefined
  let name = label || select.name(id)
  let rec: MewRec | null = target ? select.get(target, id) || (target === "characters" ? select.char(id) : null) : null
  if (mewIsRawToken(name)) name = mewHuman((rec && rec.id) || id)
  if (rec && mewIsRawToken(rec.name)) rec = { ...rec, name }
  const linkable = !!(target && rec && onNav)

  if (!linkable) return <MewRefAtom id={id} label={name} icon={icon} count={count} />

  const node = (
    <MewRefLink icon={icon} count={count} onClick={() => onNav!(target!, rec!.id)}>
      {name}
    </MewRefLink>
  )
  return (
    <MewHoverCard cat={target!} rec={rec!}>
      {node}
    </MewHoverCard>
  )
}

export function MewRefList({ ids = [], cat, icon, onNav, empty }: { ids?: (string | undefined | null)[]; cat?: string; icon?: IconName; onNav?: NavFn; empty?: React.ReactNode }) {
  const list = ids.filter(Boolean) as string[]
  if (!list.length) return empty ? <MewEmptyNote>{empty}</MewEmptyNote> : null
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((id, i) => (
        <MewRef key={id + i} id={id} cat={cat} icon={icon} onNav={onNav} />
      ))}
    </div>
  )
}

function MewEmptyNote({ children }: { children: React.ReactNode }) {
  return <div className="text-[0.78125rem]/[1.5] font-medium italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{children}</div>
}

function mewFmtNum(n: number) { return (n > 0 ? "+" : "") + n }

export function MewEffectVal({ v, onNav }: { v: unknown; onNav?: NavFn }): React.ReactElement | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return <span className="font-bold text-[color:var(--mwp-red-deep)]">{mewFmtNum(v)}</span>
  if (typeof v === "string") {
    const cat = select.catOf(v)
    if (cat) return <MewRef id={v} cat={cat} onNav={onNav} />
    return <span className="text-[color:var(--mwp-ink-soft)]">{mewHuman(v)}</span>
  }
  if (Array.isArray(v)) {
    return (
      <span className="inline-flex flex-wrap gap-1">
        {v.map((x, i) => (
          <MewEffectVal key={i} v={x} onNav={onNav} />
        ))}
      </span>
    )
  }
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {Object.entries(v as Record<string, unknown>).map(([k, val]) => (
        <span key={k} className="inline-flex items-center gap-1 border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-[0.4375rem] py-0.5 [border-radius:var(--wob-sm)]">
          <b className="font-semibold text-[color:var(--mwp-ink-soft)]">{mewSubKeyLabel(k)}</b>
          <MewEffectVal v={val} onNav={onNav} />
        </span>
      ))}
    </span>
  )
}

function mewSubKeyLabel(k: string): string {
  const eff = select.effect(k)
  return eff ? eff.rec.name : mewHuman(k)
}

export function MewEffects({ map, onNav, empty }: { map?: Record<string, unknown>; onNav?: NavFn; empty?: React.ReactNode }) {
  const entries = map ? Object.entries(map) : []
  if (!entries.length) return empty ? <MewEmptyNote>{empty}</MewEmptyNote> : null
  return (
    <div className="flex flex-col">
      {entries.map(([k, v]) => {
        const eff = select.effect(k)
        let keyNode: React.ReactNode
        if (eff && onNav) {
          const btn = (
            <button type="button" onClick={() => onNav(eff.kind, eff.rec.id)} className="cursor-pointer border-0 bg-transparent p-0 text-left text-[0.84375rem]/[1.35] font-bold text-[color:var(--mwp-red-deep)] underline decoration-wavy decoration-[color-mix(in_srgb,var(--mwp-red)_55%,transparent)] underline-offset-[3px] [font-family:var(--mwf-hand)] transition-all hover:decoration-[color:var(--mwp-red)] active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0">
              {eff.rec.name}
            </button>
          )
          keyNode = (
            <MewHoverCard cat={eff.kind} rec={eff.rec}>
              {btn}
            </MewHoverCard>
          )
        } else {
          keyNode = <span className="text-[0.84375rem]/[1.35] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)]">{mewHuman(k)}</span>
        }
        return (
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] py-2 last:border-b-0" key={k}>
            {keyNode}
            <span className="flex flex-wrap items-center justify-end gap-1 font-mono text-[0.75rem]/[1.3] font-semibold text-[color:var(--mwp-ink-soft)]">
              <MewEffectVal v={v} onNav={onNav} />
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function MewFlag({ icon, children, tone }: { icon?: IconName; children: React.ReactNode; tone?: "good" | "warn" | "bad" }) {
  const toneCls =
    tone === "good"
      ? "bg-[color:var(--mwp-paper-good)] [&_svg]:text-[color:var(--mwp-good)]"
      : tone === "warn"
        ? "bg-[color:var(--mwp-paper-warn)] [&_svg]:text-[color:var(--mwp-warn)]"
        : tone === "bad"
          ? "bg-[color:var(--mwp-paper-bad)] [&_svg]:text-[color:var(--mwp-bad)]"
          : "bg-[color:var(--mwp-paper-2)] [&_svg]:text-[color:var(--mwp-ink-soft)]"
  return (
    <span className={"inline-flex items-center gap-1.5 border-2 border-solid border-[color:var(--mwp-ink)] px-2.5 pb-1 pt-[0.3125rem] text-[0.71875rem]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] [box-shadow:0_2px_0_var(--mwp-shadow-sm)] " + toneCls}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}
