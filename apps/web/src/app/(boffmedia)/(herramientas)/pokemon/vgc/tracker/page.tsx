"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  DkApp,
  DkBar,
  DkBody,
  DkDivider,
  DkEmpty,
  DkSeg,
  DkSearch,
  DkSkelList,
  DkSpacer,
  DkStat,
  DkTitle,
} from "@/components/boffmedia/ui/tools/datakit"
import { Button, Icon } from "@/components/boffmedia/primitives"
import { useSessions, usePresets } from "@/features/vgc-tracker/hooks/useVgcDb"
import type { Session } from "@/features/vgc-tracker/types"
import { TrSessionRow } from "./_components/TrSessionRow"
import { careerFromSummaries, useSessionSummaries } from "./_components/useSessionSummaries"
import { NewSessionDialog } from "./_components/NewSessionDialog"
import { PresetManager } from "./_components/PresetManager"
import { DuplicateSessionDialog } from "./_components/DuplicateSessionDialog"
import { ExportImportDialog } from "./_components/ExportImportDialog"

type Filter = "all" | "ladder" | "tournament"

export default function TrackerHomePage() {
  const t = useTranslations("vgc.tracker")
  const {
    sessions,
    archivedSessions,
    loading,
    create: createSession,
    remove: removeSession,
    archive: archiveSession,
    unarchive: unarchiveSession,
    refresh: refreshSessions,
  } = useSessions()
  const { presets, save: savePreset, remove: removePreset } = usePresets()

  const allSessions = useMemo(() => [...sessions, ...archivedSessions], [sessions, archivedSessions])
  const summaries = useSessionSummaries(allSessions)
  const career = useMemo(() => careerFromSummaries(allSessions, summaries), [allSessions, summaries])

  const [filter, setFilter] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [showNewSession, setShowNewSession] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [duplicating, setDuplicating] = useState<Session | null>(null)
  const [showExportImport, setShowExportImport] = useState(false)

  const counts = useMemo(
    () => ({
      all: allSessions.length,
      ladder: allSessions.filter((s) => s.type === "ladder").length,
      tournament: allSessions.filter((s) => s.type === "tournament").length,
    }),
    [allSessions],
  )

  const match = (s: Session) => {
    if (filter !== "all" && s.type !== filter) return false
    if (q.trim() && !s.label.toLowerCase().includes(q.trim().toLowerCase())) return false
    return true
  }
  const active = sessions.filter(match)
  const archived = archivedSessions.filter(match)

  const presetOf = (s: Session) => presets.find((p) => p.id === s.activePresetId)

  const handleCreateSession = async (data: Omit<Session, "id" | "startedAt">) => {
    await createSession({ id: crypto.randomUUID(), startedAt: Date.now(), ...data })
    setShowNewSession(false)
  }
  const handleDuplicate = async (data: Omit<Session, "id" | "startedAt">) => {
    await createSession({ id: crypto.randomUUID(), startedAt: Date.now(), ...data })
    setDuplicating(null)
  }

  return (
    <DkApp>
      <DkBar>
        <DkTitle icon="chart" label={t("title")} sub={t("subtitle")} />
        <DkDivider />
        <DkSeg
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          ariaLabel={t("filters.sessionType")}
          options={[
            { value: "all", label: t("filters.all"), count: counts.all },
            { value: "ladder", label: t("filters.ladder"), count: counts.ladder },
            { value: "tournament", label: t("filters.tournaments"), count: counts.tournament },
          ]}
        />
        <DkSearch value={q} onChange={setQ} placeholder={t("search.session")} className="min-w-[min(240px,100%)]" />
        <DkSpacer />
        <Button size="sm" icon="database" onClick={() => setShowExportImport(true)} aria-label={t("exportImport.title")} />
        <Button size="sm" icon="layers" onClick={() => setShowPresets(true)}>
          {t("buttons.presets", { count: presets.length })}
        </Button>
        <Button variant="pri" size="sm" icon="plus" onClick={() => setShowNewSession(true)}>
          {t("buttons.newSession")}
        </Button>
      </DkBar>

      <DkBody>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <DkStat value={career.sessions} label={t("career.sessions")} />
            <DkStat value={`${career.wins}–${career.losses}`} label={t("career.record")} />
            <DkStat value={`${career.winRate}%`} label={t("career.winRate")} tone={career.winRate >= 50 ? "pos" : "neg"} />
            <DkStat value={career.bestElo} label={t("career.bestElo")} tone="accent" />
          </div>

          {loading ? (
            <DkSkelList rows={6} h={62} gap={7} />
          ) : (
            <>
              <div className="grid gap-[7px]">
                {active.length === 0 ? (
                  <DkEmpty
                    icon="sword"
                    title={t("empty.noSessions")}
                    lead={q ? t("empty.noMatch", { q }) : t("empty.noSessionsHint")}
                  >
                    {(q || filter !== "all") && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setQ("")
                          setFilter("all")
                        }}
                      >
                        {t("filters.clear")}
                      </Button>
                    )}
                  </DkEmpty>
                ) : (
                  active.map((s) => (
                    <TrSessionRow
                      key={s.id}
                      session={s}
                      summary={summaries[s.id]}
                      preset={presetOf(s)}
                      onDuplicate={() => setDuplicating(s)}
                      onArchive={() => archiveSession(s.id)}
                      onDelete={() => removeSession(s.id)}
                    />
                  ))
                )}
              </div>

              {archived.length > 0 && (
                <div className="grid gap-[10px]">
                  <button
                    type="button"
                    onClick={() => setShowArchived((v) => !v)}
                    aria-expanded={showArchived}
                    className="inline-flex items-center gap-[7px] justify-self-start border-0 bg-transparent py-[6px] font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-dim transition-colors hover:text-txt"
                  >
                    <Icon name="chevron" size={13} style={{ transform: showArchived ? "none" : "rotate(-90deg)" }} />
                    {showArchived ? t("archive.hideArchived") : t("archive.showArchived", { count: archived.length })}
                  </button>
                  {showArchived && (
                    <div className="grid gap-[7px]">
                      {archived.map((s) => (
                        <TrSessionRow
                          key={s.id}
                          session={s}
                          summary={summaries[s.id]}
                          preset={presetOf(s)}
                          onDuplicate={() => setDuplicating(s)}
                          onUnarchive={() => unarchiveSession(s.id)}
                          onDelete={() => removeSession(s.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DkBody>

      {showNewSession && (
        <NewSessionDialog presets={presets} onConfirm={handleCreateSession} onClose={() => setShowNewSession(false)} />
      )}
      {showPresets && (
        <PresetManager presets={presets} onSave={savePreset} onDelete={removePreset} onClose={() => setShowPresets(false)} />
      )}
      {duplicating && <DuplicateSessionDialog source={duplicating} onConfirm={handleDuplicate} onClose={() => setDuplicating(null)} />}
      {showExportImport && <ExportImportDialog onImportDone={refreshSessions} onClose={() => setShowExportImport(false)} />}
    </DkApp>
  )
}
