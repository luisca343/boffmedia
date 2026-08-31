"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"
import { MEW, MEW_KIND_LABEL, MEW_TOKEN_ICON, mewFactionLabel, mewHueFor, mewHuman, mewIsRawKey, mewMonogram, mewParseText, mewRarityLabel, mewStatNameLabel, mewTokenLabelI18n, type MewRec } from "./mew-util"
import { mewArtSrc, mewTokenSrc, mewUiSrc, mewCursor, mewFurnitureArt } from "./mew-art"
import { select } from "./mew-store"

// Mewgenics «Papel y tinta» atoms: tokened text, art tile, rarity/faction/kind
// stickers, crayon stat bars, entity refs, the generic effect renderer and the
// taped paper panel. Prefix mew-. Hue arrives via inline --h.

function MewTok({ v }: { v: string }) {
  const t = useTranslations("mewgenics")
  const label = mewTokenLabelI18n(t, v)
  const src = mewTokenSrc(v)
  const ico = MEW_TOKEN_ICON[String(v || "").toLowerCase()]
  return (
    <span title={label} className="mx-px inline-flex items-center gap-1 align-baseline font-mono text-[10px]/[1.5] font-bold text-[color:inherit]">
      {src ? (
        <img src={src} alt="" width={12} height={12} className="flex-none object-contain" aria-hidden />
      ) : ico ? (
        <Icon name={ico} size={12} className="text-[color:var(--mwp-red)]" />
      ) : null}
      <span>{label}</span>
    </span>
  )
}

export function MewText({ children, muted, className }: { children?: React.ReactNode; muted?: boolean; className?: string }) {
  const raw = children == null ? "" : String(children)
  if (!raw || mewIsRawKey(raw)) return null
  return (
    <div className={cn("flex flex-col gap-[3px] text-[14px]/[1.52] font-medium [font-family:var(--mwf-hand)] min-[1600px]:text-[15.5px] max-w-[76ch]", muted && "text-[13px] text-[color:var(--mwp-ink-soft)] min-[1600px]:text-[14px]", className)}>
      {raw.split(/\n/).map((ln, li) => (
        <span className="block" key={li}>
          {mewParseText(ln).map((seg, i) => {
            if (seg.t === "img") return <MewTok key={i} v={seg.v} />
            if (seg.t === "ph") return <span key={i} className="font-mono font-bold text-[color:var(--mwp-red-deep)]">{seg.v}</span>
            return <span key={i}>{seg.v}</span>
          })}
        </span>
      ))}
    </div>
  )
}

