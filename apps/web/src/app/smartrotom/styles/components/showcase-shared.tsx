import * as React from "react"
import { cn } from "@/lib/utils"

// Shared class fragments + specimen wrappers for the SmartRotom showcase.
// Mirrors the Boffmedia showcase's `showcase-shared.tsx`.
//
// The one structural difference: SmartRotom is MANY design systems, not one —
// count the namespaces in `tailwind.config.ts`, never trust a number written
// down. A primitive only resolves its tokens inside its own scope root, so every
// specimen renders inside `<Scope>` — see below.

export const MONO_LABEL = "font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-sr-txt-muted"

// The showcase's own chrome speaks the `sr-*` chrome vocabulary — the frame around
// the apps, never an app's palette. Specimens inside `<Scope>` speak their own.
export const DISPLAY = "font-display font-extrabold italic uppercase leading-[0.92] tracking-[-0.005em]"
export const DISPLAY_EM = "[&_em]:italic [&_em]:text-transparent [&_em]:[-webkit-text-stroke:1.6px_var(--sr-accent)]"
export const HEAD4 = "font-display font-bold uppercase tracking-[0.02em] leading-[1.05]"

export const GRP_KEY = "sr-sc-chapter"
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
export const sideLink =
  "block font-mono text-[0.75rem] font-semibold leading-none uppercase tracking-[0.1em] no-underline py-[0.625rem] px-[0.875rem] border-l-[3px] border-solid transition-[color,border-color,background] duration-[140ms] cursor-pointer"

// ── scope roots ─────────────────────────────────────────────────────────────
// Each app's tokens only resolve inside its scope root, so a specimen rendered
// bare would show unresolved CSS vars. `Scope` reproduces the real root from each
// app's layout — the same classes, so a primitive looks here exactly as it does in
// the app. `sr` is deliberately a no-op: the chrome has no scope root, it's global.
export type AppKey =
  | "sr" | "sb" | "ca" | "nt" | "pk" | "mw" | "tx" | "ms" | "ar" | "ft" | "pc" | "gt" | "rk" | "wp" | "ps"

// The scope CLASS is what makes an app's tokens resolve: `ca`/`nt`/`mw` are CSS-var
// backed and their vars are declared on `.ca-app`/`.nt-app`/`.mw-app` base layers, so
// without the class every `bg-ca-*` reads an undefined var. (`sb`/`pk` are baked hex
// and would resolve anywhere, but they carry the class for consistency.)
const SCOPE_VARS: Record<AppKey, string> = {
  sr: "",
  sb: "sb-app",
  ca: "ca-app",
  nt: "nt-app",
  pk: "pk-app",
  mw: "mw-app",
  tx: "tx-app",
  ms: "ms-app",
  ar: "ar-app",
  ft: "ft-app",
  pc: "pc-app",
  gt: "gt-app",
  rk: "rk-app",
  wp: "wp-app",
  ps: "ps-app",
}

