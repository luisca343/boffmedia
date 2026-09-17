"use client"

import Link from "next/link"
import { BookOpen } from "@boffmedia/ui"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import { SmartRotomBadge } from "@/components/smartrotom/ui"
import { ChangelogService } from "@/services/api/boffmedia/changelogService"
import { useBoffSession } from "@/services/useBoffSession"

/** Permanent SmartRotom navigation entry. The feed itself is public; unread
 * state is only requested for a signed-in Boffmedia account. */
export function ChangelogLink() {
  const t = useTranslations("changelog")
  const { status } = useBoffSession()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status !== "authenticated") {
      setUnreadCount(0)
      return
    }
    let active = true
    void ChangelogService.list("smartrotom", "web", "es").then((response) => {
      if (active && response.success) setUnreadCount(response.data?.unreadCount ?? 0)
    }).catch(() => undefined)
    return () => { active = false }
  }, [status])

  return (
    <Link
      href="/smartrotom/changelog"
      aria-label={unreadCount > 0 ? t("openWithUnread", { count: unreadCount }) : t("open")}
      title={unreadCount > 0 ? t("openWithUnread", { count: unreadCount }) : t("open")}
      className="group relative mx-0.5 flex h-8 w-8 items-center justify-center rounded-none transition-colors hover:bg-sr-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sr-accent"
    >
      <BookOpen size={20} aria-hidden="true" className="text-sr-txt-muted transition-colors group-hover:text-sr-accent-bright" />
      {unreadCount > 0 && (
        <SmartRotomBadge variant="button" className="absolute -bottom-2 -right-2 z-50 px-1.5">
          {unreadCount > 99 ? "99+" : unreadCount}
        </SmartRotomBadge>
      )}
    </Link>
  )
}
