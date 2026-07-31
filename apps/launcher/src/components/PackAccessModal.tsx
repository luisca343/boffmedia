import { useEffect, useState, type FormEvent } from "react"

import { Badge, Button, Field, Modal, PasswordField } from "@boffmedia/ui"

import { useLauncher } from "../state/launcher"

export function PackAccessModal() {
  const { accessPrompt, packs, submitAccessPassword, cancelAccessPrompt } = useLauncher()
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const pack = packs.find((entry) => entry.pack.id === accessPrompt?.packId)

  useEffect(() => {
    if (accessPrompt) {
      setPassword("")
      setSubmitting(false)
    }
  }, [accessPrompt])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!password.trim() || submitting) return
    setSubmitting(true)
    await submitAccessPassword(password)
    setSubmitting(false)
  }

  return (
    <Modal
      open={!!accessPrompt}
      onClose={submitting ? () => undefined : cancelAccessPrompt}
      title="Pack protegido"
      aside={<Badge tone="info">Contraseña</Badge>}
      size="sm"
      footer={
        <>
          <Button variant="ghost" disabled={submitting} onClick={cancelAccessPrompt}>
            Cancelar
          </Button>
          <Button
            variant="pri"
            icon="key"
            type="submit"
            form="pack-access-form"
            loading={submitting}
            disabled={!password.trim()}
          >
            Continuar
          </Button>
        </>
      }
    >
      <form id="pack-access-form" className="grid gap-4" onSubmit={(event) => void submit(event)}>
        <p className="text-sm leading-relaxed text-txt-muted">
          {pack?.pack.name ?? "Este pack"} necesita una contraseña para descargar su composición y configuración.
        </p>
        <Field label="Contraseña" hint="Se conserva solo mientras el launcher esté abierto.">
          <PasswordField
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Introduce la contraseña"
            autoComplete="off"
          />
        </Field>
      </form>
    </Modal>
  )
}
