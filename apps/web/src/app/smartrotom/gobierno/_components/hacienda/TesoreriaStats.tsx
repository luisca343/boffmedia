"use client"

import { Stat } from "../ui"
import { money } from "../../_utils/format"
import type { Tesoreria } from "../../_types"

export function TesoreriaStats({ t }: { t: Tesoreria }) {
  const neto = t.ingresosMes - t.gastosMes
  return (
    <div className="mb-[18px] grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Balance municipal" value={`${money(t.balance)} ₽`} tone="hacienda" icon="landmark" />
      <Stat label="Ingresos del mes" value={`+${money(t.ingresosMes)} ₽`} tone="ok" icon="trendUp" />
      <Stat label="Gastos del mes" value={`−${money(t.gastosMes)} ₽`} tone="urbanismo" icon="trendDown" />
      <Stat
        label="Resultado neto"
        value={`${neto >= 0 ? "+" : "−"}${money(Math.abs(neto))} ₽`}
        tone={neto >= 0 ? "civic" : "danger"}
        icon="coins"
      />
    </div>
  )
}
