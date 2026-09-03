"use client"

import * as React from "react"
import { lockScrollport } from "../../scrollport"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { cn } from '@boffmedia/ui'
import { DataList, type DataListProps } from "@boffmedia/ui"
import { MewText, MewTile } from "../../MewAtoms"
import { MEW, type MewRec } from "../../mew-util"
import { mewArtSrc, mewUiSrc, mewFurnitureArt, mewTokenSrc, mewClassBg } from "../../mew-art"
import { select } from "../../mew-store"
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
const MEW_FACTS_CLS = "[&>div]:border-[color:var(--mwp-ink-line)] [&_dt]:text-[color:var(--mwp-ink-soft)] [&_dt_svg]:text-[color:var(--mwp-ink-soft)] [&_dd]:text-[color:var(--mwp-ink)]"
export function MewFacts({ rows: r, className }: DataListProps) {
  return <DataList rows={r} className={cn(MEW_FACTS_CLS, className)} />
}

/**
 * The two-column fiche grid: a sticky hero rail (column 1) beside the content
 * (column 2).
 *
 * INVARIANT — never give a direct child `grid-column: 1/-1`. MewHero is placed
 * explicitly at `grid-row: 1 / span 9`, so a full-width child cannot fit in
 * rows 1-9 and auto-placement drops it to row 10, pushing the content column
 * down with it. That is what produced the ~600px of dead space above the
 * character and furniture entries. Large art goes through MewHero's `media`
 * slot; wide panels use MewPanel's `span="full"`, which spans the *inner*
 * MewSections grid, not this one.
 */
export function MewDetail({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <>
      <div className="grid content-start gap-[18px_26px] pb-[5.25rem] pt-[1.625rem] [grid-template-columns:minmax(17.5rem,21.25rem)_minmax(0,1fr)] min-[1600px]:gap-[24px_34px] min-[1600px]:pt-9 min-[1600px]:[grid-template-columns:minmax(20rem,25rem)_minmax(0,1fr)] max-[1240px]:flex max-[1240px]:flex-col max-[1240px]:gap-4 max-[1240px]:pb-[4.25rem] max-[1240px]:pt-5">
        {children}
      </div>
      {id && <MewIdCopyLine id={id} />}
    </>
  )
}

// Map tileset ids to the game's own area artwork. The names do not follow one
// pattern (some are UI_Background_*, some are <Area>UI, some are neither) and
// the ids are lowercase, so this cannot be derived by string interpolation.
const MEW_AREA_ART: Record<string, string> = {
  alley: "UI_Background",
  boneyard: "UI_Background_Graves",
  bunker: "UI_Background_Bunker",
  caves: "UI_Background_Caves",
  core: "UI_Background2",
  crater: "UI_Background_Crater",
  desert: "DesertUI",
  future: "UI_Future",
  iceage: "UI_Background_Iceage",
  junkyard: "UI_Background_Junkyard",
  jurassic: "UI_Background_Dino",
  lab: "LabUI",
  meatworld: "UI_Meat",
  moon: "MoonUI",
  sewers: "UI_Background_Sewers",
  theend: "UI_End",
  theinfinite: "UI_Infinite",
  therift: "UI_Rift",
  tutorial: "UI_tutoral",
}

