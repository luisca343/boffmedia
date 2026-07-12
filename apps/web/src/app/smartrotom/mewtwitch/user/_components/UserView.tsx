"use client"

import { useState } from "react"
import { Avatar, Check, CardSkeleton } from "@/components/smartrotom/media/ui"
import { useUser, useUserClips, useUserVideos } from "../../_hooks/useTwitch"
import { MEWTWITCH_BASE, compactCount, twitchThumb } from "../../_utils/twitch"
import { formatDuration, getTimeSince } from "../../types"
import { VodCard, type VodCardData } from "../../_components/VodCard"

export function UserView({ username }: { username: string }) {
  const user = useUser(username)
  const u = user.data
  const [tab, setTab] = useState<"videos" | "clips">("videos")
  const videos = useUserVideos(u?.id ?? "")
  const clips = useUserClips(u?.id ?? "")

  if (user.isLoading) return <div className="p-6 text-sm text-mw-fg-faint">Cargando canal…</div>
  if (!u) return <div className="p-6 text-sm text-mw-fg-faint">No se encontró el canal.</div>

  const videoCards: VodCardData[] = (videos.data ?? []).map((v) => ({
    href: `${MEWTWITCH_BASE}/video/${v.id}`,
    thumb: twitchThumb(v.thumbnail_url, 640, 360),
    title: v.title,
    duration: formatDuration(v.duration),
    meta: `${compactCount(v.view_count)} visitas · ${getTimeSince(v.published_at)}`,
  }))
  const clipCards: VodCardData[] = (clips.data ?? []).map((c) => ({
    href: `${MEWTWITCH_BASE}/clip/${c.id}`,
    thumb: c.thumbnail_url,
    title: c.title,
    streamer: c.creator_name,
    meta: `${compactCount(c.view_count)} visitas · ${getTimeSince(c.created_at)}`,
  }))

  const active = tab === "videos" ? videoCards : clipCards
  const loading = tab === "videos" ? videos.isLoading : clips.isLoading

  return (
    <div className="mx-auto max-w-[1640px] px-4 pb-20 pt-8 md:px-10">
      <div className="mb-6 flex flex-wrap items-center gap-5">
        <Avatar src={u.profile_image_url} name={u.display_name} size={96} ring />
        <div>
          <div className="inline-flex items-center gap-2 font-mw-display text-3xl font-extrabold">
            {u.display_name}
            {u.broadcaster_type === "partner" && <Check size="lg" />}
          </div>
          <div className="mt-1 text-sm text-mw-fg-mute">{compactCount(u.view_count)} visualizaciones totales</div>
          {u.description && <p className="mt-2 max-w-[720px] text-sm text-mw-fg-mute line-clamp-2">{u.description}</p>}
        </div>
      </div>

      <div className="mb-5 flex gap-1 border-b border-mw-line">
        {(["videos", "clips"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              "-mb-px border-b-2 px-4 py-3 text-[13px] font-semibold transition-colors " +
              (tab === t ? "border-mw-accent text-mw-fg" : "border-transparent text-mw-fg-mute hover:text-mw-fg")
            }
          >
            {t === "videos" ? "Vídeos" : "Clips"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : active.map((v) => <VodCard key={v.href} v={v} />)}
      </div>
      {!loading && active.length === 0 && (
        <p className="py-12 text-center text-sm text-mw-fg-faint">Nada por aquí todavía.</p>
      )}
    </div>
  )
}
