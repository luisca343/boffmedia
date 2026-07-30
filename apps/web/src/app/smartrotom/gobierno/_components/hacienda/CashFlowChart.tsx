"use client"

import { useTranslations } from "next-intl"
import { Bar, Card, Empty } from "../ui"
import { TONES } from "../../_utils/tones"
import { money } from "../../_utils/format"
import { useFormat } from "@boffmedia/ui/useFormat"
import type { Tesoreria } from "../../_types"

// The sanctioned inline-SVG exception (SMARTROTOM_V3 hard rule #3): fills are drawn from
// the same `rgb(var(--gt-…))` values as the literal Tailwind classes, never invented hex.
const BAR_W = 12
const BAR_GAP = 3
const GROUP_GAP = 16
const CHART_H = 140
const LABEL_H = 22

export function CashFlowChart({ series }: { series: Tesoreria["series"] }) {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()

  if (series.length === 0) {
    return (
      <Card>
        <Bar icon="signal" dep="hacienda">
          {t("hacienda.flujoCaja")}
        </Bar>
        <Empty
          icon="signal"
          title={t("hacienda.emptyFlujo")}
          sub={t("hacienda.emptyFlujoSub")}
        />
      </Card>
    )
  }

  const groupW = BAR_W * 2 + BAR_GAP
  const w = series.length * groupW + (series.length - 1) * GROUP_GAP
  const h = CHART_H + LABEL_H
  // At least 1 so an all-zero ledger renders a flat honest baseline instead of NaN bars.
  const max = Math.max(1, ...series.flatMap((s) => [s.ingreso, s.gasto]))

  return (
    <Card>
      <Bar
        icon="signal"
        dep="hacienda"
        right={
          <div className="flex items-center gap-3 font-gt-mono text-[10.5px] text-gt-ink-500">
            <span className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-[2px] ${TONES.civic.solidBg}`} /> {t("tesoreria.ingresos")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-[2px] ${TONES.urbanismo.solidBg} opacity-60`} /> {t("tesoreria.gastos")}
            </span>
          </div>
        }
      >
        {t("hacienda.flujoCajaWeeks", { count: series.length })}
      </Bar>
      <div className="px-4 py-5">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto block w-full"
          style={{ maxHeight: h }}
          role="img"
          aria-label={t("hacienda.flujoCajaAriaLabel")}
        >
          <line x1={0} y1={CHART_H} x2={w} y2={CHART_H} stroke="rgb(var(--gt-line-strong))" strokeWidth={1} />
          {series.map((s, i) => {
            const x = i * (groupW + GROUP_GAP)
            const hIn = (s.ingreso / max) * (CHART_H - 4)
            const hOut = (s.gasto / max) * (CHART_H - 4)
            return (
              <g key={i}>
                <title>
                  {t("hacienda.flujoCajaTooltip", {
                    label: s.label,
                    ingreso: `${money(s.ingreso, intlLocale)} ₽`,
                    gasto: `${money(s.gasto, intlLocale)} ₽`,
                  })}
                </title>
                <rect x={x} y={CHART_H - hIn} width={BAR_W} height={hIn} rx={2} fill={TONES.civic.css} />
                <rect
                  x={x + BAR_W + BAR_GAP}
                  y={CHART_H - hOut}
                  width={BAR_W}
                  height={hOut}
                  rx={2}
                  fill={TONES.urbanismo.css}
                  opacity={0.6}
                />
                <text
                  x={x + groupW / 2}
                  y={CHART_H + 15}
                  textAnchor="middle"
                  className="font-gt-mono"
                  fontSize={9.5}
                  fill="rgb(var(--gt-ink-400))"
                >
                  {s.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </Card>
  )
}