export function MewHero({ cat, rec, badges, title, sub, tip, backdrop, media }: { cat: string; rec: MewRec; badges?: React.ReactNode; title?: string; sub?: React.ReactNode; tip?: string; backdrop?: string | null; media?: React.ReactNode }) {
  const [showLightbox, setShowLightbox] = React.useState(false)
  const [artError, setArtError] = React.useState(false)
  const closeButtonRef = React.useRef<HTMLButtonElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const t = useToolT(MEWGENICS_NS)

  const hue = MEW.catBy[cat] ? MEW.catBy[cat].hue : 230
  const tape = "pointer-events-none absolute -top-[0.6875rem] h-[1.375rem] w-[4.75rem] border-l border-r border-dashed border-[color:var(--mwp-tape-light)] bg-[color:var(--mwp-tape)]"

  // Per-category art resolution for hero tiles
  const resolvedArt = React.useMemo(() => {
    if (artError) return null
    if (cat === "furniture" && rec.id) return mewFurnitureArt(rec.id)
    if (cat === "classes" && rec.id) {
      const src = mewTokenSrc(rec.id)
      return src || mewArtSrc(cat, rec)
    }
    if (cat === "sets" && rec.id) {
      const setData = select.set(rec.id)
      if (setData.members && setData.members[0]) {
        const firstItem = select.get("items", setData.members[0].id)
        return firstItem ? mewArtSrc("items", firstItem) : null
      }
    }
    if (cat === "statuses" && rec.id) {
      const kind = typeof rec.status_kind === "string" ? rec.status_kind : ""
      const kindMap: Record<string, string> = { weather: "weather", injuries: "health", elite_buffs: "elite" }
      const tokenKey = kindMap[kind]
      if (tokenKey) {
        const src = mewTokenSrc(tokenKey)
        if (src) return src
      }
    }
    return mewArtSrc(cat, rec)
  }, [cat, rec, artError])

  const artSrc = !artError ? resolvedArt : null
  const canOpenLightbox = !!artSrc

  const bgSrc = React.useMemo(() => {
    if (cat !== "maps" || typeof rec.tileset !== "string") return null
    const name = MEW_AREA_ART[rec.tileset]
    return name ? mewUiSrc("backgrounds", name) : null
  }, [cat, rec.tileset])

  const backdropSrc = backdrop ?? (cat === "classes" ? mewClassBg(rec.id) : null)

  const handleEscape = React.useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && showLightbox) {
      setShowLightbox(false)
      triggerRef.current?.focus()
    }
  }, [showLightbox])

  React.useEffect(() => {
    if (showLightbox) {
      // Locks whichever element is actually scrolling rather than the body.
      // On the web those are the same thing; in the launcher the tool sits in
      // the host's own scrollport, so freezing the body froze nothing and the
      // grid carried on moving behind the open lightbox.
      // Anchored on the trigger, which sits in the page content — the close
      // button is inside the overlay, and an overlay is exactly the thing that
      // must not be mistaken for the scroller.
      const unlock = lockScrollport(triggerRef.current)
      closeButtonRef.current?.focus()
      window.addEventListener("keydown", handleEscape)
      return () => {
        window.removeEventListener("keydown", handleEscape)
        unlock()
      }
    }
  }, [showLightbox, handleEscape])

  return (
    <>
      <header
        style={{
          "--h": hue,
          top: "var(--mew-hero-top)",
          ...(bgSrc || backdropSrc ? {
            // Paper scrim over the area/class art so ink text stays readable.
            backgroundImage: bgSrc
              ? `linear-gradient(color-mix(in srgb, var(--mwp-paper) 82%, transparent), color-mix(in srgb, var(--mwp-paper) 93%, transparent)), url(${bgSrc})`
              : backdropSrc
              ? `linear-gradient(color-mix(in srgb, var(--mwp-paper) 72%, transparent), color-mix(in srgb, var(--mwp-paper) 85%, transparent)), url(${backdropSrc})`
              : undefined,
            backgroundSize: "cover, cover",
            backgroundPosition: "center, center",
            // .mew-paper sets multiply for the grain; multiplying the area art
            // would keep its blacks pure black and cancel the scrim entirely.
            backgroundBlendMode: "normal, normal",
          } : {})
        } as React.CSSProperties}
        className="sticky z-[2] mt-1.5 flex flex-col items-center gap-[0.8125rem] self-start [grid-column:1] [grid-row:1/span_9] [border-radius:var(--wob-a)] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-5 pb-[1.375rem] pt-7 text-center text-[color:var(--mwp-ink)] [box-shadow:0_6px_0_var(--mwp-shadow-lg)] mew-paper max-[1240px]:static max-[1240px]:self-stretch"
      >
        {canOpenLightbox ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setShowLightbox(true)}
            className="cursor-pointer border-0 bg-transparent p-0 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 [border-radius:var(--wob-a)]"
            aria-label={t("common.openLightbox") || `View ${rec.name}`}
          >
            <MewTile cat={cat} rec={rec} size={112} frame="slot" art={artSrc} />
          </button>
        ) : (
          <MewTile cat={cat} rec={rec} size={112} frame="slot" art={artSrc} />
        )}
        <div className="flex min-w-0 flex-col items-center gap-[0.5625rem]">
          {badges && <div className="flex flex-wrap items-center justify-center gap-1.5">{badges}</div>}
          {/* Name plate: the game's tooltips put the name in its own outlined
              box on the paper, so the title gets a plate, not a ribbon. */}
          <div className="inline-block max-w-full border-2 border-solid border-[color:var(--mwp-ink)] bg-[color-mix(in_srgb,var(--mwp-paper)_42%,white)] px-4 pb-[0.5625rem] pt-[0.6875rem] [border-radius:var(--wob-sm)] [box-shadow:0_3px_0_var(--mwp-shadow-md)] [transform:rotate(-0.6deg)]">
            <h1 className="m-0 text-[clamp(1.375rem,1.8vw,2.375rem)]/[1.02] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [text-wrap:balance]">{title || rec.name}</h1>
          </div>
          {sub && <div className="font-mono text-[0.75rem]/[1.3] text-[color:var(--mwp-ink-soft)]">{sub}</div>}
          {tip ? (
            <div className="mt-0.5 border-t-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] pt-[0.6875rem] text-[color:var(--mwp-ink-soft)]">
              <MewText>{tip}</MewText>
            </div>
          ) : null}
        </div>
        {/* Large per-category art (portrait, furniture render, event subject).
            It lives INSIDE the hero, never as a `grid-column:1/-1` sibling —
            see MewDetail for why a full-width sibling opens a dead 9-row gap. */}
        {media ? (
          <div className="mt-1 flex w-full justify-center border-t-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] pt-[0.9375rem]">
            {media}
          </div>
        ) : null}
      </header>

      {/* Lightbox with focus trap */}
      {showLightbox && artSrc && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-[var(--mwp-scrim)] p-4 backdrop-blur-sm [animation:mew-fade-rise_200ms_ease-out] [animation-play-state:var(--motion-safe,running)]"
          onClick={() => setShowLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label={rec.name}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              const focusableElements = [closeButtonRef.current].filter(Boolean)
              if (focusableElements.length === 0) return
              const firstElement = focusableElements[0]
              const lastElement = focusableElements[focusableElements.length - 1]
              if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault()
                ;(lastElement as HTMLButtonElement).focus()
              } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault()
                ;(firstElement as HTMLButtonElement).focus()
              }
            }
          }}
        >
          <div
            className="flex flex-col items-center gap-3 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={artSrc}
              alt={rec.name}
              className="max-h-[70vh] max-w-[70vw] [image-rendering:pixelated] block object-contain"
              onError={() => setArtError(true)}
            />
            <div className="text-center">
              <div className="text-[clamp(1rem,2vw,1.75rem)] font-bold text-white [font-family:var(--mwf-disp)] [text-wrap:balance]">
                {rec.name}
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute top-2 right-2 grid h-8 w-8 place-items-center border-[1.5px] border-solid border-white/50 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-0"
              aria-label={t("common.closeLightbox") || "Close"}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/** Framed art block for the hero `media` slot — one frame for every category. */
