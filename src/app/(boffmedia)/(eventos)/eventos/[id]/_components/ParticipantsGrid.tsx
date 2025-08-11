"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { ProfileImage } from "@/components/ProfileImage"

interface ParticipantsGridProps {
  participants: any[]
}

export function ParticipantsGrid({ participants }: ParticipantsGridProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-surface-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-12 h-12 text-surface-400" />
        </div>
        <h3 className="text-xl font-semibold text-surface-300 mb-2">Sin participantes aún</h3>
        <p className="text-surface-400">Sé el primero en unirte a este evento</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Participantes</h2>
        <p className="text-surface-400">{participants.length} aventureros registrados</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {participants.map((participant, index) => (
          <Card key={participant.id} className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20 hover:scale-105 transition-transform">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ProfileImage userId={participant.userId} size={48} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {participant.nickname || 'Jugador Anónimo'}
                  </h3>
                  <p className="text-surface-400 text-sm">
                    Participante #{index + 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
