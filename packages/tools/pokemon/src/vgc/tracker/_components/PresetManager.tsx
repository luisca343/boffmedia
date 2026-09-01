"use client"

import { useEffect, useState } from "react"
import { useVgcT } from "../../i18n";
import { cn } from "@boffmedia/ui/cn"
import { Modal, Field, Input, Textarea, Select, Button, Icon } from "@boffmedia/ui"
import { parseShowdownPaste, isValidPaste } from "../../tracker-core/showdown-parse"
import { TrSprite, TrNone } from "./ui/tr-ui"
import type { PresetSlot, TeamPreset } from "../../tracker-core/types"
import { VgcService, ChampionsRegulation, VgcPokemon } from "../../service"

interface Props {
  presets: TeamPreset[]
  onSave: (preset: TeamPreset) => void
  onDelete: (id: string) => void
  onClose: () => void
}

type PanelMode = "list" | "create" | "edit" | "history"

const VER_TAG = "border border-solid border-line-2 px-[6px] py-px font-mono text-[10px] leading-none text-txt-dim"

export function PresetManager({ presets, onSave, onDelete, onClose }: Props) {
  const t = useVgcT("tracker")
  const [mode, setMode] = useState<PanelMode>("list")
  const [editingPreset, setEditingPreset] = useState<TeamPreset | null>(null)
  const [historyPreset, setHistoryPreset] = useState<TeamPreset | null>(null)

  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([])
  const [pokemonList, setPokemonList] = useState<VgcPokemon[]>([])
  const [name, setName] = useState("")
  const [regulationId, setRegulationId] = useState("")
  const [paste, setPaste] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    VgcService.getChampionsRegulations().then((res) => {
      if (res.success && res.data) {
        setRegulations(res.data)
        setRegulationId(res.data[0]?.id ?? "")
      }
    })
  }, [])

  useEffect(() => {
    if (!regulationId) return
    VgcService.getChampionsLegalPokemon(regulationId).then((res) => {
      if (res.success && res.data) setPokemonList(res.data)
    })
  }, [regulationId])

  const toId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

  const normalizeSlots = (rawSlots: PresetSlot[]): PresetSlot[] =>
    rawSlots.map((slot) => {
      const match = pokemonList.find((p) => toId(p.name) === toId(slot.speciesName))
      return match ? { ...slot, speciesId: toId(match.name), speciesName: match.name } : slot
    })

  const resetForm = () => {
    setName("")
    setPaste("")
    setError("")
  }
  const backToList = () => {
    setMode("list")
    resetForm()
  }

  const openCreate = () => {
    resetForm()
    setMode("create")
  }
  const openEdit = (preset: TeamPreset) => {
    setEditingPreset(preset)
    setName(preset.name)
    setPaste(preset.exportString)
    setRegulationId(preset.regulationId)
    setError("")
    setMode("edit")
  }
  const openHistory = (preset: TeamPreset) => {
    setHistoryPreset(preset)
    setMode("history")
  }

  const handleCreate = () => {
    if (!name.trim()) return setError(t("errors.presetNameRequired"))
    const rawSlots = parseShowdownPaste(paste)
    if (!rawSlots.length) return setError(t("errors.invalidPaste"))
    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      regulationId,
      exportString: paste.trim(),
      slots: normalizeSlots(rawSlots),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currentVersion: 1,
      versions: [],
    })
    backToList()
  }

  const handleEdit = () => {
    if (!editingPreset) return
    if (!name.trim()) return setError(t("errors.presetNameRequired"))
    const rawSlots = parseShowdownPaste(paste)
    if (!rawSlots.length) return setError(t("errors.invalidPaste"))
    onSave({ ...editingPreset, name: name.trim(), exportString: paste.trim(), slots: normalizeSlots(rawSlots), regulationId })
    setEditingPreset(null)
    backToList()
  }

  const handleRestoreVersion = (preset: TeamPreset, versionIndex: number) => {
    const v = preset.versions[versionIndex]
    onSave({ ...preset, name: v.name, exportString: v.exportString, slots: v.slots })
    backToList()
  }

  const title = mode === "edit" ? t("preset.editTitle") : mode === "history" ? t("preset.versionHistory") : t("modals.teamPresets")

  return (
    <Modal open onClose={onClose} title={title} size="lg">
      <div className="grid gap-3">
        {mode !== "list" && (
          <button
            type="button"
            onClick={backToList}
            className="inline-flex items-center gap-[6px] justify-self-start border-0 bg-transparent font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-txt-dim transition-colors hover:text-txt"
          >
            <Icon name="chevron" size={12} style={{ transform: "rotate(90deg)" }} />
            {t("preset.backToList")}
          </button>
        )}

        {mode === "list" && (
          <>
            {presets.length === 0 && <TrNone>{t("empty.noPresets")}</TrNone>}
            {presets.map((preset) => (
              <PresetRow
                key={preset.id}
                preset={preset}
                onEdit={() => openEdit(preset)}
                onHistory={() => openHistory(preset)}
                onDelete={() => onDelete(preset.id)}
              />
            ))}
            <Button size="sm" icon="plus" onClick={openCreate} className="mt-1 w-full">
              {t("buttons.importNewPreset")}
            </Button>
          </>
        )}

        {(mode === "create" || mode === "edit") && (
          <div className="grid gap-3">
            <Field label={t("labels.presetName")}>
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t("placeholders.presetName")} />
            </Field>
            <Field label={t("labels.regulation")}>
              <Select value={regulationId} onChange={setRegulationId} options={regulations.map((r) => ({ value: r.id, label: r.name }))} />
            </Field>
            <Field label={t("labels.showdownPaste")} error={error || undefined}>
              <Textarea
                value={paste}
                onChange={(e) => {
                  setPaste(e.target.value)
                  setError("")
                }}
                placeholder={"Incineroar @ Assault Vest\nAbility: Intimidate\n- Fake Out\n- Knock Off\n..."}
                rows={6}
                className="font-mono"
              />
            </Field>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={backToList} className="flex-1">
                {t("buttons.cancel")}
              </Button>
              <Button
                size="sm"
                variant="pri"
                icon={mode === "create" ? "inbox" : undefined}
                onClick={mode === "create" ? handleCreate : handleEdit}
                disabled={!paste.trim() || !isValidPaste(paste)}
                className="flex-1"
              >
                {mode === "create" ? t("buttons.import") : t("buttons.save")}
              </Button>
            </div>
          </div>
        )}

        {mode === "history" && historyPreset && (
          <div className="grid gap-2">
            <div className="border border-solid border-accent-line bg-base p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="border border-solid border-accent-line bg-accent-soft px-[6px] py-px font-mono text-[10px] leading-none text-accent-bright">
                    {t("preset.versionN", { n: historyPreset.currentVersion })}
                  </span>
                  <span className="font-mono text-[10px] text-txt-muted">{t("preset.currentTag")}</span>
                </div>
                <span className="flex gap-px">
                  {historyPreset.slots.slice(0, 3).map((s) => (
                    <TrSprite key={s.slotIndex} name={s.speciesName} size={26} />
                  ))}
                </span>
              </div>
              <p className="font-body text-[13px] font-medium text-txt">{historyPreset.name}</p>
              <p className="truncate font-mono text-[11px] text-txt-dim">{historyPreset.slots.map((s) => s.speciesName).join(", ")}</p>
            </div>

            {[...historyPreset.versions].reverse().map((v, i) => (
              <div key={i} className="border border-solid border-line bg-base p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className={VER_TAG}>{t("preset.versionN", { n: v.version })}</span>
                  <button
                    type="button"
                    onClick={() => handleRestoreVersion(historyPreset, historyPreset.versions.length - 1 - i)}
                    className="inline-flex items-center gap-1 font-mono text-[10.5px] text-txt-muted transition-colors hover:text-accent-bright"
                  >
                    <Icon name="refresh" size={11} /> {t("buttons.restoreVersion")}
                  </button>
                </div>
                <p className="font-body text-[13px] font-medium text-txt">{v.name}</p>
                <p className="truncate font-mono text-[11px] text-txt-dim">{v.slots.map((s) => s.speciesName).join(", ")}</p>
              </div>
            ))}

            {historyPreset.versions.length === 0 && <TrNone>{t("preset.noPreviousVersions")}</TrNone>}
          </div>
        )}
      </div>
    </Modal>
  )
}

