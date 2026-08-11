"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"
import { DkSprite } from "@/components/boffmedia/ui/tools/datakit"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"
import type { MatchResult, MatchSlot, OutcomeTag, SlotRole } from "@/features/vgc-tracker/types"

// ─── formatting ────────────────────────────────────────────────────────────────
export function trFmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}
export function trFmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

// ─── roles ─────────────────────────────────────────────────────────────────────
export const TR_ROLE_ORDER: Record<SlotRole, number> = { lead1: 0, lead2: 1, back1: 2, back2: 3, unknown: 4 }
export function sortSlotsByRole(slots: MatchSlot[]): MatchSlot[] {
  return [...slots].sort((a, b) => TR_ROLE_ORDER[a.role] - TR_ROLE_ORDER[b.role])
}

/** Outcome-tag → [i18n key suffix, tone color]. */
export const TR_OUTCOME_TONE: Record<OutcomeTag, string> = {
  skill: "var(--ok)",
  misplay: "var(--bad)",
  luck: "var(--warn)",
  disconnect: "var(--dim)",
}
export const TR_OUTCOME_ORDER: OutcomeTag[] = ["skill", "misplay", "luck", "disconnect"]

// ─── sprite (name → showdown url) ────────────────────────────────────────────────
export function TrSprite({ name, size = 26, dim, title }: { name: string | null; size?: number; dim?: boolean; title?: string }) {
  return (
    <DkSprite
      src={name ? spriteUrl(name) : undefined}
      alt={name ?? "?"}
      title={title ?? name ?? undefined}
      size={size}
      dim={dim}
      onError={handleSpriteError}
    />
  )
}

// ─── W / L / D result badge ──────────────────────────────────────────────────────
const RES_STYLE: Record<string, { bg: string; fg: string; extra?: string }> = {
  win: { bg: "bg-ok", fg: "text-[#06240f]" },
  loss: { bg: "bg-bad", fg: "text-[#2b060a]" },
  draw: { bg: "bg-warn", fg: "text-[#2b1d02]" },
  none: { bg: "bg-panel-2", fg: "text-txt-dim", extra: "border border-solid border-line-2 cut-tag-edge [--cut-line:var(--line-2)]" },
}

export function TrResult({ result, size = 28 }: { result?: MatchResult; size?: number }) {
  const t = useTranslations("vgc.tracker")
  const kind = result ?? "none"
  const label =
    result === "win" ? t("result.winShort") : result === "loss" ? t("result.lossShort") : result === "draw" ? t("result.drawShort") : "—"
  const aria =
    result === "win" ? t("result.win") : result === "loss" ? t("result.loss") : result === "draw" ? t("result.draw") : t("result.none")
  const s = RES_STYLE[kind]
  return (
    <span
      aria-label={aria}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className={cn("cut-tag [--cut-tag:7px]", "inline-grid flex-none place-items-center font-mono font-extrabold", s.bg, s.fg, s.extra)}
    >
      {label}
    </span>
  )
}

// ─── brought / preview sprite row ────────────────────────────────────────────────
export function TrBrought({ slots, size = 24, mode = "brought" }: { slots: MatchSlot[]; size?: number; mode?: "brought" | "preview" }) {
  const t = useTranslations("vgc.tracker")
  let list = sortSlotsByRole(slots).filter((s) => s.speciesId)
  if (mode === "brought") list = list.filter((s) => s.role !== "unknown")
  if (!list.length) return null
  return (
    <span className="inline-flex items-center gap-px">
      {list.map((s) => (
        <TrSprite
          key={s.slotIndex}
          name={s.speciesName}
          size={size}
          dim={s.role === "unknown"}
          title={`${s.speciesName} · ${t(`roles.${s.role}`)}`}
        />
      ))}
    </span>
  )
}

// ─── section panel (tr-panel) ────────────────────────────────────────────────────
export function TrPanel({
  title,
  icon,
  right,
  children,
  className,
}: {
  title: React.ReactNode
  icon?: IconName
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("min-w-0 border border-solid border-line bg-panel", className)}>
      <header className="flex flex-wrap items-center gap-[10px] border-b border-solid border-line px-[14px] py-[10px]">
        <span className="inline-flex items-center gap-[7px] font-display text-[12.5px] font-bold uppercase leading-none tracking-[0.06em]">
          {icon && <Icon name={icon} size={13} className="text-accent" />}
          {title}
        </span>
        {right && <span className="ml-auto inline-flex items-center gap-2">{right}</span>}
      </header>
      <div className="px-[14px] py-[12px]">{children}</div>
    </section>
  )
}

// ─── small mono sub-label (tr-sub) ───────────────────────────────────────────────
export function TrSub({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("mb-2 block font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim", className)}>
      {children}
    </span>
  )
}

// ─── empty note line (tr-none) ───────────────────────────────────────────────────
export function TrNone({ children }: { children: React.ReactNode }) {
  return <p className="m-0 py-1 font-mono text-[11.5px] leading-[1.5] text-txt-dim">{children}</p>
}
