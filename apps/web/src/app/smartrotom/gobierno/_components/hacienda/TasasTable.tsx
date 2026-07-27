"use client"

import { useTranslations } from "next-intl"
import { Badge, Bar, Card, Empty, Table, THead, TBody, TH, TR, TD } from "../ui"
import { money } from "../../_utils/format"
import { useFormat } from "@/lib/useFormat"
import type { Tasa } from "../../_types"

// The handoff's mock had a "pendiente"/"cobro abierto" column — our real Tasa has no such
// field (only `amount` as tariff and `collected` derived from the ledger), so it is gated
// here in favour of `active`, which is a real column.
export function TasasTable({ tasas }: { tasas: Tasa[] }) {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  return (
    <Card className="overflow-hidden">
      <Bar icon="coins" dep="hacienda">
        {t("hacienda.tasasImpuestos")}
      </Bar>
      <Table>
        <THead>
          <tr>
            <TH>{t("hacienda.concepto")}</TH>
            <TH>{t("hacienda.tarifa")}</TH>
            <TH>{t("hacienda.recaudadoCol")}</TH>
            <TH>{t("hacienda.estadoCol")}</TH>
          </tr>
        </THead>
        <TBody>
          {tasas.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <Empty icon="coins" title={t("hacienda.emptyTasas")} sub={t("hacienda.emptyTasasSub")} />
              </td>
            </tr>
          ) : (
            tasas.map((row) => (
              <TR key={row.id}>
                <TD className="font-semibold text-gt-ink-900">{row.concept}</TD>
                <TD className="font-gt-mono text-[11.5px] text-gt-ink-500">{row.rate}</TD>
                <TD className="font-gt-display text-[14px] font-bold tabular-nums text-gt-civic">
                  {money(row.collected, intlLocale)} ₽
                </TD>
                <TD>{row.active ? <Badge tone="ok">{t("common.activo")}</Badge> : <Badge tone="default">{t("common.inactivo")}</Badge>}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </Card>
  )
}
