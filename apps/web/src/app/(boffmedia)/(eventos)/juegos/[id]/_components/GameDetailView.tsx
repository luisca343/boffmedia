"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button, Empty, Icon, Spinner } from "@boffmedia/ui"
import { EventCard, GameHero, type EventLike } from "@/components/boffmedia/ui/events"
import { useGetGame } from "@/hooks/events/useGetGame"
import { useGetEvents } from "@/hooks/events/useGetEvents"

export function GameDetailView({ id }: { id: number }) {
  const t = useTranslations("juegos")
  const { game, isLoading } = useGetGame(id)
  const { events } = useGetEvents()

  const gameEvents = React.useMemo(
    () => ((Array.isArray(events) ? events : []) as EventLike[]).filter((e) => e.gameId === id),
    [events, id],
  )

  if (isLoading) {
    return (
      <main className="wrap grid min-h-[60vh] place-items-center">
        <Spinner />
      </main>
    )
  }

  if (!game) {
    return (
      <main className="wrap">
        <Empty icon="alert" title={t("detail.notFound")} lead={t("detail.notFoundLead")}>
          <Button variant="pri" icon="back" href="/juegos">
            {t("detail.back")}
          </Button>
        </Empty>
      </main>
    )
  }

  return (
    <main className="wrap pb-[5.625rem] pt-6">
      <Link
        href="/juegos"
        className="mb-5 inline-flex items-center gap-2 font-mono text-[0.6875rem]/none font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-txt"
      >
        <Icon name="back" size={14} /> {t("detail.back")}
      </Link>

      <GameHero game={game} eventCount={gameEvents.length} className="mb-8" />

      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-[clamp(1.5rem,3vw,2.125rem)] text-txt">{t("detail.events")}</h2>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      {gameEvents.length === 0 ? (
        <p className="font-body text-[0.875rem] text-txt-dim">{t("detail.noEvents")}</p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(21.25rem,1fr))] max-[720px]:grid-cols-1">
          {gameEvents.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </main>
  )
}
