"use client"

import { useMemo, useState } from "react"
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
        kicker="Seguridad · Busca y captura"
        dep="seguridad"
        title="Buscados"
        sub="Infractores reclamados por la justicia de Teras. Recompensa pagada por la tesorería municipal."
        right={
          active.length > 0 ? (
            <Badge tone="danger" icon="coins" solid className="px-[11px] py-[7px] text-[12px]">
              Bolsa total {money(totalBounty)} ₽
            </Badge>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[280px] w-full" />
          ))}
        </div>
      ) : isError ? (
        <Empty icon="alert" title="No se ha podido cargar el registro" sub={error instanceof Error ? error.message : undefined} />
      ) : active.length === 0 && resolved.length === 0 ? (
        <Empty
          icon="shieldAlert"
          title="No hay órdenes de busca y captura"
          sub="Los infractores escalados desde Denuncias aparecerán aquí, con recompensa a cargo de la tesorería."
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
                      <div className="font-gt-display text-[19px] font-bold tracking-[.22em] text-gt-paper-0">SE BUSCA</div>
                    </div>
                    <div className="bg-gradient-to-b from-gt-paper-1 to-gt-paper-0 p-4 text-center">
                      <div className="relative inline-block">
                        <Avatar user={b.player.username} size={92} />
                        <div className="absolute -bottom-2 -right-6 -rotate-[9deg]">
                          <Stamp tone={sev.tone}>{sev.label}</Stamp>
                        </div>
                      </div>
                      <div className="mt-3 font-gt-display text-[21px] font-bold text-gt-ink-900">{b.player.username}</div>
                      <div className="mx-0 my-2.5 min-h-[34px] text-[12px] italic leading-snug text-gt-ink-600">
                        {b.offense}
                      </div>
                      <div className="my-2.5 h-px bg-gt-line-strong" />
                      <div className="font-gt-mono text-[9px] uppercase tracking-[.14em] text-gt-ink-400">Recompensa</div>
                      <div className="font-gt-display text-[30px] font-bold leading-none tabular-nums text-gt-danger">
                        {money(b.bounty)} ₽
                      </div>
                      {b.lastSeen && (
                        <div className="my-2 font-gt-mono text-[10.5px] text-gt-ink-400">
                          <Icon name="mapPin" size={11} className="mr-1 inline-block align-[-1px]" />
                          {b.lastSeen}
                        </div>
                      )}
                      <div className="mt-3 flex gap-1.5">
                        <Button size="sm" tone="ghost" icon="eye" className="flex-1" onClick={() => openDossier(b.player.uuid)}>
                          Ficha
                        </Button>
                        <Button size="sm" tone="primary" icon="check" className="flex-1" onClick={() => setConfirming(b)}>
                          Capturado
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
                    <TH>Caso</TH>
                    <TH>Infractor</TH>
                    <TH>Delito</TH>
                    <TH>Recompensa</TH>
                    <TH>Estado</TH>
                  </TR>
                </THead>
                <TBody>
                  {resolved.map((b) => (
                    <TR key={b.id} onClick={() => openDossier(b.player.uuid)}>
                      <TD className="font-gt-mono text-[11px] text-gt-ink-400">{b.code}</TD>
                      <TD>
                        <span className="flex items-center gap-2">
                          <Avatar user={b.player.username} size={26} />
                          {b.player.username}
                        </span>
                      </TD>
                      <TD className="max-w-[280px] truncate text-[12px] text-gt-ink-600">{b.offense}</TD>
                      <TD className="font-gt-display tabular-nums">{money(b.bounty)} ₽</TD>
                      <TD>
                        <Badge tone={BUSCADO_STATUS[b.status].tone}>{BUSCADO_STATUS[b.status].label}</Badge>
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
        title="Confirmar captura"
        kicker="Seguridad · Pago de recompensa"
        footer={
          <>
            <Button tone="ghost" onClick={() => setConfirming(null)} disabled={captureBuscado.isPending}>
              Cancelar
            </Button>
            <Button tone="primary" icon="coins" onClick={confirmCapture} disabled={captureBuscado.isPending}>
              Confirmar y pagar
            </Button>
          </>
        }
      >
        {confirming && (
          <p className="text-[13.5px] leading-relaxed text-gt-ink-700">
            Vas a marcar a <strong className="font-gt-display text-gt-ink-900">{confirming.player.username}</strong> como
            capturado. Esto transferirá <strong className="tabular-nums text-gt-danger">{money(confirming.bounty)} ₽</strong>{" "}
            de la tesorería municipal a <strong className="font-gt-display text-gt-ink-900">{officer.username || "ti"}</strong>{" "}
            de inmediato. Esta acción no se puede deshacer.
          </p>
        )}
      </Modal>
    </>
  )
}
