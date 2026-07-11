"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/boffmedia/primitives"
import { MEW, MEW_KIND_LABEL, MEW_TOKEN_ICON, mewHueFor, mewHuman, mewIsRawKey, mewMonogram, mewParseText, mewTokenLabel, type MewRec } from "./mew-util"
import { mewArtSrc } from "./mew-art"

// Mewgenics «Papel y tinta» atoms: tokened text, art tile, rarity/faction/kind
// stickers, crayon stat bars, entity refs, the generic effect renderer and the
// taped paper panel. Prefix mew-. Hue arrives via inline --h.

function MewTok({ v }: { v: string }) {
  const ico = MEW_TOKEN_ICON[String(v || "").toLowerCase()]
  return (
    <span title={mewTokenLabel(v)} className="mx-px inline-flex items-center gap-[3px] border-[1.5px] border-solid border-[color:var(--mwp-red)] bg-[color-mix(in_srgb,var(--mwp-red)_10%,transparent)] px-1.5 py-px align-baseline font-mono text-[10px]/[1.5] font-bold text-[color:var(--mwp-red-deep)] [border-radius:8px_11px_9px_12px]">
      {ico ? <Icon name={ico} size={12} className="text-[color:var(--mwp-red)]" /> : null}
      <span>{mewTokenLabel(v)}</span>
    </span>
  )
}

export function MewText({ children, muted, className }: { children?: React.ReactNode; muted?: boolean; className?: string }) {
  const raw = children == null ? "" : String(children)
  if (!raw || mewIsRawKey(raw)) return null
  return (
    <div className={cn("flex flex-col gap-[3px] text-[14px]/[1.52] font-medium [font-family:var(--mwf-hand)] min-[1600px]:text-[15.5px]", muted && "text-[13px] text-[color:var(--mwp-ink-soft)] min-[1600px]:text-[14px]", className)}>
      {raw.split(/\n/).map((ln, li) => (
        <span className="block" key={li}>
          {mewParseText(ln).map((seg, i) => {
            if (seg.t === "img") return <MewTok key={i} v={seg.v} />
            if (seg.t === "ph") return <span key={i} className="font-bold text-[color:var(--mwp-red-deep)] [font-family:var(--font-mono)]">{seg.v}</span>
            return <span key={i}>{seg.v}</span>
          })}
        </span>
      ))}
    </div>
  )
}

export function MewTile({ cat, rec, size = 44, glyph }: { cat: string; rec: MewRec; size?: number; glyph?: IconName }) {
  const hue = mewHueFor(cat, rec)
  const ico = glyph || (MEW.catBy[cat] ? (MEW.catBy[cat].icon as IconName) : "info")
  const [err, setErr] = React.useState(false)
  const art = err ? null : mewArtSrc(cat, rec)
  return (
    <span aria-hidden style={{ "--h": hue, width: size, height: size } as React.CSSProperties} className="relative grid flex-none place-items-center overflow-hidden border-2 border-solid border-[hsl(var(--h)_45%_27%)] text-[hsl(var(--h)_50%_28%)] [background:radial-gradient(120%_120%_at_30%_18%,hsl(var(--h)_58%_88%),hsl(var(--h)_46%_74%))] [border-radius:48%_52%_45%_55%/55%_45%_52%_48%]">
      {art ? (
        <img src={art} alt="" loading="lazy" onError={() => setErr(true)} className="block h-full w-full object-contain p-[9%] [filter:drop-shadow(0_2px_3px_rgba(51,37,61,0.35))]" />
      ) : (
        <>
          <span className="mt-[8%] text-[hsl(var(--h)_55%_22%)] [font-family:var(--mwf-disp)]" style={{ fontSize: Math.max(12, Math.min(24, Math.round(size * 0.44))) }}>
            {mewMonogram(rec.name, rec.id)}
          </span>
          <span className="absolute bottom-[5%] right-[8%] text-[hsl(var(--h)_45%_28%/0.55)]">
            <Icon name={ico} size={Math.round(size * 0.34)} />
          </span>
        </>
      )}
    </span>
  )
}

const STICKER = "inline-flex items-center gap-1.5 border-2 border-solid px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] [box-shadow:0_2px_0_rgba(0,0,0,0.28)]"

export function MewRarity({ rarity }: { rarity: string }) {
  const m = MEW.rarity(rarity)
  return (
    <span data-rank={m.rank} style={{ "--h": m.hue } as React.CSSProperties} className={cn(STICKER, "border-[hsl(var(--h)_45%_26%)] bg-[hsl(var(--h)_52%_78%)] text-[hsl(var(--h)_60%_16%)]")}>
      <span className="h-2 w-2 bg-[hsl(var(--h)_55%_30%)] [border-radius:50%_40%_55%_45%]" />
      {m.label}
    </span>
  )
}

export function MewFaction({ faction }: { faction: string }) {
  const m = MEW.faction(faction)
  return (
    <span style={{ "--h": m.hue } as React.CSSProperties} className={cn(STICKER, "border-[hsl(var(--h)_45%_26%)] bg-[hsl(var(--h)_52%_78%)] text-[hsl(var(--h)_60%_16%)]")}>
      {m.label}
    </span>
  )
}

export function MewKind({ kind }: { kind: string }) {
  return (
    <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]">
      <Icon name="bookmark" size={11} className="text-[color:var(--mwp-ink-soft)]" />
      {MEW_KIND_LABEL[kind] || mewHuman(kind)}
    </span>
  )
}

