"use client"

import { Stat } from "../ui"
import { money } from "../../_utils/format"
import type { Multa } from "../../_types"

export function MultasStats({ multas }: { multas: Multa[] }) {
  const pending = multas.filter((m) => m.status === "pending")
  const paid = multas.filter((m) => m.status === "paid")
  const appealed = multas.filter((m) => m.status === "appealed")
  const cancelled = multas.filter((m) => m.status === "cancelled")

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat
        label="Pendiente de cobro"
        value={`${money(pending.reduce((a, b) => a + b.amount, 0))} ₽`}
        tone="warn"
        icon="clock"
        sub={`${pending.length} multas`}
      />
      <Stat
        label="Recaudado"
        value={`${money(paid.reduce((a, b) => a + b.amount, 0))} ₽`}
        tone="ok"
        icon="coins"
        sub={`${paid.length} pagadas`}
      />
      <Stat label="En apelación" value={appealed.length} tone="info" icon="scale" />
      <Stat label="Anuladas" value={cancelled.length} tone="default" icon="x" />
    </div>
  )
}
