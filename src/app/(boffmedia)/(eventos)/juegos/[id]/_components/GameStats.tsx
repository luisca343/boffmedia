"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Trophy, Activity, Gamepad2 } from "lucide-react"
import { Game } from "@/generated/api"

interface GameStatsProps {
  game: Game
  eventsCount?: number
  playersCount?: number
  activeEventsCount?: number
}

export function GameStats({ game, eventsCount = 0, playersCount = 0, activeEventsCount = 0 }: GameStatsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Status Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className={`w-5 h-5 ${!game.deletedAt ? 'text-success-400' : 'text-surface-400'}`} />
            Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${!game.deletedAt ? 'text-success-400' : 'text-surface-400'}`}>
            {!game.deletedAt ? 'Activo' : 'Inactivo'}
          </div>
          <p className="text-surface-400 text-sm">Estado actual del juego</p>
        </CardContent>
      </Card>

      {/* Events Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            {eventsCount}
          </div>
          <p className="text-surface-400 text-sm">Eventos disponibles</p>
        </CardContent>
      </Card>

      {/* Active Events Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-accent-400" />
            Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-secondary-400">
            {activeEventsCount}
          </div>
          <p className="text-surface-400 text-sm">Eventos en curso</p>
        </CardContent>
      </Card>

      {/* Created Date Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-secondary-400" />
            Creado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-secondary-400">
            {formatDate(game.createdAt)}
          </div>
          <p className="text-surface-400 text-sm">Fecha de registro</p>
        </CardContent>
      </Card>
    </div>
  )
}
