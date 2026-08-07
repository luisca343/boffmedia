"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button, Empty, Icon, Input, Spinner, toast, Select } from "@boffmedia/ui"
import { AvPanel, AvSectionHead } from "../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import { TournamentsService } from "@/services/api/boffmedia/tournamentsService"
import type { RandomizerPreset, RandomizerEvent } from "@/services/api/boffmedia/randomizer.types"
import type { TournamentSummaryApi } from "@/services/api/boffmedia/tournamentsService"
import { RandomizerEditor } from "./randomizer/randomizer-editor"
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
              onClick={() => setEditingEvent({ id: "", tournamentId: selectedTournamentId, title: "", gamePlatform: "gba", cleanRomSha512: "", romHint: "", status: "draft", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any)}
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
function PresetsView() {
  const t = useTranslations("randomizer")
  const [presets, setPresets] = useState<RandomizerPreset[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

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
      <AvSectionHead
        title={t("chrome.presets")}
        desc={t("desc")}
        actions={
          <Button onClick={() => loadPresets()} disabled={loading}>
            {loading ? <Spinner size={16} /> : <Icon name="refresh" size={16} />}
            {t("chrome.refresh")}
          </Button>
        }
      />

      <AvPanel>
        <Input
          placeholder={t("chrome.searchPresets")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />
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
        <AvPanel>
          <div className="space-y-2">
            {filtered.map((preset) => (
              <div
                key={preset.id}
                className="flex items-start justify-between gap-3 p-3 rounded border border-line hover:bg-panel-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{preset.name}</p>
                  {preset.description && (
                    <p className="text-xs text-txt-muted truncate">{preset.description}</p>
                  )}
                  <p className="text-xs text-txt-dim mt-1">
                    {new Date(preset.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      // Later: load and switch to editor
                      toast({ tone: "info", title: "Load", msg: "Placeholder (wired in later pass)" })
                    }}
                  >
                    {t("chrome.load")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      // Later: download .rnqs
                      toast({ tone: "info", title: "Export", msg: "Placeholder (wired in later pass)" })
                    }}
                  >
                    <Icon name="download" size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(preset.id)}
                    disabled={deleting === preset.id}
                  >
                    <Icon name="trash" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </AvPanel>
      )}
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

  const view = searchParams.get("view") ?? "presets"

  const handleViewChange = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", newView)
    router.replace(`?${params.toString()}`, { scroll: false })
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
              {t("events")}
            </Button>
          </div>
        }
      />

      <div className="mt-5">
        {view === "presets" && <PresetsView />}
        {view === "editor" && <RandomizerEditor />}
        {view === "events" && <EventsView />}
      </div>
    </div>
  )
}
