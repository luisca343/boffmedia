"use client"

import { Badge, Bar, Card, Empty, Table, THead, TBody, TH, TR, TD } from "../ui"
import { money } from "../../_utils/format"
import type { Tasa } from "../../_types"

// The handoff's mock had a "pendiente"/"cobro abierto" column — our real Tasa has no such
// field (only `amount` as tariff and `collected` derived from the ledger), so it is gated
// here in favour of `active`, which is a real column.
export function TasasTable({ tasas }: { tasas: Tasa[] }) {
  return (
    <Card className="overflow-hidden">
      <Bar icon="coins" dep="hacienda">
        Tasas e impuestos
      </Bar>
      <Table>
        <THead>
          <tr>
            <TH>Concepto</TH>
            <TH>Tarifa</TH>
            <TH>Recaudado</TH>
            <TH>Estado</TH>
          </tr>
        </THead>
        <TBody>
          {tasas.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <Empty icon="coins" title="Sin tasas configuradas" sub="Las tasas e impuestos municipales aparecerán aquí." />
              </td>
            </tr>
          ) : (
            tasas.map((t) => (
              <TR key={t.id}>
                <TD className="font-semibold text-gt-ink-900">{t.concept}</TD>
                <TD className="font-gt-mono text-[11.5px] text-gt-ink-500">{t.rate}</TD>
                <TD className="font-gt-display text-[14px] font-bold tabular-nums text-gt-civic">
                  {money(t.collected)} ₽
                </TD>
                <TD>{t.active ? <Badge tone="ok">Activa</Badge> : <Badge tone="default">Inactiva</Badge>}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </Card>
  )
}
