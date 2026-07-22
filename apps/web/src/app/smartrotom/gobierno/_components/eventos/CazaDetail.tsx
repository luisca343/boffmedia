"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Bar, Button, Card, Icon, Modal, Stat, Table, THead, TBody, TH, TR, TD } from "../ui"
import { useUpdateEvento } from "../../_hooks/queries"
import type { Evento } from "../../_types"
import { BackToEventos, Countdown, RARITY_TONE, getScoreFields, eventoStatusMeta, weightMax } from "./shared"

export function CazaDetail({ ev }: { ev: Evento }) {
  const t = useTranslations("gobierno")
  const status = eventoStatusMeta(ev.status, t)
  const closed = ev.status === "closed"
  const live = ev.status === "live"
  const canClose = live
  const max = weightMax(ev.weights)
  const scoreFields = getScoreFields(t)

  const [confirmClose, setConfirmClose] = useState(false)
  const updateEvento = useUpdateEvento()

  const closeEvento = () => {
    updateEvento.mutate({ id: ev.id, status: "closed" })
    setConfirmClose(false)
  }

  return (
    <>
      <BackToEventos />

      <Card edgeGold className="mb-[18px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3.5">
          <div className="min-w-0">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <Badge tone="civic" icon="crosshair">
                {t("eventos.cazaBichosBadge")}
              </Badge>
              <Badge tone={status.tone} dot={status.dot}>
                {status.label}
              </Badge>
              <span className="font-gt-mono text-[10.5px] text-gt-ink-400">{ev.code}</span>
            </div>
            <div className="flex flex-wrap gap-5">
              <div>
                <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                  {t("eventos.zona")}
                </div>
                <div className="flex items-center gap-1.5 font-gt-display text-[15px] font-bold text-gt-ink-900">
                  <Icon name="mapPin" size={14} className="text-gt-civic" /> {ev.zone ?? "—"}
                </div>
              </div>
              {ev.coordsX != null && ev.coordsZ != null && (
                <div>
                  <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    {t("eventos.coordenadas")}
                  </div>
                  <div className="font-gt-mono text-[13px] text-gt-ink-700">
                    X {ev.coordsX} · Z {ev.coordsZ}
                    {ev.radius != null && ` · r${ev.radius}`}
                  </div>
                </div>
              )}
              {ev.participants != null && (
                <div>
                  <div className="mb-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    {t("eventos.participantes")}
                  </div>
                  <div className="font-gt-display text-[15px] font-bold tabular-nums text-gt-ink-900">
                    {ev.participants}
                  </div>
                </div>
              )}
            </div>
          </div>
          {live && <Countdown iso={ev.closesAt} label={t("eventos.cierraEn")} />}
        </div>
      </Card>

      {live && ev.rules && (
        <Card className="mb-[18px] border-l-[3px] border-l-gt-info bg-gt-info/[.06] p-3.5">
          <div className="flex items-start gap-2.5">
            <Icon name="lock" size={17} className="mt-px flex-none text-gt-info" />
            <div>
              <div className="mb-0.5 text-[13px] font-bold text-gt-ink-900">{t("eventos.transparencia")}</div>
              <p className="m-0 text-[12.5px] leading-relaxed text-gt-ink-600">{ev.rules}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ev.participants != null && <Stat label={t("eventos.participantes")} value={ev.participants} icon="users" tone="seguridad" />}
        {ev.capturas != null && (
          <Stat
            label={t("eventos.capturasRegistradas")}
            value={ev.capturas}
            icon="crosshair"
            tone="civic"
            sub={live ? t("eventos.totalAgregado") : undefined}
          />
        )}
        {max > 0 && <Stat label={t("eventos.puntuacionMaxima")} value={max} icon="star" tone="gold" sub={t("eventos.techoTeorico")} />}
        {closed && ev.winnerSpecies != null && ev.winningScore != null && (
          <Stat label={t("eventos.capturaGanadora")} value={`${ev.winningScore} pts`} icon="award" tone="gold" sub={ev.winnerSpecies} />
        )}
      </div>

      {canClose && (
        <div className="mb-5 mt-4">
          <Button icon="checkCircle" tone="gold" onClick={() => setConfirmClose(true)}>
            {t("eventos.cerrarCaceria")}
          </Button>
        </div>
      )}

      {ev.weights && (
        <div className="mt-6">
          <Bar icon="list" dep="civic">
            {t("eventos.parametrosPublicos")}
          </Bar>
          <div className="mt-3.5 mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {scoreFields.map((f) => (
              <Card key={f.key} className="p-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-[7px] bg-gt-civic/10">
                      <Icon name={f.icon} size={15} className="text-gt-civic" />
                    </span>
                    <span className="font-gt-display text-[15px] font-bold text-gt-ink-900">{f.label}</span>
                  </div>
                  <span className="font-gt-mono text-[11px] font-bold tabular-nums text-gt-gold-600">
                    {t("eventos.maxTotal", { pts: ev.weights![f.key] })}
                  </span>
                </div>
                <p className="m-0 text-[11.5px] leading-relaxed text-gt-ink-500">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {ev.especies && ev.especies.length > 0 && (
        <>
          <Bar
            icon="crosshair"
            dep="civic"
            right={
              <span className="font-gt-mono text-[10.5px] text-gt-ink-400">
                {t("eventos.especiesZonaCount", { count: ev.especies.length })}
              </span>
            }
          >
            {t("eventos.tablaAparicion")}
          </Bar>
          <Card className="mt-3.5 overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>{t("eventos.especieCol")}</TH>
                  <TH className="text-center">{t("eventos.aparicionCol")}</TH>
                  <TH className="text-center">{t("eventos.probShiny")}</TH>
                  <TH className="text-center">{t("eventos.nivel")}</TH>
                  <TH className="text-right">{t("eventos.ptsRareza")}</TH>
                </TR>
              </THead>
              <TBody>
                {[...ev.especies]
                  .sort((a, b) => b.spawnPct - a.spawnPct)
                  .map((spc) => (
                    <TR key={spc.id}>
                      <TD>
                        <div className="flex items-center gap-2">
                          <span className="font-gt-display text-sm font-bold text-gt-ink-900">{spc.name}</span>
                          <Badge tone={RARITY_TONE[spc.rarity] ?? "default"}>{spc.rarity}</Badge>
                        </div>
                      </TD>
                      <TD className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-9 text-right font-gt-mono text-xs tabular-nums text-gt-ink-700">
                            {spc.spawnPct}%
                          </span>
                          <div className="h-[5px] w-14 overflow-hidden rounded-full bg-gt-paper-3">
                            <div
                              className="h-full bg-gt-civic"
                              style={{ width: `${Math.min(100, spc.spawnPct * 2.8)}%` }}
                            />
                          </div>
                        </div>
                      </TD>
                      <TD className="text-center">
                        <span
                          className={`font-gt-mono text-xs tabular-nums ${
                            spc.shinyPct >= 0.08 ? "text-gt-gold-600" : "text-gt-ink-500"
                          }`}
                        >
                          {spc.shinyPct.toFixed(2)}%
                        </span>
                      </TD>
                      <TD className="text-center">
                        <span className="font-gt-mono text-[11.5px] tabular-nums text-gt-ink-600">
                          {spc.lvlMin}–{spc.lvlMax}
                        </span>
                      </TD>
                      <TD className="text-right">
                        <span className="font-gt-mono text-xs font-bold tabular-nums text-gt-gold-600">
                          {spc.rarityPts}
                        </span>
                      </TD>
                    </TR>
                  ))}
              </TBody>
            </Table>
          </Card>
        </>
      )}

      <Modal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title={t("eventos.cerrarCaceriaTitle")}
        kicker={t("eventos.confirmar")}
        footer={
          <>
            <Button tone="ghost" onClick={() => setConfirmClose(false)}>
              {t("common.cancel")}
            </Button>
            <Button tone="gold" icon="checkCircle" onClick={closeEvento}>
              {t("eventos.cerrarPublicar")}
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-gt-ink-700">
          {t("eventos.cerrarCaceriaDescription", { title: ev.title })}
        </p>
      </Modal>
    </>
  )
}