// The SKIN is the app's canvas + fonts + ink, lifted from its real layout root. Kept
// separate from the vars so a specimen can resolve an app's tokens *without* painting
// its canvas — see `canvas={false}` on Sample.
const SCOPE_SKIN: Record<AppKey, string> = {
  sr: "",
  sb: "bg-sb-bg font-sb text-sb-fg [font-feature-settings:'cv11','ss01','ss03']",
  ca: "bg-ca-panel font-ca text-ca-50 antialiased",
  nt: "bg-nt-bg font-nt text-nt-fg",
  pk: "bg-pk-surface-950 font-pk text-pk-surface-100 antialiased [font-feature-settings:'ss01','cv11']",
  mw: "bg-mw-bg font-mw text-mw-fg",
  tx: "bg-tx-bg bg-[image:var(--tx-app-bg)] font-tx text-tx-txt antialiased",
  // Misiones' canvas is the tavern board itself — cork, wood and lamplight.
  ms: "ms-tavern font-ms text-ms-ink-1 antialiased",
  // The Arcade's canvas is the synthwave void: two neon blooms over a violet gradient.
  ar: "ar-canvas font-ar text-ar-ink antialiased",
  // Furret Today's canvas is the paper itself — the `.ft-app` base layer already
  // paints the cream newsprint gradient, so the skin only adds the type and ink.
  ft: "font-ft text-ft-ink antialiased",
  // The PC's canvas is the slate void the glass panels float on.
  pc: "pc-canvas font-pc text-pc-fg antialiased",
  // The Gobierno's canvas is warm paper: `gt-paper` lays the grain and the engraved
  // guilloché over it, the way an official document is printed on stock, not on white.
  gt: "gt-paper bg-gt-paper-bg font-gt text-gt-ink-800 antialiased",
  // Rooker's canvas is the timeline itself. With no `data-theme` it paints Tenue, the
  // default of its three.
  rk: "bg-rk-bg font-rk text-rk-fg antialiased",
  // Wigglypop's canvas is the pink-cream page: the `.wp-app` base layer already
  // paints the two corner glows over the wash, so the skin only adds type and ink.
  // Note the 600 weight — Nunito at 400 looks anaemic here, so the app rests semibold.
  wp: "font-wp text-wp-fg antialiased",
  // Pasaporte's canvas is the DESK — the walnut counter the book lies on. The `.ps-app`
  // base layer already paints the lamp pool and the plank seams, so the skin only adds
  // type and chrome ink. The app's OTHER material, the cream page, is not a canvas: it is
  // a surface INSIDE this one, and a paper specimen must be laid on a `<Leaf>` (below).
  ps: "font-ps text-ps-chrome-fg antialiased",
}

export function Scope({
  app,
  theme,
  media,
  ornament,
  motion,
  skin = true,
  className,
  children,
}: {
  app: AppKey
  /**
   * ca / nt / tx — the real light/dark token swap. Rooker takes the same attribute but
   * has THREE canvases (`light` | `dim` | `lightsout`), because the reader picks which
   * dark; omit it there to get Tenue, its default.
   */
  theme?: "light" | "dark" | "dim" | "lightsout"
  /** mw only — picks the accent (Mewtube pink / Mewtwitch purple). */
  media?: "mewtube" | "mewtwitch"
  /**
   * ps only — the passport's DOCUMENT properties, not themes. `ornament` scales the
   * guilloché, the paper grain and the gold tooling together; `motion` parks the looping
   * ambience. Pasaporte is fixed-canvas and takes no `data-theme` at all.
   */
  ornament?: "minimal" | "tasteful" | "maximal"
  motion?: "on" | "off"
  /** Paint the app's canvas/fonts/ink. Off = tokens resolve, chrome surface shows through. */
  skin?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(SCOPE_VARS[app], skin && SCOPE_SKIN[app], className)}
      data-theme={theme}
      data-app={app === "mw" ? (media ?? "mewtube") : undefined}
      data-ornament={app === "ps" ? (ornament ?? "tasteful") : undefined}
      data-motion={app === "ps" ? (motion ?? "on") : undefined}
    >
      {children}
    </div>
  )
}

