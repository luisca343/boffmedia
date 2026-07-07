"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/boffmedia/primitives/button"
import { Empty } from "@/components/boffmedia/primitives/empty"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"
import { EventCard, formatEventDate, type EventLike } from "@/components/boffmedia/ui/events"
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
      <main data-ds="boffmedia" className="wrap grid min-h-[60vh] place-items-center">
        <Spinner />
      </main>
    )
  }

  if (!game) {
    return (
      <main data-ds="boffmedia" className="wrap">
        <Empty icon="alert" title={t("detail.notFound")} lead={t("detail.notFoundLead")}>
          <Button variant="pri" icon="back" href="/juegos">
            {t("detail.back")}
          </Button>
        </Empty>
      </main>
    )
  }

  return (
    <main data-ds="boffmedia" className="wrap pb-[90px] pt-6">
      <Link
        href="/juegos"
        className="mb-5 inline-flex items-center gap-2 font-mono text-[11px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-txt"
      >
        <Icon name="back" size={14} /> {t("detail.back")}
      </Link>

      <div className="relative mb-8 flex min-h-[340px] flex-col justify-end overflow-hidden border border-solid border-line border-b-[3px] border-b-accent bg-panel-2 cut-corner">
        <div className="absolute inset-0 z-0">
          <ArtImage
            src={game.icon}
            alt=""
            fallback={
              <div className="absolute inset-0 grid place-items-center bg-panel-2">
                <Icon name="gamepad" size={120} className="text-line-2" />
              </div>
            }
          />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_top,var(--panel)_4%,color-mix(in_srgb,var(--panel)_55%,transparent)_46%,transparent_82%)]" />
        <div className="relative z-[2] max-w-[900px] p-[34px] max-[720px]:p-6">
          <h1 className="text-[clamp(40px,5.4vw,76px)]">{game.title}</h1>
          {game.description && (
            <p className="mt-3 max-w-[66ch] font-body text-[16px]/[1.55] text-txt-muted text-pretty">{game.description}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            <span className="inline-flex items-center gap-2 font-mono text-[12px]/none uppercase tracking-[0.06em] text-txt-muted">
              <Icon name="trophy" size={14} className="text-accent" />
              <b className="font-semibold text-txt">{gameEvents.length}</b> {t("detail.events")}
            </span>
            {game.createdAt && (
              <span className="inline-flex items-center gap-2 font-mono text-[12px]/none uppercase tracking-[0.06em] text-txt-muted">
                <Icon name="calendar" size={14} className="text-accent" />
                {t("since", { date: formatEventDate(game.createdAt) })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-[clamp(24px,3vw,34px)] text-txt">{t("detail.events")}</h2>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      {gameEvents.length === 0 ? (
        <p className="font-body text-[14px] text-txt-dim">{t("detail.noEvents")}</p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))] max-[720px]:grid-cols-1">
          {gameEvents.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </main>
  )
}