export function MewTile({ cat, rec, size = 44, glyph, frame = "blob", art: artProp }: { cat: string; rec: MewRec; size?: number; glyph?: IconName; frame?: "blob" | "slot"; art?: string | null }) {
  const hue = mewHueFor(cat, rec)
  const ico = glyph || (MEW.catBy[cat] ? (MEW.catBy[cat].icon as IconName) : "info")
  const [err, setErr] = React.useState(false)

  // Resolve art: use prop if provided, otherwise auto-resolve via category-specific logic
  const art = React.useMemo(() => {
    if (err || artProp) return artProp || null
    // For sets, provide a resolver to get first member's item art
    const setMemberResolver = cat === "sets" && rec.id ? (setId: string): string | null => {
      const setData = select.set(setId)
      if (setData?.members && setData.members[0]) {
        const firstItem = select.get("items", setData.members[0].id)
        return firstItem ? mewArtSrc("items", firstItem) : null
      }
      return null
    } : undefined
    return mewArtSrc(cat, rec, setMemberResolver)
  }, [err, artProp, cat, rec])
  // The game frames inventory art in a square beveled slot; fall back to the
  // blob when the slot asset is unavailable (store not loaded, styleguide).
  const slotSrc = frame === "slot" ? mewUiSrc("slots", "InventoryGridBGBox") : null
  return (
    <span
      aria-hidden
      style={{ "--h": hue, width: size, height: size, ...(slotSrc ? { backgroundImage: `url(${slotSrc})`, backgroundSize: "100% 100%" } : {}) } as React.CSSProperties}
      className={cn(
        "relative grid flex-none place-items-center overflow-hidden border-2 border-solid border-[hsl(var(--h)_45%_27%)] text-[hsl(var(--h)_50%_28%)]",
        slotSrc
          ? "bg-[color:var(--mwp-paper-2)] [border-radius:10px_12px_11px_13px]"
          : "[background:radial-gradient(120%_120%_at_30%_18%,hsl(var(--h)_58%_88%),hsl(var(--h)_46%_74%))] [border-radius:48%_52%_45%_55%/55%_45%_52%_48%]",
      )}>
      {art ? (
        <img src={art} alt="" width={size} height={size} loading="lazy" onError={() => setErr(true)} className="block h-full w-full object-contain p-[9%] [filter:drop-shadow(0_2px_3px_var(--mwp-shadow-ink-drop))]" />
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

const STICKER = "inline-flex items-center gap-1.5 border-2 border-solid px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] [box-shadow:0_2px_0_var(--mwp-shadow-xs)]"

export function MewRarity({ rarity }: { rarity: string }) {
  const t = useTranslations("mewgenics")
  const m = MEW.rarity(rarity)
  const label = mewRarityLabel(t, rarity)
  return (
    <span data-rank={m.rank} style={{ "--h": m.hue } as React.CSSProperties} className={cn(STICKER, "border-[hsl(var(--h)_45%_26%)] bg-[hsl(var(--h)_52%_78%)] text-[hsl(var(--h)_60%_16%)]")}>
      <span className="h-2 w-2 bg-[hsl(var(--h)_55%_30%)] [border-radius:50%_40%_55%_45%]" />
      {label}
    </span>
  )
}

export function MewFaction({ faction }: { faction: string }) {
  const t = useTranslations("mewgenics")
  const m = MEW.faction(faction)
  const label = mewFactionLabel(t, faction)
  return (
    <span style={{ "--h": m.hue } as React.CSSProperties} className={cn(STICKER, "border-[hsl(var(--h)_45%_26%)] bg-[hsl(var(--h)_52%_78%)] text-[hsl(var(--h)_60%_16%)]")}>
      {label}
    </span>
  )
}

export function MewKind({ kind }: { kind: string }) {
  const t = useTranslations("mewgenics")
  const kindLabel = MEW_KIND_LABEL[kind] ? t(`data.kind.${kind}`) : mewHuman(kind)
  return (
    <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]">
      <Icon name="bookmark" size={11} className="text-[color:var(--mwp-ink-soft)]" />
      {kindLabel}
    </span>
  )
}

export function MewClass({ cls }: { cls: string }) {
  const classLabel = mewHuman(cls)
  const src = mewTokenSrc(cls)
  return (
    <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]">
      {src ? (
        <img src={src} alt="" width={10} height={10} className="flex-none object-contain" aria-hidden />
      ) : (
        <Icon name="star" size={10} className="text-[color:var(--mwp-ink-soft)]" />
      )}
      {classLabel}
    </span>
  )
}

export function MewStats({ stats, max = 10 }: { stats?: Record<string, number>; max?: number }) {
  const t = useTranslations("mewgenics")
  if (!stats) return null
  const base = MEW.meta.STATS.map((s) => ({ ...s, v: stats[s.key] }))
  if (stats.luck != null) base.push({ key: "luck", code: "lck", v: stats.luck })
  const rows = base.filter((s) => s.v != null)
  if (!rows.length) return null
  return (
    <div className="flex flex-col gap-2">
      {rows.map((s) => {
        const abbrKey = `stat.${s.code}`
        const statLabel = mewStatNameLabel(t, s.key)
        const abbr = t(abbrKey)
        const glyphSrc = mewTokenSrc(s.code)
        return (
          <div className="grid grid-cols-[38px_1fr_26px] items-center gap-[9px]" key={s.key} title={statLabel + ": " + s.v}>
            <span className="flex items-center justify-center gap-1 text-[11px]/none text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">
              {glyphSrc && <img src={glyphSrc} alt="" width={12} height={12} className="flex-none object-contain" aria-hidden />}
              <span>{abbr}</span>
            </span>
            <span className="h-[13px] overflow-hidden border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper-3)] [border-radius:8px_12px_9px_11px]">
              <i className={cn("block h-full [border-radius:0_6px_8px_0]", s.v > 5 ? "bg-[color:var(--mwp-good)]" : s.v < 5 ? "bg-[color:var(--mwp-warn)]" : "bg-[color:var(--mwp-red)]")} style={{ width: Math.max(4, Math.min(100, (s.v / max) * 100)) + "%" }} />
            </span>
            <span className="text-right font-mono text-[13px]/none font-bold text-[color:var(--mwp-ink)]">{s.v}</span>
          </div>
        )
      })}
    </div>
  )
}

export function MewRef({ id, label, icon, count }: { id: string; label?: string; icon?: IconName; count?: number }) {
  const t = useTranslations("mewgenics")
  const name = label || mewHuman(id)
  return (
    <span className="inline-flex items-center gap-[5px] border-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-[9px] pb-1 pt-[5px] text-[12px]/[1.15] font-semibold text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]" title={t("label.noRef")}>
      {icon && <Icon name={icon} size={12} className="flex-none text-[color:var(--mwp-ink-soft)]" />}
      <span className="min-w-0">{name}</span>
      {count != null && <span className="pl-[3px] font-mono text-[9px]/none font-bold text-[color:var(--mwp-ink-soft)]">{count}</span>}
    </span>
  )
}

export { MewEffects } from "./codex/MewRefs"

export function MewPanel({ title, icon, count, aside, children, className, span }: { title?: string; icon?: IconName; count?: number; aside?: React.ReactNode; children?: React.ReactNode; className?: string; span?: "wide" | "full" }) {
  const spanClass = span === "wide" ? "col-span-2 max-[640px]:col-span-1" : span === "full" ? "col-span-full" : ""
  const hasHeader = !!(title || icon || count != null)
  return (
    <section className={cn("relative border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [border-radius:var(--wob-b)] [box-shadow:0_5px_0_var(--mwp-shadow-lg)] mew-paper", spanClass, className)}>
      {hasHeader && (
        <div style={{ marginLeft: "var(--mwp-tab-shift)" } as React.CSSProperties} className="relative z-[1] -mt-3 mr-4 flex w-fit items-center gap-[9px] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-4 pb-[9px] pt-[13px] [border-radius:var(--wob-sm)_var(--wob-sm)_0_0] [box-shadow:0_-2px_0_var(--mwp-shadow-lg)] mew-paper">
          {icon && (
            <span className="grid place-items-center text-[color:var(--mwp-red)]">
              <Icon name={icon} size={14} />
            </span>
          )}
          {title && <h2 className="m-0 text-[14.5px]/none tracking-[0.05em] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] min-[1600px]:text-[16.5px]">{title}</h2>}
          {count != null && <span className="bg-[color:var(--mwp-red-deep)] px-[7px] py-[3px] font-mono text-[10.5px]/none font-bold text-[color:var(--mwp-paper)] [border-radius:10px_8px_11px_9px] [transform:rotate(2deg)]">{count}</span>}
          {aside && <span className="flex-1">{aside}</span>}
        </div>
      )}
      <div className={cn("relative px-4 pb-4 after:pointer-events-none after:absolute after:left-[8%] after:right-[8%] after:bottom-[3px] after:h-[2px] after:bg-[color:var(--mwp-accent)] after:opacity-70", hasHeader ? "pt-3" : "pt-[14px]")}>{children}</div>
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

export function MewMapBand({ src, alt, onOpenLightbox }: { src: string; alt: string; onOpenLightbox?: () => void }) {
  const t = useTranslations("mewgenics")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState(0)

  // Detect overflow and center if not overflowing
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let centered = false
    const checkOverflow = () => {
      const overflow = container.scrollWidth > container.clientWidth
      setIsOverflowing(overflow)
      // Start centered: the interesting part of a wide map is its middle, and
      // scrollLeft 0 often lands on empty backdrop. Only once, so a later
      // resize never yanks the view away from where the reader panned to.
      if (!centered && container.scrollWidth > 0) {
        centered = true
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2
      }
    }

    const img = container.querySelector('img') as HTMLImageElement | null
    if (img) {
      if (img.complete) {
        checkOverflow()
      } else {
        img.addEventListener('load', checkOverflow)
      }
    }

    window.addEventListener('resize', checkOverflow)
    const resizeObs = new ResizeObserver(checkOverflow)
    resizeObs.observe(container)

    return () => {
      window.removeEventListener('resize', checkOverflow)
      if (img) img.removeEventListener('load', checkOverflow)
      resizeObs.disconnect()
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isOverflowing) return
    setIsDragging(true)
    setDragStart(e.clientX - (containerRef.current?.scrollLeft ?? 0))
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    e.preventDefault()
    const x = e.clientX - dragStart
    containerRef.current.scrollLeft = x
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Grab cursor from mew-art
  const grabCursor = mewCursor("grab")
  const grabCursorStyle = grabCursor
    ? { cursor: `url('${grabCursor.src}') ${grabCursor.hotspot[0]} ${grabCursor.hotspot[1]}, grab` }
    : { cursor: "grab" }

  const grabCursorStyleActive = grabCursor
    ? { cursor: `url('${grabCursor.src}') ${grabCursor.hotspot[0]} ${grabCursor.hotspot[1]}, grabbing` }
    : { cursor: "grabbing" }

  return (
    // Sits in the content column, not 1/-1: the fiche hero spans 9 grid rows,
    // so a full-width child gets pushed below it and off the first screen.
    <div className="mb-3 [grid-column:2] max-[1240px]:[grid-column:auto]">
      <div className="relative w-full">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={isDragging ? grabCursorStyleActive : grabCursorStyle}
          className={cn(
            "overflow-x-auto [border-radius:var(--wob-a)] border-2 border-solid border-[color:var(--mwp-ink)] [box-shadow:0_6px_0_var(--mwp-shadow-lg)]",
            "h-[240px] sm:h-[300px] md:h-[360px] text-center",
            isDragging && "select-none"
          )}
        >
          {/* max-w-none is load-bearing: Tailwind preflight's `img{max-width:100%}`
              would clamp the width while h-full pins the height, stretching wide
              maps (Future is 5.2:1) and leaving nothing to pan. */}
          <img
            src={src}
            alt={alt}
            className="inline-block h-full w-auto max-w-none align-top [image-rendering:pixelated]"
            draggable={false}
          />
        </div>

        {/* Pan affordances - only show when overflowing */}
        {isOverflowing && (
          <>
            {/* Left/Right fades */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[color:var(--mwp-paper)] to-transparent opacity-40" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[color:var(--mwp-paper)] to-transparent opacity-40" />
            {/* Hint text at bottom */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 bg-[color:var(--mwp-paper)] border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] px-2 py-1 rounded text-[11px] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] [box-shadow:0_2px_0_var(--mwp-shadow-xs)]">
              {t("label.panHint")}
            </div>
          </>
        )}

        {/* Lightbox button */}
        {onOpenLightbox && (
          <button
            type="button"
            onClick={onOpenLightbox}
            className="absolute top-2 right-2 grid h-8 w-8 place-items-center border-[1.5px] border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] hover:bg-[color:var(--mwp-paper-2)] text-[color:var(--mwp-red)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 [border-radius:var(--wob-a)]"
            aria-label={t("label.viewFull")}
          >
            <Icon name="fullscreen" size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
