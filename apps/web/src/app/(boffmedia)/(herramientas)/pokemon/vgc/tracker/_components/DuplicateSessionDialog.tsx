"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Modal } from "@/components/boffmedia/primitives/modal"
import { Field } from "@/components/boffmedia/primitives/field"
import { Input } from "@/components/boffmedia/primitives/input"
import { Button } from "@/components/boffmedia/primitives/button"
import { TrSub } from "./ui/tr-ui"
import type { Session } from "@/features/vgc-tracker/types"

interface Props {
  source: Session
  onConfirm: (session: Omit<Session, "id" | "startedAt">) => void
  onClose: () => void
}

export function DuplicateSessionDialog({ source, onConfirm, onClose }: Props) {
  const t = useTranslations("vgc.tracker")
  const [label, setLabel] = useState(`${source.label} (2)`)
  const [startElo, setStartElo] = useState(source.startElo !== undefined ? String(source.startElo) : "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    const parsed = parseFloat(startElo)
    onConfirm({
      type: source.type,
      label: label.trim(),
      format: source.format,
      regulationId: source.regulationId,
      activePresetId: source.activePresetId,
      tournamentName: source.tournamentName,
      startElo: source.type === "ladder" && !isNaN(parsed) ? parsed : undefined,
    })
  }

  return (
    <Modal open onClose={onClose} title={t("duplicate.title")} size="sm">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label={t("duplicate.newLabel")}>
          <Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("placeholders.sessionLabel")} />
        </Field>

        {source.type === "ladder" && (
          <Field label={t("labels.startingElo")}>
            <Input type="number" value={startElo} onChange={(e) => setStartElo(e.target.value)} placeholder={t("placeholders.startingElo")} />
          </Field>
        )}

        <div className="grid gap-2 border border-solid border-line bg-base px-3 py-[10px]">
          <TrSub className="mb-0">{t("duplicate.inherits")}</TrSub>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-txt-muted">
            <span className="border border-solid border-line-2 px-[6px] py-px">{source.format}</span>
            <span>{source.regulationId}</span>
            {source.tournamentName && <span className="text-warn">{source.tournamentName}</span>}
          </div>
        </div>

        <div className="mt-1 flex gap-2">
          <Button type="button" size="sm" onClick={onClose} className="flex-1">
            {t("buttons.cancel")}
          </Button>
          <Button type="submit" variant="pri" size="sm" disabled={!label.trim()} className="flex-1">
            {t("buttons.duplicate")}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
