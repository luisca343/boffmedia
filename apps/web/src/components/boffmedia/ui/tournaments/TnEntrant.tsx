"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { DkFlag, DkPin, DkLive } from "@/components/boffmedia/ui/tools/datakit"
import { TN_FORMAT_ICON, TN_FORMAT_LABEL_KEY, type TnCompetitor } from "./tournaments-util"

const TN_AV = "inline-grid flex-none place-items-center font-display font-extrabold uppercase cut-corner [--cut-lg:4px]"

// Generic avatar: initial-in-hue, or a team glyph; falls to a «bye» slot. `.tn-av`
export function TnAvatar({ c, size = 26 }: { c?: TnCompetitor | null; size?: number }) {
  if (!c) return <span className={cn(TN_AV, "bg-panel-2 text-txt-dim")} style={{ width: size, height: size }} aria-hidden="true">—</span>
  const ini = (c.name || "?").replace(/^Equipo\s+/, "").trim()[0] || "?"
  return (
    <span
      className={cn(TN_AV, "text-white")}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: `hsl(${c.hue || 210} 42% 34%)` }}
      aria-hidden="true"
    >
      {c.kind === "team" ? <Icon name="users" size={Math.round(size * 0.5)} /> : ini}
    </span>
  )
}

// Generic competitor row: seed · flag/avatar · name/sub · optional follow star. `.tn-ent`
export function TnEntrant({
  c,
  seed,
  win,
  lose,
  align = "left",
  onOpen,
  sub,
  pinned,
  onPin,
  avatar = true,
  compact = false,
}: {
  c?: TnCompetitor | null
  seed?: number | null
  win?: boolean
  lose?: boolean
  align?: "left" | "right"
  onOpen?: (id: string) => void
  sub?: React.ReactNode
  pinned?: boolean
  onPin?: (id: string) => void
  avatar?: boolean
  compact?: boolean
}) {
  const t = useTranslations("torneos.entrant")
  if (!c) return <span className="inline-flex min-w-0 items-center gap-2 font-mono text-[0.6875rem]/none font-semibold uppercase tracking-[0.12em] text-txt-dim">{t("bye")}</span>
  const sd = seed != null ? seed : c.seed
  const nameCls = cn(
    "max-w-full truncate font-body text-[0.84375rem]/[1.15] font-semibold transition-colors",
    win ? "text-ok" : lose ? "text-txt-dim" : "text-txt",
    onOpen && "group-hover:text-accent-bright",
  )
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", align === "right" && "flex-row-reverse")}>
      {sd != null && <span className="flex-none border border-solid border-line-2 px-[0.3125rem] py-[3px] font-mono text-[0.625rem]/none font-bold text-txt-dim">{sd}</span>}
      {avatar &&
        (c.kind === "team" ? (
          <TnAvatar c={c} size={compact ? 20 : 24} />
        ) : (
          <DkFlag flag={c.flag} code={c.country} name={c.countryName} size={compact ? 14 : 15} />
        ))}
      <button
        type="button"
        className={cn("group grid min-w-0 gap-px border-0 bg-transparent p-0 [text-align:inherit] disabled:cursor-default enabled:cursor-pointer", align === "right" && "justify-items-end text-right")}
        onClick={onOpen ? (e) => { e.stopPropagation(); onOpen(c.id) } : undefined}
        disabled={!onOpen}
      >
        <span className={nameCls}>{c.name}</span>
        {!compact && (() => {
          const subText =
            sub ??
            (c.kind === "team"
              ? `${c.tag ? c.tag + " · " : ""}${c.roster ? t("players", { count: c.roster.length }) : t("team")}`
              : c.tag
                ? "@" + c.tag
                : null)
          return subText ? (
            <span className="max-w-full truncate font-mono text-[0.59375rem]/[1.2] font-medium text-txt-dim">{subText}</span>
          ) : null
        })()}
      </button>
      {onPin && <DkPin on={pinned} onClick={() => onPin(c.id)} />}
    </span>
  )
}

// Match score / live-state. `.tn-score`
export function TnScore({ status, g1, g2 }: { status: string; g1?: number | null; g2?: number | null }) {
  if (status === "final") return <span className="whitespace-nowrap font-mono text-[0.9375rem]/none font-bold">{g1}<i className="px-0.5 not-italic text-txt-dim">–</i>{g2}</span>
  return <DkLive status={status} size="sm" />
}

// Format label pill. `.tn-fmt`
export function TnFormatBadge({ format, size }: { format: string; size?: "sm" }) {
  const t = useTranslations("torneos.format")
  const key = TN_FORMAT_LABEL_KEY[format]
  return (
    <span className={cn("inline-flex items-center border border-solid border-line-2 font-mono font-semibold tracking-[0.02em] text-txt-muted", size === "sm" ? "gap-1 px-1.5 py-1 text-[0.59375rem]/none" : "gap-1.5 px-2 py-[0.3125rem] text-[0.65625rem]/none")}>
      <Icon name={TN_FORMAT_ICON[format] || "trophy"} size={size === "sm" ? 11 : 12} className="text-accent-bright" />
      {key ? t(key) : format}
    </span>
  )
}
