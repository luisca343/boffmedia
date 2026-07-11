"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/boffmedia/primitives"
import { MewFaction, MewKind, MewRarity, MewStats, MewText, MewTile } from "./MewAtoms"
import { MEW, MEW_KIND_LABEL, mewClip, mewHueFor, mewHuman, type MewRec } from "./mew-util"

// Mewgenics roster card (CxCard) + the hover popover card. Prefix cx- / mew-pop-.

export function CxCard({ cat, rec, active, onOpen, view }: { cat: string; rec: MewRec; active?: boolean; onOpen?: () => void; view?: "grid" | "list" }) {
  const meta =
    cat === "items" ? (
      <>
        {rec.kind && <MewKind kind={rec.kind} />}
        {rec.rarity && <MewRarity rarity={rec.rarity} />}
      </>
    ) : cat === "characters" ? (
      <>
        {rec.faction && <MewFaction faction={rec.faction} />}
        {rec.hp != null && (
          <span className="inline-flex items-center gap-[3px] font-mono text-[10px]/none font-bold text-[color:var(--mwp-bad)]">
            <Icon name="heart" size={11} />
            {rec.hp}
          </span>
        )}
      </>
    ) : null
  const base = "relative cursor-pointer border-2 border-solid bg-[color:var(--mwp-paper)] text-left text-[color:var(--mwp-ink)] transition-[transform,box-shadow,border-color] duration-[160ms]"
  return (
    <button
      type="button"
      onClick={onOpen}
      data-cxid={rec.id}
      style={{ "--h": mewHueFor(cat, rec) } as React.CSSProperties}
      className={cn(
        base,
        active ? "border-[hsl(var(--h)_70%_34%)] [box-shadow:inset_0_0_0_3px_hsl(var(--h)_62%_62%/0.65),0_4px_0_rgba(0,0,0,0.4)]" : "border-[color:var(--mwp-ink)] [box-shadow:0_3px_0_rgba(0,0,0,0.4)] hover:-translate-y-[3px] hover:[box-shadow:0_7px_0_rgba(0,0,0,0.4)]",
        view === "list" ? "grid grid-cols-[40px_1fr_auto] items-center gap-2.5 px-[11px] py-2 [border-radius:var(--wob-sm)]" : "flex flex-col gap-2 px-[11px] pb-2.5 pt-[11px] [border-radius:var(--wob-c)]",
      )}
    >
      <MewTile cat={cat} rec={rec} size={view === "list" ? 40 : 48} />
      <span className="flex min-w-0 flex-col gap-[5px]">
        <span className={cn("overflow-hidden text-[13.5px]/[1.15] font-bold [font-family:var(--mwf-hand)] min-[1600px]:text-[15px]", view === "list" ? "whitespace-nowrap text-ellipsis" : "[-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]")}>{rec.name}</span>
        {meta && <span className="flex max-w-full flex-wrap items-center gap-1">{meta}</span>}
      </span>
      {view === "list" && <Icon name="chevronRight" size={15} className="flex-none text-[color:var(--mwp-ink-soft)]" />}
    </button>
  )
}

function mewCatLabel(cat: string): string {
  if (cat === "sets") return "conjunto"
  const c = MEW.catBy[cat]
  return c ? c.singular || c.label : cat
}
function mewPopHue(cat: string, rec: MewRec): number {
  if (cat === "sets") return 40
  if (cat === "items" && rec.rarity) return MEW.rarity(rec.rarity).hue
  if (cat === "characters" && rec.faction) return MEW.faction(rec.faction).hue
  return MEW.catBy[cat] ? MEW.catBy[cat].hue : 230
}
function mewEffectNames(map?: Record<string, unknown>, max = 4): string | null {
  const keys = map ? Object.keys(map) : []
  if (!keys.length) return null
  return keys.slice(0, max).map((k) => mewHuman(k)).join(" · ") + (keys.length > max ? " +" + (keys.length - max) : "")
}

