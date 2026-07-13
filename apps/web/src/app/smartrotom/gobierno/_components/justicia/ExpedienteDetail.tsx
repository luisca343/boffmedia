"use client"

import { useState } from "react"
import { Avatar, Badge, Card, Empty, Icon, Skeleton, TextArea, Button, type IconName } from "../ui"
import { EXPEDIENTE_STATUS, SEVERITY, TONES, type Tone } from "../../_utils/tones"
import { fmtDateTime } from "../../_utils/format"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useAddExpedienteEvento } from "../../_hooks/queries"
import type { Expediente, ExpedienteEvento } from "../../_types"

const KIND_META: Record<ExpedienteEvento["kind"], { tone: Tone; icon: IconName; label: string }> = {
  denuncia: { tone: "seguridad", icon: "fileText", label: "Denuncia" },
  multa: { tone: "hacienda", icon: "gavel", label: "Multa" },
  buscado: { tone: "danger", icon: "alert", label: "Buscado" },
  apelacion: { tone: "justicia", icon: "scale", label: "Apelación" },
  nota: { tone: "default", icon: "pin", label: "Nota" },
  cierre: { tone: "ok", icon: "checkCircle", label: "Cierre" },
}

// The timeline is the centrepiece: every denuncia, multa, orden de busca y captura and
// apelacion tied to this subject, assembled in one read — plus the one thing an officer
// can add directly, a nota.
export function ExpedienteDetail({ expediente, isLoading }: { expediente: Expediente | null; isLoading: boolean }) {
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const [nota, setNota] = useState("")
  const addEvento = useAddExpedienteEvento()

  if (isLoading) {
    return <Skeleton className="h-full min-h-[320px]" />
  }

  if (!expediente) {
    return (
      <Card>
        <Empty icon="folder" title="Selecciona un expediente" sub="Elige un caso de la lista para ver su cronología completa." />
      </Card>
    )
  }

  const st = EXPEDIENTE_STATUS[expediente.status] ?? { label: expediente.status, tone: "default" as const }
  const sev = SEVERITY[expediente.severity] ?? { label: expediente.severity, tone: "default" as const }

  return (
    <Card edgeGold className="overflow-hidden">
      <div className="border-b border-gt-line bg-gt-paper-1 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openDossier(expediente.subject.uuid)}
              aria-label={`Ver expediente ciudadano de ${expediente.subject.username}`}
            >
              <Avatar user={expediente.subject.username} size={48} />
            </button>
            <div>
              <div className="font-gt-mono text-[10.5px] text-gt-ink-400">
                {expediente.code} · Instruye {expediente.lead.username}
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
          <Empty icon="scroll" title="Sin anotaciones todavía" sub="Este expediente no tiene entradas registradas." />
        ) : (
          expediente.timeline.map((e, i) => {
            const km = KIND_META[e.kind] ?? KIND_META.nota
            const t = TONES[km.tone]
            const last = i === expediente.timeline.length - 1
            return (
              <div key={e.id} className={`flex items-start gap-3.5 ${last ? "" : "pb-[18px]"}`}>
                <div className="flex flex-none flex-col items-center">
                  <div className={`grid h-[30px] w-[30px] place-items-center rounded-lg border ${t.softBg} ${t.softBorder}`}>
                    <Icon name={km.icon} size={15} className={t.text} />
                  </div>
                  {!last && <div className="mt-1 min-h-[24px] w-px flex-1 bg-gt-line" />}
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-gt-mono text-[9.5px] font-bold uppercase tracking-[.1em] ${t.text}`}>
                      {km.label}
                    </span>
                    {e.ref && (
                      <span className="rounded-[4px] border border-gt-line bg-gt-paper-2 px-[7px] py-px font-gt-mono text-[10px] text-gt-ink-600">
                        {e.ref}
                      </span>
                    )}
                    <span className="ml-auto font-gt-mono text-[10px] text-gt-ink-400">{fmtDateTime(e.at)}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-gt-ink-700">{e.text}</p>
                </div>
              </div>
            )
          })
        )}

        {expediente.status === "open" && (
          <div className="mt-5 border-t border-gt-line-soft pt-4">
            <TextArea value={nota} onChange={setNota} placeholder="Añadir una anotación al expediente…" rows={2} />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                icon="pin"
                disabled={!nota.trim() || addEvento.isPending}
                onClick={() =>
                  addEvento.mutate({ id: expediente.id, kind: "nota", text: nota.trim() }, { onSuccess: () => setNota("") })
                }
              >
                {addEvento.isPending ? "Guardando…" : "Añadir nota"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
