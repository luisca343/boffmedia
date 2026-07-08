"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/boffmedia/primitives/badge"
import { Button } from "@/components/boffmedia/primitives/button"
import { Empty } from "@/components/boffmedia/primitives/empty"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { Panel } from "@/components/boffmedia/primitives/panel"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { toast } from "@/components/boffmedia/primitives/toast"
import { AchievementItem, EventBanner, formatEventDate } from "@/components/boffmedia/ui/events"
import { useGetEvent } from "@/hooks/events/useGetEvent"
import { useGetEventAchievements } from "@/hooks/events/useGetEventAchievements"
import { useGetLeaderboard } from "@/hooks/events/useGetLeaderboard"
import { useCurrentParticipant } from "@/hooks/events/useCurrentParticipant"
import { useBoffSession } from "@/services/useBoffSession"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function EventDetailView({ id }: { id: number }) {
  const t = useTranslations("events")
  const { event, isLoading } = useGetEvent(id)
  const { achievements } = useGetEventAchievements(id)
  const { leaderboard } = useGetLeaderboard(id)
  const { participantId, participants, refetch: refetchParts } = useCurrentParticipant(id)
  const { session } = useBoffSession()
  const [joining, setJoining] = React.useState(false)

  if (isLoading) {
    return (
      <main className="wrap grid min-h-[60vh] place-items-center">
        <Spinner />
      </main>
    )
  }

  if (!event) {
    return (
      <main className="wrap">
        <Empty icon="alert" title={t("detail.notFound")} lead={t("detail.notFoundLead")}>
          <Button variant="pri" icon="back" href="/eventos">
            {t("detail.back")}
          </Button>
        </Empty>
      </main>
    )
  }

  const ach = Array.isArray(achievements) ? achievements : []
  const board = Array.isArray(leaderboard) ? leaderboard : []
  const count = participants?.length ?? 0
  const joined = !!participantId

  async function handleJoin() {
    setJoining(true)
    try {
      const res = await EventsService.joinEvent(id, {})
      if (res.success) {
        toast.success(t("detail.participating"))
        refetchParts()
      } else {
        toast.error(res.error || t("error.title"))
      }
    } catch {
      toast.error(t("error.title"))
    } finally {
      setJoining(false)
    }
  }

  return (
    <main className="wrap pb-[90px] pt-6">
      <Link
        href="/eventos"
        className="mb-5 inline-flex items-center gap-2 font-mono text-[11px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-txt"
      >
        <Icon name="back" size={14} /> {t("detail.back")}
      </Link>

      <EventBanner event={event} className="mb-6" />

      <div className="grid items-start gap-5 [grid-template-columns:1fr_340px] max-[980px]:grid-cols-1">
        {/* main */}
        <div className="grid min-w-0 gap-5">
          <Panel title={t("detail.about")}>
            <p className="font-body text-[15px]/[1.6] text-txt-muted text-pretty">{event.description || "—"}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              <span className="inline-flex items-center gap-2 font-mono text-[12px]/none uppercase tracking-[0.06em] text-txt-muted">
                <Icon name="calendar" size={14} className="text-accent" />
                {formatEventDate(event.startDate)}
                {event.endDate ? ` — ${formatEventDate(event.endDate)}` : ""}
              </span>
              <span className="inline-flex items-center gap-2 font-mono text-[12px]/none uppercase tracking-[0.06em] text-txt-muted">
                <Icon name="users" size={14} className="text-accent" />
                <b className="font-semibold text-txt">{count}</b>
              </span>
            </div>
          </Panel>

          <Panel title={t("detail.achievements")} aside={<span className="font-mono text-[11px] text-txt-dim">{ach.length}</span>}>
            {ach.length === 0 ? (
              <p className="font-body text-[14px] text-txt-dim">{t("detail.empty")}</p>
            ) : (
              <div className="grid gap-3">
                {ach.map((a) => (
                  <AchievementItem key={a.id} achievement={a} />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* aside */}
        <div className="grid gap-5 max-[980px]:grid-cols-2 max-[560px]:grid-cols-1">
          <div className="border border-solid border-line border-t-[3px] border-t-accent bg-panel p-[22px] text-center cut-corner">
            <div className="font-display text-[52px]/[0.9] font-extrabold italic text-txt">{count}</div>
            <div className="mt-1.5 font-mono text-[10px]/none uppercase tracking-[0.16em] text-txt-muted">
              {t("detail.participants")}
            </div>
            <div className="mt-5">
              {!session?.user ? (
                <Button variant="pri" icon="user" href="/entrar" className="w-full">
                  {t("detail.loginToJoin")}
                </Button>
              ) : joined ? (
                <Badge tone="ok">{t("detail.participating")}</Badge>
              ) : (
                <Button variant="pri" icon="plus" loading={joining} onClick={handleJoin} className="w-full">
                  {t("detail.participate")}
                </Button>
              )}
            </div>
          </div>

          <Panel title={t("detail.leaderboard")} bodyClassName="p-0">
            {board.length === 0 ? (
              <p className="p-5 font-body text-[13px] text-txt-dim">{t("detail.leaderEmpty")}</p>
            ) : (
              <div className="grid">
                {board.slice(0, 10).map((p, i) => (
                  <div
                    key={(p as { participantId?: number }).participantId ?? i}
                    className={cn(
                      "flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0",
                      i < 3 && "bg-[linear-gradient(90deg,var(--accent-soft),transparent_60%)]",
                    )}
                  >
                    <span className={cn("w-6 flex-none font-display text-[18px]/none font-extrabold italic", i < 3 ? "text-accent" : "text-txt-muted")}>
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-display text-[14px]/none font-bold uppercase text-txt">
                      {(p as { nickname?: string }).nickname}
                    </span>
                    <span className="flex-none font-mono text-[13px]/none font-semibold text-txt">
                      {(p as { totalPoints?: number }).totalPoints ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </main>
  )
}
