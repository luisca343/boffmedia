import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { evOrgMeta, EV_BOFF, type EventOrganizerData } from "./events-util"

const SEAL = "grid place-items-center flex-none font-display font-bold leading-none cut-seal [--cut:5px]"

/**
 * Who organizes the event. Three roles — boffmedia · coorg · platform — with a
 * dual seal for the last two. `inline` for cards/banners, `block` for the detail aside.
 */
export function EventOrganizer({
  organizer,
  variant = "inline",
  className,
}: {
  organizer?: EventOrganizerData
  variant?: "inline" | "block"
  className?: string
}) {
  // `useTranslations` is sync-valid in a Server Component too — no "use client" needed here.
  const t = useTranslations("events.organizer")
  const o = organizer ?? { role: "boffmedia" as const, name: EV_BOFF.name, avatar: EV_BOFF.avatar }
  const m = evOrgMeta(o.role)
  const dual = o.role !== "boffmedia"

  const firstSeal = o.role === "platform" ? "text-txt bg-panel-2 border border-solid border-line-2" : "text-accent-ink bg-accent"
  const partnerSeal =
    o.role === "coorg"
      ? "text-signal bg-signal-soft"
      : o.role === "platform"
        ? "text-accent-ink bg-accent"
        : "text-txt bg-panel-2 border border-solid border-line-2"

  const seals = (sz: string, overlap: string) => (
    <span className={cn("inline-flex flex-none", variant === "block" && "mt-[2px]")}>
      <span className={cn(SEAL, sz, firstSeal)}>{EV_BOFF.avatar}</span>
      {dual && <span className={cn(SEAL, sz, partnerSeal, overlap)}>{o.avatar || "?"}</span>}
    </span>
  )

  if (variant === "block") {
    const line =
      o.role === "boffmedia"
        ? t("lineBoffmedia")
        : o.role === "coorg"
          ? t("lineCoorg", { name: o.name })
          : t("linePlatform", { name: o.name })
    const tagCls =
      o.role === "coorg"
        ? "text-signal bg-signal-soft border border-solid border-[color-mix(in_srgb,var(--signal)_40%,var(--line-2))]"
        : o.role === "platform"
          ? "text-txt-muted bg-panel-2 border border-solid border-line-2"
          : "text-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-solid border-[color-mix(in_srgb,var(--accent)_40%,var(--line-2))]"
    return (
      <div className={cn("flex items-start gap-[13px]", className)}>
        {seals("w-[34px] h-[34px] text-[14px]", "-ml-[10px]")}
        <div className="flex min-w-0 flex-col gap-[7px]">
          <span className={cn("inline-flex items-center gap-[6px] self-start font-mono text-[9.5px] font-bold uppercase leading-none tracking-[0.13em] px-[9px] py-[5px] cut-tag [--cut-tag:4px]", tagCls)}>
            <Icon name={m.icon} size={12} />
            {t(m.tagKey)}
          </span>
          <span className="font-display text-[15px] font-bold uppercase leading-[1.15] tracking-[0.01em] text-txt [&_b]:font-bold">
            {o.role === "boffmedia" ? (
              <b>Boffmedia</b>
            ) : o.role === "coorg" ? (
              <>
                <b>Boffmedia</b> <span className="font-semibold text-txt-dim">×</span> <b>{o.name}</b>
              </>
            ) : (
              <>
                <b>{o.name}</b> <span className="font-medium normal-case text-txt-dim">{t("inBoffmedia")}</span>
              </>
            )}
          </span>
          <p className="font-body text-[12.5px] leading-[1.5] text-txt-muted text-pretty">{line}</p>
        </div>
      </div>
    )
  }

  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-[9px] font-mono text-[11px] font-semibold leading-none tracking-[0.04em] text-txt-muted", className)}
      title={t(m.labelKey)}
    >
      {seals("w-[22px] h-[22px] text-[10px]", "-ml-[7px]")}
      <span className="overflow-hidden text-ellipsis whitespace-nowrap [&_b]:font-bold [&_b]:text-txt">
        {o.role === "boffmedia" ? (
          <>
            {t("by")} <b>Boffmedia</b>
          </>
        ) : o.role === "coorg" ? (
          <>
            <b>Boffmedia</b> <span className="font-semibold text-txt-dim">×</span> <b>{o.name}</b>
          </>
        ) : (
          <>
            {t("by")} <b>{o.name}</b>
          </>
        )}
      </span>
    </span>
  )
}
