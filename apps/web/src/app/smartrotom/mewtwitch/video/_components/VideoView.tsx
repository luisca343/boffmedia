"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useVideo } from "../../_hooks/useTwitch"
import { compactCount } from "../../_utils/twitch"
import { getTimeSince } from "../../_utils/format"

export function VideoView({ id }: { id: string }) {
  const t = useTranslations("twitch")
  const video = useVideo(id)
  const [host, setHost] = useState("")
  useEffect(() => setHost(window.location.hostname), [])
  const v = video.data

  if (video.isLoading) return <div className="p-6 text-sm text-mw-fg-faint">{t("video.loading")}</div>
  if (!v) return <div className="p-6 text-sm text-mw-fg-faint">{t("video.notFound")}</div>

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-20 pt-6 md:px-10">
      <div className="relative aspect-video w-full overflow-hidden rounded-mw-2xl border border-mw-line bg-black">
        {host && (
          <iframe
            src={`https://player.twitch.tv/?video=${encodeURIComponent(id)}&parent=${host}`}
            title={v.title}
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )}
      </div>
      <h1 className="mb-2 mt-4 font-mw-display text-2xl font-extrabold leading-[1.25]">{v.title}</h1>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-mw-fg-mute">
        <span className="font-semibold text-mw-fg">{v.user_name}</span>
        <span>·</span>
        <span>{compactCount(v.view_count)} {t("video.views")}</span>
        <span>·</span>
        <span>{getTimeSince(v.published_at)}</span>
      </div>
      {v.description && (
        <p className="mt-4 whitespace-pre-line rounded-mw-2xl border border-mw-line bg-mw-800 px-5 py-4 text-sm leading-[1.6] text-mw-fg-mute">
          {v.description}
        </p>
      )}
    </div>
  )
}
