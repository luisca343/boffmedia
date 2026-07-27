"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/boffmedia/primitives"
import type { TcgCard } from "@boffmedia/shared"
import {
  cssVars, typeColor, typeGlyph, normType, normStage, rarityMeta, isPokemon, pct, padNum, localCardArt,
} from "../_lib/tcgp-maps"

// ── Type pip ─────────────────────────────────────────────────────────────────
export function TcgTypePip({ type, size = 20, title }: { type: string; size?: number; title?: string }) {
  const c = typeColor(type)
  return (
    <span
      title={title}
      className="inline-grid place-items-center flex-none rounded-full font-bold leading-none"
      style={cssVars({
        width: size, height: size, fontSize: Math.round(size * 0.62),
        background: `color-mix(in srgb, ${c} 22%, var(--panel))`,
        color: c, border: `1px solid color-mix(in srgb, ${c} 55%, transparent)`,
      })}
    >
      {typeGlyph(type)}
    </span>
  )
}

// ── Rarity marks (◆ / ★ / ♛) ─────────────────────────────────────────────────
export function TcgRarityMarks({ rarity, size = 12 }: { rarity: string; size?: number }) {
  const r = rarityMeta(rarity)
  if (r.kind === "crown") {
    return (
      <span className="leading-none text-accent" style={{ fontSize: size + 2, filter: "drop-shadow(0 0 6px var(--accent-soft))" }}>
        ♛
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-[2px]" aria-label={r.raw}>
      {Array.from({ length: r.n }).map((_, i) =>
        r.kind === "star" ? (
          <i key={i} className="block bg-warn" style={{ width: size, height: size, clipPath: "polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }} />
        ) : (
          <i key={i} className="block rounded-[1px]" style={{ width: size, height: size, transform: "rotate(45deg)", background: "linear-gradient(135deg,#cfd8e6,#8f9bb0)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)" }} />
        ),
      )}
    </span>
  )
}

// ── Card art window ──────────────────────────────────────────────────────────
// The handoff draws a CSS «señal» window (type glyph + label). Where real card
// art is available we render it inside that same window, falling back to the
// glyph if every source fails — so the frame matches the handoff either way.
function TcgCardArt({ card, glyphLabel }: { card: TcgCard; glyphLabel: string }) {
  const sources = useMemo(() => {
    const list: string[] = []
    if (card.image) list.push(card.image.startsWith("http") && !/\.(png|jpg|jpeg|webp)$/i.test(card.image) ? `${card.image}/high.webp` : card.image)
    list.push(localCardArt(card.setId, card.id))
    return list
  }, [card.image, card.setId, card.id])
  const [idx, setIdx] = useState(0)
  useEffect(() => setIdx(0), [card.id])

  if (idx < sources.length) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sources[idx]}
        alt={card.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setIdx((i) => i + 1)}
      />
    )
  }
  // CSS signal fallback — glyph + type label, coloured by --tc.
  return (
    <>
      <span className="leading-none [font-size:clamp(30px,8vw,56px)]" style={{ color: "color-mix(in srgb, var(--tc) 62%, transparent)" }}>
        {typeGlyph(card.types?.[0])}
      </span>
      <span
        className="absolute inset-x-0 bottom-[5px] text-center font-mono text-[7px] font-semibold uppercase leading-none tracking-[0.16em]"
        style={{ color: "color-mix(in srgb, var(--tc) 78%, var(--text))" }}
      >
        {glyphLabel}
      </span>
    </>
  )
}

// ── Editor step button ───────────────────────────────────────────────────────
function StepBtn({ dir, disabled, onClick, label }: { dir: "minus" | "plus"; disabled?: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      type="button" aria-label={label} disabled={disabled} onClick={onClick}
      className="cut [--cut:4px] grid h-7 w-7 flex-none place-items-center border border-solid border-line-2 bg-panel-2 text-txt transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-30"
    >
      <Icon name={dir} size={15} />
    </button>
  )
}

