"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { EventStatusChip } from "./EventStatusChip"
import { eventStatus, formatEventDate, type EventLike } from "./events-util"

export function EventCard({ event }: { event: EventLike }) {
  const t = useTranslations("events")
  const status = eventStatus(event)
  const isEvent = (event.type || "event") === "event"
  return (
    <Link
      href={`/eventos/${event.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden border border-solid border-line border-l-4 border-l-accent bg-panel px-5 pb-4 pt-[18px] no-underline cut-tag [--cut-tag:14px]",
        "transition-[border-color,background,transform] duration-[140ms] hover:-translate-y-[3px] hover:border-accent-line hover:bg-panel-2",
        status === "completed" && "opacity-70",
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <EventStatusChip status={status} label={t(`status.${status}`)} />
        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim">
          <Icon name={isEvent ? "trophy" : "gamepad"} size={13} className="text-accent" />
          {t(`type.${isEvent ? "event" : "server"}`)}
        </span>
      </div>

      <h3 className="text-[23px]/[1.04] text-txt">{event.title}</h3>
      {event.description && (
        <p className="mt-2 line-clamp-2 font-body text-[13.5px]/[1.5] text-txt-muted text-pretty">{event.description}</p>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-3.5 border-t border-dashed border-line pt-3.5">
        {event.gameName && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px]/none font-semibold uppercase tracking-[0.06em] text-txt">
            <Icon name="gamepad" size={13} className="text-txt-dim" />
            {event.gameName}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]/none font-medium uppercase tracking-[0.05em] text-txt-muted">
          <Icon name="calendar" size={13} className="text-txt-dim" />
          {status === "upcoming"
            ? t("card.starts", { date: formatEventDate(event.startDate) })
            : formatEventDate(event.startDate)}
        </span>
      </div>
    </Link>
  )
}
