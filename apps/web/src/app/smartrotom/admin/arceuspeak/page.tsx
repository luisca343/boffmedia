"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/primitives/dialog"
import CharacterCreator from "./_components/CharacterCreator"
import { sendChatMessage } from "@/services/mcef/mcefApi"
import { useGetArceuSpeak } from "@/hooks/_main/useGetArceuSpeak"
import { Send, UserPlus, MessageSquare } from "lucide-react"

const formatToHtml = (format: string) => {
  return format.replace(/§([0-9a-fk-or])/g, (_match, p1) => {
    const COLOR_MAP: Record<string, string> = {
      '0': '000', '1': '00A', '2': '0A0', '3': '0AA', '4': 'A00',
      '5': 'A0A', '6': 'FA0', '7': 'AAA', '8': '555', '9': '55F',
      'a': '5F5', 'b': '5FF', 'c': 'F55', 'd': 'F5F', 'e': 'FF5', 'f': 'FFF',
    }
    if (p1 === 'l') return '<span style="font-weight:bold">'
    if (p1 === 'o') return '<span style="font-style:italic">'
    if (p1 === 'n') return '<span style="text-decoration:underline">'
    if (p1 === 'm') return '<span style="text-decoration:line-through">'
    if (p1 === 'r') return '</span>'
    if (COLOR_MAP[p1]) return `<span style="color:#${COLOR_MAP[p1]}">`
    return ''
  })
}

export default function ArceuSpeak() {
  const { speakers } = useGetArceuSpeak()
  const [speaker, setSpeaker] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (speakers && speakers.length > 0) {
      setSpeaker(speakers[0].value)
    }
  }, [speakers])

  const sendMessage = () => {
    if (!speakers) return
    const selectedSpeaker = speakers.find(s => s.value === speaker)
    if (!selectedSpeaker || !message.trim()) return
    setSending(true)
    sendChatMessage(selectedSpeaker.format + ":§r " + message)
    setTimeout(() => { setMessage(""); setSending(false) }, 800)
  }

  const selectedSpeaker = speakers?.find(s => s.value === speaker)

  if (!speakers) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="sr-spin" />
    </div>
  )

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><MessageSquare size={20} /> ArceuSpeak</h1>
        <p className="sr-page-sub">Transmite mensajes al chat de Minecraft como personajes del servidor</p>
      </div>

      <div className="sr-grid2" style={{ alignItems: 'start' }}>
        <div className="sr-col" style={{ gap: 'var(--gap)' }}>
          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">Personaje y mensaje</span>
            </div>
            <div className="sr-panel-body sr-col" style={{ gap: 'var(--gap)' }}>
              <div className="sr-field">
                <label>// Personaje</label>
                <select
                  className="sr-select"
                  value={speaker}
                  onChange={e => setSpeaker(e.target.value)}
                >
                  {speakers.map(s => (
                    <option key={s.value} value={s.value}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="sr-field">
                <label>// Mensaje</label>
                <textarea
                  className="sr-textarea"
                  rows={4}
                  placeholder="Escribe el mensaje aquí…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage()
                  }}
                />
              </div>

              <div className="sr-row">
                <button
                  className="sr-btn sr-solid"
                  onClick={sendMessage}
                  disabled={sending || !message.trim()}
                  style={{ flex: 1 }}
                >
                  {sending ? <span className="sr-spin" /> : <Send size={14} />}
                  {sending ? 'Enviando…' : 'Enviar mensaje'}
                </button>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="sr-btn">
                      <UserPlus size={14} /> Personajes
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-black border-none max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-highlight-400 font-mono">Gestionar personajes</DialogTitle>
                    </DialogHeader>
                    <CharacterCreator />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="sr-panel">
          <div className="sr-panel-head">
            <span className="sr-ttl">Vista previa</span>
          </div>
          <div className="sr-panel-body">
            {selectedSpeaker ? (
              <div>
                <div className="sr-faint" style={{ marginBottom: 8, fontSize: 11 }}>// Formato Minecraft</div>
                <div
                  style={{
                    background: '#000',
                    padding: 12,
                    borderRadius: 4,
                    border: '1px solid var(--line)',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    minHeight: 60,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatToHtml(selectedSpeaker.format) + ':§r ' + (message || '…')
                  }}
                />
                <div className="sr-faint" style={{ marginTop: 8, fontSize: 11 }}>
                  // raw: {selectedSpeaker.format}
                </div>
              </div>
            ) : (
              <div className="sr-empty">
                <div className="sr-t">Selecciona un personaje</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
