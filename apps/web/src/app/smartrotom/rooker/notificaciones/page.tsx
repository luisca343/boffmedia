"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { EmptyState, FeedSkeleton, Icon, SubHeader } from "../_components/ui"
import { useNotifications, useRookerUuid } from "../_hooks/queries"
import { useFormat } from "../_hooks/useFormat"

/**
 * The notification inbox.
 *
 * There is no Rooker notifications table: `rotom_notifications` was already generic —
 * a free-form `type`, a title, a body and a deep `link` — so Rooker writes rows into it
 * with `type = 'rooker'` and reads them back filtered. That is why a reply, a reaction
 * and a follow all arrive through one path, and why nothing had to be duplicated.
 *
 * The row's glyph is inferred from the link it carries rather than from a stored kind,
 * because the notification layer has no notion of Rooker's verbs — a notification that
 * points at a trino is about a trino, and one that points at a profile is about a
 * follow.
 */
function glyphFor(link: string | null) {
  if (link?.includes("/trino/")) return { icon: "reply" as const, tone: "text-rk-accent", wash: "bg-rk-accent/15" }
  return { icon: "users" as const, tone: "text-rk-rt", wash: "bg-rk-rt/15" }
}

export default function NotificacionesPage() {
  const t = useTranslations("rooker")
  const { relTime } = useFormat()
  const uuid = useRookerUuid()
  const { data: notifications, isLoading } = useNotifications()

  if (!uuid) {
    return (
      <div>
        <SubHeader title={t("notifications.title")} />
        <EmptyState
          icon="bell"
          title={t("common.loginRequiredTitle")}
          body={t("notifications.loggedOutBody")}
        />
      </div>
    )
  }

  return (
    <div>
      <SubHeader title={t("notifications.title")} />

      {isLoading ? (
        <FeedSkeleton rows={4} />
      ) : notifications?.length ? (
        notifications.map((n) => {
          const g = glyphFor(n.link)
          const unread = !n.isRead
          const body = (
            <div
              className={cn(
                "flex gap-3 border-b border-rk-line px-4 py-3.5 transition-colors hover:bg-rk-hover",
                unread && "bg-rk-accent/[.06]",
              )}
            >
              <span className={cn("grid h-[30px] w-[30px] flex-none place-items-center rounded-full", g.wash)}>
                <Icon name={g.icon} size={17} className={g.tone} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] leading-snug text-rk-fg">
                  <span className={unread ? "font-bold" : "font-semibold"}>{n.title}</span>
                  <span className="text-rk-fg-subtle"> · {relTime(n.createdAt)}</span>
                </div>
                {n.body && <p className="mt-0.5 truncate text-[13.5px] text-rk-fg-subtle">{n.body}</p>}
              </div>
              {unread && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-rk-accent" />}
            </div>
          )

          return n.link ? (
            <Link key={n.id} href={n.link}>
              {body}
            </Link>
          ) : (
            <div key={n.id}>{body}</div>
          )
        })
      ) : (
        <EmptyState
          icon="bell"
          title={t("notifications.empty.title")}
          body={t("notifications.empty.body")}
        />
      )}
    </div>
  )
}