// ── Card face ────────────────────────────────────────────────────────────────
export interface CardFaceProps {
  card: TcgCard
  count?: number
  editable?: boolean
  showAmounts?: boolean
  dim?: boolean
  onAdd?: (c: TcgCard) => void
  onRemove?: (c: TcgCard) => void
  onOpen?: (c: TcgCard) => void
}
export function TcgCardFace({ card, count = 0, editable, showAmounts = true, dim, onAdd, onRemove, onOpen }: CardFaceProps) {
  const t = useTranslations("tcgpocket")
  const tl = (key: string, fallback: string) => (t.has(key as never) ? t(key as never) : fallback)
  const r = rarityMeta(card.rarity)
  const missing = dim != null ? dim : count === 0
  const pk = isPokemon(card)
  const primary = card.types?.[0]
  const c = typeColor(primary)
  const isEx = /\bex$/i.test(card.name.trim())

  const rarityBorder =
    r.kind === "crown" ? "border-accent-line" :
    r.kind === "star" ? "border-warn/[0.45]" : "border-line-2"

  const catLabel = tl(`app.category.${(card.category || "").toLowerCase()}`, card.category || "")
  const stageLabel = tl(`app.stage.${normStage(card.stage)}`, tl("app.stage.basic", "Básica"))
  const typeLabel = primary ? tl(`types.${normType(primary)}`, catLabel).toUpperCase() : catLabel.toUpperCase()

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen ? () => onOpen(card) : undefined}
      onKeyDown={onOpen ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(card) } } : undefined}
      aria-label={`${card.name} — ${catLabel}`}
      className={cn(
        "group relative flex aspect-[2.5/3.5] flex-col overflow-hidden rounded-[9px] border border-solid shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_6px_16px_rgba(0,0,0,0.28)] transition-[transform,border-color,box-shadow]",
        rarityBorder,
        r.kind === "crown" && "bg-[linear-gradient(180deg,var(--accent-soft),var(--panel)_44%)]",
        onOpen && "cursor-pointer hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(0,0,0,0.42)] focus-visible:-translate-y-1 focus-visible:outline-none",
        missing && "opacity-[0.42] grayscale hover:opacity-[0.72]",
      )}
      style={cssVars({
        "--tc": c,
        "--tc-deep": `color-mix(in srgb, ${c} 50%, var(--bg-deep))`,
        ...(r.kind === "crown" ? {} : { background: `linear-gradient(180deg, color-mix(in srgb, ${c} 16%, var(--panel)), var(--panel) 46%)` }),
        ...(isEx ? { boxShadow: `0 0 0 1px color-mix(in srgb, ${c} 40%, transparent) inset, 0 6px 16px rgba(0,0,0,0.28)` } : {}),
      })}
    >
      {/* top row — stage/category · name · PS */}
      <div className="flex items-baseline gap-[6px] px-2 pb-1 pt-[7px]">
        <span className="flex-none font-mono text-[8px] font-semibold uppercase leading-none tracking-[0.08em] text-txt-dim">
          {pk ? stageLabel : catLabel}
        </span>
        <span className="flex-1 truncate font-display text-[12px] font-bold leading-none tracking-[0.01em] text-txt">{card.name}</span>
        {pk && card.hp != null && (
          <span className="inline-flex flex-none items-baseline gap-[2px] font-mono text-[12px] font-bold leading-none text-txt">
            <small className="text-[7px] text-txt-muted">PS</small>{card.hp}
          </span>
        )}
      </div>

      {/* art window — real art when present, glyph «señal» otherwise */}
      <div
        className="relative mx-[7px] grid flex-1 place-items-center overflow-hidden rounded-[5px] border border-solid"
        aria-hidden="true"
        style={{
          borderColor: `color-mix(in srgb, ${c} 30%, transparent)`,
          background: `repeating-linear-gradient(135deg, color-mix(in srgb, ${c} 14%, transparent) 0 6px, transparent 6px 12px), color-mix(in srgb, var(--tc-deep) 34%, var(--bg-deep))`,
        }}
      >
        <TcgCardArt card={card} glyphLabel={typeLabel} />
        {isEx && (
          <span className="absolute left-[6px] top-[5px] font-display text-[12px] font-extrabold italic leading-none text-accent [text-shadow:0_0_8px_var(--accent-soft)]">ex</span>
        )}
      </div>

      {/* foot — type pips · rarity · set·id */}
      <div className="flex items-center gap-[5px] px-2 pb-[7px] pt-[5px]">
        <span className="inline-flex gap-[3px]">
          {(card.types || []).map((ty) => <TcgTypePip key={ty} type={ty} size={16} />)}
        </span>
        <TcgRarityMarks rarity={card.rarity} size={9} />
        <span className="ml-auto font-mono text-[8px] font-semibold leading-none tracking-[0.04em] text-txt-dim">{card.setId}·{padNum(card.localId || card.id)}</span>
      </div>

      {/* count badge / add-lock */}
      {!editable && count > 0 && showAmounts && (
        <span className="absolute right-[11px] top-[32px] z-[3] rounded-full border border-solid border-line-2 bg-base-deep/80 px-[6px] py-[3px] font-mono text-[11px] font-bold leading-none text-txt backdrop-blur-sm">
          ×{count}
        </span>
      )}
      {missing && !editable && (
        <span className="absolute right-[11px] top-[30px] z-[3] grid h-6 w-6 place-items-center rounded-full border border-dashed border-line-2 bg-base-deep/70 text-txt-dim">
          <Icon name="plus" size={16} />
        </span>
      )}

      {/* editor */}
      {editable && (
        <div
          className="absolute inset-x-0 bottom-0 z-[4] flex items-center justify-between gap-[6px] bg-[linear-gradient(0deg,var(--bg-deep),color-mix(in_srgb,var(--bg-deep)_10%,transparent))] px-[9px] py-[7px]"
          onClick={(e) => e.stopPropagation()}
        >
          <StepBtn dir="minus" label="−1" disabled={count === 0} onClick={() => onRemove?.(card)} />
          <span className="font-mono text-[15px] font-bold text-txt">{count}</span>
          <StepBtn dir="plus" label="+1" onClick={() => onAdd?.(card)} />
        </div>
      )}
    </div>
  )
}

