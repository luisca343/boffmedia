"use client"

// Logging a new denuncia. `accusedUuid` is deliberately left off this form: the API takes a
// uuid, not a username, and there is no player-search endpoint anywhere in the app to resolve
// one into the other — so a denuncia starts unassigned and only gets a named infractor once
// escalated from a record where the accused arrives pre-resolved (WorldGuard plot owner, an
// existing dossier, etc). `reporterUuid` is always the officer logging it — this tool has no
// citizen-facing intake, an officer records what was reported to them.
import { useState } from "react"
import { Modal, Button, Field, TextArea, Select } from "../ui"
import { useCreateDenuncia } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { DENUNCIA_CATEGORY } from "../../_utils/tones"

const CATEGORY_OPTIONS = Object.entries(DENUNCIA_CATEGORY).map(([value, label]) => ({ value, label }))

export function NuevaDenunciaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const officer = useOfficer()
  const createDenuncia = useCreateDenuncia()

  const [category, setCategory] = useState("griefing")
  const [town, setTown] = useState("")
  const [plotNumber, setPlotNumber] = useState("")
  const [description, setDescription] = useState("")

  const reset = () => {
    setCategory("griefing")
    setTown("")
    setPlotNumber("")
    setDescription("")
  }

  const submit = () => {
    if (!description.trim()) return
    createDenuncia.mutate(
      {
        category,
        town: town.trim() || undefined,
        plotNumber: plotNumber.trim() ? Math.round(Number(plotNumber)) : undefined,
        description,
        reporterUuid: officer.uuid,
      },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title="Nueva denuncia" kicker="Seguridad · Policía municipal">
      <div className="space-y-3.5">
        <Select label="Categoría" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
        <div className="grid grid-cols-[1fr,120px] gap-2.5">
          <Field label="Pueblo" value={town} onChange={setTown} placeholder="pueblo_mizu" />
          <Field label="Parcela nº" value={plotNumber} onChange={setPlotNumber} type="number" mono />
        </div>
        <TextArea
          label="Descripción del incidente"
          value={description}
          onChange={setDescription}
          rows={4}
          placeholder="Qué ha pasado, cuándo y quién lo reporta…"
        />
        <p className="font-gt-mono text-[10.5px] uppercase tracking-[.1em] text-gt-ink-400">
          Registrada por {officer.username || "ti"} · {officer.rankLabel}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button tone="ghost" onClick={onClose} disabled={createDenuncia.isPending}>
          Cancelar
        </Button>
        <Button tone="primary" icon="plus" onClick={submit} disabled={createDenuncia.isPending || !description.trim()}>
          Registrar denuncia
        </Button>
      </div>
    </Modal>
  )
}
