"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useFormat } from "@boffmedia/ui/useFormat"
import { Avatar, Badge, Card, Empty, Icon, Skeleton, TextArea, Button, type IconName } from "../ui"
import { EXPEDIENTE_STATUS, SEVERITY, TONES, type Tone } from "../../_utils/tones"
import { fmtDateTime } from "../../_utils/format"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useAddExpedienteEvento } from "../../_hooks/queries"
import type { Expediente, ExpedienteEvento } from "../../_types"

const KIND_META: Record<ExpedienteEvento["kind"], { tone: Tone; icon: IconName; labelKey: string }> = {
  denuncia: { tone: "seguridad", icon: "fileText", labelKey: "expedientes.kinds.denuncia" },
  multa: { tone: "hacienda", icon: "gavel", labelKey: "expedientes.kinds.multa" },
  buscado: { tone: "danger", icon: "alert", labelKey: "expedientes.kinds.buscado" },
  apelacion: { tone: "justicia", icon: "scale", labelKey: "expedientes.kinds.apelacion" },
  nota: { tone: "default", icon: "pin", labelKey: "expedientes.kinds.nota" },
  cierre: { tone: "ok", icon: "checkCircle", labelKey: "expedientes.kinds.cierre" },
}

// The timeline is the centrepiece: every denuncia, multa, orden de busca y captura and
// apelacion tied to this subject, assembled in one read — plus the one thing an officer
// can add directly, a nota.
export function ExpedienteDetail({ expediente, isLoading }: { expediente: Expediente | null; isLoading: boolean }) {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const [nota, setNota] = useState("")
  const addEvento = useAddExpedienteEvento()

  if (isLoading) {
    return <Skeleton className="h-full min-h-[320px]" />
  }

  if (!expediente) {
    return (
      <Card>
        <Empty icon="folder" title={t("expedientes.selectExpediente")} sub={t("expedientes.selectExpedienteSub")} />
      </Card>
    )
  }

  const stMeta = EXPEDIENTE_STATUS[expediente.status]
  const st = { label: stMeta ? t(stMeta.labelKey) : expediente.status, tone: stMeta?.tone ?? ("default" as const) }
  const sevMeta = SEVERITY[expediente.severity]
  const sev = { label: sevMeta ? t(sevMeta.labelKey) : expediente.severity, tone: sevMeta?.tone ?? ("default" as const) }

  return (
    <Card edgeGold className="overflow-hidden">
      <div className="border-b border-gt-line bg-gt-paper-1 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openDossier(expediente.subject.uuid)}
              aria-label={t("expedientes.verExpedienteCiudadano", { username: expediente.subject.username })}
            >
              <Avatar user={expediente.subject.username} size={48} />
            </button>
            <div>
              <div className="font-gt-mono text-[10.5px] text-gt-ink-400">
                {expediente.code} · {t("expedientes.instruye", { username: expediente.lead.username })}
              </div>
              <h2 className="font-gt-display text-xl leading-tight text-gt-ink-900">{expediente.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={sev.tone}>{sev.label}</Badge>
            <Badge tone={st.tone} dot>
              {st.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        {expediente.timeline.length === 0 ? (
          <Empty icon="scroll" title={t("expedientes.noAnotaciones")} sub={t("expedientes.noAnotacionesSub")} />
        ) : (
          expediente.timeline.map((e, i) => {
            const km = KIND_META[e.kind] ?? KIND_META.nota
            const kmTone = TONES[km.tone]
            const last = i === expediente.timeline.length - 1
            return (
              <div key={e.id} className={`flex items-start gap-3.5 ${last ? "" : "pb-[18px]"}`}>
                <div className="flex flex-none flex-col items-center">
                  <div className={`grid h-[30px] w-[30px] place-items-center rounded-lg border ${kmTone.softBg} ${kmTone.softBorder}`}>
                    <Icon name={km.icon} size={15} className={kmTone.text} />
                  </div>
                  {!last && <div className="mt-1 min-h-[24px] w-px flex-1 bg-gt-line" />}
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-gt-mono text-[9.5px] font-bold uppercase tracking-[.1em] ${kmTone.text}`}>
                      {t(km.labelKey)}
                    </span>
                    {e.ref && (
                      <span className="rounded-[4px] border border-gt-line bg-gt-paper-2 px-[7px] py-px font-gt-mono text-[10px] text-gt-ink-600">
                        {e.ref}
                      </span>
                    )}
                    <span className="ml-auto font-gt-mono text-[10px] text-gt-ink-400">{fmtDateTime(e.at, intlLocale)}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-gt-ink-700">{e.text}</p>
                </div>
              </div>
            )
          })
        )}

        {expediente.status === "open" && (
          <div className="mt-5 border-t border-gt-line-soft pt-4">
            <TextArea value={nota} onChange={setNota} placeholder={t("expedientes.addNotaPlaceholder")} rows={2} />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                icon="pin"
                disabled={!nota.trim() || addEvento.isPending}
                onClick={() =>
                  addEvento.mutate({ id: expediente.id, kind: "nota", text: nota.trim() }, { onSuccess: () => setNota("") })
                }
              >
                {addEvento.isPending ? t("expedientes.saving") : t("expedientes.addNota")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
