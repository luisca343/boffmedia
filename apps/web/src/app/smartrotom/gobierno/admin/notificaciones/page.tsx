"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Avatar,
  Bar,
  Button,
  Card,
  Field,
  Icon,
  type IconName,
  PageHead,
  Skeleton,
  Sunken,
  TextArea,
} from "../../_components/ui"
import { ConsolaHero } from "../../_components/admin/ConsolaHero"
import { useAdminUsers, useSendNotification } from "../../_components/admin/adminApi"
import { TONES, type Tone } from "../../_utils/tones"

const NOTIF_TYPES: { value: string; label: string; icon: IconName; tone: Tone }[] = [
  { value: "system", label: "Sistema", icon: "server", tone: "poblacion" },
  { value: "chatapp", label: "Mensajes", icon: "send", tone: "seguridad" },
  { value: "starbank", label: "Banco", icon: "coins", tone: "hacienda" },
  { value: "arcade", label: "Arcade", icon: "zap", tone: "justicia" },
  { value: "misiones", label: "Misiones", icon: "star", tone: "gold" },
  { value: "bidkea", label: "Subastas", icon: "gavel", tone: "urbanismo" },
  { value: "admin", label: "Admin", icon: "lock", tone: "default" },
]

// `useSearchParams` opts its subtree into Suspense at build time — without this
// boundary `next build` fails even though the route is fully client-rendered.
export default function NotificacionesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-14 w-2/3" />}>
      <NotificacionesScreen />
    </Suspense>
  )
}

