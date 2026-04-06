"use client"

import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import {
  ArrowLeft, Trophy, Target, Users, Star, Lock,
  Search, Clock, Zap, Medal,
} from "lucide-react"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { UserProgress, EventParticipant } from "@/types/events"
import { useBoffSession } from "@/services/useBoffSession"
import { InternalLink } from "@/components/ui/navigation/Link"
import { AchievementBadge } from "@/components/boffmedia/event/AchievementBadge"
import { getRarityTokens } from "@/components/boffmedia/event/rarityTokens"

// ─── Types ────────────────────────────────────────────────────────────────────

type AchievementWithProgress = {
  id: number
  name: string
  description?: string
  icon?: string | null
  points: number
  rarity?: string | null
  hidden?: boolean
  maxProgress?: number
  category?: string
  itemType?: "achievement" | "medal"
  userProgress?: UserProgress
  isUnlocked: boolean
  currentProgress: number
  [key: string]: any
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d?: string | Date) =>
  d
    ? new Date(d).toLocaleDateString("es-ES", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "No desbloqueado"

function NeonProgressBar({ value, color = "rgba(249,115,22,0.75)" }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color, border, bg,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  border: string
  bg: string
}) {
  return (
    <div
      className="rounded-xl p-5 text-center"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div
        className="text-3xl font-black font-mono mb-1"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-xs font-mono text-surface-500 uppercase tracking-widest">{label}</div>
    </div>
  )
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded text-xs font-mono uppercase tracking-widest transition-all duration-150"
      style={
        active
          ? {
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.4)",
              color: "rgb(251,146,60)",
            }
          : {
              background: "transparent",
              border: "1px solid rgba(71,85,105,0.3)",
              color: "rgba(148,163,184,0.7)",
            }
      }
    >
      {children}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventAchievementsPage() {
  const params = useParams()
  const eventId = parseInt(params.id as string)
  const { session } = useBoffSession()
  const userId = session?.user?.id

  const [event, setEvent] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [progressData, setProgressData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const [eventResponse, achievementsResponse] = await Promise.all([
          EventsService.getEvent(eventId),
          EventsService.getEventAchievements(eventId),
        ])
        setEvent(eventResponse.data)
        setAchievements(achievementsResponse.data || [])

        if (userId) {
          try {
            const participantsResponse = await EventsService.getEventParticipants(eventId) as any
            const participant = participantsResponse.data.find(
              (p: any) => p.userId === parseInt(userId)
            )
            if (participant) {
              const progressResponse = await EventsService.getParticipantProgressByEvent(
                eventId,
                participant.id
              )
              setProgressData(progressResponse.data || [])
            }
          } catch {
            setProgressData([])
          }
        }
      } catch (error) {
        console.error("Error fetching achievements:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId && !isNaN(eventId)) fetchData()
  }, [eventId, userId])

  const achievementsWithProgress: AchievementWithProgress[] = useMemo(() => {
    return achievements
      .filter((a) => a.itemType === "achievement")
      .map((a) => {
        const progress = progressData.find((p) => p.achievementId === a.id)
        return {
          ...a,
          userProgress: progress,
          isUnlocked: progress?.isCompleted === 1 || false,
          currentProgress: progress?.currentProgress || 0,
        }
      })
  }, [achievements, progressData])

  const filteredAchievements = useMemo(() => {
    let list = achievementsWithProgress
    if (activeFilter === "unlocked") list = list.filter((a) => a.isUnlocked)
    else if (activeFilter === "locked") list = list.filter((a) => !a.isUnlocked)
    if (searchTerm)
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    return list
  }, [achievementsWithProgress, activeFilter, searchTerm])

  const unlockedCount = achievementsWithProgress.filter((a) => a.isUnlocked).length
  const totalCount = achievementsWithProgress.length
  const completionRate = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0
  const earnedPoints = achievementsWithProgress
    .filter((a) => a.isUnlocked)
    .reduce((s, a) => s + a.points, 0)

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full border-4"
                style={{ borderColor: "rgba(249,115,22,0.12)" }}
              />
              <div
                className="absolute top-0 left-0 w-20 h-20 rounded-full border-4 border-transparent animate-spin"
                style={{ borderTopColor: "rgba(249,115,22,0.8)" }}
              />
              <div
                className="absolute top-3 left-3 w-14 h-14 rounded-full border-4 border-transparent animate-spin"
                style={{
                  borderTopColor: "rgba(34,211,238,0.6)",
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              />
            </div>
            <p
              className="text-lg font-black uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(251,146,60)" }}
            >
              Cargando logros...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Page ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-6 max-w-7xl space-y-8">

        {/* ── Back button ─────────────────────────────────────────────── */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2 text-surface-200 hover:text-surface-50"
          style={{ background: "rgba(30,41,59,0.7)", borderColor: "rgba(71,85,105,0.55)" }}
        >
          <InternalLink href={`/eventos/${eventId}`}>
            <ArrowLeft className="w-4 h-4" />
            Volver al evento
          </InternalLink>
        </Button>

        {/* ── Hero card ──────────────────────────────────────────────── */}
        <div
          className="rounded-xl p-6 overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(9,13,27,0.99))",
            border: "1px solid rgba(249,115,22,0.18)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.04)",
          }}
        >
          {/* Top neon bar */}
          <div
            className="h-[2px] bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600 -mx-6 -mt-6 mb-6"
            style={{ opacity: 0.7 }}
          />

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Icon */}
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.22)" }}
            >
              {event?.icon ? (
                <img src={event.icon} alt="" className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <Trophy className="w-10 h-10" style={{ color: "rgb(251,146,60)" }} />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h1
                className="text-3xl font-black uppercase tracking-widest mb-1"
                style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
              >
                Logros del evento
              </h1>
              <p className="text-surface-400 text-sm mb-3">{event?.title}</p>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono uppercase tracking-widest"
                style={{
                  color: "rgba(251,146,60,0.9)",
                  border: "1px solid rgba(249,115,22,0.3)",
                  background: "rgba(249,115,22,0.07)",
                }}
              >
                <Trophy className="w-3 h-3" />
                {totalCount} logros disponibles
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Trophy}
            label="Desbloqueados"
            value={unlockedCount}
            color="rgba(168,85,247,0.9)"
            border="rgba(168,85,247,0.25)"
            bg="rgba(168,85,247,0.06)"
          />
          <StatCard
            icon={Target}
            label="Total"
            value={totalCount}
            color="rgba(34,211,238,0.9)"
            border="rgba(6,182,212,0.25)"
            bg="rgba(6,182,212,0.06)"
          />
          <StatCard
            icon={Star}
            label="Puntos"
            value={earnedPoints}
            color="rgba(250,204,21,0.9)"
            border="rgba(250,204,21,0.25)"
            bg="rgba(250,204,21,0.06)"
          />
          <StatCard
            icon={Zap}
            label="Completado"
            value={`${completionRate.toFixed(1)}%`}
            color="rgba(251,146,60,0.9)"
            border="rgba(249,115,22,0.25)"
            bg="rgba(249,115,22,0.06)"
          />
        </div>

        {/* ── Progress bar ───────────────────────────────────────────── */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(15,23,42,0.7)",
            border: "1px solid rgba(249,115,22,0.12)",
          }}
        >
          <div className="flex items-center justify-between text-sm font-mono mb-3">
            <span className="text-surface-300 font-semibold">Progreso General</span>
            <span style={{ color: "rgba(251,146,60,0.85)" }}>
              {unlockedCount}/{totalCount}
            </span>
          </div>
          <NeonProgressBar value={completionRate} />
        </div>

        {/* ── Search + Filter bar ─────────────────────────────────────── */}
        <div
          className="rounded-xl p-4 flex flex-col lg:flex-row gap-4"
          style={{
            background: "rgba(15,23,42,0.7)",
            border: "1px solid rgba(71,85,105,0.3)",
          }}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "rgba(100,116,139,0.6)" }}
            />
            <Input
              placeholder="Buscar logros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm bg-transparent focus:ring-1"
              style={{
                border: "1px solid rgba(71,85,105,0.4)",
                color: "rgb(226,232,240)",
              }}
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <FilterPill active={activeFilter === "all"} onClick={() => setActiveFilter("all")}>
              Todos ({totalCount})
            </FilterPill>
            <FilterPill active={activeFilter === "unlocked"} onClick={() => setActiveFilter("unlocked")}>
              Desbloqueados ({unlockedCount})
            </FilterPill>
            <FilterPill active={activeFilter === "locked"} onClick={() => setActiveFilter("locked")}>
              Bloqueados ({totalCount - unlockedCount})
            </FilterPill>
          </div>
        </div>

        {/* ── Achievement grid ────────────────────────────────────────── */}
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const tokens = getRarityTokens(achievement.rarity)
              const locked = !achievement.isUnlocked

              return (
                <div
                  key={achievement.id}
                  className="group rounded-xl p-5 transition-all duration-200"
                  style={{
                    background: locked
                      ? "rgba(15,23,42,0.5)"
                      : "rgba(15,23,42,0.8)",
                    border: locked
                      ? "1px solid rgba(71,85,105,0.3)"
                      : `1px solid ${tokens.border}`,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <AchievementBadge achievement={achievement} locked={locked} size="md" showTooltip={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3
                          className="text-sm font-bold leading-snug"
                          style={{ color: locked ? "rgba(148,163,184,0.6)" : "rgb(226,232,240)" }}
                        >
                          {achievement.name}
                        </h3>
                        {achievement.rarity && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide"
                            style={{ color: tokens.color, border: `1px solid ${tokens.border}`, background: tokens.bg }}
                          >
                            {tokens.label}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs leading-relaxed line-clamp-2"
                        style={{ color: locked ? "rgba(100,116,139,0.6)" : "rgba(148,163,184,0.8)" }}
                      >
                        {achievement.hidden ? "Descripción oculta" : achievement.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar (multi-step) */}
                  {achievement.maxProgress > 1 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                        <span className="text-surface-500">Progreso</span>
                        <span style={{ color: tokens.color }}>
                          {achievement.currentProgress}/{achievement.maxProgress}
                        </span>
                      </div>
                      <NeonProgressBar
                        value={(achievement.currentProgress / achievement.maxProgress) * 100}
                        color={locked ? "rgba(100,116,139,0.5)" : tokens.color}
                      />
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: "1px solid rgba(71,85,105,0.2)" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" style={{ color: "rgba(250,204,21,0.7)" }} />
                      <span className="text-xs font-mono font-semibold" style={{ color: "rgba(250,204,21,0.85)" }}>
                        {achievement.points}
                      </span>
                    </div>
                    {achievement.isUnlocked && achievement.userProgress?.completedAt && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-surface-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(achievement.userProgress.completedAt)}
                      </div>
                    )}
                    {locked && (
                      <Lock className="w-3.5 h-3.5" style={{ color: "rgba(100,116,139,0.4)" }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.15)" }}
            >
              <Trophy className="w-10 h-10" style={{ color: "rgba(249,115,22,0.5)" }} />
            </div>
            <p
              className="text-lg font-black uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
            >
              No se encontraron logros
            </p>
            <p className="text-sm text-surface-500 max-w-md text-center">
              {searchTerm
                ? "Intenta con términos de búsqueda diferentes o cambia los filtros."
                : "No hay logros disponibles para este filtro."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