// ── Card grid ────────────────────────────────────────────────────────────────
export type Density = "compacta" | "comoda" | "espaciosa"
const DENSITY_MIN: Record<Density, number> = { compacta: 112, comoda: 150, espaciosa: 190 }
const DENSITY_GAP: Record<Density, number> = { compacta: 9, comoda: 14, espaciosa: 20 }

export interface CardGridProps {
  cards: TcgCard[]
  effective?: (id: string) => number
  editable?: boolean
  showAmounts?: boolean
  allColored?: boolean
  hideMissing?: boolean
  density?: Density
  onAdd?: (c: TcgCard) => void
  onRemove?: (c: TcgCard) => void
  onOpen?: (c: TcgCard) => void
}
export function TcgCardGrid({
  cards, effective, editable, showAmounts = true, allColored, hideMissing,
  density = "comoda", onAdd, onRemove, onOpen,
}: CardGridProps) {
  const items = hideMissing ? cards.filter((c) => (effective?.(c.id) || 0) > 0) : cards
  return (
    <div
      className="grid"
      style={{
        gap: DENSITY_GAP[density],
        gridTemplateColumns: `repeat(auto-fill, minmax(${DENSITY_MIN[density]}px, 1fr))`,
      }}
    >
      {items.map((c) => {
        const n = effective?.(c.id) || 0
        return (
          <TcgCardFace
            key={c.id} card={c} count={n} editable={editable} showAmounts={showAmounts}
            dim={allColored ? false : n === 0} onAdd={onAdd} onRemove={onRemove} onOpen={onOpen}
          />
        )
      })}
    </div>
  )
}

// ── Progress bar / set progress ──────────────────────────────────────────────
export function TcgBar({ pct: p, hue }: { pct: number; hue?: string }) {
  return (
    <div className="h-[7px] overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${p}%`, background: hue ? `linear-gradient(90deg, color-mix(in srgb, ${hue} 70%, var(--accent)), ${hue})` : "linear-gradient(90deg, var(--accent-bright), var(--accent))" }}
      />
    </div>
  )
}

