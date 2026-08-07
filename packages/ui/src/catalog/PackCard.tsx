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
 *  One component, three shells behind `layout` (PACK_CARD_LAYOUTS.md):
 *  - `card`    — 16:9 cover art on top (~300px). Store / discovery grids.
 *  - `compact` — no art; the header gains a seal with the `icon` glyph (~300px,
 *                shorter). Installed lists where placeholder art adds nothing.
 *  - `row`     — horizontal, 120px art rail (~520px). Dense library lists.
 *
 *  The cleanup rules bake into every layout: ONE state signal (`stateBadge`),
 *  server status demoted to the tenue `serverStatus` strip, a single wrapping
 *  meta line (`badges` + `footerMeta`, never truncated), one hairline (above
 *  meta), and a full-width rectangular primary action. */
export interface PackCardProps {
  /** Full-bleed cover art — e.g. a `<CatalogIcon/>` or `<img>`. Ignored by
   *  `layout="compact"`. */
  art?: React.ReactNode
  /** Glyph for the art placeholder (card/row) or the header seal (compact). */
  icon?: React.ReactNode
  title: React.ReactNode
  /** Mono slug under the title. */
  slug?: React.ReactNode
  /** Header aside — the single install-state badge. One signal: anything else
   *  (server health, progress) has its own quieter slot. */
  stateBadge?: React.ReactNode
  type?: PackCardType
  layout?: PackCardLayout
  /** The online/offline `ServerStatus` strip. Typically only for server packs. */
  serverStatus?: React.ReactNode
  summary?: React.ReactNode
  /** Install progress region (bar + phase text), composed by the host. */
  progress?: React.ReactNode
  /** Broken-state message, composed by the host. */
  error?: React.ReactNode
  /** Entries of the single mono meta line — access · version · files · size.
   *  Wraps, never truncates. */
  badges?: React.ReactNode
  /** Last-played / playtime. Renders as a full-width dim line INSIDE the meta
   *  block (mock fix #4: it no longer fights the button for footer space). */
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
        "relative grid place-items-center overflow-hidden border-solid border-line",
        row ? "w-[120px] shrink-0 border-r" : "aspect-[16/9] border-b",
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

  return (
    <div
      role={onOpen ? "button" : undefined}
      onClick={onOpen}
      className={cn(
        "flex border border-solid border-line bg-panel transition-[border-color] duration-[140ms]",
        row ? "w-[520px] flex-row items-stretch" : "w-[300px] flex-col",
        onOpen && "cursor-pointer hover:border-line-2",
        className,
      )}
    >
      {cover}

      <div className={cn("flex flex-col p-3.5", compact ? "gap-[13px]" : "gap-3", row && "flex-1 justify-center")}>
        <div className="flex items-start gap-2.5">
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
                "line-clamp-2 font-display font-extrabold italic uppercase leading-[0.95] tracking-[0.01em] text-txt",
                compact ? "text-[17px]" : "text-[19px]",
              )}
            >
              {title}
            </div>
            {slug != null && (
              <div className="mt-[3px] font-mono text-[10px] tracking-[0.06em] text-txt-dim">{slug}</div>
            )}
          </div>
          {stateBadge != null && <span className="shrink-0">{stateBadge}</span>}
        </div>

        {summary != null && <div className="text-[13.5px] leading-[1.5] text-txt-muted">{summary}</div>}

        {serverStatus != null && <div>{serverStatus}</div>}

        {progress != null && <div>{progress}</div>}

        {error != null && (
          <div className="border border-solid border-bad/40 bg-bad-soft px-2.5 py-2 text-[11px] text-txt-muted">
            {error}
          </div>
        )}

        {(badges != null || footerMeta != null) && (
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-solid border-line pt-3 font-mono text-[11px] text-txt-muted">
            {badges}
            {footerMeta != null && <span className="w-full text-txt-dim">{footerMeta}</span>}
          </div>
        )}

        {(actions != null || menu != null) && (
          <div
            className="mt-auto flex items-stretch gap-2.5"
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
