"use client"

import { useTranslations } from "next-intl"
import { Stat } from "../ui"
import { money } from "../../_utils/format"
import { useFormat } from "@boffmedia/ui/useFormat"
import type { Multa } from "../../_types"

export function MultasStats({ multas }: { multas: Multa[] }) {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const pending = multas.filter((m) => m.status === "pending")
  const paid = multas.filter((m) => m.status === "paid")
  const appealed = multas.filter((m) => m.status === "appealed")
  const cancelled = multas.filter((m) => m.status === "cancelled")

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat
        label={t("hacienda.pendienteCobro")}
        value={`${money(pending.reduce((a, b) => a + b.amount, 0), intlLocale)} ₽`}
        tone="warn"
        icon="clock"
        sub={t("hacienda.multasCount", { count: pending.length })}
      />
      <Stat
        label={t("hacienda.recaudado")}
        value={`${money(paid.reduce((a, b) => a + b.amount, 0), intlLocale)} ₽`}
        tone="ok"
        icon="coins"
        sub={t("hacienda.pagadas", { count: paid.length })}
      />
      <Stat label={t("hacienda.enApelacion")} value={appealed.length} tone="info" icon="scale" />
      <Stat label={t("hacienda.anuladas")} value={cancelled.length} tone="default" icon="x" />
    </div>
  )
}