export function TcgSetProgress({ label, sub, have, total }: { label: string; sub?: string; have: number; total: number }) {
  const p = total ? Math.round((have / total) * 100) : 0
  return (
    <div className="grid gap-[7px]">
      <div className="flex items-baseline gap-[10px]">
        <span className="font-display text-[14px] font-bold uppercase leading-none tracking-[0.02em] text-txt">{label}</span>
        {sub && <span className="font-mono text-[11px] leading-none text-txt-dim">{sub}</span>}
        <span className="flex-1" />
        <span className="font-mono text-[13px] leading-none text-txt-muted">{have}<span className="text-txt-dim">/{total}</span></span>
        <span className="min-w-[38px] text-right font-mono text-[13px] font-bold leading-none text-accent">{p}%</span>
      </div>
      <TcgBar pct={p} />
    </div>
  )
}

// ── Pack tile (real pack art with CSS booster fallback) ──────────────────────
function packArt(setId: string, name: string): string {
  return `/assets/img/games/tcgpocket/packs/${setId}/${name.toLowerCase()}.png`
}
export function TcgPackTile({ setId, name, meta, hue, onOpen }: { setId: string; name: string; meta?: string; hue?: string; onOpen?: () => void }) {
  const t = useTranslations("tcgpocket")
  const c = hue || typeColor("fire")
  const [failed, setFailed] = useState(false)
  return (
    <button
      type="button" onClick={onOpen} aria-label={t("app.sobres.tileAria", { name, setId })}
      className="group relative flex aspect-[3/4.2] flex-col overflow-hidden rounded-[10px] border border-solid shadow-[0_8px_22px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-[5px] hover:-rotate-[0.6deg] hover:shadow-[0_14px_32px_rgba(0,0,0,0.5)]"
      style={{
        borderColor: `color-mix(in srgb, ${c} 45%, var(--line-2))`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${c} 30%, var(--panel)), var(--bg-deep))`,
      }}
    >
      <span className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.14) 46%, transparent 60%)" }} />
      <span className="cut [--cut:3px] absolute left-[9px] top-[9px] z-[2] bg-white/90 px-[6px] py-[3px] font-display text-[12px] font-extrabold uppercase leading-none tracking-[0.04em] text-accent-ink">{setId}</span>
      <span className="relative z-0 grid flex-1 place-items-center">
        {failed ? (
          <>
            <span className="pointer-events-none absolute inset-x-0 top-[14%] h-[6px] opacity-50 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.5)_0_3px,transparent_3px_7px)]" aria-hidden="true" />
            <span className="text-[46px] text-white/85" style={{ textShadow: "0 0 16px rgba(255,255,255,0.4)" }}>◆</span>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={packArt(setId, name)} alt={name} loading="lazy" className="h-full w-full object-contain p-2" onError={() => setFailed(true)} />
        )}
      </span>
      <span className="relative z-[2] bg-gradient-to-t from-base-deep to-transparent px-[11px] pb-3 pt-[10px]">
        <b className="block truncate font-display text-[15px] font-bold uppercase leading-none tracking-[0.02em] text-white">{name}</b>
        {meta && <small className="font-mono text-[10px] font-medium leading-tight tracking-[0.05em] text-white/65">{meta}</small>}
      </span>
    </button>
  )
}

// ── Stat tile ────────────────────────────────────────────────────────────────
export function TcgStatTile({ icon, label, value, sub, hue }: { icon?: IconName; label: string; value: React.ReactNode; sub?: string; hue?: string }) {
  return (
    <div
      className="cut-corner [--cut-lg:10px] relative flex flex-col gap-[3px] border border-solid border-line bg-panel px-4 py-[15px]"
      style={{ borderLeft: `3px solid ${hue || "var(--accent)"}` }}
    >
      {icon && <span className="absolute right-[13px] top-[13px]" style={{ color: hue || "var(--accent)" }}><Icon name={icon} size={17} /></span>}
      <span className="font-display text-[30px] font-bold leading-none text-txt">{value}</span>
      <span className="font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-txt-muted">{label}</span>
      {sub && <span className="mt-[3px] text-[12px] leading-snug text-txt-dim">{sub}</span>}
    </div>
  )
}

// ── Progress ring ────────────────────────────────────────────────────────────
export function TcgRing({ pct: p, size = 132, stroke = 11, children }: { pct: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.min(100, Math.max(0, p)) / 100)
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">{children}</div>
    </div>
  )
}

// ── Odds table ───────────────────────────────────────────────────────────────
export interface OddsTableRow { pack: string; setCode?: string; perSlot: number[]; aggregate: number; best?: boolean }
export function TcgOddsTable({ rows, slotLabels, aggLabel, packLabel, bestLabel }: {
  rows: OddsTableRow[]; slotLabels: string[]; aggLabel: string; packLabel: string; bestLabel: string
}) {
  return (
    <div className="cut-corner [--cut-lg:10px] overflow-x-auto border border-solid border-line">
      <table className="w-full border-collapse [font-variant-numeric:tabular-nums]">
        <thead>
          <tr>
            <th className="border-b border-solid border-line bg-panel-2 px-[14px] py-[11px] text-left font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-muted">{packLabel}</th>
            {slotLabels.map((s) => (
              <th key={s} className="border-b border-solid border-line bg-panel-2 px-[14px] py-[11px] text-right font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-muted">{s}</th>
            ))}
            <th className="border-b border-solid border-line bg-panel-2 px-[14px] py-[11px] text-right font-mono text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-txt">{aggLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.pack} className={r.best ? "bg-accent-soft" : ""}>
              <td className="border-b border-solid border-line px-[14px] py-[11px] text-[13px] text-txt">
                <span className="flex items-center gap-2">
                  {r.pack}
                  {r.best && <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-accent"><Icon name="trophy" size={11} />{bestLabel}</span>}
                </span>
              </td>
              {r.perSlot.map((p, j) => (
                <td key={j} className="border-b border-solid border-line px-[14px] py-[11px] text-right font-mono text-[13px] text-txt-muted">{pct(p)}</td>
              ))}
              <td className={cn("border-b border-solid border-line px-[14px] py-[11px] text-right font-mono text-[13px] font-bold", r.best ? "text-accent" : "text-txt")}>{pct(r.aggregate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Card detail drawer ───────────────────────────────────────────────────────
export interface CardDrawerProps {
  card: TcgCard
  list?: TcgCard[]
  count: number
  editable?: boolean
  labels: Record<string, string>
  onAdd?: (c: TcgCard) => void
  onRemove?: (c: TcgCard) => void
  onNav?: (c: TcgCard) => void
  onClose: () => void
}
export function TcgCardDrawer({ card, list, count, editable, labels, onAdd, onRemove, onNav, onClose }: CardDrawerProps) {
  const idx = list ? list.findIndex((c) => c.id === card.id) : -1
  const step = (d: number) => { if (idx >= 0 && list && list[idx + d]) onNav?.(list[idx + d]) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowRight") step(1)
      else if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const pk = isPokemon(card)
  const r = rarityMeta(card.rarity)

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-scrim backdrop-blur-[3px]" onClick={onClose} />
      <aside
        role="dialog" aria-label={card.name}
        className="fixed inset-y-0 right-0 z-[201] flex w-[min(560px,94vw)] flex-col border-l border-solid border-line-2 bg-base shadow-2xl animate-[bm-drawer-in_.24s_cubic-bezier(0.2,0.7,0.3,1)] motion-reduce:animate-none"
      >
        <div className="flex items-center gap-3 border-b border-solid border-line px-[18px] py-[15px]">
          <span className="cut [--cut:3px] bg-accent px-[7px] py-1 font-display text-[12px] font-bold leading-none text-accent-ink">{card.setId}</span>
          <b className="font-display text-[18px] font-bold uppercase leading-none tracking-[0.03em] text-txt">{card.name}</b>
          <div className="ml-auto flex gap-1">
            <button type="button" aria-label={labels.prev} onClick={() => step(-1)} className="grid h-8 w-8 place-items-center rounded border border-solid border-line-2 text-txt-muted hover:text-txt"><Icon name="back" size={15} /></button>
            <button type="button" aria-label={labels.next} onClick={() => step(1)} className="grid h-8 w-8 place-items-center rounded border border-solid border-line-2 text-txt-muted hover:text-txt"><Icon name="arrow" size={15} /></button>
            <button type="button" aria-label={labels.close} onClick={onClose} className="grid h-8 w-8 place-items-center rounded border border-solid border-line-2 text-txt-muted hover:text-txt"><Icon name="x" size={15} /></button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 content-start gap-[22px] overflow-y-auto p-[18px] sm:grid-cols-[minmax(0,200px)_1fr]">
          <div className="sm:sticky sm:top-0">
            <TcgCardFace card={card} count={count} showAmounts={count > 0} dim={false} />
            <div className="mt-[14px] flex items-center gap-3 border border-solid border-line bg-panel px-[14px] py-3">
              {editable ? (
                <>
                  <StepBtn dir="minus" label="−1" disabled={count === 0} onClick={() => onRemove?.(card)} />
                  <b className="min-w-[34px] text-center font-mono text-[22px] font-bold text-txt">{count}</b>
                  <StepBtn dir="plus" label="+1" onClick={() => onAdd?.(card)} />
                  <span className="font-mono text-[11px] font-semibold uppercase leading-snug tracking-[0.06em] text-txt-muted">{labels.inCollection}</span>
                </>
              ) : (
                <span className={cn("font-mono text-[12px] font-semibold", count ? "text-ok" : "text-txt-dim")}>
                  {count ? `×${count} ${labels.owned}` : labels.notOwned}
                </span>
              )}
            </div>
          </div>

          <div className="grid content-start gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <TcgRarityMarks rarity={card.rarity} size={12} />
              <span className="font-mono text-[12px] text-txt-muted">{r.raw}</span>
            </div>
            <Spec2>
              <Spec k={labels.number} v={`${card.setId} · #${padNum(card.localId || card.id)}`} />
              <Spec k={labels.expansion} v={card.setName} />
            </Spec2>
            {pk && (
              <Spec2>
                {card.types?.[0] && <Spec k={labels.type} v={<><TcgTypePip type={card.types[0]} size={22} />{card.types.join(" · ")}</>} />}
                {card.hp != null && <Spec k={labels.hp} v={<span className="font-mono text-[18px] font-bold text-txt">{card.hp} PS</span>} />}
                {card.weaknesses?.[0] && <Spec k={labels.weakness} v={<><TcgTypePip type={card.weaknesses[0].type} size={22} />{card.weaknesses[0].type} <span className="font-mono text-txt-muted">{card.weaknesses[0].value}</span></>} />}
                {card.retreat != null && <Spec k={labels.retreat} v={card.retreat ? Array.from({ length: card.retreat }).map((_, i) => <TcgTypePip key={i} type="colorless" size={20} />) : "—"} />}
              </Spec2>
            )}
            {card.boosters && card.boosters.length > 0 && (
              <Spec k={labels.availableIn} v={<span className="flex flex-wrap gap-1">{card.boosters.map((b) => <span key={b.id} className="cut [--cut:3px] border border-solid border-line-2 px-2 py-1 font-mono text-[11px] text-txt-muted">{b.name}</span>)}</span>} />
            )}
            {card.illustrator && <Spec k={labels.illustrator} v={card.illustrator} />}
            {card.description && <p className="border-l-2 border-solid border-accent-line pl-3 text-[14px] italic leading-relaxed text-txt-muted">{card.description}</p>}
          </div>
        </div>
      </aside>
    </>
  )
}

function Spec({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid gap-[5px]">
      <span className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-muted">{k}</span>
      <span className="flex flex-wrap items-center gap-2 text-[15px] leading-snug text-txt">{v}</span>
    </div>
  )
}
function Spec2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>
}
