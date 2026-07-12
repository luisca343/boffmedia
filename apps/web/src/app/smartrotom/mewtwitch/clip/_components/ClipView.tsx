"use client"

import { useEffect, useState } from "react"
import { useClip } from "../../_hooks/useTwitch"
import { compactCount } from "../../_utils/twitch"
import { getTimeSince } from "../../types"

export function ClipView({ id }: { id: string }) {
  const clip = useClip(id)
  const [host, setHost] = useState("")
  useEffect(() => setHost(window.location.hostname), [])
  const c = clip.data

  if (clip.isLoading) return <div className="p-6 text-sm text-mw-fg-faint">Cargando clip…</div>
  if (!c) return <div className="p-6 text-sm text-mw-fg-faint">No se encontró el clip.</div>

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-20 pt-6 md:px-10">
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
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-mw-fg-mute">
        <span className="font-semibold text-mw-fg">{c.broadcaster_name}</span>
        <span>·</span>
        <span>{compactCount(c.view_count)} visitas</span>
        <span>·</span>
        <span>{getTimeSince(c.created_at)}</span>
        {c.creator_name && (
          <>
            <span>·</span>
            <span>clip de {c.creator_name}</span>
          </>
        )}
      </div>
    </div>
  )
}