const FLAG_TONE: Record<string, string> = {
  warn: "text-[color:var(--mwp-warn)] border-[color-mix(in_srgb,var(--mwp-warn)_45%,transparent)] [&_svg]:text-[color:var(--mwp-warn)]",
  bad: "text-[color:var(--mwp-bad)] border-[color-mix(in_srgb,var(--mwp-bad)_45%,transparent)] [&_svg]:text-[color:var(--mwp-bad)]",
  good: "text-[color:var(--mwp-good)] border-[color-mix(in_srgb,var(--mwp-good)_45%,transparent)] [&_svg]:text-[color:var(--mwp-good)]",
  rar: "text-[hsl(var(--h)_45%_34%)] border-[color-mix(in_srgb,hsl(var(--h)_55%_50%)_55%,transparent)] [&_svg]:text-[hsl(var(--h)_55%_45%)]",
}
function PopFlag({ icon, tone, children }: { icon?: IconName; tone?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2 pb-0.5 pt-[3px] text-[11px]/[1.2] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:9px_11px_8px_12px] [&_svg]:text-[color:var(--mwp-ink-soft)]", tone && FLAG_TONE[tone])}>
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}

type FactRow = { label: string; value: React.ReactNode; mono?: boolean }
function PopFacts({ rows }: { rows: unknown[] }) {
  const list = rows.filter((r): r is FactRow => !!r && typeof r === "object")
  if (!list.length) return null
  return (
    <dl className="m-0 flex flex-col">
      {list.map((r, i) => (
        <div className="flex items-baseline justify-between gap-3 border-b-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] py-[5px] last:border-b-0" key={i}>
          <dt className="flex-none text-[10.5px]/[1.2] uppercase tracking-[0.06em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">{r.label}</dt>
          <dd className={cn("m-0 text-right", r.mono ? "font-mono text-[12px]/[1.3] font-bold text-[color:var(--mwp-red-deep)]" : "text-[12.5px]/[1.3] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)]")}>{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function MewPopBody({ cat, rec }: { cat: string; rec: MewRec }) {
  if (cat === "abilities") {
    const cost = rec.cost || {}
    const tgt = rec.target || {}
    const dmg = rec.dmg || {}
    const TM: Record<string, string> = { none: "Sin objetivo", self: "Sí mismo", single: "Un objetivo", tile: "Casilla", line: "Línea", cone: "Cono", all: "Todos", aoe: "Área" }
    const range = tgt.min_range != null || tgt.max_range != null ? (tgt.min_range === tgt.max_range ? String(tgt.max_range || 0) : (tgt.min_range || 0) + "–" + (tgt.max_range || 0)) : null
    const eff = mewEffectNames(dmg.effects)
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          {rec.cls && <PopFlag icon="star">{mewHuman(String(rec.cls).replace(/Ability$/, ""))}</PopFlag>}
          {cost.act_points != null && (
            <PopFlag icon="bolt" tone="warn">
              {cost.act_points} PA
            </PopFlag>
          )}
          {cost.move_points ? <PopFlag icon="compass">{cost.move_points} PM</PopFlag> : null}
        </div>
        {mewClip(rec.desc, 130) ? <MewText muted>{mewClip(rec.desc, 130)}</MewText> : null}
        <PopFacts rows={[tgt.target_mode && { label: "Objetivo", value: TM[tgt.target_mode] || mewHuman(tgt.target_mode) }, range && { label: "Alcance", value: range }, dmg.damage && { label: "Daño", value: dmg.damage, mono: true }, dmg.heal && { label: "Cura", value: dmg.heal, mono: true }, eff && { label: "Aplica", value: eff }]} />
      </>
    )
  }
  if (cat === "passives") {
    const base = mewEffectNames(rec.base)
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          {rec.cls ? <PopFlag icon="star">{mewHuman(rec.cls)}</PopFlag> : <PopFlag icon="shield">General</PopFlag>}
          {rec.ranks && rec.ranks.length > 0 && <PopFlag icon="layers">{rec.ranks.length} rangos</PopFlag>}
        </div>
        {mewClip(rec.desc, 150) ? <MewText muted>{mewClip(rec.desc, 150)}</MewText> : null}
        <PopFacts rows={[base && { label: "Efecto", value: base }, rec.shield != null && { label: "Escudo", value: rec.shield, mono: true }]} />
      </>
    )
  }
  if (cat === "keywords") {
    const tip = mewClip(rec.tip, 190)
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          <PopFlag icon="flame" tone="warn">
            Estado
          </PopFlag>
        </div>
        {tip ? <MewText muted>{tip}</MewText> : <div className="text-[12px]/[1.4] font-medium italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">Sin descripción en los datos.</div>}
      </>
    )
  }
  if (cat === "items") {
    const passN = rec.passives ? Object.keys(rec.passives).length : 0
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          <PopFlag icon="bookmark">{MEW_KIND_LABEL[rec.kind || ""] || mewHuman(rec.kind)}</PopFlag>
          {rec.rarity && (
            <PopFlag tone="rar" icon="star">
              {MEW.rarity(rec.rarity).label}
            </PopFlag>
          )}
        </div>
        {mewClip(rec.desc, 130) ? <MewText muted>{mewClip(rec.desc, 130)}</MewText> : null}
        <PopFacts rows={[rec.shield != null && { label: "Escudo", value: rec.shield, mono: true }, rec.durability != null && { label: "Durabilidad", value: rec.durability, mono: true }, passN > 0 && { label: "Pasivas", value: passN + " que otorga" }]} />
      </>
    )
  }
  if (cat === "characters") {
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          {rec.faction && <PopFlag icon="paw">{MEW.faction(rec.faction).label}</PopFlag>}
          {rec.type && (
            <PopFlag icon="star" tone="warn">
              {mewHuman(rec.type)}
            </PopFlag>
          )}
          {rec.hp != null && (
            <PopFlag icon="heart" tone="bad">
              {rec.hp} PV
            </PopFlag>
          )}
        </div>
        {rec.stats ? (
          <div className="mt-px">
            <MewStats stats={rec.stats} />
          </div>
        ) : null}
      </>
    )
  }
  if (cat === "sets") {
    const members = rec.members || []
    const kinds = [...new Set(members.map((m) => MEW_KIND_LABEL[m.kind] || mewHuman(m.kind)).filter(Boolean))]
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          <PopFlag icon="layers">Conjunto</PopFlag>
          <PopFlag icon="sword" tone="rar">
            {members.length} {members.length === 1 ? "pieza" : "piezas"}
          </PopFlag>
        </div>
        {members.length ? (
          <div className="flex flex-wrap gap-[5px]">
            {members.slice(0, 9).map((m) => (
              <span key={m.id} className="border-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2 pb-0.5 pt-[3px] text-[11px]/[1.2] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:8px_10px_9px_11px]">
                {m.name}
              </span>
            ))}
          </div>
        ) : null}
        {kinds.length ? <PopFacts rows={[{ label: "Ranuras", value: kinds.join(" · ") }]} /> : null}
      </>
    )
  }
  return mewClip(rec.desc || rec.tip, 160) ? <MewText muted>{mewClip(rec.desc || rec.tip, 160)}</MewText> : null
}

