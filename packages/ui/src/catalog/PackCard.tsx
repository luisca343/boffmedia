import * as React from "react"

import { cn } from "../cn"
import { Icon } from "../primitives/icon"

export type PackCardType = "server" | "client"
export type PackCardLayout = "card" | "compact" | "row"

/** A pack library card. Deliberately slot-driven and state-free: the host supplies
 *  every dynamic node (the install-state badge, the live server-status strip, the
 *  action button, the kebab menu) already rendered, and this only owns the layout
 *  and the (sharp, cut-free) geometry. Nothing here pings a server or touches a
 *  runtime, so it renders identically in the launcher, in web admin and in the
 *  styleguide.
 *
 *  One component, three shells behind `layout`:
 *  - `card`    — 2:1 cover art on top, vertical body. Store / discovery grids.
 *  - `compact` — no art; the header gains a seal with the `icon` glyph. Dense grids.
 *  - `row`     — horizontal: square art rail, one-line body, controls on the right.
 *                Library lists.
 *
 *  Heights are CONTENT-DRIVEN. Nothing is reserved for an absent region: a pack
 *  with no summary and no server does not carry an empty two-line box and an
 *  empty 40px slot between its title and its footer — that reservation is what
 *  made a bare card read as hollow. Equal heights in a grid come from the grid
 *  itself: the shell is `h-full`, so grid-row stretch makes every card in a row
 *  the same height, and the footer group (`mt-auto`) pins to the bottom edge so
 *  buttons stay flush across the row whatever the bodies hold. */
export interface PackCardProps {
  /** Full-bleed cover art — e.g. a `<CatalogIcon/>` or `<img>`. Ignored by
   *  `layout="compact"`. */
  art?: React.ReactNode
  /** Glyph for the art placeholder (card/row) or the header seal (compact). */
  icon?: React.ReactNode
  title: React.ReactNode
  /** Mono slug under the title. One line, ellipsized. */
  slug?: React.ReactNode
  /** Header aside — the single install-state badge. One signal: anything else
   *  (server health, progress) has its own quieter slot. */
  stateBadge?: React.ReactNode
  type?: PackCardType
  layout?: PackCardLayout
  /** The online/offline `ServerStatus` strip. Typically only for server packs.
   *  Renders in the signal slot; a live `progress` outranks it. */
  serverStatus?: React.ReactNode
  summary?: React.ReactNode
  /** Install progress region (bar + phase text), composed by the host. Highest
   *  priority occupant of the signal slot. */
  progress?: React.ReactNode
  /** Broken-state message, composed by the host. Shown as a one-line note in the
   *  signal slot when neither `progress` nor `serverStatus` claim it. */
  error?: React.ReactNode
  /** Entries of the mono meta line — access · version · files · size. Wraps in
   *  card/compact, stays on one line in row. */
  badges?: React.ReactNode
  /** Last-played / playtime. Pinned to the right end of the meta line. */
  footerMeta?: React.ReactNode
  /** Corner note over the cover art — e.g. the slug. Card only. */
  artNote?: React.ReactNode
  /** Top-left overlay on the art — small pills / ribbons. Card/row only. */
  ribbon?: React.ReactNode
  /** Dims the art behind a lock (no-access state). Card/row only. */
  locked?: boolean
  /** The primary state-driven button (Install / Play / Repair …). In card and
   *  compact the first action stretches full width; in row every action keeps
   *  its natural size. */
  actions?: React.ReactNode
  /** The kebab menu. Clicks inside it never navigate the card. */
  menu?: React.ReactNode
  /** Card click — usually "open the detail view". */
  onOpen?: () => void
  className?: string
}

// The striped placeholder — a repeating diagonal hatch over the deep base. Inline
// because a repeating-linear-gradient with token colours has no clean utility form.
const STRIPE: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(135deg, var(--panel-2) 0 10px, transparent 10px 20px)",
  backgroundColor: "var(--bg-2)",
}

const SHELL: Record<PackCardLayout, string> = {
  card: "h-full w-full flex-col",
  compact: "h-full w-full flex-col",
  row: "min-h-[104px] w-full flex-row items-stretch",
}

