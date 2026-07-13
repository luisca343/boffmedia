"use client"

import { useEffect, useState } from "react"
import { Button, Field, Modal } from "../ui"
import { useUpsertNpcSkin } from "../../_hooks/queries"
import type { NpcSkin } from "../../_types"

const FLAGS: { key: "src" | "face" | "head" | "body"; label: string }[] = [
  { key: "src", label: "Origen" },
  { key: "face", label: "2D" },
  { key: "head", label: "Cabeza" },
  { key: "body", label: "Cuerpo" },
]

export function NpcSkinModal({ open, onClose, skin }: { open: boolean; onClose: () => void; skin?: NpcSkin }) {
  const upsert = useUpsertNpcSkin()
  const [name, setName] = useState("")
  const [npcs, setNpcs] = useState("")
  const [flags, setFlags] = useState({ src: false, face: false, head: false, body: false })

  useEffect(() => {
    if (!open) return
    setName(skin?.skin ?? "")
    setNpcs(skin?.npcs.join(", ") ?? "")
    setFlags({ src: skin?.src ?? false, face: skin?.face ?? false, head: skin?.head ?? false, body: skin?.body ?? false })
  }, [open, skin])

  const canSave = name.trim().length > 0

  const save = () => {
    if (!canSave) return
    upsert.mutate(
      {
        ...(skin ? { id: skin.id } : {}),
        skin: name.trim(),
        npcs: npcs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        ...flags,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      kicker="Administración · Recursos"
      title={skin ? `Editar «${skin.skin}»` : "Nueva skin"}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon="check" disabled={!canSave || upsert.isPending} onClick={save}>
            {upsert.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5">
        <Field label="Nombre de la skin" value={name} onChange={setName} placeholder="ProfesorOak" mono />
        <Field label="NPCs que la usan" value={npcs} onChange={setNpcs} placeholder="Prof. Oak, Asistente lab." />
        <div>
          <div className="mb-1.5 font-gt-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">
            Renders completados
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FLAGS.map((f) => {
              const on = flags[f.key]
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFlags((s) => ({ ...s, [f.key]: !s[f.key] }))}
                  className={`rounded-gt-sm border px-3 py-1.5 font-gt text-[12.5px] font-bold transition-colors ${
                    on ? "border-gt-ok bg-gt-ok/12 text-gt-ok" : "border-gt-line-strong bg-gt-paper-0 text-gt-ink-500"
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