export function MewPopCard({ cat, rec }: { cat: string; rec: MewRec }) {
  const isSet = cat === "sets"
  return (
    <div style={{ "--h": mewPopHue(cat, rec) } as React.CSSProperties} className="relative border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [border-radius:var(--wob-c)] [box-shadow:0_5px_0_rgba(0,0,0,0.4)] [font-family:var(--mwf-hand)] [transform:rotate(-0.5deg)]">
      <span aria-hidden className="pointer-events-none absolute -top-[9px] left-[22px] h-[17px] w-[58px] border-l border-r border-dashed border-[rgba(255,255,255,0.4)] bg-[color-mix(in_srgb,hsl(var(--h)_60%_70%)_40%,var(--mwp-tape))] [transform:rotate(-4deg)]" />
      <header className="flex items-center gap-[11px] border-b-2 border-dashed border-[color:var(--mwp-ink-line)] px-[14px] pb-2.5 pt-3">
        <MewTile cat={cat} rec={rec} size={40} glyph={isSet ? "layers" : undefined} />
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-[10px]/none uppercase tracking-[0.1em] text-[hsl(var(--h)_45%_34%)] [font-family:var(--mwf-disp)]">{mewCatLabel(cat)}</span>
          <span className="truncate text-[16px]/none text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [text-shadow:1.5px_1.5px_0_color-mix(in_srgb,hsl(var(--h)_55%_55%)_40%,transparent)]">{rec.name}</span>
        </div>
      </header>
      <div className="flex flex-col gap-[9px] px-[14px] pb-3 pt-[11px]">
        <MewPopBody cat={cat} rec={rec} />
      </div>
      {isSet ? (
        <div className="flex items-center gap-[5px] border-t-2 border-dashed border-[color:var(--mwp-ink-line)] px-[14px] py-2 text-[10.5px]/none font-bold tracking-[0.02em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] [&_svg]:text-[color:var(--mwp-ink-soft)]">
          <Icon name="layers" size={11} />
          Conjunto de equipo
        </div>
      ) : (
        <div className="flex items-center gap-[5px] border-t-2 border-dashed border-[color:var(--mwp-ink-line)] bg-[color-mix(in_srgb,var(--mwp-red)_6%,transparent)] px-[14px] py-2 text-[10.5px]/none font-bold tracking-[0.02em] text-[color:var(--mwp-red-deep)] [font-family:var(--mwf-hand)] [&_svg]:text-[color:var(--mwp-red)]">
          <Icon name="arrow" size={11} />
          Clic para abrir la ficha
        </div>
      )}
    </div>
  )
}

