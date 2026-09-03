"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Modal, Select, toast } from "@boffmedia/ui"
import { AvAlert } from "../../_components/ui/av-kit"
import {
  TournamentsService,
  type TnEntryResolutionApi,
  type TournamentDetailApi,
} from "@/services/api/boffmedia/tournamentsService"
import { isPreStart } from "./lifecycle"

/**
 * Generating freezes the field first: anyone registered but not entered is
 * dropped, irreversibly once the bracket exists. This is where that split is
 * shown, and where the two options that only matter at this instant live —
 * seeding and "only checked-in" used to sit permanently among the buttons.
 */
export function GenerateDialog({
  open,
  tn,
  label,
  onClose,
  onGenerated,
}: {
  open: boolean
  tn: TournamentDetailApi
  label: string
  onClose: () => void
  onGenerated: () => void
}) {
  const t = useTranslations("tournaments")
  const [seeding, setSeeding] = useState("as-seeded")
  const [onlyCheckedIn, setOnlyCheckedIn] = useState(false)
  const [preview, setPreview] = useState<TnEntryResolutionApi | null>(null)
  const [busy, setBusy] = useState(false)
  const pre = isPreStart(tn)

  useEffect(() => {
    if (!open) return
    setPreview(null)
    let alive = true
    TournamentsService.entryPreview(tn.id).then((r) => {
      if (alive && r.success && r.data) setPreview(r.data)
    })
    return () => { alive = false }
  }, [open, tn.id])

  const run = async (draft: boolean) => {
    setBusy(true)
    const body: Record<string, unknown> = { seeding }
    if (draft) body.preview = true
    if (onlyCheckedIn) body.onlyCheckedIn = true
    const r = await TournamentsService.generate(tn.id, body)
    setBusy(false)
    if (r.error) return toast.error(r.error)
    toast.success(draft ? t("generatedDraft") : t("generated"))
    onClose()
    onGenerated()
  }

  const dropped = preview?.dropped.length ?? 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("generateTitle")}
      footer={
        <div className="flex items-center justify-between gap-3">
          {pre ? (
            <Button size="sm" icon="eye" disabled={busy} onClick={() => run(true)}>{t("generateDraft")}</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button size="sm" onClick={onClose}>{t("cancel")}</Button>
            <Button size="sm" variant="pri" icon="bolt" disabled={busy} onClick={() => run(false)}>{label}</Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-3">
        {preview ? (
          <AvAlert tone={dropped > 0 ? "warning" : "success"}>
            {t("confirmEntryCut", { entered: preview.entered.length, dropped })}
          </AvAlert>
        ) : (
          <p className="m-0 font-mono text-[0.6875rem] text-txt-dim">{t("loadingPreview")}</p>
        )}
        {pre && (
          <Field label={t("seeding")}>
            <Select
              value={seeding}
              onChange={setSeeding}
              options={[
                { value: "as-seeded", label: t("seedAsSeeded") },
                { value: "random", label: t("seedRandom") },
                { value: "as-added", label: t("seedAsAdded") },
              ]}
            />
          </Field>
        )}
        {pre && (
          <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-[0.6875rem] text-txt-muted">
            <input type="checkbox" checked={onlyCheckedIn} onChange={(e) => setOnlyCheckedIn(e.target.checked)} />
            {t("onlyCheckedIn")}
          </label>
        )}
      </div>
    </Modal>
  )
}
