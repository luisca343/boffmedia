"use client"

import { Bar, Card, Empty, Skeleton } from "../ui"
import { TONES } from "../../_utils/tones"
import { useTesoreria } from "../../_hooks/queries"
import { money } from "../../_utils/format"

const moneyR = (n: number | null | undefined) => `${money(n)} ₽`

function SparkBars({ series }: { series: { label: string; ingreso: number; gasto: number }[] }) {
  const max = Math.max(1, ...series.flatMap((s) => [s.ingreso, s.gasto]))
  return (
    <div className="flex h-[72px] items-end gap-[7px]">
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
  const { data, isLoading } = useTesoreria()

  return (
    <Card>
      <Bar
        icon="coins"
        dep="hacienda"
        right={
          <span className="flex items-center gap-3 text-[11px] text-gt-ink-500">
            <span className="flex items-center gap-[5px]">
              <span className={`h-[9px] w-[9px] rounded-[2px] ${TONES.civic.solidBg}`} /> Ingresos
            </span>
            <span className="flex items-center gap-[5px]">
              <span className={`h-[9px] w-[9px] rounded-[2px] opacity-[.55] ${TONES.urbanismo.solidBg}`} /> Gastos
            </span>
          </span>
        }
      >
        Tesorería · últimas semanas
      </Bar>

      <div className="p-[18px]">
        {isLoading ? (
          <Skeleton className="h-[120px]" />
        ) : !data ? (
          <Empty icon="coins" title="Sin datos de tesorería" />
        ) : (
          <>
            <div className="mb-3.5 flex flex-wrap gap-[22px]">
              <div>
                <div className="font-gt-mono text-[9px] uppercase tracking-[.14em] text-gt-ink-400">
                  Balance municipal
                </div>
                <div className="font-gt-display text-[26px] tabular-nums text-gt-ink-900">
                  {moneyR(data.balance)}
                </div>
              </div>
              <div>
                <div className="font-gt-mono text-[9px] uppercase tracking-[.14em] text-gt-ink-400">
                  Ingresos mes
                </div>
                <div className={`font-gt-display text-[26px] tabular-nums ${TONES.civic.text}`}>
                  +{moneyR(data.ingresosMes)}
                </div>
              </div>
              <div>
                <div className="font-gt-mono text-[9px] uppercase tracking-[.14em] text-gt-ink-400">
                  Gastos mes
                </div>
                <div className={`font-gt-display text-[26px] tabular-nums ${TONES.urbanismo.text}`}>
                  −{moneyR(data.gastosMes)}
                </div>
              </div>
            </div>
            {data.series.length > 0 ? (
              <SparkBars series={data.series} />
            ) : (
              <div className="py-4 text-center text-[12px] text-gt-ink-400">
                Aún no hay histórico semanal que graficar.
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
