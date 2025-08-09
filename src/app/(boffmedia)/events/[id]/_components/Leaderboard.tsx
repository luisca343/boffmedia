"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Star, User, Crown, Medal, Award } from "lucide-react"

interface LeaderboardEntry {
  userId: number
  nickname: string
  achievementPoints: number
  medalPoints: number
  totalPoints: number
  achievementCount: number
  medalCount: number
  avatar?: string
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[]
}

export function Leaderboard({ leaderboard }: LeaderboardProps) {
  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-surface-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-surface-400" />
        </div>
        <h3 className="text-xl font-semibold text-surface-300 mb-2">Clasificación vacía</h3>
        <p className="text-surface-400">Los resultados aparecerán cuando comience la competición</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Clasificación</h2>
        <p className="text-surface-400">Tabla de posiciones actual</p>
      </div>

      <div className="space-y-4">
        {leaderboard.slice(0, 10).map((entry, index) => (
          <Card key={entry.userId} className={`bg-surface-800/60 backdrop-blur-sm transition-all hover:scale-105 ${
            index < 3 
              ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/10' 
              : 'border-accent-500/20'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                  index === 1 ? 'bg-gradient-to-br from-surface-300 to-surface-500 text-black' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                  'bg-gradient-to-br from-accent-600 to-indigo-600 text-white'
                }`}>
                  {index < 3 ? (
                    index === 0 ? <Crown className="w-6 h-6" /> :
                    index === 1 ? <Medal className="w-6 h-6" /> :
                    <Award className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                
                <Avatar className="w-12 h-12 border-2 border-accent-500/30">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback className="bg-accent-600 text-white">
                    {entry.nickname?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {entry.nickname || 'Jugador Anónimo'}
                  </h3>
                  <p className="text-surface-400 text-sm">
                    {entry.achievementCount} logros • {entry.medalCount} medallas
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    {entry.totalPoints}
                  </div>
                  <div className="text-surface-400 text-sm">puntos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
