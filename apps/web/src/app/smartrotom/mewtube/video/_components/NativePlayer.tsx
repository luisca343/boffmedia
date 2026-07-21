"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { I } from "@/components/smartrotom/media/ui"
import type { Chapter } from "../../_utils/chapters"

export interface NativePlayerHandle {
  seek(seconds: number): void
}

// Minimal slice of the YouTube IFrame Player API we drive.
interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  setVolume(v: number): void
  destroy?(): void
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: unknown) => YTPlayer
  PlayerState: { PLAYING: number }
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytReady: Promise<void> | null = null
function loadYT(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (ytReady) return ytReady
  ytReady = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const s = document.createElement("script")
    s.src = "https://www.youtube.com/iframe_api"
    s.async = true
    document.head.appendChild(s)
  })
  return ytReady
}

function fmt(t: number): string {
  if (!Number.isFinite(t) || t < 0) return "0:00"
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = Math.floor(t % 60)
  const pad = (x: number) => x.toString().padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

const PauseGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" fill="currentColor" />
  </svg>
)
const VolGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9zM16 9a3 3 0 0 1 0 6" />
  </svg>
)
const FsGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
)

/**
 * Native Mewtube player: the official YouTube IFrame Player API (our controls,
 * their player — ToS-compliant) with real play/seek, a scrubbable progress bar,
 * chapter ticks that seek, and keyboard shortcuts (k play/pause, f fullscreen).
 */
export const NativePlayer = forwardRef<
  NativePlayerHandle,
  { videoId: string; poster?: string; title?: string; chapters?: Chapter[] }
>(function NativePlayer({ videoId, poster, title, chapters = [] }, ref) {
  const t = useTranslations("mewtube")
  const holderRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const [vol, setVol] = useState(72)

  useEffect(() => {
    let cancelled = false
    let iv: ReturnType<typeof setInterval> | undefined
    void loadYT().then(() => {
      if (cancelled || !holderRef.current || !window.YT) return
      playerRef.current = new window.YT.Player(holderRef.current, {
        videoId,
        playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            setReady(true)
            setDur(e.target.getDuration())
            e.target.setVolume(vol)
          },
          onStateChange: (e: { data: number }) => setPlaying(e.data === window.YT!.PlayerState.PLAYING),
        },
      })
      iv = setInterval(() => {
        const p = playerRef.current
        if (p && typeof p.getCurrentTime === "function") {
          setCur(p.getCurrentTime())
          const d = p.getDuration()
          if (d) setDur(d)
        }
      }, 500)
    })
    return () => {
      cancelled = true
      if (iv) clearInterval(iv)
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
    // vol is an init-only default; re-running on volume change would rebuild the player
     
  }, [videoId])

  const toggle = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }, [playing])

  const seekTo = useCallback((seconds: number, resume = true) => {
    playerRef.current?.seekTo(seconds, true)
    if (resume) playerRef.current?.playVideo()
  }, [])

  useImperativeHandle(ref, () => ({ seek: (s: number) => seekTo(s) }), [seekTo])

  const onBar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dur) return
    const r = e.currentTarget.getBoundingClientRect()
    seekTo(((e.clientX - r.left) / r.width) * dur, false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "k" || e.key === " ") {
      e.preventDefault()
      toggle()
    } else if (e.key === "f") {
      wrapRef.current?.requestFullscreen?.()
    }
  }

  const pct = dur ? (cur / dur) * 100 : 0

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={onKey}
      className="relative aspect-video w-full overflow-hidden rounded-mw-2xl border border-mw-line bg-black outline-none focus-visible:ring-2 focus-visible:ring-mw-accent"
    >
      <div ref={holderRef} className="absolute inset-0 h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />

      {!ready && poster && (
         
        <img src={poster} alt={title ?? ""} className="absolute inset-0 z-[1] h-full w-full object-cover" />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] grid grid-cols-[auto_auto_auto_1fr_auto] items-center gap-3.5 px-4 pb-4 pt-3 text-white [background:linear-gradient(to_top,rgba(0,0,0,.75),transparent)]">
        <div className="pointer-events-auto order-first col-span-full mb-2 h-1 cursor-pointer rounded-full bg-white/15" onClick={onBar}>
          <div className="relative h-full">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-mw-accent shadow-[0_0_8px_rgb(var(--mw-accent)/.35)]"
              style={{ width: `${pct}%` }}
            />
            {chapters.map((c) => (
              <button
                key={c.seconds}
                type="button"
                aria-label={t("player.seekTo", { label: c.label })}
                onClick={(e) => {
                  e.stopPropagation()
                  seekTo(c.seconds)
                }}
                className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-[1px] bg-white/70 hover:bg-white"
                style={{ left: dur ? `${(c.seconds / dur) * 100}%` : "0" }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t("player.pause") : t("player.play")}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
        >
          {playing ? <PauseGlyph /> : <I.play size={18} />}
        </button>

        <div className="pointer-events-auto flex items-center gap-2">
          <VolGlyph />
          <input
            type="range"
            min={0}
            max={100}
            value={vol}
            onChange={(e) => {
              const v = Number(e.target.value)
              setVol(v)
              playerRef.current?.setVolume(v)
            }}
            className="w-20 accent-white"
            aria-label={t("player.volume")}
          />
        </div>

        <div className="pointer-events-auto whitespace-nowrap font-mono text-xs text-white/85">
          {fmt(cur)} / {fmt(dur)}
        </div>

        <div />

        <div className="pointer-events-auto flex gap-0.5">
          <button
            type="button"
            onClick={() => wrapRef.current?.requestFullscreen?.()}
            aria-label={t("player.fullscreen")}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
          >
            <FsGlyph />
          </button>
        </div>
      </div>
    </div>
  )
})
