"use client"

import { useState } from "react"
import { Button, Field, Input, Modal, Textarea } from "@boffmedia/ui"
import { useTranslations } from "next-intl"

export function TierListHeadingEditor({ title, description, onSave, onClose }: {
  title: string; description: string; onSave: (title: string, description: string) => void; onClose: () => void
}) {
  const t = useTranslations("tierLists")
  const [name, setName] = useState(title)
  const [caption, setCaption] = useState(description)
  return <Modal open onClose={onClose} title={t("editHeading")} size="sm">
    <form className="grid gap-4" onSubmit={(event) => {
      event.preventDefault()
      if (name.trim()) { onSave(name.trim(), caption.trim()); onClose() }
    }}>
      <p className="text-sm text-txt-muted">{t("headingHint")}</p>
      <Field label={t("title")}><Input value={name} required maxLength={200} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label={t("description")}><Textarea value={caption} maxLength={2000} rows={3} onChange={(event) => setCaption(event.target.value)} /></Field>
      <Button type="submit" variant="pri">{t("save")}</Button>
    </form>
  </Modal>
}
