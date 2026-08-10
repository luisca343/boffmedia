"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Empty, Spinner } from "@boffmedia/ui"
import { AvPanel, AvPill, AvSectionHead } from "../../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import { EventConfigForm } from "./EventConfigForm"
import { ConfigSummaryCard } from "./ConfigSummaryCard"
import { AssignmentsPanel } from "./AssignmentsPanel"
import type { RandomizerConfig } from "@/services/api/boffmedia/randomizer.types"
import type { Event as EventType } from "@boffmedia/shared"

const STATUS_TONE: Record<RandomizerConfig["status"], "amber" | "green" | "default" | "accent"> = {
  draft: "amber",
  open: "green",
  closed: "default",
  published: "accent",
}

const STATUS_KEY: Record<RandomizerConfig["status"], string> = {
  draft: "statusDraft",
  open: "statusOpen",
  closed: "statusClosed",
  published: "statusPublished",
}

interface EventRandomizerPanelProps {
  event: EventType
  onBack: () => void
  /** Rendered inside EventAdminPanel, which already owns the header and tabs. */
  embedded?: boolean
}

export function EventRandomizerPanel({ event, onBack, embedded }: EventRandomizerPanelProps) {
  const t = useTranslations("randomizer.eventPanel")
  const eventId = Number(event.id)
  const [config, setConfig] = useState<RandomizerConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"setup" | "assignments">("setup")
  // Most events are not randomlockes, so the config form is opt-in: it used to
  // mount eagerly on every event, presenting a full setup form for a module the
  // event was never going to have.
  const [adding, setAdding] = useState(false)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await RandomizerService.getAdminEventConfig(eventId)
      const next = res.success && res.data ? res.data : null
      setConfig(next)
      // After a delete the assignments tab has nothing to point at, and the
      // form must fold back into the CTA rather than reappear pre-opened.
      if (!next) {
        setTab("setup")
        setAdding(false)
      }
    } catch {
      setConfig(null)
      setTab("setup")
      setAdding(false)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return (
    <div>
      {!embedded && (
        <AvSectionHead
          title={event.title}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <AvPill tone={config ? STATUS_TONE[config.status] : "muted"}>
                {config ? t(STATUS_KEY[config.status]) : t("statusNone")}
              </AvPill>
              <Button variant="ghost" size="sm" icon="back" onClick={onBack}>
                {t("back")}
              </Button>
            </div>
          }
        />
      )}

      {/* Tabs only make sense once the event actually has a randomizer —
          before that there is one action, not two views. */}
      {(config || adding) && (
        <div className="flex gap-2 mb-5 items-center">
          {embedded && (
            <AvPill tone={config ? STATUS_TONE[config.status] : "muted"} className="mr-1">
              {config ? t(STATUS_KEY[config.status]) : t("statusNone")}
            </AvPill>
          )}
          <Button
            variant={tab === "setup" ? "pri" : "ghost"}
            size="sm"
            onClick={() => setTab("setup")}
          >
            {t("tabSetup")}
          </Button>
          <Button
            variant={tab === "assignments" ? "pri" : "ghost"}
            size="sm"
            onClick={() => setTab("assignments")}
            disabled={!config}
          >
            {t("tabAssignments")}
          </Button>
        </div>
      )}

      {loading ? (
        <AvPanel>
          <div className="flex items-center justify-center py-8 gap-2">
            <Spinner />
            <span className="text-txt-muted">{t("loading")}</span>
          </div>
        </AvPanel>
      ) : !config && !adding ? (
        <Empty icon="dice" title={t("empty.title")} lead={t("empty.lead")}>
          <Button variant="pri" icon="plus" onClick={() => setAdding(true)}>
            {t("empty.add")}
          </Button>
        </Empty>
      ) : tab === "setup" ? (
        config ? (
          <ConfigSummaryCard config={config} onChanged={loadConfig} />
        ) : (
          <EventConfigForm
            eventId={eventId}
            onSaved={loadConfig}
            onCancel={() => setAdding(false)}
          />
        )
      ) : (
        config && <AssignmentsPanel configId={config.id} />
      )}
    </div>
  )
}
