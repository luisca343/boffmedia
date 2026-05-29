"use client"

import { useState, useEffect } from "react"
import { Bell, Send, CheckCircle, XCircle, Search } from "lucide-react"
import { NotificationsService } from "@/services/api/smartrotom/notificationsService"
import { UsersService } from "@/services/api/smartrotom/usersService"
import type { SmartRotomUser } from "@boffmedia/shared"

const NOTIFICATION_TYPES = [
  { value: "system",   label: "System",   icon: "⚙" },
  { value: "chatapp",  label: "ChatApp",  icon: "💬" },
  { value: "starbank", label: "StarBank", icon: "⭐" },
  { value: "arcade",   label: "Arcade",   icon: "🎮" },
  { value: "misiones", label: "Misiones", icon: "📋" },
  { value: "bidkea",   label: "Bidkea",   icon: "🏪" },
  { value: "admin",    label: "Admin",    icon: "🔒" },
]

type SendStatus = "idle" | "sending" | "success" | "error"

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<SmartRotomUser[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [selectedUuid, setSelectedUuid] = useState("")
  const [type, setType] = useState("system")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [link, setLink] = useState("")
  const [status, setStatus] = useState<SendStatus>("idle")
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    UsersService.findAll().then(res => { if (res.data) setUsers(res.data) })
  }, [])

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.uuid.toLowerCase().includes(userSearch.toLowerCase())
  )

  const canSend =
    selectedUuid.trim().length > 0 &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    status !== "sending"

  const handleSend = async () => {
    if (!canSend) return
    setStatus("sending")
    setStatusMessage("")
    const res = await NotificationsService.sendNotification({
      userUuid: selectedUuid.trim(),
      type,
      title: title.trim(),
      body: body.trim(),
      link: link.trim() || undefined,
    })
    if (res.data) {
      setStatus("success")
      setStatusMessage(`Notificación #${res.data.id} enviada a ${selectedUuid.slice(0, 8)}…`)
      setTitle(""); setBody(""); setLink("")
    } else {
      setStatus("error")
      setStatusMessage(res.error ?? "Error desconocido al enviar la notificación")
    }
    setTimeout(() => setStatus("idle"), 4000)
  }

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><Bell size={20} /> NotifyBell</h1>
        <p className="sr-page-sub">Envía notificaciones push a jugadores del servidor</p>
      </div>

      <div className="sr-grid2" style={{ alignItems: 'start' }}>
        <div className="sr-col" style={{ gap: 'var(--gap)' }}>
          {/* User selector */}
          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">Destinatario</span>
            </div>
            <div className="sr-panel-body sr-col" style={{ gap: 10 }}>
              <div className="sr-search">
                <Search size={13} />
                <input
                  placeholder="Buscar jugador por nombre o UUID…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>

              {userSearch.length > 0 && (
                <div className="sr-user-pick">
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--fg-faint)' }}>Sin resultados</div>
                  ) : (
                    filteredUsers.slice(0, 20).map(u => (
                      <button
                        key={u.uuid}
                        className={selectedUuid === u.uuid ? 'sr-on' : ''}
                        onClick={() => { setSelectedUuid(u.uuid); setUserSearch(u.username) }}
                      >
                        <span style={{ color: 'var(--fg-strong)', fontWeight: 500 }}>{u.username}</span>
                        <span style={{ color: 'var(--fg-faint)', fontSize: 11 }}>{u.uuid}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className="sr-field">
                <label>// UUID manual</label>
                <input
                  className="sr-input"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={selectedUuid}
                  onChange={e => setSelectedUuid(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notification type */}
          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">Tipo de notificación</span>
            </div>
            <div className="sr-panel-body">
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                {NOTIFICATION_TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`sr-opt-card${type === t.value ? ' sr-on' : ''}`}
                    onClick={() => setType(t.value)}
                  >
                    <span className="sr-oc-ic">{t.icon}</span>
                    <span style={{ fontSize: 12, color: 'var(--fg-strong)' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sr-col" style={{ gap: 'var(--gap)' }}>
          {/* Content */}
          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">Contenido</span>
            </div>
            <div className="sr-panel-body sr-col" style={{ gap: 12 }}>
              <div className="sr-field">
                <label>// Título <span className="sr-req">*</span></label>
                <input className="sr-input" placeholder="Título de la notificación" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="sr-field">
                <label>// Mensaje <span className="sr-req">*</span></label>
                <textarea className="sr-textarea" rows={3} placeholder="Cuerpo del mensaje" value={body} onChange={e => setBody(e.target.value)} />
              </div>
              <div className="sr-field">
                <label>// Enlace <span className="sr-c">(opcional)</span></label>
                <input className="sr-input" placeholder="app://…" value={link} onChange={e => setLink(e.target.value)} />
              </div>

              {status === "success" && (
                <div className="sr-banner sr-ok">
                  <CheckCircle size={14} /> {statusMessage}
                </div>
              )}
              {status === "error" && (
                <div className="sr-banner sr-crit">
                  <XCircle size={14} /> {statusMessage}
                </div>
              )}

              <button
                className="sr-btn sr-solid"
                disabled={!canSend}
                onClick={handleSend}
              >
                {status === "sending" ? <span className="sr-spin" /> : <Send size={14} />}
                {status === "sending" ? "Enviando…" : "Enviar notificación"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
