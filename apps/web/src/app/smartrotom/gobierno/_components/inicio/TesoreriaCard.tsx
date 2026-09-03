"use client"

import { useTranslations } from "next-intl"
import { Bar, Card, Empty, Skeleton } from "../ui"
import { TONES } from "../../_utils/tones"
import { useTesoreria } from "../../_hooks/queries"
import { money } from "../../_utils/format"
import { useFormat } from "@boffmedia/ui/useFormat"

function SparkBars({
  series,
  moneyR,
}: {
  series: { label: string; ingreso: number; gasto: number }[]
  moneyR: (n: number | null | undefined) => string
}) {
  const max = Math.max(1, ...series.flatMap((s) => [s.ingreso, s.gasto]))
  return (
    <div className="flex h-[4.5rem] items-end gap-[0.4375rem]">
      {series.map((s) => (
        <div
          key={s.label}
          title={`${s.label}: +${moneyR(s.ingreso)} / −${moneyR(s.gasto)}`}
          className="flex h-full flex-1 items-end gap-[2px]"
        >
          <div
            className={`min-h-[3px] flex-1 rounded-t-[2px] ${TONES.civic.solidBg}`}
            style={{ height: `${(s.ingreso / max) * 100}%` }}
          />
          <div
            className={`min-h-[3px] flex-1 rounded-t-[2px] opacity-[.55] ${TONES.urbanismo.solidBg}`}
            style={{ height: `${(s.gasto / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  )
}

export function TesoreriaCard() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const moneyR = (n: number | null | undefined) => `${money(n, intlLocale)} ₽`
  const { data, isLoading } = useTesoreria()

  return (
    <Card>
      <Bar
        icon="coins"
        dep="hacienda"
        right={
          <span className="flex items-center gap-3 text-[0.6875rem] text-gt-ink-500">
            <span className="flex items-center gap-[0.3125rem]">
              <span className={`h-[0.5625rem] w-[0.5625rem] rounded-[2px] ${TONES.civic.solidBg}`} /> {t("tesoreria.ingresos")}
            </span>
            <span className="flex items-center gap-[0.3125rem]">
              <span className={`h-[0.5625rem] w-[0.5625rem] rounded-[2px] opacity-[.55] ${TONES.urbanismo.solidBg}`} /> {t("tesoreria.gastos")}
            </span>
          </span>
        }
      >
        {t("tesoreria.title")}
      </Bar>

      <div className="p-[1.125rem]">
        {isLoading ? (
          <Skeleton className="h-[7.5rem]" />
        ) : !data ? (
          <Empty icon="coins" title={t("tesoreria.emptyTitle")} />
        ) : (
          <>
            <div className="mb-3.5 flex flex-wrap gap-[1.375rem]">
              <div>
                <div className="font-gt-mono text-[0.5625rem] uppercase tracking-[.14em] text-gt-ink-400">
                  {t("tesoreria.balance")}
                </div>
                <div className="font-gt-display text-[1.625rem] tabular-nums text-gt-ink-900">
                  {moneyR(data.balance)}
                </div>
              </div>
              <div>
                <div className="font-gt-mono text-[0.5625rem] uppercase tracking-[.14em] text-gt-ink-400">
                  {t("tesoreria.ingresosMes")}
                </div>
                <div className={`font-gt-display text-[1.625rem] tabular-nums ${TONES.civic.text}`}>
                  +{moneyR(data.ingresosMes)}
                </div>
              </div>
              <div>
                <div className="font-gt-mono text-[0.5625rem] uppercase tracking-[.14em] text-gt-ink-400">
                  {t("tesoreria.gastosMes")}
                </div>
                <div className={`font-gt-display text-[1.625rem] tabular-nums ${TONES.urbanismo.text}`}>
                  −{moneyR(data.gastosMes)}
                </div>
              </div>
            </div>
            {data.series.length > 0 ? (
              <SparkBars series={data.series} moneyR={moneyR} />
            ) : (
              <div className="py-4 text-center text-[0.75rem] text-gt-ink-400">
                {t("tesoreria.noHistorical")}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
