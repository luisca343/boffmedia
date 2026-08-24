import * as React from "react"
import { cn } from "../cn"
import { Icon, type IconName } from "./icon"
import { Kicker } from "./kicker"

/**
 * The display voice — heavy italic condensed uppercase, with `<em>` rendered as
 * an accent outline. apps/web also applies this to bare `h1/h2/h3` through a
 * `:where([data-ds="boffmedia"])` base rule, but that rule lives in the HOST's
 * Tailwind config: a package that relied on it would render flat, roman text in
 * apps/desktop. So the classes are spelled out here, and this constant is the
 * single definition every host shares.
 */
export const DISPLAY_VOICE = cn(
  "font-display font-extrabold italic uppercase leading-[0.92] tracking-[-0.005em]",
  "[&_em]:italic [&_em]:text-transparent [&_em]:[-webkit-text-stroke:1.6px_var(--accent)]",
)

export interface ToolHeaderProps {
  /**
   * `page` is the editorial header: kicker, big italic title, lead, and a meta
   * row of StatChips. `bar` is the 45px sticky strip a tool uses when it owns
   * the viewport or carries persistent controls.
   *
   * The tie-break is `page`: a page header can grow a sticky ToolBar underneath
   * it, but a bar can never grow a title — the cheap conversion runs one way.
   */
  density?: "page" | "bar"
  /** Kicker text (page) — the small accent-ruled label above the title. */
  eyebrow?: React.ReactNode
  /** Leading seal glyph. Rendered in `bar`; ignored in `page`, where the kicker
   *  already does the labelling work an icon would repeat. */
  icon?: IconName
  /** The title. Wrap a word in `<em>` to get the accent outline treatment. */
  title: React.ReactNode
  /** One-line lead (page) or the mono subtitle under the bar title (bar). */
  sub?: React.ReactNode
  /** Metric slot — a row of `<StatChip>`s (page) or any trailing node (bar). */
  meta?: React.ReactNode
  /** Trailing controls, right-aligned next to `meta`. */
  actions?: React.ReactNode
  className?: string
}

/**
 * The sticky strip a `bar`-density header lives in. Exported on its own because
 * a bar is not always a header: datakit's sub-bar and mhwilds' toolbar are the
 * same strip carrying only controls.
 *
 * It sticks to `--tool-sticky-top`, never `--nav-h`. `--nav-h` exists in
 * apps/web's globals.css alone, so in apps/desktop the whole declaration would
 * be invalid and silently dropped — and the right offset there is 0, which is
 * this token's fallback. The host maps the two (apps/web: `--tool-sticky-top:
 * var(--nav-h)`).
 */
