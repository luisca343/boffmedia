import * as React from "react"

import { cn } from "../cn"
import { Icon } from "../primitives/icon"

export type PackCardType = "server" | "client"
export type PackCardLayout = "card" | "row"

/** A pack library card. Deliberately slot-driven and state-free: the host supplies
 *  every dynamic node (the install-state badge, the live server-status strip, the
 *  action button, the kebab menu) already rendered, and this only owns the layout
 *  and the (sharp, cut-free) geometry. Nothing here pings a server or touches a
 *  runtime, so it renders identically in the launcher, in web admin and in the
 *  styleguide.
 *
 *  Redesign: no diagonal cut. A 16:9 cover-art hero on top (`art`, or a striped
 *  placeholder with the `icon` glyph), then a body — header row (title + slug +
 *  `stateBadge`), optional `serverStatus` strip / `progress` / `error` / `summary`,
 *  a meta `badges` row, and a footer (primary `actions` + `footerMeta` + `menu`).
 *  `layout="row"` lays the same slots out horizontally for a denser list view. */
export interface PackCardProps {
  /** Full-bleed cover art — e.g. a `<CatalogIcon/>` or `<img>`. */
  art?: React.ReactNode
  /** Centered glyph shown on the striped placeholder when there's no `art`. */
  icon?: React.ReactNode
  title: React.ReactNode
  /** Mono slug under the title. */
  slug?: React.ReactNode
  /** Header aside — the single install-state badge. */
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
  /** The meta row above the footer — version · file count, etc. */
  badges?: React.ReactNode
  /** Left of the footer — last-played / playtime text. */
  footerMeta?: React.ReactNode
  /** Corner note over the cover art — e.g. "Sin carátula". */
  artNote?: React.ReactNode
  /** Top-left overlay on the art — small pills / ribbons. */
  ribbon?: React.ReactNode
  /** Dims the art behind a lock (no-access state). */
  locked?: boolean
  /** The primary state-driven button (Install / Play / Repair …). */
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

  const cover = (
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

      <div className={cn("flex flex-col gap-3 p-3.5", row && "flex-1 justify-center")}>
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 font-display text-[19px] font-extrabold italic uppercase leading-[0.95] tracking-[0.01em] text-txt">
              {title}
            </div>
            {slug != null && (
              <div className="mt-[3px] font-mono text-[10px] tracking-[0.06em] text-txt-dim">{slug}</div>
            )}
          </div>
          {stateBadge != null && <span className="shrink-0">{stateBadge}</span>}
        </div>

        {serverStatus != null && <div>{serverStatus}</div>}

        {progress != null && <div>{progress}</div>}

        {error != null && (
          <div className="border border-solid border-bad/40 bg-bad-soft px-2.5 py-2 text-[11px] text-txt-muted">
            {error}
          </div>
        )}

        {summary != null && <div className="text-sm leading-[1.5] text-txt-muted">{summary}</div>}

        {badges != null && (
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-solid border-line pt-3 font-mono text-[11px] text-txt-muted">
            {badges}
          </div>
        )}

        {(actions != null || footerMeta != null || menu != null) && (
          <div
            className="mt-auto flex items-center gap-2.5"
            // A click on the button OR the kebab must not bubble to onOpen —
            // otherwise every menu open also navigates away.
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
            {footerMeta != null && <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.05em] text-txt-dim">{footerMeta}</span>}
            {menu != null && <span className="ml-auto shrink-0">{menu}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
