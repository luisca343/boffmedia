"use client"

import { useTranslations } from "next-intl"
import { PageHead, Skeleton } from "../_components/ui"
import { TesoreriaStats } from "../_components/hacienda/TesoreriaStats"
import { CashFlowChart } from "../_components/hacienda/CashFlowChart"
import { GastoBreakdown } from "../_components/hacienda/GastoBreakdown"
import { TasasTable } from "../_components/hacienda/TasasTable"
import { useTesoreria } from "../_hooks/queries"

export default function TesoreriaPage() {
  const t = useTranslations("gobierno")
  const { data, isLoading } = useTesoreria()

  return (
    <>
      <PageHead
        kicker={t("tesoreria.pageKicker")}
        dep="hacienda"
        title={t("tesoreria.pageTitle")}
        sub={t("tesoreria.pageSub")}
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[92px]" />
          ))}
        </div>
      ) : (
        <>
          <TesoreriaStats t={data} />

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
            <CashFlowChart series={data.series} />
            <GastoBreakdown gastos={data.gastos} />
          </div>

          <div className="mt-5">
            <TasasTable tasas={data.tasas} />
          </div>
        </>
      )}
    </>
  )
}
