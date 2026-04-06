"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/primitives/button"
import { Trophy, ExternalLink, Medal, CheckCircle } from "lucide-react"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useBoffSession } from "@/services/useBoffSession"
import { InternalLink } from "@/components/ui/navigation/Link"
import { AchievementBadge } from "@/components/boffmedia/event/AchievementBadge"
import { getRarityTokens } from "@/components/boffmedia/event/rarityTokens"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementWithProgress {
  id: number
  name: string
  description: string
  icon?: string
  points: number
  rarity?: string
  maxProgress?: number
  itemType: "achievement" | "medal"
  userProgress?: { currentProgress: number; isCompleted: number; completedAt?: string }
  isUnlocked: boolean
  currentProgress: number
  completionRate: number
  hidden: boolean
}

interface AchievementsSectionProps {
  eventId: number
  achievements: any[]
  participants: any[]
}

// ─── Neon progress bar ────────────────────────────────────────────────────────

function NeonProgressBar({ value, color = "rgba(249,115,22,0.75)" }: { value: number; color?: string }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="h-[2px] w-5 rounded-none"
        style={{ background: "rgba(249,115,22,0.6)" }}
      />
      <div>
        <h2
          className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
        >
          {label}
        </h2>
        {sub && <p className="text-[10px] font-mono text-surface-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return "Hace unos minutos"
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return "Ayer"
  if (d < 7) return `Hace ${d} días`
  return new Date(dateString).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AchievementsSection({ eventId, achievements, participants }: AchievementsSectionProps) {
  const { session } = useBoffSession()
  const [progressData, setProgressData] = useState<any[]>([])
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)

  useEffect(() => {
    async function fetchUserProgress() {
      if (!session?.user?.id || achievements.length === 0) return
      try {
        setIsLoadingProgress(true)
        const participantsResponse = await EventsService.getEventParticipants(eventId)
        const participant = participantsResponse.data?.find(
          (p: any) => p.userId === parseInt(session.user.id!)
        )
        if (participant) {
          const progressResponse = await EventsService.getParticipantProgressByEvent(
            eventId,
            participant.participantId
          )
          setProgressData(progressResponse.data || [])
        }
      } catch {
        setProgressData([])
      } finally {
        setIsLoadingProgress(false)
      }
    }
    fetchUserProgress()
  }, [eventId, session?.user?.id, achievements.length])

  const achievementsWithProgress: AchievementWithProgress[] = useMemo(() => {
    return achievements.map((achievement) => {
      const progress = progressData.find((p) => p.achievementId === achievement.id)
      const currentProgress = progress?.currentProgress || 0
      const maxProgress = achievement.maxProgress || 1
      return {
        ...achievement,
        userProgress: progress,
        isUnlocked: progress?.isCompleted === 1,
        currentProgress,
        completionRate: maxProgress > 0 ? (currentProgress / maxProgress) * 100 : 0,
      }
    })
  }, [achievements, progressData])

  const actualAchievements = achievementsWithProgress.filter((a) => a.itemType === "achievement")
  const medals = achievementsWithProgress.filter((a) => a.itemType === "medal")
  const unlockedAchievements = actualAchievements.filter((a) => a.isUnlocked)
  const totalAchievements = actualAchievements.length
  const playerCompletionRate =
    totalAchievements > 0 ? (unlockedAchievements.length / totalAchievements) * 100 : 0
  const playerMedals = medals.filter((m) => m.isUnlocked)
  const showAchievements = totalAchievements > 0
  const showMedals = playerMedals.length > 0

  const displayUnlocked = useMemo(() => {
    const withDates = unlockedAchievements.filter((a) => a.userProgress?.completedAt)
    const withoutDates = unlockedAchievements.filter((a) => !a.userProgress?.completedAt)
    return [
      ...withDates.sort(
        (a, b) =>
          new Date(b.userProgress!.completedAt!).getTime() -
          new Date(a.userProgress!.completedAt!).getTime()
      ),
      ...withoutDates,
    ]
  }, [unlockedAchievements])

  const displayMedals = useMemo(() => {
    const withDates = playerMedals.filter((m) => m.userProgress?.completedAt)
    const withoutDates = playerMedals.filter((m) => !m.userProgress?.completedAt)
    return [
      ...withDates.sort(
        (a, b) =>
          new Date(b.userProgress!.completedAt!).getTime() -
          new Date(a.userProgress!.completedAt!).getTime()
      ),
      ...withoutDates,
    ]
  }, [playerMedals])

  if (!showAchievements && !showMedals) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.15)" }}
        >
          <Trophy className="w-8 h-8" style={{ color: "rgba(249,115,22,0.5)" }} />
        </div>
        <p
          className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
        >
          Sin logros disponibles
        </p>
        <p className="text-xs text-surface-500">Los logros aparecerán pronto</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Achievements ──────────────────────────────────────────────── */}
      {showAchievements && (
        <div>
          <SectionHeader
            label="Logros"
            sub={session?.user ? `${unlockedAchievements.length}/${totalAchievements} desbloqueados` : undefined}
          />

          <div
            className="rounded-xl p-5 space-y-5"
            style={{
              background: "rgba(15,23,42,0.7)",
              border: "1px solid rgba(249,115,22,0.12)",
            }}
          >
            {/* Progress bar */}
            {session?.user && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-surface-400">Progreso</span>
                  <span style={{ color: "rgba(251,146,60,0.85)" }}>
                    {playerCompletionRate.toFixed(0)}%
                  </span>
                </div>
                <NeonProgressBar value={playerCompletionRate} />
              </div>
            )}

            {/* Latest achievement highlight */}
            {session?.user && displayUnlocked.length > 0 && (
              <div
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: "rgba(249,115,22,0.05)",
                  border: "1px solid rgba(249,115,22,0.12)",
                }}
              >
                <AchievementBadge achievement={displayUnlocked[0]} size="md" showTooltip={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-widest text-surface-500 mb-0.5">
                    Último logro
                  </p>
                  <p className="text-sm font-bold text-surface-100 leading-snug truncate">
                    {displayUnlocked[0].name}
                  </p>
                  <p className="text-xs text-surface-500 line-clamp-1 mt-0.5">
                    {displayUnlocked[0].hidden ? "Descripción oculta" : displayUnlocked[0].description}
                  </p>
                  {displayUnlocked[0].userProgress?.completedAt && (
                    <p className="text-[10px] font-mono mt-1" style={{ color: "rgba(132,204,22,0.7)" }}>
                      {relativeTime(displayUnlocked[0].userProgress.completedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Badge grid — unlocked + locked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unlocked */}
              {session?.user && displayUnlocked.length > 1 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-surface-500 mb-2">
                    Obtenidos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {displayUnlocked.slice(1, 8).map((a) => (
                      <AchievementBadge key={`u-${a.id}`} achievement={a} size="md" />
                    ))}
                    {unlockedAchievements.length > 8 && (
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-xs font-bold font-mono cursor-pointer transition-all hover:scale-105"
                        style={{
                          background: "rgba(30,41,59,0.7)",
                          border: "1px dashed rgba(71,85,105,0.5)",
                          color: "rgba(148,163,184,0.7)",
                        }}
                      >
                        +{unlockedAchievements.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Locked */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-surface-500 mb-2">
                  Bloqueados
                </p>
                <div className="flex flex-wrap gap-2">
                  {actualAchievements
                    .filter((a) => !a.isUnlocked)
                    .slice(0, 7)
                    .map((a) => (
                      <AchievementBadge key={`l-${a.id}`} achievement={a} locked size="md" />
                    ))}
                  {actualAchievements.filter((a) => !a.isUnlocked).length > 7 && (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-xs font-bold font-mono cursor-pointer transition-all hover:scale-105"
                      style={{
                        background: "rgba(30,41,59,0.7)",
                        border: "1px dashed rgba(71,85,105,0.4)",
                        color: "rgba(100,116,139,0.6)",
                      }}
                    >
                      +{actualAchievements.filter((a) => !a.isUnlocked).length - 7}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              className="pt-3 flex justify-center"
              style={{ borderTop: "1px solid rgba(71,85,105,0.2)" }}
            >
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-2 text-surface-400 hover:text-surface-100"
                style={{ fontSize: "11px", fontFamily: "monospace" }}
              >
                <InternalLink href={`${eventId}/logros`}>
                  Ver todos mis logros
                  <ExternalLink className="w-3.5 h-3.5" />
                </InternalLink>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Medals ────────────────────────────────────────────────────── */}
      {showMedals && (
        <div>
          <SectionHeader
            label="Medallas"
            sub={`${playerMedals.length} medalla${playerMedals.length !== 1 ? "s" : ""} obtenida${playerMedals.length !== 1 ? "s" : ""}`}
          />

          <div
            className="rounded-xl p-5 space-y-2"
            style={{
              background: "rgba(15,23,42,0.7)",
              border: "1px solid rgba(249,115,22,0.12)",
            }}
          >
            {displayMedals.map((medal) => {
              const tokens = getRarityTokens(medal.rarity)
              return (
                <div
                  key={`medal-${medal.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-primary-500/[0.05]"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: tokens.bg, border: `1px solid ${tokens.border}` }}
                  >
                    {medal.icon ? (
                      <img src={medal.icon} alt="" className="w-5 h-5" />
                    ) : (
                      <Medal className="w-4 h-4" style={{ color: tokens.color }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-100 truncate">{medal.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono" style={{ color: "rgba(251,146,60,0.7)" }}>
                        {medal.points} pts
                      </span>
                      {medal.rarity && (
                        <span className="text-[10px] font-mono text-surface-500">· {medal.rarity}</span>
                      )}
                      {medal.userProgress?.completedAt && (
                        <span className="text-[10px] font-mono" style={{ color: "rgba(132,204,22,0.7)" }}>
                          · {relativeTime(medal.userProgress.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(132,204,22,0.6)" }} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
