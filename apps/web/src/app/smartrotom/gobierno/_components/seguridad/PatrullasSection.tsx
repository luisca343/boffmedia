"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { userMessageFrom } from "@/services/boffAPI"
import { useFormat } from "@boffmedia/ui/useFormat"
import { Badge, Bar, Button, Card, Empty, PageHead, Skeleton, TextArea } from "../ui"
import { PlayerLink } from "./PlayerLink"
import { NuevaPatrullaModal } from "./NuevaPatrullaModal"
import { useAddBitacora, useBitacora, usePatrullas, useUpdatePatrulla } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { TONES, type Tone } from "../../_utils/tones"
import { fmtDateTime } from "../../_utils/format"
import type { PlayerRef } from "../../_types"

const STATUS_LABEL: Record<string, { labelKey: string; tone: Tone }> = {
  active: { labelKey: "seguridad.enCurso", tone: "ok" },
  next: { labelKey: "seguridad.siguiente", tone: "warn" },
  rest: { labelKey: "seguridad.descanso", tone: "default" },
}
// The real endpoint's response field is `by`, not `officer` — `_types.BitacoraEntry` was
// written against the intended shape before the API landed. Read both so this keeps working
// whichever one is actually on the wire, without touching the shared type declaration.
const authorOf = (e: { officer?: PlayerRef; by?: PlayerRef }): PlayerRef | undefined => e.officer ?? e.by
// Same story for `tone`: the DTO's own swagger doc uses `info`/`warning`/`alert`, the shared
// type uses `ok`/`warn`/`danger`/`info`. Normalize on read; `info` is sent on write since it
// is the one value both vocabularies agree on.
const BITACORA_TONE: Record<string, Tone> = {
  ok: "ok",
  warn: "warn",
  warning: "warn",
  danger: "danger",
  alert: "danger",
  info: "info",
}

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function PatrullasSection() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const officer = useOfficer()
  const { data: patrullas, isLoading, isError, error } = usePatrullas()
  const { data: bitacora, isLoading: bitacoraLoading } = useBitacora({ dateFrom: startOfToday() })
  const updatePatrulla = useUpdatePatrulla()
  const addBitacora = useAddBitacora()
  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [note, setNote] = useState("")

  const nextShift = useMemo(() => patrullas?.find((p) => p.status === "next"), [patrullas])

  const toggleShift = (id: number, current: string) => {
    updatePatrulla.mutate({ id, status: current === "active" ? "rest" : "active", actorUuid: officer.uuid })
  }

  const submitTraspaso = () => {
    if (!note.trim()) return
    addBitacora.mutate(
      { uuid: officer.uuid, text: note, tone: "info", patrullaId: nextShift?.id },
      { onSuccess: () => setNote("") },
    )
  }

  return (
    <>
      <PageHead
        kicker={t("seguridad.patrullasKicker")}
        dep="seguridad"
        title={t("seguridad.patrullasTitle")}
        sub={t("seguridad.patrullasSub")}
        right={
          <Button tone="primary" icon="plus" onClick={() => setNuevoOpen(true)}>
            {t("seguridad.nuevoTurno")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[13.75rem] w-full" />
          ))}
        </div>
      ) : isError ? (
        <Empty
          icon="alert"
          title={t("denuncias.errorTitle")}
          sub={error ? userMessageFrom(error, t("common.retry")) : undefined}
        />
      ) : !patrullas || patrullas.length === 0 ? (
        <div className="mb-5">
          <Empty icon="shield" title={t("seguridad.emptyTurnos")} sub={t("seguridad.emptyTurnosSub")} />
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patrullas.map((p) => {
            const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.rest
            return (
              <Card
                key={p.id}
                className="p-4"
                style={{ borderTop: `3px solid ${TONES[st.tone].css}` }}
              >
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="font-gt-display text-[1.0625rem] font-bold text-gt-ink-900">{p.label}</span>
                  <Badge tone={st.tone} dot={p.status === "active"}>
                    {t(st.labelKey)}
                  </Badge>
                </div>
                <div className="mb-3 font-gt-mono text-[0.75rem] text-gt-ink-500">
                  {p.fromTime} – {p.toTime}
                  {p.zone && ` · ${p.zone}`}
                </div>
                <div className="mb-1.5 font-gt-mono text-[0.5625rem] font-bold uppercase tracking-[.12em] text-gt-ink-400">
                  {t("seguridad.agentesAsignados")}
                </div>
                <div className="grid gap-1.5">
                  {p.officers.length === 0 ? (
                    <span className="text-[0.75rem] italic text-gt-ink-400">{t("seguridad.sinAgentes")}</span>
                  ) : (
                    p.officers.map((o) => (
                      <PlayerLink
                        key={o.uuid}
                        player={o}
                        size={26}
                        className="rounded-gt-sm border border-gt-line bg-gt-paper-1 px-2.5 py-1.5"
                      />
                    ))
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gt-line-soft pt-2.5">
                  <span className="font-gt-mono text-[0.6875rem] text-gt-ink-400">
                    {p.incidents != null ? t("seguridad.incidencias", { count: p.incidents }) : ""}
                  </span>
                  {p.status !== "next" && (
                    <Button size="sm" tone="plain" onClick={() => toggleShift(p.id, p.status)} disabled={updatePatrulla.isPending}>
                      {p.status === "active" ? t("seguridad.finalizarTurno") : t("seguridad.iniciarTurno")}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr,1fr] lg:items-start">
        <Card className="overflow-hidden p-0">
          <Bar icon="list" dep="seguridad">
            {t("seguridad.bitacoraDelDia")}
          </Bar>
          <div className="px-4 py-3">
            {bitacoraLoading ? (
              <div className="space-y-2.5 py-1">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !bitacora || bitacora.length === 0 ? (
              <Empty icon="list" title={t("seguridad.emptyBitacora")} sub={t("seguridad.emptyBitacoraSub")} />
            ) : (
              bitacora.map((e, i) => {
                const author = authorOf(e)
                return (
                  <div
                    key={e.id}
                    className={`flex items-start gap-3 py-2.5 ${i < bitacora.length - 1 ? "border-b border-gt-line-soft" : ""}`}
                  >
                    <span
                      className={`mt-1 h-[0.5625rem] w-[0.5625rem] flex-none rounded-full ${TONES[BITACORA_TONE[e.tone] ?? "info"].dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[0.8125rem] text-gt-ink-800">{e.text}</div>
                      <div className="mt-0.5 font-gt-mono text-[0.625rem] text-gt-ink-400">
                        {author?.username ?? "—"} · {fmtDateTime(e.createdAt, intlLocale)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card edgeGold className="overflow-hidden p-0">
          <Bar icon="send" dep="gold">
            {t("seguridad.traspasoTurno")}
          </Bar>
          <div className="p-4">
            <p className="mb-2.5 text-[0.78125rem] leading-relaxed text-gt-ink-500">
              {t("seguridad.traspasoDescription")}
            </p>
            <TextArea value={note} onChange={setNote} rows={4} placeholder={t("seguridad.traspasoPlaceholder")} />
            <Button
              tone="gold"
              icon="check"
              className="mt-2.5 w-full"
              onClick={submitTraspaso}
              disabled={addBitacora.isPending || !note.trim()}
            >
              {t("seguridad.entregarRelevo")}
            </Button>
          </div>
        </Card>
      </div>

      <NuevaPatrullaModal open={nuevoOpen} onClose={() => setNuevoOpen(false)} />
    </>
  )
}
