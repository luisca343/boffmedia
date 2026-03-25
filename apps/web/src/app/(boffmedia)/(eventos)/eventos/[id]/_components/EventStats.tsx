"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card"
import { Users, Trophy, Target } from "lucide-react"
import { Event } from "@/generated/api/models/Event"

interface EventStatsProps {
  event: any
  participants: any[]
  achievements: any[]
}

export function EventStats({ event, participants, achievements }: EventStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Participants Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary-400" />
            Participantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-cyan-400">
            {participants.length}
          </div>
          <p className="text-surface-400 text-sm">Aventureros registrados</p>
        </CardContent>
      </Card>

      {/* Achievements Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Logros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            {achievements.length}
          </div>
          <p className="text-surface-400 text-sm">Conquistas disponibles</p>
        </CardContent>
      </Card>

      {/* Event Type Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-accent-400" />
            Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-accent-400">
            {event.type === Event.type.EVENT ? 'Evento' : 'Servidor'}
          </div>
          <p className="text-surface-400 text-sm">Modalidad de juego</p>
        </CardContent>
      </Card>
    </div>
  )
}
