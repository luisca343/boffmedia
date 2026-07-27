"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar, Badge, Bar, Button, Card, Empty, Field, Modal, Sunken, TextArea, Icon, Table, THead, TBody, TH, TR, TD } from "../ui"
import { useCreateObra, useUpdateEvento } from "../../_hooks/queries"
import { fmtDateTime } from "../../_utils/format"
import type { Evento, Obra } from "../../_types"
import { BackToEventos, BuildSlot, Countdown, RankMark, ScoreDisplay, eventoStatusMeta } from "./shared"

/** The wire has no combined score — it's the simple average of the three vote categories. */
const score10 = (o: Obra) => (o.diseno + o.ambicion + o.fidelidad) / 3

export function ConstruccionDetail({ ev }: { ev: Evento }) {
  const t = useTranslations("gobierno")
  const status = eventoStatusMeta(ev.status, t)
  const closed = ev.status === "closed"
  const canClose = ev.status === "rating"
  const canRegister = !closed

  const catLabels: Record<"diseno" | "ambicion" | "fidelidad", string> = {
    diseno: t("eventos.diseno"),
    ambicion: t("eventos.ambicion"),
    fidelidad: t("eventos.fidelidadTema"),
  }

  const [registering, setRegistering] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const updateEvento = useUpdateEvento()

  const ranked = useMemo(() => [...(ev.obras ?? [])].sort((a, b) => score10(b) - score10(a)), [ev.obras])

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
            <BuildSlot icon="building" label={t("eventos.maquetaReto")} className="h-full" />
          </div>
          <div className="p-5">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <Badge tone="urbanismo" icon="building">
                {t("eventos.retoConstruccionBadge")}
              </Badge>
              <Badge tone={status.tone} dot={status.dot}>
                {status.label}
              </Badge>
              <span className="font-gt-mono text-[10.5px] text-gt-ink-400">{ev.code}</span>
              {ev.status === "rating" && (
                <div className="ml-auto">
                  <Countdown iso={ev.ratingClosesAt} label={t("eventos.valoracionCierraEn")} />
                </div>
              )}
            </div>
            {ev.brief && <p className="mb-3.5 max-w-[680px] text-sm leading-relaxed text-gt-ink-700">{ev.brief}</p>}
            <div className="flex flex-wrap gap-5">
              {ev.prize && (
                <div>
                  <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    {t("eventos.premioLabel")}
                  </div>
                  <div className="font-gt-display text-[13.5px] font-bold text-gt-gold-600">{ev.prize}</div>
                </div>
              )}
              <div>
                <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                  {t("eventos.participanLabel")}
                </div>
                <div className="font-gt-display text-[13.5px] font-bold text-gt-ink-800">
                  {t("eventos.ciudades", { count: ranked.length, plural: ranked.length === 1 ? "" : "es" })}
                </div>
              </div>
              {ev.crew && (
                <div>
                  <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    {t("eventos.cuadrillaLabel")}
                  </div>
                  <div className="font-gt-display text-[13.5px] font-bold text-gt-ink-800">{ev.crew}</div>
                </div>
              )}
              {ev.buildClosedAt && (
                <div>
                  <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    {t("eventos.finConstruccionLabel")}
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
            {t("eventos.registrarObra")}
          </Button>
        )}
        {canClose && (
          <Button icon="checkCircle" tone="gold" onClick={() => setConfirmClose(true)}>
            {t("eventos.cerrarValoracion")}
          </Button>
        )}
      </div>

      {ranked.length === 0 ? (
        <Empty
          icon="building"
          title={t("eventos.emptyObras")}
          sub={t("eventos.emptyObrasSub")}
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
            <Bar icon="award" dep="urbanismo">
              {t("eventos.clasificacion")}{closed ? t("eventos.clasificacionFinal") : t("eventos.clasificacionProvisional")}
            </Bar>
          </div>

          <Card className="mb-5 overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH className="w-[70px]">{t("eventos.puesto")}</TH>
                  <TH>{t("eventos.ciudadObra")}</TH>
                  <TH>{t("eventos.cuadrillaCol")}</TH>
                  <TH className="text-center">{t("eventos.votos")}</TH>
                  <TH className="text-right">{t("eventos.valoracion")}</TH>
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
                            {isWinner && t("eventos.ganadora")}
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center">
                          {r.builders.slice(0, 4).map((b, bi) => (
                            <span
                              key={b.uuid}
                              className="rounded-[5px] border-2 border-gt-paper-0"
                              style={bi ? { marginLeft: -8 } : undefined}
                            >
                              <Avatar user={b.username} size={26} />
                            </span>
                          ))}
                        </div>
                      </TD>
                      <TD className="text-center">
                        <span className="font-gt-mono text-[13px] tabular-nums text-gt-ink-600">{r.votes}</span>
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end">
                          <ScoreDisplay score10={score10(r)} />
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </Card>

          <Bar icon="building" dep="urbanismo">
            {t("eventos.obrasPresentadas")}
          </Bar>
          <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map((r, i) => (
              <Card key={r.id} dep="urbanismo" className="overflow-hidden">
                <BuildSlot icon="building" label={t("eventos.obraDe", { town: townLabel(r.town) })} className="h-[120px]" />
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
                    {(Object.keys(catLabels) as (keyof typeof catLabels)[]).map((k) => (
                      <div key={k}>
                        <div className="mb-0.5 flex items-center justify-between">
                          <span className="text-[10.5px] text-gt-ink-500">{catLabels[k]}</span>
                          <span className="font-gt-mono text-[10px] tabular-nums text-gt-ink-600">
                            {r.votes > 0 ? r[k].toFixed(1) : "—"}
                          </span>
                        </div>
                        <div className="h-[5px] overflow-hidden rounded-full bg-gt-paper-3">
                          <div
                            className="h-full bg-gt-dep-urbanismo"
                            style={{ width: `${Math.min(100, (r[k] / 10) * 100)}%` }}
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
        title={t("eventos.cerrarValoracionTitle")}
        kicker={t("eventos.confirmar")}
        footer={
          <>
            <Button tone="ghost" onClick={() => setConfirmClose(false)}>
              {t("common.cancel")}
            </Button>
            <Button tone="gold" icon="checkCircle" onClick={closeEvento} disabled={updateEvento.isPending}>
              {t("eventos.cerrarPublicarGanador")}
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-gt-ink-700">
          {t("eventos.cerrarDescription", { title: ev.title })}
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
  const t = useTranslations("gobierno")
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
      title={t("eventos.registrarObraTitle")}
      kicker={t("eventos.registrarObraKicker")}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button tone="primary" icon="plus" disabled={!valid || createObra.isPending} onClick={submit}>
            {t("eventos.registrar")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5">
        <Field
          label={t("eventos.ciudadWG")}
          value={town}
          onChange={setTown}
          placeholder={t("eventos.ciudadPlaceholder")}
          mono
        />
        <Field label={t("eventos.nombreObra")} value={buildName} onChange={setBuildName} placeholder={t("eventos.nombreObraPlaceholder")} />
        <TextArea
          label={t("eventos.descripcion")}
          value={description}
          onChange={setDescription}
          rows={3}
          placeholder={t("eventos.descripcionPlaceholder")}
        />
        <Field
          label={t("eventos.cuadrillaUsuarios")}
          value={builders}
          onChange={setBuilders}
          placeholder={t("eventos.cuadrillaUsuariosPlaceholder")}
        />
        <div className="flex items-start gap-2 rounded-gt-sm bg-gt-paper-2 p-2.5 text-[11.5px] leading-relaxed text-gt-ink-500">
          <Icon name="alert" size={13} className="mt-0.5 flex-none text-gt-ink-400" />
          {t("eventos.valoracionHint2")}
        </div>
      </div>
    </Modal>
  )
}
