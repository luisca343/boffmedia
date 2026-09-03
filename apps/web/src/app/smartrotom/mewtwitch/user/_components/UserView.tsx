"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar, Check, CardSkeleton } from "@/components/smartrotom/media/ui"
import { useUser, useUserClips, useUserVideos } from "../../_hooks/useTwitch"
import { MEWTWITCH_BASE, compactCount, twitchThumb } from "../../_utils/twitch"
import { formatDuration, getTimeSince } from "../../_utils/format"
import { VodCard, type VodCardData } from "../../_components/VodCard"

export function UserView({ username }: { username: string }) {
  const t = useTranslations("twitch")
  const user = useUser(username)
  const u = user.data
  const [tab, setTab] = useState<"videos" | "clips">("videos")
  const videos = useUserVideos(u?.id ?? "")
  const clips = useUserClips(u?.id ?? "")

  if (user.isLoading) return <div className="p-6 text-sm text-mw-fg-faint">{t("user.channelLoading")}</div>
  if (!u) return <div className="p-6 text-sm text-mw-fg-faint">{t("user.channelNotFound")}</div>

  const videoCards: VodCardData[] = (videos.data ?? []).map((v) => ({
    href: `${MEWTWITCH_BASE}/video/${v.id}`,
    thumb: twitchThumb(v.thumbnail_url, 640, 360),
    title: v.title,
    duration: formatDuration(v.duration),
    meta: `${compactCount(v.view_count)} ${t("clip.views")} · ${getTimeSince(v.published_at)}`,
  }))
  const clipCards: VodCardData[] = (clips.data ?? []).map((c) => ({
    href: `${MEWTWITCH_BASE}/clip/${c.id}`,
    thumb: c.thumbnail_url,
    title: c.title,
    streamer: c.creator_name,
    meta: `${compactCount(c.view_count)} ${t("clip.views")} · ${getTimeSince(c.created_at)}`,
  }))

  const active = tab === "videos" ? videoCards : clipCards
  const loading = tab === "videos" ? videos.isLoading : clips.isLoading

  return (
    <div className="mx-auto max-w-[102.5rem] px-4 pb-20 pt-8 md:px-10">
      <div className="mb-6 flex flex-wrap items-center gap-5">
        <Avatar src={u.profile_image_url} name={u.display_name} size={96} ring />
        <div>
          <div className="inline-flex items-center gap-2 font-mw-display text-3xl font-extrabold">
            {u.display_name}
            {u.broadcaster_type === "partner" && <Check size="lg" />}
          </div>
          <div className="mt-1 text-sm text-mw-fg-mute">{compactCount(u.view_count)} {t("user.totalViewsSuffix")}</div>
          {u.description && <p className="mt-2 max-w-[45rem] text-sm text-mw-fg-mute line-clamp-2">{u.description}</p>}
        </div>
      </div>

      <div className="mb-5 flex gap-1 border-b border-mw-line">
        {(["videos", "clips"] as const).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setTab(tabKey)}
            className={
              "-mb-px border-b-2 px-4 py-3 text-[0.8125rem] font-semibold transition-colors " +
              (tab === tabKey ? "border-mw-accent text-mw-fg" : "border-transparent text-mw-fg-mute hover:text-mw-fg")
            }
          >
            {tabKey === "videos" ? t("user.videos") : t("user.clips")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-[1.125rem] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : active.map((v) => <VodCard key={v.href} v={v} />)}
      </div>
      {!loading && active.length === 0 && (
        <p className="py-12 text-center text-sm text-mw-fg-faint">{t("user.noContent")}</p>
      )}
    </div>
  )
}
