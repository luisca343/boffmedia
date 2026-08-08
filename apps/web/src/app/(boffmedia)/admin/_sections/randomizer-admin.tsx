"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button, Empty, Icon, Input, Modal, Spinner, toast, Select } from "@boffmedia/ui"
import { AvPanel, AvSectionHead } from "../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import { TournamentsService } from "@/services/api/boffmedia/tournamentsService"
import type { RandomizerPreset, RandomizerEvent } from "@/services/api/boffmedia/randomizer.types"
import type { TournamentSummaryApi } from "@/services/api/boffmedia/tournamentsService"
import { RandomizerEditor } from "./randomizer/randomizer-editor"
import { QuickRandomizeModal } from "./randomizer/QuickRandomizeModal"
import { totalChanged } from "./randomizer/_components/catalog-view"
import { EventsList } from "./randomizer/events/EventsList"
import { EventEditor } from "./randomizer/events/EventEditor"
import { AssignmentsList } from "./randomizer/events/AssignmentsList"

/**
 * Events management view with tournament selection, event list/edit, and assignments.
 */
function EventsView() {
  const t = useTranslations("randomizer.events")
  const [tournaments, setTournaments] = useState<TournamentSummaryApi[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null)
  const [loadingTournaments, setLoadingTournaments] = useState(false)
  const [editingEvent, setEditingEvent] = useState<RandomizerEvent | null>(null)
  const [showAssignments, setShowAssignments] = useState<RandomizerEvent | null>(null)

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    setLoadingTournaments(true)
    try {
      const res = await TournamentsService.list()
      setTournaments(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoadingTournaments"), msg: String(err) })
    } finally {
      setLoadingTournaments(false)
    }
  }

  // If editing an event, show the editor
  if (editingEvent !== null) {
    return (
      <EventEditor
        event={editingEvent}
        tournamentId={selectedTournamentId}
        onSave={() => {
          setEditingEvent(null)
        }}
        onCancel={() => setEditingEvent(null)}
      />
    )
  }

  // If viewing assignments, show the assignments list
  if (showAssignments) {
    return (
      <AssignmentsList
        event={showAssignments}
        onClose={() => setShowAssignments(null)}
      />
    )
  }

  // Main events view with tournament selector
  return (
    <div className="space-y-5">
      <AvPanel>
        <div className="space-y-3">
          <Select
            label={t("selectTournament")}
            value={selectedTournamentId || ""}
            options={[
              { value: "", label: t("chooseTournament") },
              ...tournaments.map((tn) => ({
                value: String(tn.id),
                label: tn.name,
              })),
            ]}
            disabled={loadingTournaments}
            onChange={(v) => setSelectedTournamentId(v || null)}
          />
        </div>
      </AvPanel>

      {selectedTournamentId && (
        <div>
          <AvPanel className="mb-5">
            <Button
              onClick={() => setEditingEvent({ id: "", tournamentId: selectedTournamentId, gameTitle: "", gamePlatform: "gba", settingsBlobSha512: "", fvxJarSha512: "", cleanRomSha512: "", romHint: "", status: "draft", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any)}
              className="w-full"
            >
              <Icon name="plus" size={16} />
              {t("createEvent")}
            </Button>
          </AvPanel>
          <EventsList
            tournamentId={selectedTournamentId}
            onEdit={setEditingEvent}
            onShowAssignments={setShowAssignments}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Presets list view with create/edit/delete/import/export actions.
 */
function PresetsView({ onLoad }: { onLoad: (preset: RandomizerPreset) => void }) {
  const t = useTranslations("randomizer")
  const [presets, setPresets] = useState<RandomizerPreset[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [presetToDelete, setPresetToDelete] = useState<RandomizerPreset | null>(null)
  const [randomizing, setRandomizing] = useState<RandomizerPreset | null>(null)

  const handleExport = async (preset: RandomizerPreset) => {
    try {
      const blob = await RandomizerService.exportRnqs(preset.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${preset.name}.rnqs`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({ tone: "bad", title: t("chrome.exportError"), msg: String(err) })
    }
  }

  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = async () => {
    setLoading(true)
    try {
      const res = await RandomizerService.listPresets()
      setPresets(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("chrome.errorLoadingPresets"), msg: String(err) })
      setPresets([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setPresetToDelete(null)
    setDeleting(id)
    try {
      const res = await RandomizerService.deletePreset(id)
      if (res.success) {
        toast({ tone: "ok", title: t("chrome.presetDeleted") })
        await loadPresets()
      } else {
        toast({ tone: "bad", title: t("chrome.deleteError"), msg: res.userMessage })
      }
    } finally {
      setDeleting(null)
    }
  }

  const filtered = presets?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-5">
      <AvPanel>
        <div className="flex items-center gap-3">
          <Input
            placeholder={t("chrome.searchPresets")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            className="flex-1 min-w-0"
          />
          <Button variant="ghost" size="sm" icon="refresh" onClick={() => loadPresets()} loading={loading} className="shrink-0">
            {t("chrome.refresh")}
          </Button>
        </div>
      </AvPanel>

      {loading && !presets ? (
        <AvPanel>
          <div className="flex items-center justify-center py-8 gap-2">
            <Spinner />
            <span className="text-txt-muted">{t("chrome.loadingPresets")}</span>
          </div>
        </AvPanel>
      ) : filtered.length === 0 ? (
        <Empty
          title={t("chrome.noPresets")}
          lead={t("chrome.noPresetsDesc")}
          icon="puzzle"
        />
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {filtered.map((preset) => {
            const count = totalChanged(preset.settingsJson as unknown as Record<string, unknown>)
            return (
              <article
                key={preset.id}
                className="flex flex-col border border-solid border-line bg-panel transition-colors hover:border-line-2"
              >
                <div className="p-4 flex-1">
                  <h4 className="font-display font-extrabold italic uppercase text-[19px] tracking-[0.01em] leading-tight">
                    {preset.name}
                  </h4>
                  {preset.description && (
                    <p className="mt-2 text-txt-muted text-[13px] leading-[1.45]">{preset.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 font-mono text-[11px] text-txt-dim">
                    <Icon name="settings" size={13} />
                    <span>{t("chrome.nSettings", { count })}</span>
                    <span className="text-line-2">·</span>
                    <span>{new Date(preset.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 p-3 border-t border-solid border-line bg-panel-2">
                  <Button size="sm" variant="pri" icon="play" onClick={() => setRandomizing(preset)}>
                    {t("quick.run")}
                  </Button>
                  <Button size="sm" variant="default" className="mr-auto" onClick={() => onLoad(preset)}>
                    {t("chrome.load")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="download"
                    title={t("chrome.exportRnqs")}
                    onClick={() => handleExport(preset)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="trash"
                    title={t("chrome.delete")}
                    onClick={() => setPresetToDelete(preset)}
                    disabled={deleting === preset.id}
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}

      {randomizing && (
        <QuickRandomizeModal
          preset={randomizing}
          onClose={() => setRandomizing(null)}
        />
      )}

      <Modal
        open={presetToDelete !== null}
        onClose={() => setPresetToDelete(null)}
        size="sm"
        title={t("chrome.deleteConfirmTitle")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPresetToDelete(null)}>
              {t("chrome.cancel")}
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => presetToDelete && handleDelete(presetToDelete.id)}
            >
              {t("chrome.confirmDelete")}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.5] text-txt-muted">
          {t("chrome.deleteConfirmMsg", { name: presetToDelete?.name ?? "" })}
        </p>
      </Modal>
    </div>
  )
}

/**
 * Main section: routes between Presets, Editor, and Events based on ?view=
 */
export function RandomizerAdmin() {
  const t = useTranslations("randomizer")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [presetToLoad, setPresetToLoad] = useState<RandomizerPreset | null>(null)

  const view = searchParams.get("view") ?? "presets"

  const handleViewChange = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", newView)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const handleLoadPreset = (preset: RandomizerPreset) => {
    setPresetToLoad(preset)
    handleViewChange("editor")
    toast({ tone: "ok", title: t("chrome.presetApplied", { name: preset.name }) })
  }

  return (
    <div>
      <AvSectionHead
        title={t("title")}
        desc={t("desc")}
        actions={
          <div className="flex gap-2">
            <Button
              variant={view === "presets" ? "pri" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("presets")}
            >
              {t("chrome.presets")}
            </Button>
            <Button
              variant={view === "editor" ? "pri" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("editor")}
            >
              {t("chrome.editor")}
            </Button>
            <Button
              variant={view === "events" ? "pri" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("events")}
            >
              {t("chrome.events")}
            </Button>
          </div>
        }
      />

      <div className="mt-5">
        {view === "presets" && <PresetsView onLoad={handleLoadPreset} />}
        {view === "editor" && (
          <RandomizerEditor
            key={presetToLoad?.id ?? "blank"}
            initialSettings={presetToLoad?.settingsJson}
          />
        )}
        {view === "events" && <EventsView />}
      </div>
    </div>
  )
}
