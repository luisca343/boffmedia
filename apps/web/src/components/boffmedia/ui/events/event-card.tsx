"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"
import { BoffButton as Button } from "../../primitives/button"
import { BoffCard as Card } from "../../primitives/card"
import { BoffBadge as Badge } from "../../primitives/badge"

interface EventData {
  date: string
  title: string
  game: string
  players: number
  status: string
}

interface EventCardProps {
  event: EventData
  go: (path: string) => void
  delay?: number
  action?: React.ReactNode
}

export function EventCard({ event, go, delay = 0, action }: EventCardProps) {
  const [day, mon] = event.date.split(" ")

  return (
    <Card
      hover
      className="flex items-center gap-5 p-[1.1rem_1.3rem]"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex flex-col items-center justify-center w-16 min-w-[64px] aspect-square rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)] border border-[color-mix(in_srgb,var(--orange-500)_30%,transparent)]">
        <span className="font-display font-extrabold text-xl text-[var(--orange-500)] leading-none">{day}</span>
        <span className="font-mono text-[0.65rem] tracking-[0.12em] text-[var(--orange-400)] mt-[2px]">{mon}</span>
      </div>
      <div className="flex-1 flex flex-col gap-[0.35rem] min-w-0">
        <span className="font-mono text-xs tracking-[0.1em] uppercase text-[var(--text-dim)]">{event.game}</span>
        <h3 className="text-lg m-0">{event.title}</h3>
        <div className="flex items-center gap-4 flex-wrap mt-[0.2rem]">
          <span className="inline-flex items-center gap-[0.4rem] text-sm text-[var(--text-muted)]">
            <Icon name="users" size={15} className="text-[var(--text-dim)]" />
            {event.players} plazas
          </span>
          <Badge kind={event.status === "open" ? "live" : "new"}>
            {event.status === "open" ? "Inscripción abierta" : "Casi lleno"}
          </Badge>
        </div>
      </div>
      {action || (
        <Button variant="primary" size="sm" iconRight="arrow" onClick={() => go("/eventos")} className="self-center shrink-0">
          Inscribirse
        </Button>
      )}
    </Card>
  )
}
