"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { userMessageFrom } from "@/services/boffAPI"
import { useFormat } from "@boffmedia/ui/useFormat"
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Icon,
  Modal,
  PageHead,
  Skeleton,
  Stamp,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "../ui"
import { useBuscados, useCaptureBuscado } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { BUSCADO_STATUS } from "../../_utils/tones"
import { money } from "../../_utils/format"
import { severityTone } from "./severity"
import type { Buscado } from "../../_types"

export function BuscadosSection() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  // `limit`/`page` are what ListBuscadosQueryDto actually validates — 100 is its max.
  const { data, isLoading, isError, error } = useBuscados({ limit: 100 })
  const officer = useOfficer()
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const captureBuscado = useCaptureBuscado()
  const [confirming, setConfirming] = useState<Buscado | null>(null)

  const items = data?.items ?? []
  const active = useMemo(() => items.filter((b) => b.status === "active").sort((a, b) => b.bounty - a.bounty), [items])
  const resolved = useMemo(() => items.filter((b) => b.status !== "active"), [items])
  const totalBounty = active.reduce((sum, b) => sum + b.bounty, 0)

  const confirmCapture = () => {
    if (!confirming) return
    captureBuscado.mutate({ id: confirming.id, capturedBy: officer.uuid }, { onSuccess: () => setConfirming(null) })
  }

  return (
    <>
      <PageHead
        kicker={t("buscados.sectionKicker")}
        dep="seguridad"
        title={t("buscados.sectionTitle")}
        sub={t("buscados.sectionSub")}
        right={
          active.length > 0 ? (
            <Badge tone="danger" icon="coins" solid className="px-[0.6875rem] py-[0.4375rem] text-[0.75rem]">
              {t("buscados.bolsaTotal", { amount: money(totalBounty, intlLocale) })}
            </Badge>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[17.5rem] w-full" />
          ))}
        </div>
      ) : isError ? (
        <Empty
          icon="alert"
          title={t("denuncias.errorTitle")}
          sub={error ? userMessageFrom(error, t("common.retry")) : undefined}
        />
      ) : active.length === 0 && resolved.length === 0 ? (
        <Empty
          icon="shieldAlert"
          title={t("buscados.emptyCapture")}
          sub={t("buscados.emptyCaptureSub")}
        />
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((b) => {
                const sev = severityTone(b.severity)
                return (
                  <Card key={b.id} className="overflow-hidden border-gt-line-strong p-0">
                    <div className="bg-gt-ink-900 py-2 text-center">
                      <div className="font-gt-display text-[1.1875rem] font-bold tracking-[.22em] text-gt-paper-0">{t("buscados.seBusca")}</div>
                    </div>
                    <div className="bg-gradient-to-b from-gt-paper-1 to-gt-paper-0 p-4 text-center">
                      <div className="relative inline-block">
                        <Avatar user={b.player.username} size={92} />
                        <div className="absolute -bottom-2 -right-6 -rotate-[9deg]">
                          <Stamp tone={sev.tone}>{t(sev.labelKey)}</Stamp>
                        </div>
                      </div>
                      <div className="mt-3 font-gt-display text-[1.3125rem] font-bold text-gt-ink-900">{b.player.username}</div>
                      <div className="mx-0 my-2.5 min-h-[2.125rem] text-[0.75rem] italic leading-snug text-gt-ink-600">
                        {b.offense}
                      </div>
                      <div className="my-2.5 h-px bg-gt-line-strong" />
                      <div className="font-gt-mono text-[0.5625rem] uppercase tracking-[.14em] text-gt-ink-400">{t("buscados.recompensa")}</div>
                      <div className="font-gt-display text-[1.875rem] font-bold leading-none tabular-nums text-gt-danger">
                        {money(b.bounty, intlLocale)} ₽
                      </div>
                      {b.lastSeen && (
                        <div className="my-2 font-gt-mono text-[0.65625rem] text-gt-ink-400">
                          <Icon name="mapPin" size={11} className="mr-1 inline-block align-[-1px]" />
                          {b.lastSeen}
                        </div>
                      )}
                      <div className="mt-3 flex gap-1.5">
                        <Button size="sm" tone="ghost" icon="eye" className="flex-1" onClick={() => openDossier(b.player.uuid)}>
                          {t("buscados.ficha")}
                        </Button>
                        <Button size="sm" tone="primary" icon="check" className="flex-1" onClick={() => setConfirming(b)}>
                          {t("buscados.capturado")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {resolved.length > 0 && (
            <Card className="overflow-hidden p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>{t("buscados.tableCaso")}</TH>
                    <TH>{t("buscados.tableInfractor")}</TH>
                    <TH>{t("buscados.tableDelito")}</TH>
                    <TH>{t("buscados.tableRecompensa")}</TH>
                    <TH>{t("buscados.tableEstado")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {resolved.map((b) => (
                    <TR key={b.id} onClick={() => openDossier(b.player.uuid)}>
                      <TD className="font-gt-mono text-[0.6875rem] text-gt-ink-400">{b.code}</TD>
                      <TD>
                        <span className="flex items-center gap-2">
                          <Avatar user={b.player.username} size={26} />
                          {b.player.username}
                        </span>
                      </TD>
                      <TD className="max-w-[17.5rem] truncate text-[0.75rem] text-gt-ink-600">{b.offense}</TD>
                      <TD className="font-gt-display tabular-nums">{money(b.bounty, intlLocale)} ₽</TD>
                      <TD>
                        <Badge tone={BUSCADO_STATUS[b.status].tone}>{t(BUSCADO_STATUS[b.status].labelKey)}</Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}
        </>
      )}

      <Modal
        open={!!confirming}
        onClose={() => setConfirming(null)}
        title={t("buscados.confirmCapture")}
        kicker={t("buscados.captureKicker")}
        footer={
          <>
            <Button tone="ghost" onClick={() => setConfirming(null)} disabled={captureBuscado.isPending}>
              {t("common.cancel")}
            </Button>
            <Button tone="primary" icon="coins" onClick={confirmCapture} disabled={captureBuscado.isPending}>
              {t("buscados.confirmAndPay")}
            </Button>
          </>
        }
      >
        {confirming && (
          <p className="text-[0.84375rem] leading-relaxed text-gt-ink-700">
            {t("buscados.captureDescription", {
              username: confirming.player.username,
              amount: money(confirming.bounty, intlLocale),
              officer: officer.username || t("common.you"),
            })}
          </p>
        )}
      </Modal>
    </>
  )
}