export function MewHoverCard({ cat, rec, children }: { cat: string; rec: MewRec; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const showT = React.useRef(0)
  const hideT = React.useRef(0)
  const openFn = () => {
    clearTimeout(hideT.current)
    showT.current = window.setTimeout(() => setOpen(true), 90)
  }
  const closeFn = () => {
    clearTimeout(showT.current)
    hideT.current = window.setTimeout(() => setOpen(false), 110)
  }
  React.useEffect(
    () => () => {
      clearTimeout(showT.current)
      clearTimeout(hideT.current)
    },
    [],
  )
  return (
    <span className="relative inline-flex max-w-full" onMouseEnter={openFn} onMouseLeave={closeFn} onFocus={openFn} onBlur={closeFn}>
      {children}
      {open && (
        <div className="absolute left-1/2 top-[calc(100%_+_9px)] z-[120] w-[300px] max-w-[calc(100vw_-_20px)] -translate-x-1/2 [filter:drop-shadow(0_10px_14px_rgba(0,0,0,0.4))]" onMouseEnter={() => clearTimeout(hideT.current)} onMouseLeave={closeFn}>
          <MewPopCard cat={cat} rec={rec} />
        </div>
      )}
    </span>
  )
}

// The paper pill link used as a hover trigger (mew-ref--link).
export function MewRefLink({ icon, count, onClick, children }: { icon?: IconName; count?: number; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="group inline-flex cursor-pointer items-center gap-[5px] border-[1.5px] border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-[9px] pb-1 pt-[5px] text-[12px]/[1.15] font-semibold text-[color:var(--mwp-ink)] transition-[color,border-color,transform] duration-[130ms] [box-shadow:0_2px_0_rgba(0,0,0,0.22)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] hover:border-[color:var(--mwp-red-deep)] hover:text-[color:var(--mwp-red-deep)] hover:[transform:rotate(-1.2deg)_translateY(-1px)]">
      {icon && <Icon name={icon} size={12} className="flex-none text-[color:var(--mwp-ink-soft)] group-hover:text-[color:var(--mwp-red)]" />}
      <span className="min-w-0">{children}</span>
      {count != null && <span className="pl-[3px] font-mono text-[9px]/none font-bold text-[color:var(--mwp-ink-soft)]">{count}</span>}
    </button>
  )
}

// The set tag (mew-tag--set) — a help-cursor sticker used as a hover trigger.
export function MewSetTag({ children }: { children: React.ReactNode }) {
  return <span className="cursor-help border-[1.5px] border-solid border-[color-mix(in_srgb,hsl(40_55%_45%)_45%,var(--mwp-ink-line))] bg-[color:var(--mwp-paper-2)] px-2 pb-1 pt-[5px] text-[11.5px]/none font-semibold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]">{children}</span>
}
