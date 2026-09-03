"use client"

import { useTranslations } from "next-intl"
import { Stat } from "../ui"
import { useBuscados, useCenso, useOficiales, useParcelas, useTesoreria } from "../../_hooks/queries"
import { money } from "../../_utils/format"
import { useFormat } from "@boffmedia/ui/useFormat"

export function StatsRow() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const moneyR = (n: number | null | undefined) => `${money(n, intlLocale)} ₽`
  const censo = useCenso({ pageSize: 1 })
  const parcelas = useParcelas({ pageSize: 500 })
  const tesoreria = useTesoreria()
  const buscados = useBuscados({ status: "active", pageSize: 3 })
  const oficiales = useOficiales()

  const ocupadas = parcelas.data?.items.filter((p) => p.status === "ocupada").length ?? 0
  const totalParcelas = parcelas.data?.total ?? 0
  const semanaActual = tesoreria.data?.series.at(-1)?.ingreso

  return (
    <div className="mb-[1.125rem] grid grid-cols-[repeat(auto-fit,minmax(9.375rem,1fr))] gap-3">
      <Stat
        label={t("stats.poblacion")}
        value={censo.isLoading ? "—" : (censo.data?.total ?? 0)}
        sub={t("stats.poblacionSub")}
        tone="poblacion"
        icon="users"
      />
      <Stat
        label={t("stats.parcelas")}
        value={parcelas.isLoading ? "—" : `${ocupadas}/${totalParcelas}`}
        sub={t("stats.parcelasSub")}
        tone="urbanismo"
        icon="mapPin"
      />
      <Stat
        label={t("stats.recaudacion")}
        value={tesoreria.isLoading ? "—" : moneyR(tesoreria.data?.ingresosMes)}
        trend={semanaActual ? 1 : undefined}
        sub={semanaActual != null ? t("stats.recaudacionSub", { amount: moneyR(semanaActual) }) : undefined}
        tone="hacienda"
        icon="coins"
      />
      <Stat
        label={t("stats.alertas")}
        value={buscados.isLoading ? "—" : (buscados.data?.total ?? 0)}
        sub={t("stats.alertasSub")}
        tone="danger"
        icon="alert"
      />
      <Stat
        label={t("stats.oficiales")}
        value={oficiales.isLoading ? "—" : (oficiales.data?.length ?? 0)}
        sub={t("stats.oficialesSub")}
        tone="seguridad"
        icon="shield"
      />
    </div>
  )
}
