"use client"

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import GlitchStyles from '../_components/GlitchStyles'
import CharacterCreator from './_components/CharacterCreator'
import { sendChatMessage } from '@/services/mcef/mcefApi'

const speakers = [
  { name: "Arceus", value: "arceus", format: "§l§e[§fArceus§e]" },
  { name: "Profesor Ficus", value: "ficus", format: "§l§2[§aProfessor Ficus§2]" },
  { name: "Team Rocket", value: "rocket", format: "§l§8[§7Team Rocket§8]" },
  { name: "Team Magma", value: "magma", format: "§l§4[§cTeam Magma§4]" },
  { name: "Team Aqua", value: "aqua", format: "§l§1[§9Team Aqua§1]" },
]

const formatToHtml = (format: string) => {
  return format.replace(/§([0-9a-fk-or])/g, (match, p1) => {
    switch (p1) {
      case 'l': return '<span style="font-weight: bold;">';
      case 'k': return '<span style="text-decoration: blink;">';
      case 'o': return '<span style="font-style: italic;">';
      case 'n': return '<span style="text-decoration: underline;">';
      case 'm': return '<span style="text-decoration: line-through;">';
      case 'r': return '</span>';
      default: return `<span style="color: #${p1 === '0' ? '000' : p1 === '1' ? '00A' : p1 === '2' ? '0A0' : p1 === '3' ? '0AA' : p1 === '4' ? 'A00' : p1 === '5' ? 'A0A' : p1 === '6' ? 'FA0' : p1 === '7' ? 'AAA' : p1 === '8' ? '555' : p1 === '9' ? '55F' : p1 === 'a' ? '5F5' : p1 === 'b' ? '5FF' : p1 === 'c' ? 'F55' : p1 === 'd' ? 'F5F' : p1 === 'e' ? 'FF5' : 'FFF'};">`;
    }
  });
}

export default function ArceuSpeak() {
  const [speaker, setSpeaker] = useState(speakers[0].value)
  const [message, setMessage] = useState("")

  const sendMessage = () => {
    const selectedSpeaker = speakers.find(s => s.value === speaker)
    console.log(`Enviando mensaje como ${selectedSpeaker?.format}: ${message}`)
    sendChatMessage(selectedSpeaker?.format + ":§r " + message)
  }

  return (
    <div className="w-full min-h-full text-green-400 font-mono p-8 flex flex-col relative">
      <GlitchStyles />
      <div className="z-10 relative">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-500 uppercase tracking-widest glitch">
          ArceuSpeak
        </h1>
        <Card className="bg-surface-900 border-green-500 border">
          <CardHeader>
            <CardTitle className="text-green-400">Enviar Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={setSpeaker} defaultValue={speaker}>
              <SelectTrigger className="w-full bg-surface-800 text-green-400 border-green-500">
                <SelectValue placeholder="Seleccionar emisor" />
              </SelectTrigger>
              <SelectContent className="bg-surface-800 text-green-400 border-green-500">
                {speakers.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="hover:bg-surface-700">
                    <span dangerouslySetInnerHTML={{ __html: formatToHtml(s.format) }} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Escribe tu mensaje aquí"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-surface-800 text-green-400 border-green-500"
            />
            <div className="flex space-x-4">
              <Button onClick={sendMessage} className="flex-1 bg-green-700 hover:bg-green-600 text-black">
                Enviar Mensaje
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-700 hover:bg-blue-600 text-black">
                    Crear Personaje
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface-900 border-green-500 border">
                  <DialogHeader>
                    <DialogTitle className="text-green-400">Crear Nuevo Personaje</DialogTitle>
                  </DialogHeader>
                  <CharacterCreator />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="absolute inset-0 bg-gradient pointer-events-none" />
      <style jsx>{`
        .bg-gradient {
          background: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 1) 100%);
        }
        @media (min-width: 1281px) and (min-height: 721px) {
          .bg-gradient {
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.3) 100%);
          }
        }
      `}</style>
    </div>
  )
}