"use client"

import { useEffect, useState } from "react"
import { LivePill, PulseDot } from "@/components/smartrotom/media/ui"
import { useFormat } from "@/lib/useFormat"

/**
 * Twitch embed player (their player, our chrome — ToS-compliant) with a live
 * pill + viewer pulse overlaid. Playback controls come from the embed itself.
 */
export function StreamPlayer({ channel, viewers, poster }: { channel: string; viewers?: number; poster?: string }) {
  const [host, setHost] = useState("")
  useEffect(() => setHost(window.location.hostname), [])
  const { number } = useFormat()

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-mw-2xl border border-[color-mix(in_srgb,rgb(var(--mw-accent))_45%,var(--mw-hairline))] bg-black">
      {host ? (
        <iframe
          src={`https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${host}&muted=true`}
          title={channel}
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        poster && (
           
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )
      )}
      <div className="pointer-events-none absolute left-3.5 top-3.5 z-[2] inline-flex items-center gap-2">
        <LivePill size="lg" className="shadow-[0_4px_14px_rgb(var(--mw-accent)/.35)]" />
        {viewers != null && (
          <span className="inline-flex items-center gap-1.5 rounded-mw-pill border border-mw-line-strong bg-black/65 px-2.5 py-1 font-mono text-[11px] text-white">
            <PulseDot /> {number(viewers)}
          </span>
        )}
      </div>
    </div>
  )
}
