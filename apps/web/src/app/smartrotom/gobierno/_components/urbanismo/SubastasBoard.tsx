"use client"

import { useEffect, useState } from "react"
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Icon,
  Modal,
  PageHead,
  Select,
  Skeleton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "../ui"
import { useCloseSubasta, useCreateSubasta, useParcelas, usePuja, useSubastas } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { money, timeLeft, townName } from "../../_utils/format"
import { SUBASTA_STATUS } from "../../_utils/tones"
import type { Parcela, Subasta } from "../../_types"

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i

// The interesting module: a puja must beat the current bid (client-checked here, and
// server-enforced regardless), and closing an auction charges the winner's real StarBank
// account. Bidding needs the citizen's uuid — there is no player-search endpoint in scope
// yet (that is the Población/Censo module, not built), so the officer enters it directly.
export function SubastasBoard() {
  const { data, isLoading, isError } = useSubastas({ limit: 100 })
  const { data: parcelas } = useParcelas({ limit: 100 })
  const officer = useOfficer()
  const createSubasta = useCreateSubasta()
  const openDossier = useGobiernoUi((s) => s.openDossier)

  const [, tick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const [creating, setCreating] = useState(false)

  const items = data?.items ?? []
  const live = items.filter((a) => a.status === "live")
  const closed = items.filter((a) => a.status !== "live")

  const vacantParcelas = (parcelas?.items ?? []).filter(
    (p) => p.id != null && !p.owner && (p.status === "vacante" || p.status === "embargada"),
  )

  return (
    <div>
      <PageHead
        kicker="Urbanismo · Patrimonio"
        dep="urbanismo"
        title="Subastas de parcelas"
        sub="Parcelas vacantes o embargadas sacadas a subasta pública. Puja por terreno o adjudícalo al mejor postor."
        right={
          <Button icon="plus" tone="gold" onClick={() => setCreating(true)}>
            Nueva subasta
          </Button>
        }
      />

      {isLoading ? (
        <div className="mb-6 grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : isError ? (
        <Card className="mb-6">
          <Empty icon="alert" title="No se pudieron cargar las subastas" sub="Inténtalo de nuevo en unos minutos." />
        </Card>
      ) : (
        <>
          {live.length > 0 ? (
            <div className="mb-6 grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
              {live.map((a) => (
                <SubastaCard key={a.id} subasta={a} onOpenOwner={openDossier} />
              ))}
            </div>
          ) : (
            <Card className="mb-6">
              <Empty icon="gavel" title="Sin subastas en curso" sub="No hay ninguna parcela a subasta pública en este momento." />
            </Card>
          )}

          <div className="mb-3 flex items-center gap-2.5 border-b border-gt-line px-1 pb-[11px]">
            <Icon name="history" size={16} className="text-gt-dep-urbanismo" />
            <span className="font-gt-display text-base font-bold text-gt-ink-900">Subastas cerradas</span>
          </div>
          <Card className="overflow-hidden">
            {closed.length === 0 ? (
              <Empty icon="scroll" title="Sin subastas cerradas" sub="Todavía no se ha adjudicado ninguna subasta." />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Subasta</TH>
                    <TH>Parcela</TH>
                    <TH>Adjudicada a</TH>
                    <TH>Importe final</TH>
                    <TH>Motivo</TH>
                    <TH>Estado</TH>
                  </TR>
                </THead>
                <TBody>
                  {closed.map((a) => {
                    const st = SUBASTA_STATUS[a.status] ?? { label: a.status, tone: "default" as const }
                    return (
                      <TR key={a.id}>
                        <TD>
                          <span className="font-gt-mono text-[11px] text-gt-ink-400">{a.code}</span>
                        </TD>
                        <TD>
                          {townName(a.town)} #{a.number}
                        </TD>
                        <TD>
                          {a.bidder ? (
                            <button
                              type="button"
                              onClick={() => openDossier(a.bidder!.uuid)}
                              className="flex items-center gap-2 rounded-gt-sm py-0.5 pr-1 transition-colors hover:bg-gt-paper-1"
                            >
                              <Avatar user={a.bidder.username} size={24} />
                              {a.bidder.username}
                            </button>
                          ) : (
                            <span className="italic text-gt-ink-400">— sin adjudicar —</span>
                          )}
                        </TD>
                        <TD>
                          <span className="font-gt-display font-bold tabular-nums text-gt-ink-900">
                            {money(a.currentBid)} ₽
                          </span>
                        </TD>
                        <TD>
                          <span className="text-[12px] text-gt-ink-500">{a.reason || "—"}</span>
                        </TD>
                        <TD>
                          <Badge tone={st.tone}>{st.label}</Badge>
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            )}
          </Card>
        </>
      )}

      {creating && (
        <NuevaSubastaModal
          parcelas={vacantParcelas}
          officerUuid={officer.uuid}
          saving={createSubasta.isPending}
          onClose={() => setCreating(false)}
          onSave={(body) => createSubasta.mutate(body, { onSuccess: () => setCreating(false) })}
        />
      )}
    </div>
  )
}

function SubastaCard({ subasta: a, onOpenOwner }: { subasta: Subasta; onOpenOwner: (uuid: string) => void }) {
  const puja = usePuja()
  const closeSubasta = useCloseSubasta()

  const [bidding, setBidding] = useState(false)
  const [bidUuid, setBidUuid] = useState("")
  const [bidAmount, setBidAmount] = useState(String(a.currentBid + 500))
  const [confirmClose, setConfirmClose] = useState(false)

  const ms = new Date(a.endsAt).getTime() - Date.now()
  const ending = ms > 0 && ms < 3_600_000
  const finished = ms <= 0

  const amountNum = Number(bidAmount)
  const canBid = UUID_RE.test(bidUuid.trim()) && amountNum > a.currentBid

  return (
    <Card edgeGold className="overflow-hidden">
      <div className="relative flex h-24 items-center justify-center border-b border-gt-line bg-gt-dep-urbanismo/10 px-4">
        <span className="text-center font-gt-display text-xl font-bold text-gt-dep-urbanismo">
          {townName(a.town)} #{a.number}
        </span>
        <span
          className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] font-gt-mono text-[11px] font-bold text-white ${
            ending || finished ? "bg-gt-danger" : "bg-gt-ink-900"
          }`}
        >
          <Icon name="clock" size={12} />
          {timeLeft(a.endsAt)}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="font-gt-mono text-[11px] text-gt-ink-400">
            {a.code} · {a.bids} pujas
          </span>
          {a.reason && <span className="max-w-[160px] truncate text-[11px] text-gt-ink-400">{a.reason}</span>}
        </div>
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <div className="font-gt-mono text-[9px] uppercase tracking-[.12em] text-gt-ink-400">Puja actual</div>
            <div className="font-gt-display text-[26px] font-bold tabular-nums text-gt-ink-900">
              {money(a.currentBid)} ₽
            </div>
          </div>
          {a.bidder ? (
            <button
              type="button"
              onClick={() => onOpenOwner(a.bidder!.uuid)}
              className="flex items-center gap-1.5 rounded-gt-sm py-0.5 pr-1 transition-colors hover:bg-gt-paper-1"
            >
              <Avatar user={a.bidder.username} size={26} />
              <span className="text-[12px] font-semibold text-gt-ink-700">{a.bidder.username}</span>
            </button>
          ) : (
            <Badge tone="warn">Sin pujas</Badge>
          )}
        </div>

        {bidding ? (
          <div className="flex flex-col gap-2">
            <Field mono value={bidUuid} onChange={setBidUuid} placeholder="UUID del jugador" />
            <div className="flex gap-2">
              <Field type="number" mono value={bidAmount} onChange={setBidAmount} placeholder={`> ${a.currentBid}`} />
              <Button
                icon="check"
                disabled={!canBid || puja.isPending}
                onClick={() =>
                  puja.mutate(
                    { id: a.id, uuid: bidUuid.trim(), amount: amountNum },
                    { onSuccess: () => setBidding(false) },
                  )
                }
              >
                Pujar
              </Button>
            </div>
          </div>
        ) : (
          <Button tone="gold" icon="gavel" className="w-full" onClick={() => setBidding(true)}>
            Pujar por esta parcela
          </Button>
        )}

        <div className="mt-2.5 border-t border-gt-line-soft pt-2.5">
          {confirmClose ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] text-gt-ink-500">¿Cerrar y adjudicar ahora?</span>
              <div className="flex gap-1.5">
                <Button size="sm" tone="ghost" onClick={() => setConfirmClose(false)}>
                  No
                </Button>
                <Button
                  size="sm"
                  tone="danger"
                  disabled={closeSubasta.isPending}
                  onClick={() => closeSubasta.mutate(a.id, { onSuccess: () => setConfirmClose(false) })}
                >
                  Sí, cerrar
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClose(true)}
              className="text-[11.5px] font-semibold text-gt-ink-400 underline-offset-2 hover:text-gt-ink-700 hover:underline"
            >
              Cerrar subasta ahora
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

function NuevaSubastaModal({
  parcelas,
  officerUuid,
  saving,
  onClose,
  onSave,
}: {
  parcelas: Parcela[]
  officerUuid: string
  saving: boolean
  onClose: () => void
  onSave: (body: {
    regionId: string
    town: string
    number: number
    startBid: number
    endsAt: string
    reason: string
    createdBy: string
  }) => void
}) {
  const [regionId, setRegionId] = useState(parcelas[0]?.regionId ?? "")
  const [startBid, setStartBid] = useState("5000")
  const [endsAt, setEndsAt] = useState("")
  const [reason, setReason] = useState("")

  const selected = parcelas.find((p) => p.regionId === regionId)
  const canSave = !!selected && Number(startBid) > 0 && endsAt.length > 0 && !!officerUuid

  return (
    <Modal
      open
      onClose={onClose}
      kicker="Urbanismo · Patrimonio"
      title="Nueva subasta"
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            tone="primary"
            disabled={!canSave || saving}
            onClick={() =>
              selected &&
              onSave({
                regionId: selected.regionId,
                town: selected.town,
                number: selected.number,
                startBid: Number(startBid),
                endsAt: new Date(endsAt).toISOString(),
                reason: reason.trim(),
                createdBy: officerUuid,
              })
            }
          >
            {saving ? "Abriendo…" : "Abrir subasta"}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        {parcelas.length === 0 ? (
          <Empty
            icon="mapPin"
            title="No hay parcelas disponibles"
            sub="Solo pueden subastarse parcelas vacantes o embargadas ya registradas en el catastro."
          />
        ) : (
          <>
            <Select
              label="Parcela"
              value={regionId}
              onChange={setRegionId}
              options={parcelas.map((p) => ({
                value: p.regionId,
                label: `${townName(p.town)} #${p.number} · ${p.status === "embargada" ? "Embargada" : "Vacante"}`,
              }))}
            />
            <Field label="Puja de salida (₽)" type="number" mono value={startBid} onChange={setStartBid} />
            <Field label="Cierre" type="datetime-local" value={endsAt} onChange={setEndsAt} />
            <Field label="Motivo (opcional)" value={reason} onChange={setReason} placeholder="Impago de impuestos…" />
          </>
        )}
      </div>
    </Modal>
  )
}
