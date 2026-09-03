"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Modal } from "../ui"
import { useUpsertNpcSkin } from "../../_hooks/queries"
import type { NpcSkin } from "../../_types"

const FLAG_KEYS = ["src", "face", "head", "body"] as const
type FlagKey = (typeof FLAG_KEYS)[number]

const FLAG_I18N: Record<FlagKey, string> = {
  src: "skins.origen",
  face: "skins.face",
  head: "skins.cabeza",
  body: "skins.cuerpo",
}

export function NpcSkinModal({ open, onClose, skin }: { open: boolean; onClose: () => void; skin?: NpcSkin }) {
  const t = useTranslations("gobierno")
  const upsert = useUpsertNpcSkin()
  const [name, setName] = useState("")
  const [npcs, setNpcs] = useState("")
  const [flags, setFlags] = useState({ src: false, face: false, head: false, body: false })

  useEffect(() => {
    if (!open) return
    setName(skin?.skin ?? "")
    setNpcs(skin?.npcs?.join(", ") ?? "")
    setFlags({ src: !!skin?.src, face: !!skin?.face, head: !!skin?.head, body: !!skin?.body })
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
      kicker={t("skins.kicker")}
      title={skin ? t("skins.editarSkin", { name: skin.skin }) : t("skins.nuevaSkin")}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button icon="check" disabled={!canSave || upsert.isPending} onClick={save}>
            {upsert.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5">
        <Field label={t("skins.nombreSkin")} value={name} onChange={setName} placeholder={t("skins.nombreSkinPlaceholder")} mono />
        <Field label={t("skins.npcsUsan")} value={npcs} onChange={setNpcs} placeholder={t("skins.npcsPlaceholder")} />
        <div>
          <div className="mb-1.5 font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
            {t("skins.rendersCompletados")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FLAG_KEYS.map((key) => {
              const on = flags[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFlags((s) => ({ ...s, [key]: !s[key] }))}
                  className={`rounded-gt-sm border px-3 py-1.5 font-gt text-[0.78125rem] font-bold transition-colors ${
                    on ? "border-gt-ok bg-gt-ok/12 text-gt-ok" : "border-gt-line-strong bg-gt-paper-0 text-gt-ink-500"
                  }`}
                >
                  {t(FLAG_I18N[key])}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
