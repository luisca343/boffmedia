import * as React from "react"
import { cn } from "../cn"
import { getLink } from "../i18n"
import { Icon, type IconName } from "./icon"

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
   * Which one you want follows from the SURFACE, not from the header:
   *
   * - A surface that OWNS THE VIEWPORT (panes, internal scroll regions,
   *   controls that must stay put while the content moves) is an App, and an
   *   App carries no title at all. Its name lives in the chrome around it —
   *   ToolShell's rail. Use a bare `ToolStrip` for its controls, and reach for
   *   `density="bar"` only when the tool is a frame in its own right, with no
   *   rail to inherit from (the schematic tools, TcgpApp).
   * - A surface that FLOWS IN THE DOCUMENT — a list you scroll to the end of —
   *   is an Index, and it names itself: `density="page"`.
   * - Nothing names itself twice. Inside a surface that already carries a name,
   *   an inner view never adds a second header; the tab row is the label.
   *
   * Carrying persistent controls does NOT on its own make something a bar — an
   * Index has a `ToolBar` under its title and is still a page. Owning the
   * viewport is the test.
   */
  density?: "page" | "bar"
  /** Leading seal glyph. Rendered in `bar`; ignored in `page`, where the
   *  title already does the labelling work an icon would repeat. */
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
 * ONE bar height for the whole system, published as a token rather than spelled
 * as a number at each call site.
 *
 * It is a token because layouts have to offset against it: mhwilds' roster
 * column sticks below the bar and subtracts its height, and it used to do that
 * by repeating `58px` twice. A literal there is a silent breakage waiting for
 * the next height change — the column drifts and nothing errors. Anything that
 * needs the bar's height reads `var(--tool-bar-h)`.
 *
 * 58px rather than the old nominal 45px because 45 was never real: a bar whose
 * `ToolTitle` carries a `sub` needs ~52px, so those bars quietly grew and the
 * system ended up with heights nobody chose. 58 fits seal + title + sub, and a
 * control-only bar simply has more air.
 */
export const TOOL_BAR_H = "58px"

const STRIP_GUTTER = "px-[var(--tool-pad,clamp(14px,2vw,32px))]"

/**
 * A themed tool (Mewgenics, and anything like it later) needs its bar to be the
 * SAME OBJECT as every other bar — same height, gutter, sticky offset, row
 * structure — while looking like itself. So the three surface colours are
 * tokens with the system palette as the fallback, and a skin sets them on the
 * `ToolStrip`.
 *
 * Colour only, deliberately. A skin cannot reach height, padding or gutter
 * through these, which is what separates "own skin" from the `className`
 * free-for-all that produced four heights in the first place.
 */
const STRIP_BG = "bg-[var(--tool-bar-bg,var(--bg))]"
const STRIP_SUB_BG = "bg-[var(--tool-bar-sub-bg,var(--bg-2))]"
const STRIP_LINE = "border-[var(--tool-bar-line,var(--line))]"

/** One row of a strip. Not exported: a row only ever exists inside a
 *  `ToolStrip`, which owns the sticky context, the border and the background. */
function StripRow({ tone = "base", children }: { tone?: "base" | "sub"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        STRIP_GUTTER,
        tone === "sub"
          ? cn("border-t border-solid py-2", STRIP_LINE, STRIP_SUB_BG)
          : "min-h-[var(--tool-bar-h,3.625rem)] py-[0.625rem]",
      )}
    >
      {children}
    </div>
  )
}

