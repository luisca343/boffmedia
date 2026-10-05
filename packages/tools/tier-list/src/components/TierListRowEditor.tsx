"use client"

import { useState } from "react"
import { Button, ColorInput, Field, Input, Modal } from "@boffmedia/ui"
import { useTierListT } from "../i18n"
import type { TierListRow } from "../core/schema"

export function TierListRowEditor({ row, onSave, onClose }: { row: TierListRow; onSave: (row: TierListRow) => void; onClose: () => void }) {
  const t = useTierListT()
  const [draft, setDraft] = useState(row)
  return <Modal open onClose={onClose} title={t("editRow")} size="sm">
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (draft.label.trim()) { onSave({ ...draft, label: draft.label.trim() }); onClose() } }}>
      <Field label={t("rowLabel")}><Input value={draft.label} required maxLength={200} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></Field>
      <Field label={t("rowColor")}><ColorInput value={draft.color ?? "#808080"} onChange={(e) => setDraft({ ...draft, color: e.target.value })} /></Field>
      <Field label={t("description")}><Input value={draft.description ?? ""} maxLength={2000} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
      <Button type="submit" variant="pri">{t("save")}</Button>
    </form>
  </Modal>
}
