"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Spinner } from "@boffmedia/ui"
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

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await RandomizerService.getAdminEventConfig(eventId)
      const next = res.success && res.data ? res.data : null
      setConfig(next)
      // After a delete the assignments tab has nothing to point at.
      if (!next) setTab("setup")
    } catch {
      setConfig(null)
      setTab("setup")
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

      {loading ? (
        <AvPanel>
          <div className="flex items-center justify-center py-8 gap-2">
            <Spinner />
            <span className="text-txt-muted">{t("loading")}</span>
          </div>
        </AvPanel>
      ) : tab === "setup" ? (
        config ? (
          <ConfigSummaryCard config={config} onChanged={loadConfig} />
        ) : (
          <EventConfigForm eventId={eventId} onSaved={loadConfig} />
        )
      ) : (
        config && <AssignmentsPanel configId={config.id} />
      )}
    </div>
  )
}
