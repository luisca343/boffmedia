"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Input, Spinner, Empty, toast } from "@boffmedia/ui"
import { AvPanel, AvSectionHead, AvPill } from "../../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerEvent } from "@/services/api/boffmedia/randomizer.types"

const STATUS_TONE: Record<string, "amber" | "green" | "muted" | "warn"> = {
  draft: "amber",
  locked: "warn",
  running: "green",
  finished: "muted",
}

const PLATFORM_LABELS: Record<"gba" | "nds", string> = {
  gba: "GBA",
  nds: "NDS",
}

interface EventsListProps {
  tournamentId: string | null
  onEdit: (event: RandomizerEvent) => void
  onShowAssignments: (event: RandomizerEvent) => void
}

export function EventsList({
  tournamentId,
  onEdit,
  onShowAssignments,
}: EventsListProps) {
  const t = useTranslations("randomizer.events")
  const [events, setEvents] = useState<RandomizerEvent[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  useEffect(() => {
    if (tournamentId) {
      loadEvents()
    } else {
      setEvents(null)
    }
  }, [tournamentId])

  const loadEvents = async () => {
    if (!tournamentId) return
    setLoading(true)
    try {
      const res = await RandomizerService.listEvents(tournamentId)
      setEvents(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoading"), msg: String(err) })
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleLock = async (event: RandomizerEvent) => {
    if (event.status !== "draft") return
    setActionInProgress(event.id)
    try {
      const res = await RandomizerService.lockEvent(event.id)
      if (res.success) {
        toast({ tone: "ok", title: t("eventLocked") })
        await loadEvents()
      } else {
        toast({ tone: "bad", title: t("lockError"), msg: res.userMessage })
      }
    } finally {
      setActionInProgress(null)
    }
  }

  const handleFinish = async (event: RandomizerEvent) => {
    if (event.status !== "locked" && event.status !== "running") return
    setActionInProgress(event.id)
    try {
      const res = await RandomizerService.finishEvent(event.id)
      if (res.success) {
        toast({ tone: "ok", title: t("eventFinished") })
        await loadEvents()
      } else {
        toast({ tone: "bad", title: t("finishError"), msg: res.userMessage })
      }
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDelete = async (event: RandomizerEvent) => {
    if (event.status !== "draft") return
    setActionInProgress(event.id)
    try {
      const res = await RandomizerService.deleteEvent(event.id)
      if (res.success) {
        toast({ tone: "ok", title: t("eventDeleted") })
        await loadEvents()
      } else {
        toast({ tone: "bad", title: t("deleteError"), msg: res.userMessage })
      }
    } finally {
      setActionInProgress(null)
    }
  }

  const filtered = (events ?? []).filter(
    (e) =>
      e.gameTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.gamePlatform.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!tournamentId) {
    return (
      <Empty
        title={t("selectTournament")}
        lead={t("selectTournamentDesc")}
        icon="home"
      />
    )
  }

  return (
    <div className="space-y-5">
      <AvSectionHead
        title={t("events")}
        actions={
          <Button onClick={() => loadEvents()} disabled={loading}>
            {loading ? <Spinner size={16} /> : <Icon name="refresh" size={16} />}
            {t("refresh")}
          </Button>
        }
      />

      <AvPanel>
        <Input
          placeholder={t("searchEvents")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />
      </AvPanel>

      {loading && !events ? (
        <AvPanel>
          <div className="flex items-center justify-center py-8 gap-2">
            <Spinner />
            <span className="text-txt-muted">{t("loadingEvents")}</span>
          </div>
        </AvPanel>
      ) : filtered.length === 0 ? (
        <Empty
          title={t("noEvents")}
          lead={t("noEventsDesc")}
          icon="calendar"
        />
      ) : (
        <AvPanel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-left font-semibold">{t("colStatus")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colPlatform")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colTitle")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colCreatedAt")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-line hover:bg-panel-2 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <AvPill tone={STATUS_TONE[event.status] ?? "muted"}>
                        {t(`status_${event.status}`)}
                      </AvPill>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-txt-muted font-mono">
                        {PLATFORM_LABELS[event.gamePlatform] || event.gamePlatform}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{event.gameTitle}</td>
                    <td className="px-3 py-2 text-txt-muted">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(event)}
                          disabled={event.status !== "draft"}
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onShowAssignments(event)}
                        >
                          {t("assignments")}
                        </Button>
                        {event.status === "draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLock(event)}
                            disabled={actionInProgress === event.id}
                          >
                            {actionInProgress === event.id ? (
                              <Spinner size={14} />
                            ) : (
                              t("lock")
                            )}
                          </Button>
                        )}
                        {(event.status === "locked" || event.status === "running") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFinish(event)}
                            disabled={actionInProgress === event.id}
                          >
                            {actionInProgress === event.id ? (
                              <Spinner size={14} />
                            ) : (
                              t("finish")
                            )}
                          </Button>
                        )}
                        {event.status === "draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(event)}
                            disabled={actionInProgress === event.id}
                          >
                            <Icon name="trash" size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AvPanel>
      )}
    </div>
  )
}
