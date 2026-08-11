"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useFormat } from "@boffmedia/ui/useFormat"
import { Icon } from "@boffmedia/ui"
import { EventStatusChip } from "./EventStatusChip"
import { Countdown } from "./Countdown"
import { EventOrganizer } from "./EventOrganizer"
import { eventStatus, formatEventDate, type EventLike } from "./events-util"

export function EventCard({ event, layout }: { event: EventLike; layout?: "grid" | "list" }) {
  const t = useTranslations("events")
  const { intlLocale, number: formatNumber } = useFormat()
  const status = eventStatus(event)
  const isServer = (event.type || "event") === "server"
  const row = layout === "list"

  // `--ghue`: per-game hue. NOT in the events API yet → falls back to the brand
  // accent. [deferred — needs a game→hue field on the event DTO]
  const hue = event.hue || "var(--accent)"

  const start = new Date(event.startDate ?? NaN)
  const valid = !Number.isNaN(start.getTime())
  const day = valid ? start.toLocaleDateString(intlLocale, { day: "2-digit" }) : "–"
  const mon = valid ? start.toLocaleDateString(intlLocale, { month: "short" }).replace(".", "").toUpperCase() : ""

  return (
    <Link
      href={`/eventos/${event.id}`}
      style={{ "--ghue": hue } as React.CSSProperties}
      className={cn(
        "group relative flex overflow-hidden border border-solid border-line border-l-4 border-l-[var(--ghue)] bg-panel no-underline",
        "transition-[border-color,background,transform] duration-[140ms] hover:-translate-y-[3px] hover:bg-panel-2 hover:border-[color-mix(in_srgb,var(--ghue)_45%,var(--line))]",
        row
          ? "flex-row items-center gap-5 px-[22px] py-4 [clip-path:polygon(0_0,100%_0,100%_100%,14px_100%,0_calc(100%_-_14px))] max-[560px]:flex-wrap"
          : "flex-col px-5 pb-4 pt-[18px] cut-tag [--cut-tag:14px]",
        status === "completed" && "opacity-70",
      )}
    >
      {/* type watermark */}
      <Icon
        name={isServer ? "globe" : "trophy"}
        size={110}
        className="pointer-events-none absolute -bottom-[14px] -right-[14px] z-0 text-[var(--ghue)] opacity-[0.08]"
      />

      {/* list-only date block */}
      {row && (
        <div className="flex w-[60px] flex-none flex-col items-center justify-center border-r border-solid border-line pr-[18px] max-[560px]:w-full max-[560px]:flex-row max-[560px]:justify-start max-[560px]:gap-2 max-[560px]:border-b max-[560px]:border-r-0 max-[560px]:pb-2.5 max-[560px]:pr-0">
          <span className={cn("font-display text-[34px] font-extrabold italic leading-none", status === "completed" ? "text-txt-muted" : "text-[var(--ghue)]")}>
            {day}
          </span>
          <span className="mt-[5px] font-mono text-[9px] font-semibold leading-none tracking-[0.12em] text-txt-muted max-[560px]:mt-0">{mon}</span>
        </div>
      )}

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex items-center gap-2.5">
          <EventStatusChip status={status} label={t(`status.${status}`)} />
          <span className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim">
            <Icon name={isServer ? "globe" : "trophy"} size={12} className="text-[var(--ghue)]" />
            {t(`type.${isServer ? "server" : "event"}`)}
          </span>
        </div>

        <h3 className="text-[23px]/[1.04] text-txt">{event.title}</h3>
        {event.description && (
          <p className={cn("mt-2 font-body text-[13.5px]/[1.5] text-txt-muted text-pretty", row ? "line-clamp-1" : "line-clamp-2")}>
            {event.description}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-3.5 border-t border-dashed border-line pt-3.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px]/none font-semibold uppercase tracking-[0.06em] text-txt">
            <span className="grid h-[22px] w-[22px] flex-none place-items-center border-[1.5px] border-solid border-[color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] bg-[color-mix(in_srgb,var(--ghue)_14%,var(--bg))] text-[var(--ghue)] cut-seal cut-seal-edge [--cut-w:1.5px] [--cut-line:color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] [--cut:5px]">
              <Icon name="gamepad" size={11} />
            </span>
            {event.gameName || "—"}
          </span>
          {status === "upcoming" && event.startDate ? (
            <Countdown date={event.startDate} compact />
          ) : (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px]/none font-medium uppercase tracking-[0.05em] text-txt-muted">
              <Icon name="calendar" size={13} className="text-txt-dim" />
              {formatEventDate(event.startDate, intlLocale)}
            </span>
          )}
          {/* participant count — NOT in the list API yet (the detail page fetches
              participants separately) → rendered only when supplied. [deferred] */}
          {event.participants != null && (
            <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px]/none font-medium uppercase tracking-[0.05em] text-txt-muted">
              <Icon name="users" size={13} className="text-txt-dim" />
              {formatNumber(event.participants)}
            </span>
          )}
        </div>

        {/* organizer — NOT in the events model yet → rendered only when supplied
            (the handoff defaults to «Boffmedia»; we defer until the API has it). [deferred] */}
        {event.organizer && (
          <div className="mt-2.5 border-t border-dashed border-line pt-2.5 text-[10.5px]">
            <EventOrganizer organizer={event.organizer} />
          </div>
        )}
      </div>

      {row && (
        <Icon
          name="arrow"
          size={18}
          className="relative z-[1] ml-1 flex-none self-center text-txt-dim transition-transform group-hover:translate-x-1 group-hover:text-accent-bright"
        />
      )}
    </Link>
  )
}