function NotificacionesScreen() {
  const searchParams = useSearchParams()
  const presetUuid = searchParams.get("uuid")

  const { data: users, isLoading: usersLoading } = useAdminUsers()
  const sendNotification = useSendNotification()

  const [query, setQuery] = useState("")
  const [target, setTarget] = useState("")
  const [type, setType] = useState("system")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [link, setLink] = useState("")

  useEffect(() => {
    if (presetUuid && !target) setTarget(presetUuid)
  }, [presetUuid, target])

  const matches = query
    ? (users ?? [])
        .filter((u) => u.username.toLowerCase().includes(query.toLowerCase()) || u.uuid.includes(query))
        .slice(0, 6)
    : []
  const tgt = users?.find((u) => u.uuid === target)
  const activeType = NOTIF_TYPES.find((t) => t.value === type) ?? NOTIF_TYPES[0]
  const canSend = !!target && title.trim().length > 0 && body.trim().length > 0 && !sendNotification.isPending

  const send = () => {
    if (!canSend) return
    sendNotification.mutate(
      { userUuid: target, type, title: title.trim(), body: body.trim(), link: link.trim() || undefined },
      {
        onSuccess: () => {
          setTitle("")
          setBody("")
          setLink("")
        },
      },
    )
  }

  return (
    <>
      <PageHead
        kicker="Administración · Mensajería"
        dep="gold"
        title="Notificaciones push"
        sub="Envía avisos al SmartRotom de un jugador. Antes NotifyBell."
      />
      <ConsolaHero title="NotifyBell" code="notificaciones" icon="bell" dep="gold" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          <Card className="overflow-hidden">
            <Bar icon="users" dep="gold">
              Destinatario
            </Bar>
            <div className="p-4">
              {usersLoading ? (
                <Skeleton className="h-9" />
              ) : (
                <Field
                  id="user-search"
                  icon="search"
                  value={query}
                  onChange={setQuery}
                  placeholder="Buscar jugador por nombre o UUID…"
                />
              )}
              {query && !tgt && (
                <Sunken id="user-search-results" className="mt-2 overflow-hidden p-0">
                  {matches.length ? (
                    matches.map((u) => (
                      <button
                        key={u.uuid}
                        type="button"
                        data-uuid={u.uuid}
                        onClick={() => {
                          setTarget(u.uuid)
                          setQuery("")
                        }}
                        className="flex w-full items-center gap-2.5 border-b border-gt-line-soft px-3 py-2.5 text-left last:border-b-0 hover:bg-gt-paper-1"
                      >
                        <Avatar user={u.username} size={24} />
                        <span className="text-[13px] font-bold text-gt-ink-900">{u.username}</span>
                        <span className="ml-auto font-gt-mono text-[10.5px] text-gt-ink-400">
                          {u.uuid.slice(0, 10)}…
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2.5 text-xs text-gt-ink-400">Sin resultados</div>
                  )}
                </Sunken>
              )}
              {tgt && (
                <div className="mt-2.5 flex items-center gap-2.5 rounded-gt border border-gt-accent/25 bg-gt-accent-tint px-3 py-2.5">
                  <Avatar user={tgt.username} size={32} />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-bold text-gt-ink-900">{tgt.username}</div>
                    <div className="font-gt-mono text-[10px] text-gt-ink-500">{tgt.uuid}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTarget("")}
                    aria-label="Quitar destinatario"
                    className="ml-auto text-gt-ink-400 hover:text-gt-ink-900"
                  >
                    <Icon name="x" size={15} />
                  </button>
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <Bar icon="layers" dep="gold">
              Categoría
            </Bar>
            <div className="grid grid-cols-2 gap-2 p-3.5 sm:grid-cols-3">
              {NOTIF_TYPES.map((t) => {
                const on = type === t.value
                const tone = TONES[t.tone]
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2.5 rounded-gt border px-[11px] py-2.5 text-left transition-colors ${
                      on ? `${tone.softBg} ${tone.border} shadow-gt-sm` : "border-gt-line bg-gt-paper-0"
                    }`}
                  >
                    <Icon name={t.icon} size={17} className={`flex-none ${on ? tone.text : "text-gt-ink-400"}`} />
                    <span className={`text-[12.5px] font-bold ${on ? "text-gt-ink-900" : "text-gt-ink-600"}`}>
                      {t.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        <Card className="h-fit overflow-hidden">
          <Bar icon="fileText" dep="gold">
            Contenido
          </Bar>
          <div className="p-4">
            <div className="mb-1.5 font-gt-mono text-[9px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
              Título *
            </div>
            <div className="mb-3.5">
              <Field id="notif-title" value={title} onChange={setTitle} placeholder="Título de la notificación" />
            </div>
            <div className="mb-1.5 font-gt-mono text-[9px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
              Mensaje *
            </div>
            <div className="mb-3.5">
              <TextArea id="notif-body" rows={3} value={body} onChange={setBody} placeholder="Cuerpo del mensaje…" />
            </div>
            <div className="mb-1.5 font-gt-mono text-[9px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
              Enlace <span className="normal-case tracking-normal text-gt-ink-300">(opcional)</span>
            </div>
            <div className="mb-4">
              <Field id="notif-link" mono value={link} onChange={setLink} placeholder="app://…" />
            </div>

            <Sunken className="mb-3.5 px-[13px] py-[11px]">
              <div className="mb-2 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                Vista previa
              </div>
              <div className="flex items-start gap-2.5">
                <div className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-[7px] ${TONES[activeType.tone].softBg} border ${TONES[activeType.tone].softBorder}`}>
                  <Icon name={activeType.icon} size={15} className={TONES[activeType.tone].text} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-gt-ink-900">
                    {title || <span className="text-gt-ink-300">Título…</span>}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-normal text-gt-ink-500">
                    {body || <span className="text-gt-ink-300">Mensaje…</span>}
                  </div>
                </div>
              </div>
            </Sunken>

            <Button icon="send" tone="gold" className="w-full" disabled={!canSend} onClick={send}>
              {sendNotification.isPending ? "Enviando…" : "Enviar notificación"}
            </Button>
            <div className="mt-2.5 text-center font-gt-mono text-[10px] text-gt-ink-400">
              {target
                ? "Llega a un único jugador — no existe un endpoint de difusión masiva."
                : "Selecciona un destinatario para enviar"}
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
