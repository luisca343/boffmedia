"use client"

import { User } from "lucide-react"
import { ProfileImage } from "@/components/ui/ProfileImage"

interface ParticipantsGridProps {
  participants: any[]
}

export function ParticipantsGrid({ participants }: ParticipantsGridProps) {
  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.15)" }}
        >
          <User className="w-8 h-8" style={{ color: "rgba(249,115,22,0.5)" }} />
        </div>
        <p
          className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
        >
          Sin participantes aún
        </p>
        <p className="text-xs text-surface-500">Sé el primero en unirte a este evento</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-[2px] w-5" style={{ background: "rgba(249,115,22,0.6)" }} />
        <div>
          <h2
            className="text-sm font-black uppercase tracking-widest"
            style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
          >
            Participantes
          </h2>
          <p className="text-[10px] font-mono text-surface-500 mt-0.5">
            {participants.length} aventureros registrados
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-primary-500/[0.06]"
            style={{ border: "1px solid rgba(71,85,105,0.3)" }}
          >
            <ProfileImage userId={participant.userId} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-100 truncate">
                {participant.nickname || "Jugador Anónimo"}
              </p>
              <p className="text-[10px] font-mono text-surface-500">#{index + 1}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
