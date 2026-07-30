"use client"

import { useTranslations } from "next-intl"
import { Avatar, Badge, Button, Card, Empty, Table, THead, TBody, TH, TR, TD, TableSkeleton } from "../ui"
import { MULTA_STATUS } from "../../_utils/tones"
import { money, timeAgo } from "../../_utils/format"
import { useFormat } from "@boffmedia/ui/useFormat"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import type { Multa } from "../../_types"

export function MultasTable({
  multas,
  isLoading,
  onPay,
  onCancel,
}: {
  multas: Multa[]
  isLoading: boolean
  onPay: (m: Multa) => void
  onCancel: (m: Multa) => void
}) {
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()

  return (
    <Card className="overflow-hidden">
      <Table>
        <THead>
          <tr>
            <TH>{t("hacienda.codigo")}</TH>
            <TH>{t("hacienda.jugadorCol")}</TH>
            <TH>{t("hacienda.motivoCol")}</TH>
            <TH>{t("hacienda.importeCol")}</TH>
            <TH>{t("hacienda.emisor")}</TH>
            <TH>{t("hacienda.estadoCol")}</TH>
            <TH className="text-right">{t("hacienda.acciones")}</TH>
          </tr>
        </THead>
        <TBody>
          {isLoading ? (
            <tr>
              <td colSpan={7}>
                <TableSkeleton cols={7} />
              </td>
            </tr>
          ) : multas.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <Empty
                  icon="gavel"
                  title={t("hacienda.emptyMultas")}
                  sub={t("hacienda.emptyMultasSub")}
                />
              </td>
            </tr>
          ) : (
            multas.map((m) => {
              const st = MULTA_STATUS[m.status]
              const label = st ? t(st.labelKey) : m.status
              const tone = st ? st.tone : ("default" as const)
              return (
                <TR key={m.id}>
                  <TD className="font-gt-mono text-[11px] text-gt-ink-400">{m.code}</TD>
                  <TD>
                    <button
                      type="button"
                      onClick={() => openDossier(m.player.uuid)}
                      className="flex items-center gap-2 font-semibold text-gt-ink-900 hover:text-gt-accent"
                    >
                      <Avatar user={m.player.username} size={26} />
                      {m.player.username}
                    </button>
                  </TD>
                  <TD className="max-w-[280px] text-[12.5px]">
                    {m.reason}
                    {m.denunciaId != null && (
                      <span className="ml-1.5 font-gt-mono text-[10px] text-gt-ink-400">
                        {t("hacienda.denunciaRef", { id: m.denunciaId })}
                      </span>
                    )}
                  </TD>
                  <TD className="font-gt-display text-[15px] font-bold tabular-nums text-gt-ink-900">
                    {money(m.amount, intlLocale)} ₽
                  </TD>
                  <TD className="text-[12px] text-gt-ink-500">{m.issuedBy.username}</TD>
                  <TD>
                    <Badge tone={tone}>{label}</Badge>
                    {m.status === "paid" && m.paidAt && (
                      <div className="mt-1 font-gt-mono text-[9.5px] text-gt-ink-400">{timeAgo(m.paidAt)}</div>
                    )}
                  </TD>
                  <TD className="text-right">
                    {m.status === "pending" && (
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" tone="soft" onClick={() => onPay(m)}>
                          {t("hacienda.cobrar")}
                        </Button>
                        <Button size="sm" tone="plain" onClick={() => onCancel(m)}>
                          {t("hacienda.anular")}
                        </Button>
                      </div>
                    )}
                  </TD>
                </TR>
              )
            })
          )}
        </TBody>
      </Table>
    </Card>
  )
}