// ── specimen wrapper ────────────────────────────────────────────────────────
export function Sample({
  title,
  code,
  note,
  app = "sr",
  theme,
  media,
  ornament,
  motion,
  col,
  grid,
  padded = true,
  canvas = true,
  children,
}: {
  title: React.ReactNode
  code?: React.ReactNode
  note?: React.ReactNode
  /** Which design system the specimen belongs to — sets its scope root. */
  app?: AppKey
  /** Rooker takes three canvases here, not two — see `Scope`. */
  theme?: "light" | "dark" | "dim" | "lightsout"
  media?: "mewtube" | "mewtwitch"
  /** ps only — document properties, not themes. See `Scope`. */
  ornament?: "minimal" | "tasteful" | "maximal"
  motion?: "on" | "off"
  col?: boolean
  grid?: boolean
  /** Off for specimens that supply their own padding (full-bleed chrome, shells). */
  padded?: boolean
  /**
   * Paint the app's canvas behind the specimen. On (default) for components, so a
   * Starbank button sits on Starbank white exactly as it does in the app — its ink
   * (`sb-fg`) is near-black and would be unreadable on the chrome. Off for
   * palettes/tokens, which need no canvas. Tokens resolve either way: the scope
   * class stays, only the skin drops.
   */
  canvas?: boolean
  children: React.ReactNode
}) {
  const stage = (
    <Scope
      app={app}
      theme={theme}
      media={media}
      ornament={ornament}
      motion={motion}
      skin={canvas}
      className={cn(
        padded && "p-[1.625rem]",
        canvas && app !== "sr" && "border border-solid border-sr-line",
        "flex flex-wrap gap-4 items-center",
        col && "flex-col items-stretch flex-nowrap",
        grid && "grid grid-cols-1 sm:grid-cols-2",
      )}
    >
      {children}
    </Scope>
  )

  return (
    <div className="border border-solid border-sr-line bg-sr-panel mb-[1.375rem]">
      <div className="flex items-center gap-3 py-[0.625rem] px-4 border-b border-solid border-sr-line bg-sr-panel-2">
        <h4 className={cn(HEAD4, "text-[0.875rem]/[1.05] tracking-[0.08em] text-sr-txt")}>{title}</h4>
        {code && <code className="ml-auto font-mono text-[0.6875rem] font-medium leading-none text-sr-txt-dim">{code}</code>}
      </div>
      {/*
        An app's canvas is INSET as a framed stage rather than painted across the whole
        body. Starbank and light-theme ChatApp are genuinely light systems, so their
        specimens must sit on a light surface to be legible — but full-bleed that reads
        as a broken white wrapper. The chrome gutter keeps the frame dark and makes the
        canvas look deliberate. `sr` chrome needs no stage: it IS the surface.
      */}
      {canvas && app !== "sr" ? <div className="p-3 bg-sr-panel">{stage}</div> : stage}
      {note && (
        <div className="font-body text-[0.8125rem] leading-[1.6] text-sr-txt-muted py-3 px-4 border-t border-dashed border-sr-line [&_code]:font-mono [&_code]:text-[0.75rem] [&_code]:font-medium [&_code]:text-sr-accent">
          {note}
        </div>
      )}
    </div>
  )
}

export function Section({
  id,
  kicker,
  title,
  lead,
  children,
}: {
  id: string
  kicker: string
  title: string
  lead?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mb-[4.625rem] scroll-mt-[120px]">
      <Kicker>{kicker}</Kicker>
      <h2 className={cn(DISPLAY, "text-sr-txt text-[clamp(1.875rem,8vw,2.625rem)]/[0.92] mt-[0.625rem] mb-2")}>{title}</h2>
      {lead && (
        <p className="text-sr-txt-muted max-w-[66ch] mb-7 text-[0.9375rem] [&_code]:font-mono [&_code]:text-[0.8125rem] [&_code]:text-sr-accent">
          {lead}
        </p>
      )}
      {children}
    </section>
  )
}

// The chrome has no `Kicker` primitive of its own (only Button/Badge/Panel), so the
// showcase owns this one rather than reaching across to Boffmedia's.
export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.16em] text-sr-accent">
      <i className="h-[0.4375rem] w-[0.4375rem] rotate-45 bg-sr-accent" />
      {children}
    </span>
  )
}

/** A swatch grid — used by every Bases chapter to show a namespace's palette. */
export function Swatches({ tokens }: { tokens: readonly (readonly [string, string])[] }) {
  return (
    <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-5">
      {tokens.map(([cls, name]) => (
        <div key={cls + name} className="border border-solid border-sr-line">
          <i className={cn("block h-16", cls)} />
          <div className="bg-sr-panel-2 px-[0.6875rem] py-[0.5625rem] font-mono text-[0.625rem] font-medium leading-[1.5] text-sr-txt-muted">
            <b className="block font-semibold text-sr-txt">{name}</b>
            {cls}
          </div>
        </div>
      ))}
    </div>
  )
}
