"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useClip } from "../../_hooks/useTwitch"
import { compactCount } from "../../_utils/twitch"
import { getTimeSince } from "../../_utils/format"

export function ClipView({ id }: { id: string }) {
  const t = useTranslations("twitch")
  const clip = useClip(id)
  const [host, setHost] = useState("")
  useEffect(() => setHost(window.location.hostname), [])
  const c = clip.data

  if (clip.isLoading) return <div className="p-6 text-sm text-mw-fg-faint">{t("clip.loading")}</div>
  if (!c) return <div className="p-6 text-sm text-mw-fg-faint">{t("clip.notFound")}</div>

  return (
    <div className="mx-auto max-w-[68.75rem] px-4 pb-20 pt-6 md:px-10">
      <div className="relative aspect-video w-full overflow-hidden rounded-mw-2xl border border-mw-line bg-black">
        {host && (
          <iframe
            src={`https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}&parent=${host}`}
            title={c.title}
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )}
      </div>
      <h1 className="mb-2 mt-4 font-mw-display text-2xl font-extrabold leading-[1.25]">{c.title}</h1>
      <div className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-mw-fg-mute">
        <span className="font-semibold text-mw-fg">{c.broadcaster_name}</span>
        <span>·</span>
        <span>{compactCount(c.view_count)} {t("clip.views")}</span>
        <span>·</span>
        <span>{getTimeSince(c.created_at)}</span>
        {c.creator_name && (
          <>
            <span>·</span>
            <span>{t("clip.byCreator", { creator: c.creator_name })}</span>
          </>
        )}
      </div>
    </div>
  )
}
