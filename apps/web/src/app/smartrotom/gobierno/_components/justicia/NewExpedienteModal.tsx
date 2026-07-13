"use client"

import { useState } from "react"
import { Modal, Field, Select, Button } from "../ui"
import { SEVERITY } from "../../_utils/tones"
import { useCreateExpediente } from "../../_hooks/queries"

export function NewExpedienteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      kicker="Justicia · Expedientes"
      title="Abrir expediente"
      footer={
        <>
          <Button tone="ghost" onClick={close}>
            Cancelar
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
            {createExpediente.isPending ? "Abriendo…" : "Abrir expediente"}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field
          label="Título del caso"
          value={title}
          onChange={setTitle}
          placeholder="Ej. Vandalismo reincidente en Ciudad Carmín"
        />
        <Field label="Sujeto (jugador)" value={subject} onChange={setSubject} placeholder="Usuario" icon="users" />
        <Select
          label="Gravedad"
          value={severity}
          onChange={setSeverity}
          options={Object.entries(SEVERITY).map(([value, s]) => ({ value, label: s.label }))}
        />
      </div>
    </Modal>
  )
}
