"use client"

import { useEffect, useState } from "react"
import { useGetArceuSpeak } from "@/hooks/_main/useGetArceuSpeak"
import { Bar, Button, Card, Empty, PageHead, Select, Skeleton, Sunken, TextArea } from "../../_components/ui"
import { ConsolaHero } from "../../_components/admin/ConsolaHero"
import { MCText } from "../../_components/admin/MCText"
import { VozCreator } from "../../_components/admin/VozCreator"
import { useMegafonia, useSendMegafonia } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { fmtDateTime } from "../../_utils/format"

export default function MegafoniaPage() {
  const { speakers, isLoading: speakersLoading, refetch: refetchSpeakers } = useGetArceuSpeak()
  const { data: history, isLoading: historyLoading } = useMegafonia()
  const sendMegafonia = useSendMegafonia()
  const officer = useOfficer()

  const [speakerValue, setSpeakerValue] = useState("")
  const [msg, setMsg] = useState("")
  const [showCreator, setShowCreator] = useState(false)

  useEffect(() => {
    if (!speakerValue && speakers?.length) setSpeakerValue(speakers[0].value)
  }, [speakers, speakerValue])

  const sp = speakers?.find((x) => x.value === speakerValue)
  const sortedHistory = [...(history ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  // `byUuid` is required and @IsUUID(): with no linked Minecraft account useOfficer()
  // returns "", which the API rejects — block the send instead of round-tripping a 400.
  const send = () => {
    if (!msg.trim() || !speakerValue || !officer.uuid || sendMegafonia.isPending) return
    sendMegafonia.mutate(
      { speaker: speakerValue, text: msg.trim(), byUuid: officer.uuid },
      { onSuccess: () => setMsg("") },
    )
  }

  const handleCreated = async (value: string) => {
    await refetchSpeakers()
    setSpeakerValue(value)
    setShowCreator(false)
  }

  return (
    <>
      <PageHead
        kicker="Administración · Comunicación remota"
        dep="seguridad"
        title="Megafonía"
        sub="Transmite mensajes al chat del servidor en nombre de una voz oficial. Antes ArceuSpeak."
      />
      <ConsolaHero title="ArceuSpeak" code="megafonia" icon="megaphone" dep="seguridad" />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="h-fit overflow-hidden">
          <Bar
            icon="megaphone"
            dep="seguridad"
            right={
              <Button size="sm" tone="ghost" icon="plus" onClick={() => setShowCreator((v) => !v)}>
                Crear voz
              </Button>
            }
          >
            Emisión
          </Bar>
          <div className="p-4">
            <div className="mb-1.5 font-gt-mono text-[9px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
              Emisor
            </div>
            <div className="mb-3.5">
              {speakersLoading ? (
                <Skeleton className="h-9" />
              ) : (
                <Select
                  value={speakerValue}
                  onChange={setSpeakerValue}
                  options={(speakers ?? []).map((s) => ({ value: s.value, label: s.name }))}
                />
              )}
            </div>

            <div className="mb-1.5 font-gt-mono text-[9px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
              Mensaje
            </div>
            <div className="mb-2">
              <TextArea rows={4} value={msg} onChange={setMsg} placeholder="Escribe el mensaje a transmitir…" />
            </div>

            <Sunken className="mb-3.5 px-[13px] py-[11px]">
              <div className="mb-1.5 font-gt-mono text-[8.5px] uppercase tracking-[.14em] text-gt-ink-400">
                Vista previa · chat del juego
              </div>
              <div className="text-[13.5px] leading-normal">
                <MCText format={sp?.format} />
                <span className="text-gt-ink-800">: {msg || <span className="text-gt-ink-300">…</span>}</span>
              </div>
            </Sunken>

            <Button
              icon="send"
              className="w-full"
              disabled={!msg.trim() || !speakerValue || !officer.uuid || sendMegafonia.isPending}
              onClick={send}
            >
              {sendMegafonia.isPending ? "Transmitiendo…" : "Enviar al servidor"}
            </Button>
          </div>
        </Card>

        <div className="grid gap-4">
          {showCreator && <VozCreator onCreated={handleCreated} onClose={() => setShowCreator(false)} />}

          <Card className="overflow-hidden">
            <Bar icon="history" dep="seguridad">
              Últimas emisiones
            </Bar>
            {historyLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : sortedHistory.length ? (
              <div className="py-1.5">
                {sortedHistory.map((h) => {
                  const hs = speakers?.find((x) => x.value === h.speaker)
                  return (
                    <div key={h.id} className="border-b border-gt-line-soft px-4 py-2.5 last:border-b-0">
                      <Sunken className="px-[11px] py-[7px]">
                        <span className="text-[12.5px]">
                          <MCText format={hs?.format} />
                          <span className="text-gt-ink-800">: {h.text}</span>
                        </span>
                      </Sunken>
                      <div className="mt-[5px] font-gt-mono text-[9.5px] tabular-nums text-gt-ink-400">
                        {h.by.username} · {fmtDateTime(h.createdAt)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Empty icon="megaphone" title="Sin emisiones" sub="Todavía no se ha transmitido ningún mensaje." />
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
