"use client"

import { Stat } from "../ui"
import { useBuscados, useCenso, useOficiales, useParcelas, useTesoreria } from "../../_hooks/queries"
import { money } from "../../_utils/format"

const moneyR = (n: number | null | undefined) => `${money(n)} ₽`

// The five KPI tiles. Población/Parcelas/Recaudación/Alertas mirror the handoff one-to-one;
// "Oficiales" replaces the handoff's "en línea · de guardia" reading — there is no presence
// system for officers (Oficial has no online flag, no session table), so it honestly shows
// the roster size instead of a fabricated duty status.
export function StatsRow() {
  const censo = useCenso({ pageSize: 1 })
  const parcelas = useParcelas({ pageSize: 500 })
  const tesoreria = useTesoreria()
  const buscados = useBuscados({ status: "active", pageSize: 3 })
  const oficiales = useOficiales()

  const ocupadas = parcelas.data?.items.filter((p) => p.status === "ocupada").length ?? 0
  const totalParcelas = parcelas.data?.total ?? 0
  const semanaActual = tesoreria.data?.series.at(-1)?.ingreso

  return (
    <div className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
      <Stat
        label="Población"
        value={censo.isLoading ? "—" : (censo.data?.total ?? 0)}
        sub="ciudadanos registrados"
        tone="poblacion"
        icon="users"
      />
      <Stat
        label="Parcelas"
        value={parcelas.isLoading ? "—" : `${ocupadas}/${totalParcelas}`}
        sub="ocupadas"
        tone="urbanismo"
        icon="mapPin"
      />
      <Stat
        label="Recaudación / mes"
        value={tesoreria.isLoading ? "—" : moneyR(tesoreria.data?.ingresosMes)}
        trend={semanaActual ? 1 : undefined}
        sub={semanaActual != null ? `+${moneyR(semanaActual)} esta semana` : undefined}
        tone="hacienda"
        icon="coins"
      />
      <Stat
        label="Alertas activas"
        value={buscados.isLoading ? "—" : (buscados.data?.total ?? 0)}
        sub="busca y captura"
        tone="danger"
        icon="alert"
      />
      <Stat
        label="Oficiales"
        value={oficiales.isLoading ? "—" : (oficiales.data?.length ?? 0)}
        sub="en la plantilla"
        tone="seguridad"
        icon="shield"
      />
    </div>
  )
}