export function MewHeroMedia({ src, alt, max = 240 }: { src: string; alt: string; max?: number }) {
  // The grid tiles and the lightbox both step aside when their art will not
  // load; this frame did not, so a missing image left a browser's broken-file
  // glyph inside a hand-drawn border. That is not a hypothetical: the art tree
  // is fetched over the network while the dataset is bundled, so "text is here,
  // pictures are not" is a state the codex genuinely runs in — offline, or
  // before the art has been published. Rendering nothing is the honest answer,
  // and the fiche simply has no hero rather than a broken one.
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [src])
  if (failed) return null
  return (
    <span className="inline-block max-w-full border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper-2)] p-1.5 [border-radius:var(--wob-sm)] [box-shadow:0_3px_0_var(--mwp-shadow-md)]">
      <img
        src={src}
        alt={alt}
        style={{ maxHeight: max }}
        onError={() => setFailed(true)}
        className="block h-auto w-auto max-w-full object-contain"
      />
    </span>
  )
}

/**
 * Compact numeric facts. MewFacts (DataList) pushes the label hard left and the
 * value hard right, which strands them at opposite ends of a wide panel; this
 * pairs each label with its own value in a cell and reflows into columns, so a
 * six-stat block reads as a block instead of a sparse ladder.
 */
export function MewFactGrid({ rows: r, min = 148 }: { rows: Row[]; min?: number }) {
  if (!r.length) return null
  return (
    <dl className="m-0 grid gap-x-3 gap-y-px" style={{ gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))` }}>
      {r.map((row, i) => (
        <div className="flex items-baseline justify-between gap-2 border-b-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] py-[0.4375rem]" key={i}>
          <dt className="min-w-0 truncate text-[0.65625rem]/[1.2] uppercase tracking-[0.06em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">{row.label}</dt>
          <dd className={cn("m-0 flex-none text-right", row.mono !== false ? "font-mono text-[0.8125rem]/[1.2] font-bold text-[color:var(--mwp-ink)]" : "text-[0.78125rem]/[1.2] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)]")}>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function MewDesc({ children }: { children?: string }) {
  if (!children || /^[A-Z_]+$/.test(children)) return null
  return <MewText className="mt-1 max-w-[76ch] text-[0.96875rem]/[1.55] [grid-column:2] max-[1240px]:[grid-column:auto]">{children}</MewText>
}
export function MewFlags({ children }: { children: React.ReactNode }) {
  return <div className="m-0 flex flex-wrap gap-2 [grid-column:2] max-[1240px]:[grid-column:auto]">{children}</div>
}
export function MewSections({ children }: { children: React.ReactNode }) {
  return <div className="mt-1.5 grid items-start gap-[20px_18px] [grid-column:2] [grid-template-columns:repeat(auto-fit,minmax(18.75rem,1fr))] max-[1240px]:mt-0 max-[1240px]:[grid-column:auto] [&>*]:data-[span=full]:[grid-column:1/-1] [&>*]:data-[span=half]:max-[900px]:[grid-column:1/-1]">{children}</div>
}

/** New layout primitives for T3 scaffold redesign (not yet in use by views) */
export function MewHeroBand({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-6 [grid-column:1/-1]">{children}</div>
}

export function MewMainColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>
}

export function MewAsideColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>
}

export function MewFicheSectionBar() {
  return <div className="mt-auto border-t border-dashed border-[color:var(--mwp-ink-line)] pt-3 text-[0.6875rem] font-mono text-[color:var(--mwp-ink-soft)] [grid-column:1/-1]" />
}

export function MewIdCopyLine({ id }: { id: string }) {
  const t = useToolT(MEWGENICS_NS)
  const [copied, setCopied] = React.useState(false)
  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [id])
  return (
    <div className="mt-3 border-t border-dashed border-[color:var(--mwp-ink-line)] pt-2 flex items-center gap-2">
      <span className="text-[0.6875rem] font-mono text-[color:var(--mwp-ink-soft)]">{t("label.id")}: <span className="text-[color:var(--mwp-red-deep)] font-bold">{id}</span></span>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-auto text-[0.625rem] px-2 py-1 border border-solid border-[color:var(--mwp-ink-line)] hover:border-[color:var(--mwp-ink)] rounded text-[color:var(--mwp-ink-soft)] hover:text-[color:var(--mwp-ink)] transition-colors"
        title={t("label.id")}
      >
        {copied ? t("common.copied") : t("common.copy")}
      </button>
    </div>
  )
}
export function MewSubLabel({ children, n }: { children: React.ReactNode; n?: number }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[0.6875rem]/none uppercase tracking-[0.09em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">
      {children}
      {n != null && <span className="border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-[0.3125rem] py-0.5 font-mono text-[0.59375rem]/none font-bold text-[color:var(--mwp-ink)] [border-radius:8px_10px_9px_11px]">{n}</span>}
    </div>
  )
}
export function MewTag({ children }: { children: React.ReactNode }) {
  return <span className="border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2 pb-1 pt-[0.3125rem] text-[0.71875rem]/none font-semibold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]">{children}</span>
}

export function MewMoreTag({ n }: { n: number }) {
  const t = useToolT(MEWGENICS_NS)
  return <span className="border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2 pb-1 pt-[0.3125rem] text-[0.65625rem]/none font-semibold text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]">{t("common.moreCount", { n })}</span>
}

export function mewTruncate<T>(items: T[], max: number): { list: T[]; more: number } {
  return { list: items.slice(0, max), more: Math.max(0, items.length - max) }
}
