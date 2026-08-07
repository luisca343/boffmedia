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
 *  One component, three FIXED-HEIGHT shells behind `layout`
 *  (PACK_CARD_FIXED_HEIGHT.md — every card in a grid is pixel-identical in height):
 *  - `card`    — 150px cover art on top, 420px tall. Store / discovery grids.
 *  - `compact` — no art; the header gains a seal with the `icon` glyph. 272px tall.
 *  - `row`     — horizontal, 150px art rail, 150px tall. Dense library lists.
 *
 *  Equal-height rule: the shell has an explicit height, every internal region is
 *  flex:none with a reserved size (title & description clamp to 2 lines but also
 *  min-height 2 lines; the signal slot is always ≥40px; the meta line never
 *  wraps), and only the footer's mt-auto absorbs the slack. */
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
   *  Renders inside the fixed-height signal slot; a live `progress` outranks it. */
  serverStatus?: React.ReactNode
  summary?: React.ReactNode
  /** Install progress region (bar + phase text), composed by the host. Highest
   *  priority occupant of the signal slot. */
  progress?: React.ReactNode
  /** Broken-state message, composed by the host. Shown as a one-line note in the
   *  signal slot when neither `progress` nor `serverStatus` claim it. */
  error?: React.ReactNode
  /** Entries of the single mono meta line — access · version · files · size.
   *  ONE line: truncates, never wraps. */
  badges?: React.ReactNode
  /** Last-played / playtime. Pinned to the right end of the meta line, never
   *  wrapped below it. */
  footerMeta?: React.ReactNode
  /** Corner note over the cover art — e.g. the slug. Card/row only. */
  artNote?: React.ReactNode
  /** Top-left overlay on the art — small pills / ribbons. Card/row only. */
  ribbon?: React.ReactNode
  /** Dims the art behind a lock (no-access state). Card/row only. */
  locked?: boolean
  /** The primary state-driven button (Install / Play / Repair …). The first
   *  action stretches full width; extra icon actions keep their natural size. */
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

// Shell heights per layout — the single tunable of the equal-height rule. The
// reserved regions below must keep summing to ≤ these (with the footer's mt-auto
// absorbing the slack), or overflow-hidden would clip the footer.
const SHELL: Record<PackCardLayout, string> = {
  card: "h-[420px] w-[300px] flex-col",
  compact: "h-[272px] w-[300px] flex-col",
  row: "h-[150px] w-full flex-row items-stretch",
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
        row ? "w-[150px] border-r" : "h-[150px] border-b",
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
      {artNote != null && (
        <span className="absolute bottom-2 left-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-dim">
          {artNote}
        </span>
      )}
      {locked && (
        <span className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_68%,transparent)] text-txt-muted backdrop-blur-[1px]">
          <Icon name="lock" size={24} />
        </span>
      )}
    </div>
  )

  // The polymorphic signal slot: exactly one occupant — a live install progress,
  // else the server strip, else a one-line broken note, else reserved emptiness.
  // The wrapper keeps its 40px floor in every case so cards never disagree.
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

  return (
    <div
      role={onOpen ? "button" : undefined}
      onClick={onOpen}
      className={cn(
        "flex overflow-hidden border border-solid border-line bg-panel transition-[border-color] duration-[140ms]",
        SHELL[layout],
        onOpen && "cursor-pointer hover:border-line-2",
        className,
      )}
    >
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
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "font-display font-extrabold italic uppercase leading-[1.02] tracking-[0.01em] text-txt",
                compact ? "text-[17px]" : "text-[19px]",
                // A 1-line title occupies the same box as a 2-line one — the
                // min-height is 2 line-boxes (2 × 1.02em), not the content.
                row ? "line-clamp-1" : "line-clamp-2 min-h-[2.04em]",
              )}
            >
              {title}
            </div>
            {slug != null && (
              <div className="mt-[3px] truncate font-mono text-[10px] tracking-[0.06em] text-txt-dim">{slug}</div>
            )}
          </div>
          {stateBadge != null && <span className="shrink-0">{stateBadge}</span>}
        </div>

        {!row && (
          // Reserved even when empty: a short or missing description still holds
          // its 2-line box (2 × 1.5em) so the regions below never shift.
          <div className="line-clamp-2 min-h-[3em] shrink-0 text-[13.5px] leading-[1.5] text-txt-muted">
            {summary}
          </div>
        )}

        {!row && <div className="flex min-h-[40px] shrink-0 flex-col justify-center">{signal}</div>}

        {(badges != null || footerMeta != null) && (
          <div className="flex shrink-0 items-center gap-3 overflow-hidden whitespace-nowrap border-t border-solid border-line pt-3 font-mono text-[11px] text-txt-muted">
            <span className="flex min-w-0 items-center gap-2.5 overflow-hidden">{badges}</span>
            {footerMeta != null && <span className="ml-auto shrink-0 text-txt-dim">{footerMeta}</span>}
          </div>
        )}

        {(actions != null || menu != null) && (
          <div
            className="mt-auto flex shrink-0 items-stretch gap-2.5"
            // A click on the button OR the kebab must not bubble to onOpen —
            // otherwise every menu open also navigates away.
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5 [&>*:first-child]:flex-1">{actions}</span>
            {menu != null && <span className="flex shrink-0 items-center">{menu}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
