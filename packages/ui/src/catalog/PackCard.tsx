import * as React from "react"

import { cn } from "../cn"
import { useT } from "../i18n"
import { Panel } from "../primitives/panel"
import { Icon } from "../primitives/icon"

export type PackCardType = "server" | "client"

/** A pack library card. Deliberately slot-driven and stateful-free: the host
 *  supplies every dynamic node (the install-state badge, the live server-status
 *  badge, the action button, the kebab menu) already rendered, and this only
 *  owns the layout, the geometry and the server/client banner. Nothing here
 *  pings a server or touches a runtime, so it renders identically in the
 *  launcher, in web admin, and in Storybook.
 *
 *  The type is the ONE piece of presentation the card decides for itself: a
 *  `type="server"` pack gets a full-bleed accent strip under the header that
 *  carries the type label and the server-status slot, so a server pack reads as
 *  one at a glance in a grid; a `type="client"` pack gets no strip and keeps the
 *  vertical rhythm tight. */
export interface PackCardProps {
  /** Leading header media — e.g. a `<CatalogIcon/>`. */
  icon?: React.ReactNode
  title: React.ReactNode
  /** Header aside — typically the install-state badge. */
  stateBadge?: React.ReactNode
  type: PackCardType
  /** Rendered inside the server banner, right-aligned — the live status badge.
   *  Only shown for `type="server"`. */
  serverStatus?: React.ReactNode
  summary?: React.ReactNode
  /** Install progress region (bar + phase text), composed by the host. */
  progress?: React.ReactNode
  /** Broken-state message, composed by the host. */
  error?: React.ReactNode
  /** The meta row above the footer — access badge, version · file count, etc. */
  badges?: React.ReactNode
  /** Left of the footer — last-played / playtime text. */
  footerMeta?: React.ReactNode
  /** The primary state-driven button (Install / Play / Repair …). */
  actions?: React.ReactNode
  /** The kebab menu. Clicks inside it never navigate the card. */
  menu?: React.ReactNode
  /** Card click — usually "open the detail view". */
  onOpen?: () => void
  className?: string
}

export function PackCard({
  icon,
  title,
  stateBadge,
  type,
  serverStatus,
  summary,
  progress,
  error,
  badges,
  footerMeta,
  actions,
  menu,
  onOpen,
  className,
}: PackCardProps) {
  const t = useT()

  return (
    <Panel
      hover
      media={icon}
      title={title}
      aside={stateBadge}
      className={cn("cursor-pointer", className)}
      onClick={onOpen}
    >
      {type === "server" && (
        // Full-bleed: negative margins pull the strip to the panel edges and up
        // against the header's bottom border so it reads as a banner, not a box.
        <div className="-mx-5 -mt-5 mb-4 flex items-center gap-2 border-b border-solid border-accent-line bg-accent-soft px-5 py-2 text-accent-bright">
          <Icon name="server" size={13} className="flex-none" />
          <span className="font-mono text-[10.5px] font-bold uppercase leading-none tracking-[0.12em]">
            {t("serverPack")}
          </span>
          {serverStatus && <span className="ml-auto flex items-center">{serverStatus}</span>}
        </div>
      )}

      {summary != null && <div className="mb-4 min-h-[40px] text-sm text-txt-muted">{summary}</div>}

      {progress && <div className="mb-4">{progress}</div>}

      {error && (
        <div className="mb-4 rounded-sm border border-solid border-bad/40 bg-bad/10 px-2.5 py-2 text-[11px] text-txt-muted">
          {error}
        </div>
      )}

      {badges && <div className="mb-4 flex flex-wrap items-center gap-2">{badges}</div>}

      <div className="flex items-center justify-between gap-3 border-t border-solid border-line pt-3">
        <span className="min-w-0 text-xs text-txt-dim">{footerMeta}</span>
        {(actions || menu) && (
          // A click on the button OR the kebab must not bubble to the Panel's
          // onOpen — otherwise every menu open also navigates away.
          <span
            className="flex flex-none items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
            {menu}
          </span>
        )}
      </div>
    </Panel>
  )
}
