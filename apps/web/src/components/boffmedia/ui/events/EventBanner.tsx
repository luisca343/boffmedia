"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"
import { EventStatusChip } from "./EventStatusChip"
import { Countdown } from "./Countdown"
import { EventOrganizer } from "./EventOrganizer"
import { eventStatus, type EventLike } from "./events-util"

/**
 * Full-bleed event-page header: art background + scanlines + type glyph, a flags
 * row (status · countdown · game · organizer), title and description.
 */
export function EventBanner({
  event,
  className,
  children,
}: {
  event: EventLike
  className?: string
  children?: React.ReactNode
}) {
  const t = useTranslations("events")
  const status = eventStatus(event)
  const isServer = (event.type || "event") === "server"
  const hue = event.hue || "var(--accent)" // [deferred] no game→hue field

  return (
    <div
      style={{ "--ghue": hue } as React.CSSProperties}
      className={cn(
        "relative flex min-h-[420px] flex-col justify-end overflow-hidden border-b-[3px] border-[color-mix(in_srgb,var(--ghue)_75%,transparent)] bg-base-2",
        className,
      )}
    >
      <div className="absolute inset-0 z-0">
        <ArtImage
          src={event.banner || event.icon}
          alt=""
          fallback={
            <div className="absolute inset-0 grid place-items-center bg-panel-2">
              <Icon name={isServer ? "globe" : "trophy"} size={140} className="text-line-2" />
            </div>
          }
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] [background:linear-gradient(to_top,var(--bg)_2%,color-mix(in_srgb,var(--bg)_60%,transparent)_42%,transparent_82%),linear-gradient(100deg,color-mix(in_srgb,var(--bg)_82%,transparent)_6%,color-mix(in_srgb,var(--bg)_20%,transparent)_48%,transparent_70%),radial-gradient(120%_120%_at_90%_6%,color-mix(in_srgb,var(--ghue)_18%,transparent),transparent_52%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] opacity-40 mix-blend-multiply [background:repeating-linear-gradient(to_bottom,transparent_0_3px,rgba(0,0,0,0.2)_3px_4px)]" />
      <Icon name={isServer ? "globe" : "trophy"} size={320} className="pointer-events-none absolute right-[-30px] top-[-20px] z-[1] text-[var(--ghue)] opacity-[0.13]" />

      <div className="relative z-[2] max-w-[1000px] px-[clamp(22px,3.2vw,40px)] pb-[26px] pt-10">
        <div className="mb-4 flex flex-wrap items-center gap-3.5">
          <EventStatusChip status={status} label={t(`status.${status}`)} lg />
          {status === "upcoming" && <Countdown date={event.startDate} />}
          {event.gameName && (
            <span className="inline-flex items-center gap-2 font-mono text-[11px]/none font-semibold uppercase tracking-[0.08em] text-txt-muted">
              <span className="grid h-[26px] w-[26px] flex-none place-items-center border-[1.5px] border-solid border-[color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] bg-[color-mix(in_srgb,var(--ghue)_14%,var(--bg))] text-[var(--ghue)] cut-seal [--cut:5px]">
                <Icon name="gamepad" size={13} />
              </span>
              {event.gameName}
            </span>
          )}
          {/* [deferred] organizer — not in the events model; shown only when supplied */}
          {event.organizer && <EventOrganizer organizer={event.organizer} />}
        </div>
        <h1 className="text-[clamp(44px,5.4vw,82px)]/[0.9]">{event.title}</h1>
        {event.description && (
          <p className="mt-3.5 max-w-[66ch] font-body text-[17px]/[1.55] text-txt-muted text-pretty">{event.description}</p>
        )}
        {children && <div className="mt-[22px] flex flex-wrap gap-3">{children}</div>}
      </div>
    </div>
  )
}
