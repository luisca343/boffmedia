"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { kvCapsuleArt, kvHeaderArt, kvPlatformMeta, kvReviewColor, kvViaMeta, type KvPlatform, type KvViaKey } from "./keys-util"

const ART_FB = "grid h-full w-full place-items-center text-line-2 [background:repeating-linear-gradient(-45deg,var(--bg-2)_0_10px,var(--panel-2)_10px_20px)]"

// Steam art with a striped fallback. Fills its parent (which sets the aspect).
export function KvArt({ appid, name, kind = "header", src }: { appid?: number; name: string; kind?: "header" | "capsule"; src?: string }) {
  const [err, setErr] = React.useState(false)
  const url = src || (appid != null ? (kind === "capsule" ? kvCapsuleArt(appid) : kvHeaderArt(appid)) : "")
  return (
    <div className="relative h-full w-full overflow-hidden bg-base-2">
      {!err && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} loading="lazy" onError={() => setErr(true)} className="block h-full w-full object-cover" />
      ) : (
        <div className={cn("relative", ART_FB)}>
          <Icon name="gamepad" size={34} />
          <small className="absolute bottom-2.5 font-mono text-[9px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim">{name}</small>
        </div>
      )}
    </div>
  )
}

export function KvStatus({ given }: { given?: boolean }) {
  return (
    <span
      className={cn(
        "cut [--cut:4px] inline-flex items-center gap-[7px] border border-solid px-[9px] py-1.5 font-mono text-[9.5px]/none font-bold uppercase tracking-[0.1em]",
        given ? "border-[color-mix(in_srgb,var(--warn)_28%,transparent)] bg-[color-mix(in_srgb,var(--warn)_8%,transparent)] text-txt-dim" : "border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-ok-soft text-ok",
      )}
    >
      <Icon name={given ? "check" : "bookmark"} size={11} />
      {given ? "Entregada" : "Disponible"}
    </span>
  )
}

export function KvVia({ via, sm }: { via: KvViaKey; sm?: boolean }) {
  const m = kvViaMeta(via)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] border border-solid font-mono font-semibold uppercase",
        sm ? "px-[7px] py-[5px] text-[9.5px]/none tracking-[0.06em]" : "px-[9px] py-1.5 text-[10px]/none tracking-[0.08em]",
        via === "sorteo" ? "border-accent-line bg-accent-soft text-accent" : "border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-[color:var(--info-soft)] text-[color:var(--info)]",
      )}
    >
      <Icon name={m.icon} size={12} className="flex-none" />
      {sm ? m.short : m.label}
    </span>
  )
}

export function KvReview({ score, count, sm }: { score: number; count?: number; sm?: boolean }) {
  const color = kvReviewColor(score)
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("flex-none font-display font-extrabold italic tabular-nums", sm ? "text-[13px]/none" : "text-[15px]/none")} style={{ color }}>
        {score}%
      </span>
      <span className="h-1.5 min-w-[60px] flex-1 overflow-hidden border border-solid border-line bg-panel-2">
        <span className="block h-full transition-[width] duration-[420ms]" style={{ width: score + "%", background: color }} />
      </span>
      {count != null && <span className="flex-none font-mono text-[10px]/none font-medium tracking-[0.03em] text-txt-dim">{count.toLocaleString("es")} reseñas</span>}
    </div>
  )
}

export function KvTags({ tags, max }: { tags: string[]; max?: number }) {
  const list = max ? tags.slice(0, max) : tags
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((t) => (
        <span key={t} className="border border-solid border-line-2 bg-panel-2 px-2 py-[5px] font-mono text-[9.5px]/none font-semibold uppercase tracking-[0.05em] text-txt-muted">
          {t}
        </span>
      ))}
      {max && tags.length > max && <span className="border border-solid border-line-2 bg-panel-2 px-2 py-[5px] font-mono text-[9.5px]/none font-semibold uppercase tracking-[0.05em] text-txt-muted">+{tags.length - max}</span>}
    </div>
  )
}

export function KvPlatforms({ platforms }: { platforms: KvPlatform[] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {(platforms || []).map((p) => {
        const m = kvPlatformMeta(p)
        return (
          <span key={p} title={m.label} className="grid h-[26px] w-[26px] place-items-center border border-solid border-line-2 bg-panel-2 text-txt-muted">
            <Icon name={m.icon} size={13} />
          </span>
        )
      })}
    </span>
  )
}
