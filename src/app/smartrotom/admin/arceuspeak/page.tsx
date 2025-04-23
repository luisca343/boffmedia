"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import CharacterCreator from "./_components/CharacterCreator"
import { sendChatMessage } from "@/services/mcef/mcefApi"
import { useGetArceuSpeak } from "@/hooks/_main/useGetArceuSpeak"
import { Send, UserPlus } from "lucide-react"
import AdminPageLayout from "../_components/AdminPageLayout"
import TerminalCard from "../_components/TerminalCard"
import TerminalHeader from "../_components/TerminalHeader"
import TerminalLabel from "../_components/TerminalLabel"

const formatToHtml = (format: string) => {
  return format.replace(/§([0-9a-fk-or])/g, (match, p1) => {
    switch (p1) {
      case "l":
        return '<span style="font-weight: bold;">'
      case "k":
        return '<span style="text-decoration: blink;">'
      case "o":
        return '<span style="font-style: italic;">'
      case "n":
        return '<span style="text-decoration: underline;">'
      case "m":
        return '<span style="text-decoration: line-through;">'
      case "r":
        return "</span>"
      default:
        return `<span style="color: #${p1 === "0" ? "000" : p1 === "1" ? "00A" : p1 === "2" ? "0A0" : p1 === "3" ? "0AA" : p1 === "4" ? "A00" : p1 === "5" ? "A0A" : p1 === "6" ? "FA0" : p1 === "7" ? "AAA" : p1 === "8" ? "555" : p1 === "9" ? "55F" : p1 === "a" ? "5F5" : p1 === "b" ? "5FF" : p1 === "c" ? "F55" : p1 === "d" ? "F5F" : p1 === "e" ? "FF5" : "FFF"};">`
    }
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
    const selectedSpeaker = speakers.find((s) => s.value === speaker)
    if (!selectedSpeaker || !message.trim()) return
    
    setSending(true)
    console.log(`Enviando mensaje como ${selectedSpeaker.format}: ${message}`)
    sendChatMessage(selectedSpeaker.format + ":§r " + message)
    
    // Simulate a sent message and reset the form
    setTimeout(() => {
      setMessage("")
      setSending(false)
    }, 800)
  }

  if (!speakers) return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-green-400 animate-pulse font-mono">Cargando sistema de comunicación...</div>
    </div>
  )

  return (
    <AdminPageLayout title="ArceuSpeak" version="1.2.7">
      <div className="z-10 relative">
        {/* Terminal Card with Header */}
        <TerminalHeader title="communication" username="ficus-labs" />
        <TerminalCard 
          title="Sistema de Comunicación" 
          roundedTop={false}
          className="bg-black"
        >
          <>
            <div className="space-y-4">
              <div>
                <TerminalLabel htmlFor="speaker-select" indicator="comment">
                  Selecciona un emisor para enviar mensaje
                </TerminalLabel>
                
                <Select onValueChange={setSpeaker} value={speaker}>
                  <SelectTrigger id="speaker-select" className="w-full bg-black text-green-400 border-green-700">
                    <SelectValue placeholder="Seleccionar emisor" />
                  </SelectTrigger>
                  <SelectContent className="bg-black text-green-400 border-green-700">
                    {speakers.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="hover:bg-green-900/30">
                        <span dangerouslySetInnerHTML={{ __html: formatToHtml(s.format) }} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <TerminalLabel htmlFor="message-text" indicator="comment">
                  Mensaje para transmitir
                </TerminalLabel>
                
                <Textarea
                  id="message-text"
                  placeholder="Escribe tu mensaje aquí"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-black text-green-400 border-green-700 min-h-[100px]"
                />
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  onClick={sendMessage} 
                  disabled={sending || !message.trim()} 
                  className="flex-1 bg-green-700 hover:bg-green-600 text-black hover:shadow-neon transition-all duration-300 flex items-center justify-center"
                >
                  {sending ? 
                    <span className="animate-pulse flex items-center">Transmitiendo...</span> : 
                    <>
                      <Send className="mr-2 w-4 h-4" />
                      Enviar Mensaje
                    </>
                  }
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-blue-700 hover:bg-blue-600 text-black hover:shadow-neon transition-all duration-300 flex items-center"
                    >
                      <UserPlus className="mr-2 w-4 h-4" />
                      Crear Personaje
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black border-green-500 border">
                    <DialogHeader>
                      <DialogTitle className="text-green-400">
                        <span className="text-green-600 mr-2">&gt;</span>
                        Crear Nuevo Personaje
                      </DialogTitle>
                    </DialogHeader>
                    <CharacterCreator />
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="mt-4 border-t border-green-700/30 pt-2">
                <div className="flex justify-between text-xs text-green-700">
                  <span>ESTADO:</span>
                  <span className="text-green-400 flex items-center">
                    CONECTADO
                    <span className="w-2 h-2 bg-green-500 animate-pulse rounded-full ml-2"></span>
                  </span>
                </div>
                <div className="flex justify-between text-xs text-green-700">
                  <span>PERMISOS:</span>
                  <span className="text-green-400">ROOT</span>
                </div>
              </div>
            </div>
          </>
        </TerminalCard>
        
        <div className="text-xs text-green-700 mt-2 text-center">
          ArceuSpeak | Sistema de Comunicación Remota | Acceso Restringido
        </div>
      </div>
    </AdminPageLayout>
  )
}