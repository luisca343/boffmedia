"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Modal, Field, Select, Button } from "../ui"
import { SEVERITY } from "../../_utils/tones"
import { useCreateExpediente } from "../../_hooks/queries"

export function NewExpedienteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("gobierno")
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [severity, setSeverity] = useState("medium")
  const createExpediente = useCreateExpediente()

  const valid = title.trim().length > 0 && subject.trim().length > 0

  const close = () => {
    onClose()
    setTitle("")
    setSubject("")
    setSeverity("medium")
  }

  return (
    <Modal
      open={open}
      onClose={close}
      kicker={t("expedientes.openExpedienteKicker")}
      title={t("expedientes.openExpediente")}
      footer={
        <>
          <Button tone="ghost" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!valid || createExpediente.isPending}
            onClick={() =>
              createExpediente.mutate(
                { title: title.trim(), subject: subject.trim(), severity, dep: "justicia" },
                { onSuccess: close },
              )
            }
          >
            {createExpediente.isPending ? t("expedientes.abriendo") : t("expedientes.openExpediente")}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field
          label={t("expedientes.tituloCaso")}
          value={title}
          onChange={setTitle}
          placeholder={t("expedientes.tituloCasoPlaceholder")}
        />
        <Field label={t("expedientes.sujeto")} value={subject} onChange={setSubject} placeholder={t("expedientes.sujetoPlaceholder")} icon="users" />
        <Select
          label={t("denuncias.action.gravedad")}
          value={severity}
          onChange={setSeverity}
          options={Object.entries(SEVERITY).map(([value, s]) => ({ value, label: t(s.labelKey) }))}
        />
      </div>
    </Modal>
  )
}
