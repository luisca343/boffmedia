"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Modal, Button, Field, TextArea, Select } from "../ui"
import { useCreateDenuncia } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { DENUNCIA_CATEGORY } from "../../_utils/tones"

export function NuevaDenunciaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("gobierno")
  const officer = useOfficer()
  const createDenuncia = useCreateDenuncia()

  const CATEGORY_OPTIONS = Object.entries(DENUNCIA_CATEGORY).map(([value, key]) => ({ value, label: t(key) }))

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
    <Modal open={open} onClose={onClose} title={t("denuncias.new.title")} kicker={t("denuncias.new.kicker")}>
      <div className="space-y-3.5">
        <Select label={t("denuncias.new.category")} value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
        <div className="grid grid-cols-[1fr,120px] gap-2.5">
          <Field label={t("denuncias.new.town")} value={town} onChange={setTown} placeholder={t("denuncias.new.townPlaceholder")} />
          <Field label={t("denuncias.new.plotNumber")} value={plotNumber} onChange={setPlotNumber} type="number" mono />
        </div>
        <TextArea
          label={t("denuncias.new.description")}
          value={description}
          onChange={setDescription}
          rows={4}
          placeholder={t("denuncias.new.descriptionPlaceholder")}
        />
        <p className="font-gt-mono text-[10.5px] uppercase tracking-[.1em] text-gt-ink-400">
          {t("denuncias.new.registeredBy", { username: officer.username || t("common.you"), rank: officer.rankLabel })}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button tone="ghost" onClick={onClose} disabled={createDenuncia.isPending}>
          {t("common.cancel")}
        </Button>
        <Button tone="primary" icon="plus" onClick={submit} disabled={createDenuncia.isPending || !description.trim()}>
          {t("denuncias.new.submit")}
        </Button>
      </div>
    </Modal>
  )
}
