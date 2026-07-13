"use client"

import { useMemo, useState } from "react"
import { Avatar, Badge, Bar, Button, Card, Empty, Field, Modal, Sunken, TextArea, Icon, Table, THead, TBody, TH, TR, TD } from "../ui"
import { useCreateObra, useUpdateEvento } from "../../_hooks/queries"
import { fmtDateTime } from "../../_utils/format"
import type { Evento, Obra } from "../../_types"
import { BackToEventos, BuildSlot, Countdown, RankMark, ScoreDisplay, eventoStatusMeta } from "./shared"

const CAT_LABELS: Record<keyof Obra["cats"], string> = {
  diseno: "Diseño",
  ambicion: "Ambición",
  fidelidad: "Fidelidad al tema",
}

export function ConstruccionDetail({ ev }: { ev: Evento }) {
  const status = eventoStatusMeta(ev.status)
  const closed = ev.status === "closed"
  const canClose = ev.status === "rating"
  const canRegister = !closed

  const [registering, setRegistering] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const updateEvento = useUpdateEvento()

  const ranked = useMemo(() => [...(ev.obras ?? [])].sort((a, b) => b.score10 - a.score10), [ev.obras])

  const closeEvento = () => {
    updateEvento.mutate({ id: ev.id, status: "closed" })
    setConfirmClose(false)
  }

  return (
    <>
      <BackToEventos />

      <Card edgeGold className="mb-[18px] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
          <div className="hidden md:block">
            <BuildSlot icon="building" label="maqueta del reto" className="h-full" />
          </div>
          <div className="p-5">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <Badge tone="urbanismo" icon="building">
                Reto de construcción
              </Badge>
              <Badge tone={status.tone} dot={status.dot}>
                {status.label}
              </Badge>
              <span className="font-gt-mono text-[10.5px] text-gt-ink-400">{ev.code}</span>
              {ev.status === "rating" && (
                <div className="ml-auto">
                  <Countdown iso={ev.ratingClosesAt} label="Valoración cierra en" />
                </div>
              )}
            </div>
            {ev.brief && <p className="mb-3.5 max-w-[680px] text-sm leading-relaxed text-gt-ink-700">{ev.brief}</p>}
            <div className="flex flex-wrap gap-5">
              {ev.prize && (
                <div>
                  <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    Premio
                  </div>
                  <div className="font-gt-display text-[13.5px] font-bold text-gt-gold-600">{ev.prize}</div>
                </div>
              )}
              <div>
                <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                  Participan
                </div>
                <div className="font-gt-display text-[13.5px] font-bold text-gt-ink-800">
                  {ranked.length} ciudad{ranked.length === 1 ? "" : "es"}
                </div>
              </div>
              {ev.crew && (
                <div>
                  <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    Cuadrilla
                  </div>
                  <div className="font-gt-display text-[13.5px] font-bold text-gt-ink-800">{ev.crew}</div>
                </div>
              )}
              {ev.buildClosedAt && (
                <div>
                  <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    Fin construcción
                  </div>
                  <div className="font-gt-mono text-[13px] text-gt-ink-700">{fmtDateTime(ev.buildClosedAt)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        {canRegister && (
          <Button icon="plus" tone="primary" onClick={() => setRegistering(true)}>
            Registrar obra
          </Button>
        )}
        {canClose && (
          <Button icon="checkCircle" tone="gold" onClick={() => setConfirmClose(true)}>
            Cerrar valoración y publicar ganador
          </Button>
        )}
      </div>

      {ranked.length === 0 ? (
        <Empty
          icon="building"
          title="Todavía no hay obras registradas"
          sub="Registra cada obra a medida que las ciudades terminen de construir. Los jugadores de otras ciudades las valorarán."
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
            <Bar icon="award" dep="urbanismo">
              Clasificación{closed ? " final" : " provisional"}
            </Bar>
          </div>

          <Card className="mb-5 overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH className="w-[70px]">Puesto</TH>
                  <TH>Ciudad y obra</TH>
                  <TH>Cuadrilla</TH>
                  <TH className="text-center">Votos</TH>
                  <TH className="text-right">Valoración</TH>
                </TR>
              </THead>
              <TBody>
                {ranked.map((r, i) => {
                  const isWinner = closed && ev.winnerTown === r.town
                  return (
                    <TR key={r.id} className={isWinner ? "bg-gt-gold/10" : undefined}>
                      <TD>
                        <RankMark rank={i} />
                      </TD>
                      <TD>
                        <div className="min-w-0">
                          <div className="font-gt-display text-[14.5px] font-bold text-gt-ink-900">
                            {r.buildName}
                          </div>
                          <div className="font-gt-mono text-[10.5px] text-gt-ink-400">
                            {townLabel(r.town)}
                            {isWinner && " · ganadora"}
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center">
                          {r.builders.slice(0, 4).map((b, bi) => (
                            <span
                              key={b}
                              className="rounded-[5px] border-2 border-gt-paper-0"
                              style={bi ? { marginLeft: -8 } : undefined}
                            >
                              <Avatar user={b} size={26} />
                            </span>
                          ))}
                        </div>
                      </TD>
                      <TD className="text-center">
                        <span className="font-gt-mono text-[13px] tabular-nums text-gt-ink-600">{r.votes}</span>
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end">
                          <ScoreDisplay score10={r.score10} />
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </Card>

          <Bar icon="building" dep="urbanismo">
            Obras presentadas
          </Bar>
          <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map((r, i) => (
              <Card key={r.id} dep="urbanismo" className="overflow-hidden">
                <BuildSlot icon="building" label={`obra de ${townLabel(r.town)}`} className="h-[120px]" />
                <div className="p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-gt-mono text-[10.5px] text-gt-ink-500">{townLabel(r.town)}</span>
                    <RankMark rank={i} />
                  </div>
                  <h4 className="mb-1.5 font-gt-display text-base leading-tight text-gt-ink-900">{r.buildName}</h4>
                  {r.description && (
                    <p className="mb-3 text-xs leading-relaxed text-gt-ink-600">{r.description}</p>
                  )}
                  <Sunken className="grid gap-1.5 p-2.5">
                    {(Object.keys(CAT_LABELS) as (keyof Obra["cats"])[]).map((k) => (
                      <div key={k}>
                        <div className="mb-0.5 flex items-center justify-between">
                          <span className="text-[10.5px] text-gt-ink-500">{CAT_LABELS[k]}</span>
                          <span className="font-gt-mono text-[10px] tabular-nums text-gt-ink-600">
                            {r.votes > 0 ? r.cats[k].toFixed(1) : "—"}
                          </span>
                        </div>
                        <div className="h-[5px] overflow-hidden rounded-full bg-gt-paper-3">
                          <div
                            className="h-full bg-gt-dep-urbanismo"
                            style={{ width: `${Math.min(100, (r.cats[k] / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </Sunken>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <RegistrarObraModal open={registering} eventoId={ev.id} onClose={() => setRegistering(false)} />

      <Modal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title="Cerrar valoración"
        kicker="Confirmar"
        footer={
          <>
            <Button tone="ghost" onClick={() => setConfirmClose(false)}>
              Cancelar
            </Button>
            <Button tone="gold" icon="checkCircle" onClick={closeEvento}>
              Cerrar y publicar ganador
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-gt-ink-700">
          Se cerrará la valoración de <strong>{ev.title}</strong> y se publicará la obra ganadora. Esta acción no se
          puede deshacer.
        </p>
      </Modal>
    </>
  )
}

function townLabel(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function RegistrarObraModal({
  open,
  eventoId,
  onClose,
}: {
  open: boolean
  eventoId: number
  onClose: () => void
}) {
  const createObra = useCreateObra()
  const [town, setTown] = useState("")
  const [buildName, setBuildName] = useState("")
  const [description, setDescription] = useState("")
  const [builders, setBuilders] = useState("")

  const valid = town.trim() && buildName.trim()

  const submit = async () => {
    if (!valid) return
    await createObra.mutateAsync({
      eventoId,
      town: town.trim(),
      buildName: buildName.trim(),
      description: description.trim() || undefined,
      builders: builders
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
    })
    setTown("")
    setBuildName("")
    setDescription("")
    setBuilders("")
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar obra"
      kicker="Reto de construcción"
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button tone="primary" icon="plus" disabled={!valid || createObra.isPending} onClick={submit}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5">
        <Field
          label="Ciudad (identificador WorldGuard)"
          value={town}
          onChange={setTown}
          placeholder="Ej. ciudad_carmin"
          mono
        />
        <Field label="Nombre de la obra" value={buildName} onChange={setBuildName} placeholder="Ej. El Faro de Charizard" />
        <TextArea
          label="Descripción"
          value={description}
          onChange={setDescription}
          rows={3}
          placeholder="Qué han construido, materiales, detalles a destacar…"
        />
        <Field
          label="Cuadrilla (usuarios separados por comas)"
          value={builders}
          onChange={setBuilders}
          placeholder="Ej. LtSurgeVolt, BlaineFuego"
        />
        <div className="flex items-start gap-2 rounded-gt-sm bg-gt-paper-2 p-2.5 text-[11.5px] leading-relaxed text-gt-ink-500">
          <Icon name="alert" size={13} className="mt-0.5 flex-none text-gt-ink-400" />
          La valoración (diseño, ambición, fidelidad) la emiten los jugadores desde su app — aquí solo se registra la
          obra presentada.
        </div>
      </div>
    </Modal>
  )
}
