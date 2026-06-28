"use client"

import { Users, Crown } from "lucide-react"
import { ProfileImage } from "@/components/ui/ProfileImage"
import { EventSectionHeader } from "./EventSectionHeader"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParticipantsGridProps {
  participants: any[]
}

// ─── Rank styles ──────────────────────────────────────────────────────────────

const RANK_STYLES = [
  { color: "rgb(250,204,21)",   border: "rgba(250,204,21,0.28)", bg: "rgba(250,204,21,0.05)", label: "Líder"     },
  { color: "rgb(203,213,225)",  border: "rgba(148,163,184,0.28)", bg: "rgba(148,163,184,0.04)", label: "2.° puesto" },
  { color: "rgb(194,120,72)",   border: "rgba(194,120,72,0.28)", bg: "rgba(194,120,72,0.05)", label: "3.° puesto" },
] as const

const DEFAULT_RANK = {
  color: "rgba(100,116,139,0.7)",
  border: "rgba(71,85,105,0.3)",
  bg: "transparent",
  label: null,
}

function getRank(index: number) {
  return RANK_STYLES[index] ?? DEFAULT_RANK
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ParticipantsGrid({ participants }: ParticipantsGridProps) {
  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.15)" }}
        >
          <Users className="w-8 h-8" style={{ color: "rgba(249,115,22,0.5)" }} />
        </div>
        <p
          className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
        >
          Sin participantes aún
        </p>
        <p className="text-xs text-ink-muted">Sé el primero en unirte a este evento</p>
      </div>
    )
  }

  const badge = (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-widest"
      style={{
        color: "rgba(251,146,60,0.9)",
        border: "1px solid rgba(249,115,22,0.3)",
        background: "rgba(249,115,22,0.07)",
      }}
    >
      <Users className="w-3 h-3" />
      {participants.length}
    </span>
  )

  return (
    <div className="space-y-4">
      <EventSectionHeader
        label="Participantes"
        sub={`${participants.length} aventureros registrados`}
        badge={badge}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {participants.map((participant, index) => {
          const rank = getRank(index)
          const isTop3 = index < 3

          return (
            <div
              key={participant.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.01]"
              style={{
                border: `1px solid ${rank.border}`,
                background: isTop3 ? rank.bg : "rgba(30,41,59,0.45)",
              }}
            >
              {/* Rank indicator */}
              <div
                className="flex-shrink-0 w-6 flex items-center justify-center"
                style={{ color: rank.color }}
              >
                {index === 0 ? (
                  <Crown className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-black font-mono">#{index + 1}</span>
                )}
              </div>

              <ProfileImage userId={participant.userId} size={36} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                  {participant.nickname || "Jugador Anónimo"}
                </p>
                {isTop3 && rank.label && (
                  <p
                    className="text-[10px] font-mono uppercase tracking-widest mt-0.5"
                    style={{ color: rank.color }}
                  >
                    {rank.label}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
