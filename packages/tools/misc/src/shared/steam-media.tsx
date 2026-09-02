"use client"

import * as React from "react"
import { Icon } from "@boffmedia/ui"
import type { MediaItem, SteamGame } from "./useFetchSteamData"

/**
 * Steam artwork + media viewer, shared by the sibling Steam tools (`keys`,
 * `steamfree`). Locale-agnostic on purpose: the only string it needs is the
 * thumbnail's a11y label, which each host passes in from its own namespace.
 */

const FALLBACK_BG = "repeating-linear-gradient(-45deg, var(--bg-2) 0 10px, var(--panel-2) 10px 20px)"

export function SteamArtFallback({ size = 34 }: { size?: number }) {
  return (
    <div className="absolute inset-0 grid place-items-center text-line-2" style={{ background: FALLBACK_BG }}>
      <Icon name="gamepad" size={size} />
    </div>
  )
}

/**
 * Fills its parent absolutely, so height is driven purely by the parent's
 * aspect-ratio — identical whether the art loads or falls back.
 */
export function SteamArt({ src, name, className }: { src?: string; name: string; className?: string }) {
  const [err, setErr] = React.useState(false)
  React.useEffect(() => setErr(false), [src])
  return (
    <div className={"absolute inset-0 overflow-hidden bg-base-2 " + (className ?? "")}>
      {src && !err ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setErr(true)}
          className="block h-full w-full object-cover"
        />
      ) : (
        <SteamArtFallback />
      )}
    </div>
  )
}

/* ── media gallery (screenshots + trailers) ───────────────────────────────── */

function isVideo(m: MediaItem): boolean {
  return "thumbnail" in m && !("path_full" in m)
}
function videoSrc(m: any): string | undefined {
  return m?.mp4?.max || m?.mp4?.["480"] || m?.webm?.max || m?.webm?.["480"]
}
function imgSrc(m: any): string | undefined {
  return m?.path_full || m?.path_thumbnail
}
function thumbSrc(m: any): string | undefined {
  return isVideo(m) ? m?.thumbnail : m?.path_thumbnail || m?.path_full
}

export function SteamGallery({
  media,
  name,
  thumbLabel,
}: {
  media: MediaItem[]
  name: string
  /** a11y label for thumbnail `n` (1-based). */
  thumbLabel: (n: number) => string
}) {
  const [i, setI] = React.useState(0)
  const [err, setErr] = React.useState<Record<number, boolean>>({})
  const shots = media || []
  const current = shots[i]

  if (!shots.length) {
    return (
      <div className="relative grid aspect-video place-items-center border border-line-2">
        <SteamArtFallback />
      </div>
    )
  }

  return (
    <div className="grid gap-[10px]">
      <div className="relative aspect-video overflow-hidden border border-line-2 bg-base-2">
        {isVideo(current) ? (
          <video key={"v" + i} src={videoSrc(current)} controls className="h-full w-full object-cover" />
        ) : !err[i] ? (
          <img
            key={"i" + i}
            src={imgSrc(current)}
            alt={name + " " + (i + 1)}
            onError={() => setErr((e) => ({ ...e, [i]: true }))}
            className="h-full w-full object-contain"
          />
        ) : (
          <SteamArtFallback />
        )}
      </div>
      {shots.length > 1 && (
        <div className="grid grid-cols-4 gap-[8px]">
          {shots.map((s, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setI(k)}
              aria-label={thumbLabel(k + 1)}
              className={
                "relative aspect-video overflow-hidden border bg-base-2 p-0 transition-colors duration-[120ms] " +
                (k === i ? "border-accent shadow-[inset_0_0_0_1px_var(--accent)]" : "border-line hover:border-line-2")
              }
            >
              <img src={thumbSrc(s)} alt="" className="h-full w-full object-cover" />
              {isVideo(s) && (
                <span className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_30%,transparent)]">
                  <Icon name="play" size={16} className="text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── dev / publisher / release / platforms fact grid ──────────────────────── */

export function SteamFact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[5px] bg-panel px-[13px] py-[11px] transition-colors duration-[120ms] hover:bg-panel-2">
      <span className="font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-dim">{k}</span>
      <span className="font-display text-[13px] font-semibold leading-[1.3] text-txt">{children}</span>
    </div>
  )
}

export function platformList(p: SteamGame["platforms"] | { windows: boolean; mac: boolean; linux: boolean }): string {
  const out: string[] = []
  if (p?.windows) out.push("Windows")
  if (p?.mac) out.push("macOS")
  if (p?.linux) out.push("Linux")
  return out.join(" · ") || "—"
}
