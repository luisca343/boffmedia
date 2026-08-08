"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button, Empty, Icon, Input, Modal, Spinner, toast, Select } from "@boffmedia/ui"
import { AvPanel, AvSectionHead } from "../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import type { RandomizerPreset, RandomizerConfig } from "@/services/api/boffmedia/randomizer.types"
import { RandomizerEditor } from "./randomizer/randomizer-editor"
import { QuickRandomizeModal } from "./randomizer/QuickRandomizeModal"
import { totalChanged } from "./randomizer/_components/catalog-view"
import { ConfigsList } from "./randomizer/configs/ConfigsList"
import { ConfigEditor } from "./randomizer/configs/ConfigEditor"
import { ConfigAssignmentsList } from "./randomizer/configs/ConfigAssignmentsList"

/**
 * Configs management view with community event selection, config list/edit, and assignments.
 * Replaces tournament-based event management with event-based config management.
 */
function ConfigsView() {
  const t = useTranslations("randomizer.events")
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [editingConfig, setEditingConfig] = useState<RandomizerConfig | null>(null)
  const [showAssignments, setShowAssignments] = useState<RandomizerConfig | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoadingEvents(true)
    try {
      // Load community events (any game). createConfig validates emulator-pack
      // attachment server-side; listing all events keeps this independent of the
      // shared Event type exposing packId (pre generate:shared).
      const res = await EventsService.getEvents()
      setEvents(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoadingEvents"), msg: String(err) })
    } finally {
      setLoadingEvents(false)
    }
  }

  // If editing a config, show the editor
  if (editingConfig !== null) {
    return (
      <ConfigEditor
        config={editingConfig}
        eventId={selectedEventId ? Number(selectedEventId) : null}
        onSave={() => {
          setEditingConfig(null)
          // Refresh configs list
        }}
        onCancel={() => setEditingConfig(null)}
      />
    )
  }

  // If viewing assignments, show the assignments list
  if (showAssignments) {
    return (
      <ConfigAssignmentsList
        config={showAssignments}
        onClose={() => setShowAssignments(null)}
      />
    )
  }

  // Main configs view with event selector
  return (
    <div className="space-y-5">
      <AvPanel>
        <div className="space-y-3">
          <Select
            label={t("selectEvent")}
            value={selectedEventId || ""}
            options={[
              { value: "", label: t("chooseEvent") },
              ...events.map((ev) => ({
                value: String(ev.id),
                label: ev.title ?? ev.name ?? `#${ev.id}`,
              })),
            ]}
            disabled={loadingEvents}
            onChange={(v) => setSelectedEventId(v || null)}
          />
        </div>
      </AvPanel>

      {selectedEventId && (
        <div>
          <AvPanel className="mb-5">
            <Button
              onClick={() => setEditingConfig({} as any)}
              className="w-full"
            >
              <Icon name="plus" size={16} />
              {t("createConfig")}
            </Button>
          </AvPanel>
          <ConfigsList
            eventId={Number(selectedEventId)}
            onEdit={setEditingConfig}
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
              variant={view === "configs" ? "pri" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("configs")}
            >
              {t("chrome.configs")}
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
        {view === "configs" && <ConfigsView />}
      </div>
    </div>
  )
}