function PresetRow({
  preset,
  onEdit,
  onHistory,
  onDelete,
}: {
  preset: TeamPreset
  onEdit: () => void
  onHistory: () => void
  onDelete: () => void
}) {
  const t = useVgcT("tracker")
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-solid border-line bg-base">
      <div className="flex items-center gap-3 p-3">
        <span className="flex flex-none gap-px">
          {preset.slots.slice(0, 3).map((s) => (
            <TrSprite key={s.slotIndex} name={s.speciesName} size={34} />
          ))}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-[13px] font-bold uppercase leading-none tracking-[0.03em]">{preset.name}</p>
            <span className={cn(VER_TAG, "flex-none")}>{t("preset.versionN", { n: preset.currentVersion })}</span>
          </div>
          <p className="mt-1 truncate font-mono text-[11px] text-txt-dim">{preset.slots.map((s) => s.speciesName).join(", ")}</p>
        </div>
        <div className="flex flex-none items-center gap-1">
          <IconBtn icon="edit" label={t("buttons.editPreset")} onClick={onEdit} />
          <IconBtn
            icon={expanded ? "chevron" : "chevronDown"}
            label={t("preset.versionHistory")}
            onClick={() => setExpanded((v) => !v)}
          />
          <IconBtn icon="trash" label={t("buttons.delete")} danger onClick={onDelete} />
        </div>
      </div>
      {expanded && (
        <div className="border-t border-solid border-line px-3 pb-3 pt-2">
          <button
            type="button"
            onClick={onHistory}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-txt-muted transition-colors hover:text-accent-bright"
          >
            <Icon name="refresh" size={11} /> {t("preset.versionHistory")} ({preset.versions.length})
          </button>
        </div>
      )}
    </div>
  )
}

function IconBtn({ icon, label, onClick, danger }: { icon: "edit" | "chevron" | "chevronDown" | "trash"; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn("grid h-7 w-7 place-items-center text-txt-muted transition-colors hover:text-txt", danger && "hover:text-bad")}
    >
      <Icon name={icon} size={14} />
    </button>
  )
}