export interface ToolStripProps {
  /** Second row, under the title row: this tool's tabs, or its filter set.
   *
   *  It is a SLOT rather than something a caller assembles because of a trap
   *  that is invisible until it bites: a sticky child inside a sticky parent
   *  resolves against the parent, not the viewport, so a hand-built two-row bar
   *  scrolls its second row out from under its first. This component owns the
   *  one sticky context and both rows run static inside it. */
  sub?: React.ReactNode
  /** Off for a bar that is not the top of a scrolling region — a tool whose own
   *  body scrolls, or a strip inside an already-sticky shell. */
  sticky?: boolean
  /** `base` is the primary bar. `sub` makes the whole strip the recessed row,
   *  for the case where the two rows are rendered by DIFFERENT components and
   *  cannot use the `sub` slot (datakit's standalone sub-bar). Prefer `sub`. */
  tone?: "base" | "sub"
  /** Skin only — palette, per-tool tint, z-order. NOT geometry: height, padding
   *  and gutter come from the props and tokens above, and a `check-tool-chassis`
   *  lint rule fails the build on a geometry class here. That escape hatch is
   *  how seven call sites ended up with four heights and four gutters. */
  className?: string
  /** How a skin sets `--tool-bar-bg` / `--tool-bar-sub-bg` / `--tool-bar-line`.
   *  Colour tokens only — geometry does not have a token here to set. */
  style?: React.CSSProperties
  children: React.ReactNode
}

/**
 * The tool's sticky header region: one or two rows, one gutter, one sticky
 * context, one height.
 *
 * It sticks to `--tool-sticky-top`, never `--nav-h`. `--nav-h` exists in
 * apps/web's globals.css alone, so in apps/desktop the whole declaration would
 * be invalid and silently dropped — and the right offset there is 0, which is
 * this token's fallback. The host maps the two (apps/web: `--tool-sticky-top:
 * var(--nav-h)`).
 *
 * `--tool-pad` is owned by the HOST SHELL, not by the tool — the same rule that
 * keeps viewport math out of `packages/tools/*`. A tool that sets its own
 * gutter is a tool whose bar no longer lines up with the body beneath it.
 */
export function ToolStrip({ sub, sticky = true, tone = "base", className, style, children }: ToolStripProps) {
  return (
    <div
      style={style}
      className={cn(
        "flex-none border-b border-solid",
        STRIP_LINE,
        tone === "sub" ? cn("z-[25]", STRIP_SUB_BG) : cn("z-30", STRIP_BG),
        sticky && "sticky top-[var(--tool-sticky-top,0px)]",
        className,
      )}
    >
      <StripRow tone={tone}>{children}</StripRow>
      {present(sub) && <StripRow tone="sub">{sub}</StripRow>}
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
        "cut-tag cut-tag-edge [--cut-tag:8px] grid h-[2.125rem] w-[2.125rem] flex-none place-items-center border border-solid",
        !hue &&
          (solid
            ? "[--cut-line:var(--accent)] border-accent bg-accent text-accent-ink"
            : "[--cut-line:var(--accent-line)] border-accent-line bg-accent-soft text-accent"),
        label && "font-display text-[0.9375rem] font-bold tracking-[0.02em]",
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
      <b className="truncate font-display text-[1.0625rem] font-bold uppercase leading-[1.05] tracking-[0.04em]">{title}</b>
      {present(sub) && (
        <i className="truncate font-mono text-[0.625rem] font-medium not-italic uppercase leading-[1.3] tracking-[0.1em] text-txt-dim">
          {sub}
        </i>
      )}
    </span>
  )
}

/**
 * One header for every surface that needs one — and, by the rule on `density`,
 * none for the ones that do not. It absorbs the chassis that grew in parallel
 * under `(herramientas)` AND the eight hand-rolled headers on the site's own
 * index pages, which never heard about the tool canon and drifted the other way
 * (72px and 80px against the tools' 66px).
 *
 * The `page` rung is `clamp(32px,4vw,52px)`, down from 66. The drift is the
 * evidence: every tool that hand-rolled a title picked something SMALLER, because
 * 66px of condensed italic over a thirty-row list is a poster, not a header.
 *
 * The `bar` density sticks to `--tool-sticky-top`, never `--nav-h`. `--nav-h` is
 * defined in apps/web's globals.css only; in apps/desktop the whole declaration
 * would be invalid and silently dropped, and the correct offset there is 0 —
 * which is exactly this token's fallback.
 */
