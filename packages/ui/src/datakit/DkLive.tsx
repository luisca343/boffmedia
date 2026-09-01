"use client"

import * as React from "react"
import { useNsT, type Translate } from "../i18n"
import { cn } from "../cn"
import { Icon } from "../primitives"

// live / playing / pending / final / soon status pill. Mirrors `.dk-live`.
const DK_LIVE: Record<string, [string, string, boolean]> = {
  live: ["dkLive.live", "live", true],
  playing: ["dkLive.playing", "playing", true],
  pending: ["dkLive.pending", "pending", false],
  final: ["dkLive.final", "final", false],
  soon: ["dkLive.soon", "soon", false],
  done: ["dkLive.done", "final", false],
}

const DK_LIVE_TONE: Record<string, string> = {
  live: "text-ok border-[color:color-mix(in_srgb,var(--ok)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft",
  playing: "text-warn border-[color:color-mix(in_srgb,var(--warn)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft",
  pending: "text-txt-dim border-line-2 [--cut-line:var(--line-2)] bg-transparent",
  final: "text-txt-muted border-line-2 [--cut-line:var(--line-2)] bg-panel-2",
  soon: "text-info border-[color:color-mix(in_srgb,var(--info)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--info)_45%,transparent)] bg-info-soft",
}

export function DkLive({ status = "live", label, size = "md" }: { status?: string; label?: React.ReactNode; size?: "sm" | "md" }) {
  const t = useNsT("common")
  const [defLabelKey, kind, dot] = DK_LIVE[status] || DK_LIVE.live
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap border border-solid font-mono font-bold uppercase tracking-[0.14em] cut cut-edge-slant [--cut:3px]",
        size === "sm" ? "px-1.5 py-1 text-[8px]/none" : "px-2 py-[5px] text-[9px]/none",
        DK_LIVE_TONE[kind],
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-[bm-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none" aria-hidden="true" />}
      {label != null ? label : t(defLabelKey)}
    </span>
  )
}

function dkRelTime(ms: number, t: Translate): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000))
  if (s < 5) return t("dkLive.justNow")
  if (s < 60) return t("dkLive.secondsAgo", { seconds: s })
  const m = Math.round(s / 60)
  if (m < 60) return t("dkLive.minutesAgo", { minutes: m })
  return t("dkLive.hoursAgo", { hours: Math.round(m / 60) })
}

// «updated N ago», auto-ticking + manual refresh. Mirrors `.dk-updated`.
export function DkUpdated({ updatedAt, live = false, onRefresh }: { updatedAt: number; live?: boolean; onRefresh?: () => void }) {
  const t = useNsT("common")
  const [, force] = React.useState(0)
  React.useEffect(() => {
    if (!live) return undefined
    const id = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [live])
  return (
    <span className="inline-flex items-center gap-[7px] whitespace-nowrap font-mono text-[10px]/none font-medium tracking-[0.06em] text-txt-dim">
      {live && <Icon name="refresh" size={13} className="animate-[bm-spin_2.6s_linear_infinite] text-ok motion-reduce:animate-none" />}
      <span suppressHydrationWarning>{dkRelTime(updatedAt, t)}</span>
      {onRefresh && (
        <button type="button" onClick={onRefresh} aria-label={t("dkLive.refreshNow")} className="grid cursor-pointer place-items-center border-0 bg-transparent p-[3px] text-txt-dim hover:text-accent-bright">
          <Icon name="refresh" size={13} />
        </button>
      )}
    </span>
  )
}
