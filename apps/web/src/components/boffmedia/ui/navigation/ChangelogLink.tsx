"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"

import { ChangelogService } from "@/services/api/boffmedia/changelogService"
import { useBoffSession } from "@/services/useBoffSession"

/** Permanent Boffmedia navigation entry. Anonymous visitors can open the feed;
 * signed-in viewers additionally get their unread count. */
export function ChangelogLink({ mobile = false }: { mobile?: boolean }) {
  const t = useTranslations("changelog")
  const { status } = useBoffSession()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status !== "authenticated") {
      setUnreadCount(0)
      return
    }
    let active = true
    void ChangelogService.list("boffmedia", "web", "es").then((response) => {
      if (active && response.success) setUnreadCount(response.data?.unreadCount ?? 0)
    }).catch(() => undefined)
    return () => { active = false }
  }, [status])

  return (
    <Link
      href="/changelog"
      aria-label={unreadCount > 0 ? t("openWithUnread", { count: unreadCount }) : t("open")}
      title={unreadCount > 0 ? t("openWithUnread", { count: unreadCount }) : t("open")}
      className={mobile
        ? "group flex items-center gap-2 border-b border-line py-3.5 font-display text-[1.0625rem] font-bold uppercase leading-none tracking-[0.06em] text-txt no-underline transition-colors hover:text-accent"
        : "relative inline-grid h-10 w-10 place-items-center border border-solid bg-panel text-txt-muted no-underline transition-[color,border-color,background] duration-[140ms] cut-tag cut-tag-edge border-line [--cut-line:var(--line)] hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:text-accent-bright"}
    >
      <Icon name="book" size={mobile ? 16 : 18} className={mobile ? "text-txt-dim transition-colors group-hover:text-accent" : undefined} />
      {mobile && <span>{t("shortTitle")}</span>}
      {unreadCount > 0 && (
        <span className={mobile
          ? "ml-auto grid h-[1.0625rem] min-w-[1.0625rem] place-items-center border-2 border-base bg-accent px-1 font-mono text-[0.625rem] font-extrabold leading-none text-accent-ink cut cut-edge-slant [--cut:3px] [--cut-w:2px] [--cut-line:var(--base)]"
          : "absolute -right-[0.3125rem] -top-[0.3125rem] grid h-[1.0625rem] min-w-[1.0625rem] place-items-center border-2 border-base bg-accent px-1 font-mono text-[0.625rem] font-extrabold leading-none text-accent-ink cut cut-edge-slant [--cut:3px] [--cut-w:2px] [--cut-line:var(--base)]"}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  )
}