export function ToolHeader({
  density = "page",
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
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-6 border-b border-solid border-line pb-5 pt-1",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className={cn(DISPLAY_VOICE, "mb-3 text-[clamp(2rem,4vw,3.25rem)]")}>{title}</h1>
        {present(sub) && <p className="max-w-[58ch] text-pretty text-[0.9375rem] leading-[1.5] text-txt-muted">{sub}</p>}
      </div>
      {(present(meta) || present(actions)) && (
        <div className="flex flex-wrap items-center gap-[0.625rem]">
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

/**
 * The height of a `SectionBar`, as a token rather than a literal.
 *
 * A view that owns the full viewport subtracts this from `100dvh` to build its
 * scrollport (`--tool-vh`). Respelling `37px` at such a call site is a silent
 * breakage waiting for the next height change: the bar moves, the scrollport
 * does not, and nothing errors — it just scrolls wrong.
 */
// In rem, like every other chassis height, so the bar grows with the type it
// contains when the display scale steps up. The host subtracts THIS from
// 100dvh, so a px value here against a rem bar is a scrollport that overflows
// the window by the difference.
export const SECTION_BAR_H = "2.3125rem"

/**
 * "Go up one level", on its own.
 *
 * The bare atom, for the two views whose back link shares a row with something
 * else (a labelled field) and therefore cannot use the bar. Everything else
 * gets it through `SectionBar`, which is what makes the affordance look and
 * behave identically wherever it appears.
 */
export function BackLink({
  label,
  onBack,
  href,
  className,
}: {
  label: React.ReactNode
  /** Click handler for a host that navigates by state (the launcher). */
  onBack?: () => void
  /** Href for a host that navigates by URL. Ignored when `onBack` is given. */
  href?: string
  className?: string
}) {
  const cls = cn(
    "inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-txt-muted transition-colors hover:text-accent-bright",
    className,
  )
  const inner = (
    <>
      <Icon name="back" size={13} /> {label}
    </>
  )
  if (!onBack && href) {
    const Link = getLink()
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onBack} className={cls}>
      {inner}
    </button>
  )
}

/**
 * The depth-one navigation row: back link, optionally the name of where you
 * are, optionally the controls that belong to LEAVING.
 *
 * Deliberately NOT built on `ToolStrip`. A tool bar is 58px because it carries
 * a seal over a title over a sub-line; a row whose whole job is "go up one
 * level" has no business being that tall, and the first attempt at sharing the
 * chassis produced exactly that — a header three times the weight of the thing
 * it labels. The two bars only ever agreed on having a border. What is shared
 * is the ATOM (`BackLink`), not the chassis.
 *
 * Corollary for `actions`: a view's PRIMARY action stays in the body next to
 * what it acts on. This slot is for controls that belong to the act of leaving
 * — an editor's Cancel/Save — never for hoisting a Play or Install button up
 * into the navigation row.
 */
export function SectionBar({
  label,
  onBack,
  href,
  title,
  actions,
  bordered = false,
  className,
}: {
  label: React.ReactNode
  onBack?: () => void
  href?: string
  /** Where you are. Quiet body-size text: the bar navigates, it does not shout. */
  title?: React.ReactNode
  actions?: React.ReactNode
  /** A view that owns the full height (a tool) needs the row to read as a fixed
   *  bar. One that scrolls with its page (a pack) does not want a rule cutting
   *  across its own heading. */
  bordered?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        bordered
          ? // Explicit height, not padding — see `SECTION_BAR_H`.
            "flex h-[var(--section-bar-h,2.3125rem)] shrink-0 items-center gap-3 border-b border-solid border-line px-4"
          : "mb-4 flex items-center gap-3",
        className,
      )}
    >
      <BackLink label={label} onBack={onBack} href={href} />
      {present(title) && (
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-txt">{title}</span>
      )}
      {present(actions) && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}

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
        "mb-5 mt-4",
        sticky && "sticky top-[var(--tool-sticky-top,0px)] z-20 -mx-[var(--tool-pad,0px)] bg-base/90 px-[var(--tool-pad,0px)] py-2 backdrop-blur-[10px]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">{children}</div>
      {present(filters) && <div className="mt-3 flex flex-wrap gap-[0.4375rem]">{filters}</div>}
      {present(note) && <div className="mt-[0.625rem] font-mono text-[0.75rem] leading-none text-txt-dim">{note}</div>}
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