export function PackCard({
  art,
  icon,
  title,
  slug,
  stateBadge,
  type = "client",
  layout = "card",
  serverStatus,
  summary,
  progress,
  error,
  badges,
  footerMeta,
  artNote,
  ribbon,
  locked,
  actions,
  menu,
  onOpen,
  className,
}: PackCardProps) {
  const row = layout === "row"
  const compact = layout === "compact"

  const cover = compact ? null : (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden border-solid border-line",
        // The art itself (an <img> from the host) eases in on hover — a small
        // motion that makes a grid of static covers feel touchable.
        "[&_img]:transition-transform [&_img]:duration-300 [&_img]:ease-out",
        onOpen && "group-hover:[&_img]:scale-[1.04]",
        row ? "w-[104px] self-stretch border-r" : "aspect-[2/1] w-full border-b",
      )}
      style={art == null ? STRIPE : undefined}
    >
      {art != null ? (
        art
      ) : (
        <span className="grid size-[38px] place-items-center border border-solid border-line-2 text-txt-dim">
          {icon ?? <Icon name="cube" size={20} />}
        </span>
      )}
      {ribbon != null && <span className="absolute left-0 top-0 flex gap-1.5 p-2">{ribbon}</span>}
      {artNote != null && !row && (
        <span className="absolute bottom-2 left-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-dim">
          {artNote}
        </span>
      )}
      {locked && (
        <span className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_68%,transparent)] text-txt-muted backdrop-blur-[1px]">
          <Icon name="lock" size={row ? 18 : 24} />
        </span>
      )}
    </div>
  )

  // The polymorphic signal slot: exactly one occupant — a live install progress,
  // else the server strip, else a one-line broken note, else nothing at all.
  const signal =
    progress != null ? (
      <div>{progress}</div>
    ) : serverStatus != null ? (
      <div>{serverStatus}</div>
    ) : error != null ? (
      <div className="truncate border border-solid border-bad/40 bg-bad-soft px-2.5 py-2 text-[11px] text-txt-muted">
        {error}
      </div>
    ) : null

  const titleNode = (
    <div className="min-w-0 flex-1">
      <div
        className={cn(
          "font-display font-extrabold italic uppercase leading-[1.02] tracking-[0.01em] text-txt",
          row ? "truncate text-[17px]" : compact ? "line-clamp-2 text-[17px]" : "line-clamp-2 text-[19px]",
        )}
      >
        {title}
      </div>
      {slug != null && (
        <div className="mt-[3px] truncate font-mono text-[10px] tracking-[0.06em] text-txt-dim">{slug}</div>
      )}
    </div>
  )

  const meta =
    badges != null || footerMeta != null ? (
      <div
        className={cn(
          "flex items-center gap-x-2.5 gap-y-1.5 font-mono text-[11px] text-txt-muted",
          row ? "overflow-hidden whitespace-nowrap" : "flex-wrap border-t border-solid border-line pt-3",
        )}
      >
        <span className={cn("flex items-center gap-2.5", row ? "min-w-0 overflow-hidden" : "flex-wrap gap-y-1.5")}>
          {badges}
        </span>
        {footerMeta != null && (
          // Row: pinned to the right end of the single line. Card/compact: its
          // own right-aligned line, truncated — "played · playtime · size" is
          // longer than a 280px card, and clipping it mid-word is worse than a
          // second line.
          <span
            className={cn(
              "ml-auto text-txt-dim",
              row ? "shrink-0 whitespace-nowrap" : "min-w-0 basis-full truncate text-right",
            )}
          >
            {footerMeta}
          </span>
        )}
      </div>
    ) : null

  // Stops the button and the kebab from bubbling to onOpen — otherwise every
  // menu open also navigates away.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  const shell = cn(
    "group flex overflow-hidden border border-solid border-line bg-panel transition-[border-color,transform,box-shadow] duration-[140ms]",
    SHELL[layout],
    onOpen &&
      "cursor-pointer hover:-translate-y-[2px] hover:border-line-2 hover:shadow-[0_12px_28px_rgba(0,0,0,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
    className,
  )

  const interactive = onOpen
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: onOpen,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.target !== e.currentTarget) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onOpen()
          }
        },
      }
    : {}

  if (row) {
    return (
      <div {...interactive} className={shell}>
        {cover}

        <div className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {titleNode}
            {summary != null && (
              <div className="truncate text-[12.5px] leading-[1.4] text-txt-muted">{summary}</div>
            )}
            {signal}
            {meta}
          </div>

          {(stateBadge != null || actions != null || menu != null) && (
            <div className="flex shrink-0 items-center gap-2.5" onClick={stop} onKeyDown={stop}>
              {stateBadge}
              {actions}
              {menu}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div {...interactive} className={shell}>
      {cover}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[10px] p-3.5">
        <div className="flex shrink-0 items-start gap-2.5">
          {compact && (
            // No art region in compact, so the lock cue moves into the seal —
            // without this, `locked` would read only from the state badge.
            <span
              className={cn(
                "grid size-[38px] shrink-0 place-items-center overflow-hidden border border-solid",
                locked ? "border-bad/40 bg-bad-soft text-bad" : "border-line-2 bg-panel-2 text-txt",
              )}
            >
              {locked ? <Icon name="lock" size={16} /> : (icon ?? <Icon name="cube" size={18} />)}
            </span>
          )}
          {titleNode}
          {stateBadge != null && <span className="shrink-0">{stateBadge}</span>}
        </div>

        {summary != null && (
          <div className="line-clamp-2 text-[13.5px] leading-[1.5] text-txt-muted">{summary}</div>
        )}

        {signal}

        {(meta != null || actions != null || menu != null) && (
          // The footer group: meta line + controls, pinned to the bottom so a
          // grid row of cards with different bodies still ends in one flush line
          // of buttons.
          <div className="mt-auto flex flex-col gap-[10px] pt-1">
            {meta}
            {(actions != null || menu != null) && (
              <div className="flex items-stretch gap-2.5" onClick={stop} onKeyDown={stop}>
                <span className="flex min-w-0 flex-1 items-center gap-2.5 [&>*:first-child]:flex-1">{actions}</span>
                {menu != null && <span className="flex shrink-0 items-center">{menu}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
