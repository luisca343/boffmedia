"use client"

import { useTranslations } from "next-intl"
import { Stat } from "../ui"
import { money } from "../../_utils/format"
import { useFormat } from "@boffmedia/ui/useFormat"
import type { Tesoreria } from "../../_types"

export function TesoreriaStats({ t: data }: { t: Tesoreria }) {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const neto = data.ingresosMes - data.gastosMes
  return (
    <div className="mb-[18px] grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label={t("tesoreria.stats.balance")} value={`${money(data.balance, intlLocale)} ₽`} tone="hacienda" icon="landmark" />
      <Stat label={t("tesoreria.stats.ingresos")} value={`+${money(data.ingresosMes, intlLocale)} ₽`} tone="ok" icon="trendUp" />
      <Stat label={t("tesoreria.stats.gastos")} value={`−${money(data.gastosMes, intlLocale)} ₽`} tone="urbanismo" icon="trendDown" />
      <Stat
        label={t("tesoreria.stats.neto")}
        value={`${neto >= 0 ? "+" : "−"}${money(Math.abs(neto), intlLocale)} ₽`}
        tone={neto >= 0 ? "civic" : "danger"}
        icon="coins"
      />
    </div>
  )
}
