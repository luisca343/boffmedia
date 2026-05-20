"use client"

import { useState, useEffect } from "react"
import { Bell, Send, CheckCircle, XCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/primitives/input"
import { Textarea } from "@/components/ui/primitives/textarea"
import { Button } from "@/components/ui/primitives/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives/select"
import AdminPageLayout from "../_components/AdminPageLayout"
import TerminalCard from "../_components/TerminalCard"
import TerminalHeader from "../_components/TerminalHeader"
import TerminalLabel from "../_components/TerminalLabel"
import { NotificationsService } from "@/services/api/smartrotom/notificationsService"
import { UsersService } from "@/services/api/smartrotom/usersService"
import type { SmartRotomUser } from "@boffmedia/shared"

const NOTIFICATION_TYPES = [
  { value: "system", label: "System" },
  { value: "chatapp", label: "ChatApp" },
  { value: "starbank", label: "StarBank" },
  { value: "arcade", label: "Arcade" },
  { value: "misiones", label: "Misiones" },
  { value: "bidkea", label: "Bidkea" },
  { value: "admin", label: "Admin" },
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
    UsersService.findAll().then((res) => {
      if (res.data) setUsers(res.data)
    })
  }, [])

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.uuid.toLowerCase().includes(userSearch.toLowerCase()),
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
      setStatusMessage(`✓ Notificación #${res.data.id} enviada a ${selectedUuid.slice(0, 8)}…`)
      setTitle("")
      setBody("")
      setLink("")
    } else {
      setStatus("error")
      setStatusMessage(res.error ?? "Error desconocido al enviar la notificación")
    }

    setTimeout(() => setStatus("idle"), 4000)
  }

  return (
    <AdminPageLayout title="NotifyBell" version="1.0.0">
      <div className="z-10 relative space-y-4">
        <TerminalHeader title="notification-sender" username="rotom-admin" />

        {/* Player selector */}
        <TerminalCard
          title="Destinatario"
          description="Busca y selecciona el jugador que recibirá la notificación"
          roundedTop={false}
          className="bg-black"
        >
          <div className="space-y-3">
            <div>
              <TerminalLabel htmlFor="user-search" indicator="comment">
                Buscar jugador
              </TerminalLabel>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-highlight-600" />
                <Input
                  id="user-search"
                  placeholder="Nombre o UUID…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 bg-black text-highlight-400 border-highlight-700 placeholder:text-highlight-800"
                />
              </div>
            </div>

            {userSearch.length > 0 && (
              <div className="border border-highlight-700 rounded max-h-40 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-highlight-700 text-xs p-2">// sin resultados</p>
                ) : (
                  filteredUsers.slice(0, 20).map((u) => (
                    <button
                      key={u.uuid}
                      onClick={() => {
                        setSelectedUuid(u.uuid)
                        setUserSearch(u.username)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-highlight-900/30 border-b border-highlight-900 last:border-0 transition-colors ${
                        selectedUuid === u.uuid
                          ? "text-highlight-300 bg-highlight-900/20"
                          : "text-highlight-600"
                      }`}
                    >
                      <span className="text-highlight-400 font-bold">{u.username}</span>
                      <span className="text-highlight-700 ml-2 text-xs">{u.uuid}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedUuid && (
              <p className="text-xs text-highlight-600 font-mono">
                <span className="text-highlight-700">// uuid: </span>
                <span className="text-highlight-400">{selectedUuid}</span>
              </p>
            )}

            {/* Manual UUID input fallback */}
            <div>
              <TerminalLabel htmlFor="uuid-input" indicator="dot">
                O introduce UUID manualmente
              </TerminalLabel>
              <Input
                id="uuid-input"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={selectedUuid}
                onChange={(e) => setSelectedUuid(e.target.value)}
                className="bg-black text-highlight-400 border-highlight-700 font-mono placeholder:text-highlight-800"
              />
            </div>
          </div>
        </TerminalCard>

        {/* Notification content */}
        <TerminalCard
          title="Contenido de la Notificación"
          description="Define tipo, título, cuerpo y enlace opcional"
          className="bg-black"
        >
          <div className="space-y-4">
            <div>
              <TerminalLabel htmlFor="type-select" indicator="comment">
                Tipo de notificación
              </TerminalLabel>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger
                  id="type-select"
                  className="bg-black text-highlight-400 border-highlight-700"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black text-highlight-400 border-highlight-700">
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="hover:bg-highlight-900/30"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <TerminalLabel htmlFor="notif-title" indicator="comment" required>
                Título
              </TerminalLabel>
              <Input
                id="notif-title"
                placeholder="Ej: Mensaje del servidor"
                value={title}
                maxLength={255}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-black text-highlight-400 border-highlight-700 placeholder:text-highlight-800"
              />
              <p className="text-highlight-800 text-xs mt-1">
                {title.length}/255
              </p>
            </div>

            <div>
              <TerminalLabel htmlFor="notif-body" indicator="comment" required>
                Cuerpo del mensaje
              </TerminalLabel>
              <Textarea
                id="notif-body"
                placeholder="Escribe el contenido de la notificación…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="bg-black text-highlight-400 border-highlight-700 min-h-[90px] placeholder:text-highlight-800"
              />
            </div>

            <div>
              <TerminalLabel htmlFor="notif-link" indicator="dot">
                Enlace (opcional)
              </TerminalLabel>
              <Input
                id="notif-link"
                placeholder="/smartrotom/starbank"
                value={link}
                maxLength={512}
                onChange={(e) => setLink(e.target.value)}
                className="bg-black text-highlight-400 border-highlight-700 placeholder:text-highlight-800"
              />
            </div>

            {/* Status feedback */}
            {status === "success" && (
              <div className="flex items-center gap-2 text-green-400 text-sm border border-green-900 bg-green-950/30 rounded p-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-mono">{statusMessage}</span>
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 text-red-400 text-sm border border-red-900 bg-red-950/30 rounded p-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-mono">{statusMessage}</span>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={!canSend}
              variant="highlight"
              className="w-full"
            >
              {status === "sending" ? (
                <span className="animate-pulse flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Enviando…
                </span>
              ) : (
                <>
                  <Send className="mr-2 w-4 h-4" />
                  Enviar Notificación
                </>
              )}
            </Button>
          </div>
        </TerminalCard>
      </div>
    </AdminPageLayout>
  )
}
