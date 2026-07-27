"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Bar, Card, Field, Button } from "../ui"

// The inline "emitir sanción" card. Player is a plain username field, not a censo
// lookup — the censo is itself derived from multas/buscados/plots, so it is empty
// exactly when it would matter most: issuing the first fine against someone new.
export function MultaForm({
  onSubmit,
  pending,
}: {
  onSubmit: (values: { player: string; reason: string; amount: number }) => void
  pending: boolean
}) {
  const t = useTranslations("gobierno")
  const [player, setPlayer] = useState("")
  const [reason, setReason] = useState("")
  const [amount, setAmount] = useState("")

  const valid = player.trim().length > 0 && Number(amount) > 0

  return (
    <Card dep="hacienda" className="mb-4 animate-gt-pop motion-reduce:animate-none">
      <Bar icon="gavel" dep="hacienda">
        {t("hacienda.nuevaSancion")}
      </Bar>
      <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-[1fr_2fr_1fr_auto] sm:items-end">
        <Field
          label={t("hacienda.jugador")}
          value={player}
          onChange={setPlayer}
          placeholder={t("expedientes.sujetoPlaceholder")}
          icon="users"
        />
        <Field label={t("hacienda.motivo")} value={reason} onChange={setReason} placeholder={t("hacienda.motivoPlaceholder")} />
        <Field label={t("hacienda.importe")} type="number" mono value={amount} onChange={setAmount} placeholder="0" />
        <Button
          tone="primary"
          icon="check"
          disabled={!valid || pending}
          onClick={() => onSubmit({ player: player.trim(), reason: reason.trim(), amount: Number(amount) })}
        >
          {pending ? t("hacienda.emitiendo") : t("hacienda.emitir")}
        </Button>
      </div>
    </Card>
  )
}
