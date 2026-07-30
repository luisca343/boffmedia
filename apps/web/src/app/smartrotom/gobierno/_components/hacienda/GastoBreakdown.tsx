"use client"

import { useTranslations } from "next-intl"
import { Bar, Card, Empty } from "../ui"
import { DEPARTMENTS, TONES, type Department, type Tone } from "../../_utils/tones"
import { money } from "../../_utils/format"
import { useFormat } from "@boffmedia/ui/useFormat"
import type { Tesoreria } from "../../_types"

// `gastos[].dep` is a free string off the ledger's memo, not a typed enum — fall back to
// the neutral civic tone/label for anything that doesn't match a known department slug.
const depInfo = (dep: string): { tone: Tone; labelKey: string | null; label: string } =>
  Object.prototype.hasOwnProperty.call(DEPARTMENTS, dep)
    ? { ...DEPARTMENTS[dep as Department], label: dep }
    : { tone: "civic", labelKey: null, label: dep }

export function GastoBreakdown({ gastos }: { gastos: Tesoreria["gastos"] }) {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()

  if (gastos.length === 0) {
    return (
      <Card>
        <Bar icon="receipt" dep="hacienda">
          {t("hacienda.gastoPublico")}
        </Bar>
        <Empty
          icon="receipt"
          title={t("hacienda.emptyGasto")}
          sub={t("hacienda.emptyGastoSub")}
        />
      </Card>
    )
  }

  const total = gastos.reduce((a, b) => a + b.amount, 0)

  return (
    <Card>
      <Bar icon="receipt" dep="hacienda">
        {t("hacienda.gastoPublico")}
      </Bar>
      <div className="space-y-3 p-4">
        {gastos.map((g, i) => {
          const pct = total > 0 ? Math.round((g.amount / total) * 100) : 0
          const { tone, labelKey, label } = depInfo(g.dep)
          const tn = TONES[tone]
          return (
            <div key={i}>
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] text-gt-ink-700">{g.concept}</div>
                  <div className="font-gt-mono text-[9px] uppercase tracking-[.08em] text-gt-ink-400">
                    {labelKey ? t(labelKey) : label}
                  </div>
                </div>
                <span className="flex-none font-gt-display text-[13px] font-bold tabular-nums text-gt-ink-900">
                  {money(g.amount, intlLocale)} ₽
                </span>
              </div>
              <div className="h-[7px] overflow-hidden rounded-full bg-gt-paper-2">
                <div className={`h-full rounded-full ${tn.solidBg}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