export function MewStats({ stats, max = 10 }: { stats?: Record<string, number>; max?: number }) {
  if (!stats) return null
  const base = MEW.meta.STATS.map((s) => ({ ...s, v: stats[s.key] }))
  if (stats.luck != null) base.push({ key: "luck", abbr: "SUE", label: "Suerte", v: stats.luck })
  const rows = base.filter((s) => s.v != null)
  if (!rows.length) return null
  return (
    <div className="flex flex-col gap-2">
      {rows.map((s) => (
        <div className="grid grid-cols-[38px_1fr_26px] items-center gap-[9px]" key={s.key} title={s.label + ": " + s.v}>
          <span className="text-[11px]/none text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">{s.abbr}</span>
          <span className="h-[13px] overflow-hidden border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper-3)] [border-radius:8px_12px_9px_11px]">
            <i className={cn("block h-full [border-radius:0_6px_8px_0]", s.v > 5 ? "bg-[color:var(--mwp-good)]" : s.v < 5 ? "bg-[color:var(--mwp-warn)]" : "bg-[color:var(--mwp-red)]")} style={{ width: Math.max(4, Math.min(100, (s.v / max) * 100)) + "%" }} />
          </span>
          <span className="text-right font-mono text-[13px]/none font-bold text-[color:var(--mwp-ink)]">{s.v}</span>
        </div>
      ))}
    </div>
  )
}

export function MewRef({ id, label, icon, count }: { id: string; cat?: string; label?: string; icon?: IconName; count?: number }) {
  const name = label || mewHuman(id)
  return (
    <span className="inline-flex items-center gap-[5px] border-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-[9px] pb-1 pt-[5px] text-[12px]/[1.15] font-semibold text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]" title="Sin ficha en la base de datos">
      {icon && <Icon name={icon} size={12} className="flex-none text-[color:var(--mwp-ink-soft)]" />}
      <span className="min-w-0">{name}</span>
      {count != null && <span className="pl-[3px] font-mono text-[9px]/none font-bold text-[color:var(--mwp-ink-soft)]">{count}</span>}
    </span>
  )
}

function MewEffectVal({ v }: { v: unknown }): React.ReactElement | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return <span className="font-bold text-[color:var(--mwp-red-deep)]">{(v > 0 ? "+" : "") + v}</span>
  if (typeof v === "string") return <span className="text-[color:var(--mwp-ink-soft)]">{mewHuman(v)}</span>
  if (Array.isArray(v))
    return (
      <span className="inline-flex flex-wrap gap-1">
        {v.map((x, i) => (
          <MewEffectVal key={i} v={x} />
        ))}
      </span>
    )
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {Object.entries(v as Record<string, unknown>).map(([k, val]) => (
        <span key={k} className="inline-flex items-center gap-1 border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-[7px] py-0.5 [border-radius:var(--wob-sm)]">
          <b className="font-semibold text-[color:var(--mwp-ink-soft)]">{mewHuman(k)}</b>
          <MewEffectVal v={val} />
        </span>
      ))}
    </span>
  )
}

export function MewEffects({ map, empty }: { map?: Record<string, unknown>; empty?: React.ReactNode }) {
  const entries = map ? Object.entries(map) : []
  if (!entries.length) return empty ? <div className="text-[12.5px]/[1.5] font-medium italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{empty}</div> : null
  return (
    <div className="flex flex-col">
      {entries.map(([k, v]) => (
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] py-2 last:border-b-0" key={k}>
          <span className="text-[13.5px]/[1.35] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)]">{mewHuman(k)}</span>
          <span className="flex flex-wrap items-center justify-end gap-1 font-mono text-[12px]/[1.3] font-semibold text-[color:var(--mwp-ink-soft)]">
            <MewEffectVal v={v} />
          </span>
        </div>
      ))}
    </div>
  )
}

export function MewPanel({ title, icon, count, aside, children, className }: { title?: string; icon?: IconName; count?: number; aside?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("relative border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [border-radius:var(--wob-b)] [box-shadow:0_5px_0_rgba(0,0,0,0.4)]", className)}>
      <span aria-hidden className="pointer-events-none absolute -top-2.5 left-1/2 -ml-[39px] h-5 w-[78px] border-l border-r border-dashed border-[rgba(255,255,255,0.35)] bg-[color:var(--mwp-tape)] [transform:rotate(-2deg)]" />
      {(title || aside) && (
        <header className="flex items-center gap-[9px] border-b-2 border-dashed border-[color:var(--mwp-ink-line)] px-4 pb-[9px] pt-[13px]">
          {icon && (
            <span className="-mt-0.5 grid place-items-center text-[color:var(--mwp-red)]">
              <Icon name={icon} size={14} />
            </span>
          )}
          {title && <h3 className="m-0 text-[14.5px]/none tracking-[0.05em] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] min-[1600px]:text-[16.5px]">{title}</h3>}
          {count != null && <span className="bg-[color:var(--mwp-red)] px-[7px] py-[3px] font-mono text-[10.5px]/none font-bold text-[color:var(--mwp-paper)] [border-radius:10px_8px_11px_9px] [transform:rotate(2deg)]">{count}</span>}
          <span className="flex-1" />
          {aside}
        </header>
      )}
      <div className="px-4 pb-4 pt-[14px]">{children}</div>
    </section>
  )
}

export function MewNote({ children, icon = "info" }: { children?: React.ReactNode; icon?: IconName }) {
  return (
    <div className="mt-3 flex items-start gap-2 border-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-3 py-[9px] text-[12.5px]/[1.5] font-medium italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]">
      <Icon name={icon} size={12} className="mt-px flex-none text-[color:var(--mwp-red)]" />
      {children}
    </div>
  )
}