export function ToolStrip({
  tone = "base",
  className,
  children,
}: {
  /** `base` is the primary bar; `sub` is the recessed second row beneath it. */
  tone?: "base" | "sub"
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "sticky top-[var(--tool-sticky-top,0px)] flex flex-none flex-wrap items-center gap-3 border-b border-solid border-line",
        "px-[var(--tool-pad,clamp(14px,2vw,32px))]",
        tone === "sub" ? "z-[25] bg-base-2 py-2" : "z-30 min-h-[45px] bg-base py-[10px]",
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * The 34px chamfered glyph that opens a tool bar. `cut-tag` (bottom-right
 * chamfer) rather than the `.cut` parallelogram mhwilds used: the parallelogram
 * is the pill/button shape, and a seal sitting beside a title needs its
 * baseline edges square or the title appears to lean away from it.
 *
 * `hue` tints the seal for a game-scoped tool (mhwilds' emerald) without
 * forking the component — pass any colour expression.
 */
export function ToolSeal({
  icon,
  label,
  hue,
  solid,
  className,
}: {
  icon?: IconName
  /** A short wordmark instead of a glyph (TCG Pocket's "TCG"). */
  label?: React.ReactNode
  hue?: string
  /** Filled accent block rather than the soft tinted one. Reserved for a tool
   *  whose bar IS the app bar — a tool that owns the whole viewport — so the
   *  fill still reads as "this is a different level", not as decoration. */
  solid?: boolean
  className?: string
}) {
  return (
    <span
      style={
        hue
          ? ({
              "--cut-line": `color-mix(in srgb, ${hue} 45%, transparent)`,
              borderColor: `color-mix(in srgb, ${hue} 45%, transparent)`,
              background: solid ? hue : `color-mix(in srgb, ${hue} 14%, transparent)`,
              color: solid ? "var(--naranja-ink)" : hue,
            } as React.CSSProperties)
          : undefined
      }
      className={cn(
        "cut-tag cut-tag-edge [--cut-tag:8px] grid h-[34px] w-[34px] flex-none place-items-center border border-solid",
        !hue &&
          (solid
            ? "[--cut-line:var(--accent)] border-accent bg-accent text-accent-ink"
            : "[--cut-line:var(--accent-line)] border-accent-line bg-accent-soft text-accent"),
        label && "font-display text-[15px] font-bold tracking-[0.02em]",
        className,
      )}
    >
      {icon ? <Icon name={icon} size={17} /> : label}
    </span>
  )
}

/** The title cluster of a bar: a 17px display line over an optional mono sub. */
export function ToolTitle({ title, sub, className }: { title: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("grid min-w-0", className)}>
      <b className="truncate font-display text-[17px] font-bold uppercase leading-[1.05] tracking-[0.04em]">{title}</b>
      {present(sub) && (
        <i className="truncate font-mono text-[10px] font-medium not-italic uppercase leading-[1.3] tracking-[0.1em] text-txt-dim">
          {sub}
        </i>
      )}
    </span>
  )
}

/**
 * One header for every tool. It absorbs the five chassis that grew in parallel
 * under `(herramientas)`: the hand-rolled editorial `<header>` (which had drifted
 * into two different title scales), datakit's `DkBar` + `DkTitle`, TCG Pocket's
 * own non-italic title, and the bare no-header views.
 *
 * The `bar` density sticks to `--tool-sticky-top`, never `--nav-h`. `--nav-h` is
 * defined in apps/web's globals.css only; in apps/desktop the whole declaration
 * would be invalid and silently dropped, and the correct offset there is 0 —
 * which is exactly this token's fallback.
 */
export function ToolHeader({
  density = "page",
  eyebrow,
  icon,
  title,
  sub,
  meta,
  actions,
  className,
}: ToolHeaderProps) {
  if (density === "bar") {
    return (
      <ToolStrip className={className}>
        {icon && <ToolSeal icon={icon} />}
        <ToolTitle title={title} sub={sub} />
        {(present(meta) || present(actions)) && (
          <span className="ml-auto flex flex-wrap items-center gap-2">
            {meta}
            {actions}
          </span>
        )}
      </ToolStrip>
    )
  }

  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-6 pb-5 pt-1", className)}>
      <div className="min-w-0">
        {eyebrow && <Kicker>{eyebrow}</Kicker>}
        <h1 className={cn(DISPLAY_VOICE, "my-3 text-[clamp(38px,5vw,66px)]")}>{title}</h1>
        {present(sub) && <p className="max-w-[58ch] text-pretty text-[15px] leading-[1.5] text-txt-muted">{sub}</p>}
      </div>
      {(present(meta) || present(actions)) && (
        <div className="flex flex-wrap items-center gap-[10px]">
          {meta}
          {actions}
        </div>
      )}
    </header>
  )
}

/** `cond && <X/>` evaluates to `false`, not `null`, so a `!= null` test renders
 *  the wrapper anyway — an empty row that still spends its margin and reads as a
 *  stray gap. Every optional slot in this file goes through this instead. */
const present = (node: React.ReactNode) => node !== null && node !== undefined && node !== false && node !== ""

export interface ToolBarProps {
  /** Sticks the row under the host chrome. Use for a bar that must survive a
   *  long scroll (a card grid, a file list); leave off for a short page. */
  sticky?: boolean
  /** A wrapping row of filter chips, rendered under the control row. Chips are
   *  a variable-length set: inline they would push the primary action off the
   *  end of the bar the moment a tool has more than a handful. */
  filters?: React.ReactNode
  /** Result count / status line. Rendered BELOW the control row, never inside
   *  it — a count wedged between controls moves every time the filter changes
   *  and drags the whole row's tab order with it. */
  note?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

/**
 * The control row that sits under a `ToolHeader`. A bare flex row, deliberately
 * with no panel chrome of its own: the controls inside it already carry the
 * system's outlines, and wrapping them in a second bordered box double-frames
 * every filter.
 *
 * Canonical order — search · seg · select · `<ToolBarSpacer/>` · view toggle ·
 * one primary action.
 */
export function ToolBar({ sticky, filters, note, className, children }: ToolBarProps) {
  return (
    <div
      className={cn(
        "mb-[18px] mt-1",
        sticky && "sticky top-[var(--tool-sticky-top,0px)] z-20 -mx-[var(--tool-pad,0px)] bg-base/90 px-[var(--tool-pad,0px)] py-2 backdrop-blur-[10px]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">{children}</div>
      {present(filters) && <div className="mt-3 flex flex-wrap gap-[7px]">{filters}</div>}
      {present(note) && <div className="mt-[10px] font-mono text-[12px] leading-none text-txt-dim">{note}</div>}
    </div>
  )
}

/** Pushes the controls that follow it to the trailing edge of a `ToolBar`. */
export function ToolBarSpacer() {
  return <span className="flex-1" />
}

/** Vertical hairline between two control clusters in a `ToolBar`. */
export function ToolBarDivider({ className }: { className?: string }) {
  return <span className={cn("my-[2px] w-px flex-none self-stretch bg-line", className)} />
}
